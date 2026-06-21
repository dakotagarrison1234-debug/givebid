import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await prisma.orgMember.findFirst({ where: { clerkUserId: userId } });
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const asin = req.nextUrl.searchParams.get("asin")?.trim().toUpperCase();
  if (!asin || !/^[A-Z0-9]{10}$/.test(asin)) {
    return NextResponse.json({ error: "Invalid ASIN" }, { status: 400 });
  }

  const apiKey = process.env.OPENWEBNINJA_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json({ error: "OPENWEBNINJA_API_KEY not configured" }, { status: 500 });
  }

  try {
    const res = await fetch(
      `https://api.openwebninja.com/realtime-amazon-data/product-details?asin=${asin}&country=US`,
      {
        headers: { "X-API-Key": apiKey },
        cache: "no-store", // avoid Next.js data cache mangling auth headers
      }
    );

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error("OpenWebNinja error:", res.status, errText);
      return NextResponse.json({ error: `Amazon lookup failed (${res.status})`, detail: errText }, { status: 502 });
    }

    const raw = await res.json();
    console.log("OpenWebNinja top-level keys:", Object.keys(raw));

    // Their response may wrap product fields under a "data" key
    const data = raw?.data ?? raw;

    if (!data || (!data.asin && !data.product_title)) {
      console.log("OpenWebNinja full response:", JSON.stringify(raw).slice(0, 500));
      return NextResponse.json({ found: false, message: "No Amazon product found for that ASIN." });
    }

    // Pull images
    const images: string[] = [];
    if (data.product_photo) images.push(data.product_photo);
    for (const img of data.product_photos ?? []) {
      if (img && !images.includes(img)) images.push(img);
      if (images.length >= 5) break;
    }

    // Map Amazon category to our categories
    const rawCat = (data.category_path?.[0]?.name ?? "").toLowerCase();
    let category = "";
    if (rawCat.includes("electronic") || rawCat.includes("computer") || rawCat.includes("phone") || rawCat.includes("audio") || rawCat.includes("camera") || rawCat.includes("video game")) category = "Electronics";
    else if (rawCat.includes("sport") || rawCat.includes("outdoor") || rawCat.includes("fitness")) category = "Sports";
    else if (rawCat.includes("food") || rawCat.includes("beverage") || rawCat.includes("grocery")) category = "Food & Drink";
    else if (rawCat.includes("home") || rawCat.includes("garden") || rawCat.includes("kitchen") || rawCat.includes("furniture") || rawCat.includes("appliance")) category = "Home & Garden";
    else if (rawCat.includes("art") || rawCat.includes("book") || rawCat.includes("toy") || rawCat.includes("collectible")) category = "Art & Collectibles";

    // Description: prefer product_description, fall back to about_product bullets
    const description =
      data.product_description ||
      (Array.isArray(data.about_product) ? data.about_product.join(" ") : "") ||
      "";

    // Price: strip $ and parse
    const rawPrice = data.product_price?.replace(/[^0-9.]/g, "");
    const retailValue = rawPrice ? parseFloat(rawPrice) : null;

    return NextResponse.json({
      found: true,
      source: "amazon",
      product: {
        title: data.product_title ?? "",
        description,
        brand: data.product_details?.Brand ?? "",
        category,
        retailValue,
        images,
      },
    });
  } catch {
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
}
