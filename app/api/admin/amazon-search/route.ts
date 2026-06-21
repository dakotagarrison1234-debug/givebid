import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await prisma.orgMember.findFirst({ where: { clerkUserId: userId } });
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const query = req.nextUrl.searchParams.get("q")?.trim();
  if (!query || query.length < 2) {
    return NextResponse.json({ error: "Query too short" }, { status: 400 });
  }

  const apiKey = process.env.OPENWEBNINJA_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json({ error: "OPENWEBNINJA_API_KEY not configured" }, { status: 500 });
  }

  try {
    const res = await fetch(
      `https://api.openwebninja.com/realtime-amazon-data/search?query=${encodeURIComponent(query)}&country=US&page=1`,
      { headers: { "X-API-Key": apiKey }, cache: "no-store" }
    );

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error("Amazon search error:", res.status, errText);
      return NextResponse.json({ results: [] });
    }

    const raw = await res.json();
    console.log("Amazon search raw keys:", Object.keys(raw));

    // OpenWeb Ninja search returns products array — try common shapes
    const items: Record<string, unknown>[] =
      Array.isArray(raw) ? raw :
      Array.isArray(raw?.data) ? raw.data :
      Array.isArray(raw?.products) ? raw.products :
      Array.isArray(raw?.search_results) ? raw.search_results :
      [];

    const results = items.slice(0, 8).map((p) => ({
      asin: p.asin ?? p.product_asin ?? "",
      title: p.product_title ?? p.title ?? "",
      image: p.product_photo ?? p.thumbnail ?? p.image ?? "",
      price: p.product_price ?? p.price ?? "",
      brand: (p.product_details as Record<string,string>)?.Brand ?? p.brand ?? "",
    })).filter(r => r.title);

    return NextResponse.json({ results });
  } catch (e) {
    console.error("Amazon search exception:", e);
    return NextResponse.json({ results: [] });
  }
}
