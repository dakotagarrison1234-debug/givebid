import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

const OPTS = { headers: { "X-API-Key": "" }, cache: "no-store" as const };

function buildOpts(apiKey: string) {
  return { headers: { "X-API-Key": apiKey }, cache: "no-store" as const };
}

function extractProduct(raw: Record<string, unknown>) {
  // Their response may wrap product fields under a "data" key
  const data = (raw?.data ?? raw) as Record<string, unknown>;
  if (!data || (!data.asin && !data.product_title)) return null;

  const images: string[] = [];
  if (data.product_photo) images.push(data.product_photo as string);
  for (const img of (data.product_photos as string[] ?? [])) {
    if (img && !images.includes(img)) images.push(img);
    if (images.length >= 5) break;
  }

  const rawCat = ((data.category_path as {name:string}[])?.[0]?.name ?? "").toLowerCase();
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

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await prisma.orgMember.findFirst({ where: { clerkUserId: userId } });
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const code = req.nextUrl.searchParams.get("asin")?.trim().toUpperCase();
  if (!code || !/^[A-Z0-9]{10}$/.test(code)) {
    return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  }

  const apiKey = process.env.OPENWEBNINJA_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json({ error: "OPENWEBNINJA_API_KEY not configured" }, { status: 500 });
  }

  const opts = buildOpts(apiKey);

  try {
    // ── Step 1: try direct ASIN product-details lookup ─────────────────────
    const res1 = await fetch(
      `https://api.openwebninja.com/realtime-amazon-data/product-details?asin=${code}&country=US`,
      opts
    );

    if (res1.ok) {
      const raw1 = await res1.json();
      const product = extractProduct(raw1);
      if (product) {
        return NextResponse.json({ found: true, source: "amazon", product });
      }
    }

    // ── Step 2: FNSKU / unknown code — fall back to search ─────────────────
    // FNSKUs (X00...) and other codes that aren't real ASINs won't resolve
    // via product-details, but Amazon search can still find the product.
    const searchRes = await fetch(
      `https://api.openwebninja.com/realtime-amazon-data/search?query=${encodeURIComponent(code)}&country=US&page=1`,
      opts
    );

    if (!searchRes.ok) {
      const errText = await searchRes.text().catch(() => "");
      console.error("OpenWebNinja search error:", searchRes.status, errText);
      return NextResponse.json({ found: false, message: "No product found for that code." });
    }

    const searchRaw = await searchRes.json();
    // Search response: { data: [ { asin, product_title, ... }, ... ] }
    const searchData = (searchRaw?.data ?? searchRaw) as Record<string, unknown>;
    const results = Array.isArray(searchData)
      ? searchData
      : Array.isArray((searchData as Record<string, unknown>)?.products)
        ? (searchData as Record<string, unknown[]>).products
        : [];

    const first = results[0] as Record<string, unknown> | undefined;
    if (!first) {
      return NextResponse.json({ found: false, message: "No product found for that code." });
    }

    // We have a search hit — fetch full details using its real ASIN
    const realAsin = first.asin as string;
    if (realAsin) {
      const res2 = await fetch(
        `https://api.openwebninja.com/realtime-amazon-data/product-details?asin=${realAsin}&country=US`,
        opts
      );
      if (res2.ok) {
        const raw2 = await res2.json();
        const product = extractProduct(raw2);
        if (product) {
          return NextResponse.json({ found: true, source: "amazon", product });
        }
      }
    }

    // Fall back to whatever the search result itself contains
    const product = extractProduct(first);
    if (product) {
      return NextResponse.json({ found: true, source: "amazon", product });
    }

    return NextResponse.json({ found: false, message: "No product found for that code." });
  } catch (e) {
    console.error("ASIN lookup exception:", e);
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
}
