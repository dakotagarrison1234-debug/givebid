import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// ── helpers ───────────────────────────────────────────────────────────────────

function isFnsku(code: string) {
  // FNSKUs almost always start with X followed by two digits (X00, X01, etc.)
  return /^X\d{2}/i.test(code);
}

function buildNinjaOpts(apiKey: string) {
  return { headers: { "X-API-Key": apiKey }, cache: "no-store" as const };
}

// ── F2A: FNSKU → ASIN ────────────────────────────────────────────────────────

async function fnsku2asin(fnsku: string, f2aKey: string): Promise<string | null> {
  const post = () =>
    fetch("https://ato.fnskutoasin.com/api/v1/ScanTask/AddOrGet", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Api-Key": f2aKey, "Accept-Language": "en-US" },
      body: JSON.stringify({ BarCode: fnsku }),
      cache: "no-store",
    });

  // Poll up to 6 times (taskState 0 = Pending, 1 = Finished, 2 = Failed)
  for (let attempt = 0; attempt < 6; attempt++) {
    if (attempt > 0) await new Promise(r => setTimeout(r, 1200));

    const res = await post();
    if (!res.ok) {
      console.error("F2A error:", res.status, await res.text().catch(() => ""));
      return null;
    }

    const json = await res.json();
    console.log("F2A attempt", attempt, "state:", json?.data?.taskState, "asin:", json?.data?.asin);

    const task = json?.data;
    if (!task) return null;
    if (task.taskState === 1 && task.asin) return task.asin as string; // Finished
    if (task.taskState === 2) return null; // Failed
    // taskState 0 = Pending → loop
  }

  return null;
}

// ── OpenWeb Ninja: ASIN → product ────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractProduct(raw: any) {
  const data = raw?.data ?? raw;
  if (!data || (!data.asin && !data.product_title)) return null;

  const images: string[] = [];
  if (data.product_photo) images.push(data.product_photo as string);
  for (const img of (data.product_photos as string[] ?? [])) {
    if (img && !images.includes(img)) images.push(img);
    if (images.length >= 5) break;
  }

  const rawCat = ((data.category_path as { name: string }[])?.[0]?.name ?? "").toLowerCase();
  let category = "";
  if (rawCat.includes("electronic") || rawCat.includes("computer") || rawCat.includes("phone") || rawCat.includes("audio") || rawCat.includes("camera") || rawCat.includes("video game")) category = "Electronics";
  else if (rawCat.includes("sport") || rawCat.includes("outdoor") || rawCat.includes("fitness")) category = "Sports";
  else if (rawCat.includes("food") || rawCat.includes("beverage") || rawCat.includes("grocery")) category = "Food & Drink";
  else if (rawCat.includes("home") || rawCat.includes("garden") || rawCat.includes("kitchen") || rawCat.includes("furniture") || rawCat.includes("appliance")) category = "Home & Garden";
  else if (rawCat.includes("art") || rawCat.includes("book") || rawCat.includes("toy") || rawCat.includes("collectible")) category = "Art & Collectibles";

  const description =
    (data.product_description as string) ||
    (Array.isArray(data.about_product) ? (data.about_product as string[]).join(" ") : "") ||
    "";

  const rawPrice = (data.product_price as string)?.replace(/[^0-9.]/g, "");
  const retailValue = rawPrice ? parseFloat(rawPrice) : null;

  return {
    title: (data.product_title as string) ?? "",
    description,
    brand: (data.product_details as Record<string, string>)?.Brand ?? "",
    category,
    retailValue,
    images,
  };
}

async function asinToProduct(asin: string, ninjaKey: string) {
  const res = await fetch(
    `https://api.openwebninja.com/realtime-amazon-data/product-details?asin=${asin}&country=US`,
    buildNinjaOpts(ninjaKey)
  );
  if (!res.ok) {
    console.error("OpenWebNinja product-details error:", res.status);
    return null;
  }
  const raw = await res.json();
  return extractProduct(raw);
}

// ── Route ─────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await prisma.orgMember.findFirst({ where: { clerkUserId: userId } });
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const code = req.nextUrl.searchParams.get("asin")?.trim().toUpperCase();
  if (!code || !/^[A-Z0-9]{10}$/.test(code)) {
    return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  }

  const ninjaKey = process.env.OPENWEBNINJA_API_KEY?.trim();
  if (!ninjaKey) return NextResponse.json({ error: "OPENWEBNINJA_API_KEY not configured" }, { status: 500 });

  const f2aKey = process.env.F2A_API_KEY?.trim();

  try {
    if (isFnsku(code)) {
      // ── FNSKU path ──────────────────────────────────────────────────────────
      if (!f2aKey) {
        return NextResponse.json({ error: "F2A_API_KEY not configured" }, { status: 500 });
      }

      const asin = await fnsku2asin(code, f2aKey);
      if (!asin) {
        return NextResponse.json({ found: false, message: "FNSKU not found in F2A database." });
      }

      const product = await asinToProduct(asin, ninjaKey);
      if (!product) {
        return NextResponse.json({ found: false, message: "FNSKU resolved but product details unavailable." });
      }

      return NextResponse.json({ found: true, source: "fnsku", resolvedAsin: asin, product });
    } else {
      // ── Direct ASIN path ────────────────────────────────────────────────────
      const product = await asinToProduct(code, ninjaKey);
      if (!product) {
        return NextResponse.json({ found: false, message: "No Amazon product found for that ASIN." });
      }
      return NextResponse.json({ found: true, source: "amazon", product });
    }
  } catch (e) {
    console.error("asin-lookup exception:", e);
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
}
