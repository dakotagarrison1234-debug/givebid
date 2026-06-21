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

  const apiKey = process.env.OPENWEBNINJA_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OPENWEBNINJA_API_KEY not configured" }, { status: 500 });
  }

  try {
    const res = await fetch(
      `https://api.openwebninja.com/realtime-amazon-data/product-details?asin=${asin}&country=US`,
      {
        headers: { "x-api-key": apiKey },
        next: { revalidate: 86400 }, // cache 24h — same ASIN won't change
      }
    );

    if (!res.ok) {
      return NextResponse.json({ error: "Amazon lookup failed" }, { status: 502 });
    }

    const data = await res.json();

    if (!data || !data.asin) {
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
