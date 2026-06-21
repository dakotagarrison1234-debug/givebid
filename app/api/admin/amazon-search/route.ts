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

    const text = await res.text();
    console.log("Amazon search status:", res.status);
    console.log("Amazon search raw (first 1000):", text.slice(0, 1000));

    if (!res.ok) {
      return NextResponse.json({ results: [] });
    }

    let raw: Record<string, unknown>;
    try { raw = JSON.parse(text); } catch { return NextResponse.json({ results: [] }); }

    // Try every possible nesting the API might use
    const items: Record<string, unknown>[] =
      Array.isArray(raw?.data?.products) ? (raw.data as Record<string, unknown[]>).products as Record<string, unknown>[] :
      Array.isArray(raw?.data?.search_results) ? (raw.data as Record<string, unknown[]>).search_results as Record<string, unknown>[] :
      Array.isArray(raw?.data) ? raw.data as Record<string, unknown>[] :
      Array.isArray(raw?.products) ? raw.products as Record<string, unknown>[] :
      Array.isArray(raw?.search_results) ? raw.search_results as Record<string, unknown>[] :
      Array.isArray(raw?.results) ? raw.results as Record<string, unknown>[] :
      Array.isArray(raw) ? raw as Record<string, unknown>[] :
      [];

    console.log("Amazon search items found:", items.length);

    const results = items.slice(0, 8).map((p) => ({
      asin: (p.asin ?? p.product_asin ?? "") as string,
      title: (p.product_title ?? p.title ?? "") as string,
      image: (p.product_photo ?? p.thumbnail ?? p.image ?? p.product_image ?? "") as string,
      price: (p.product_price ?? p.price ?? "") as string,
      brand: ((p.product_details as Record<string, string>)?.Brand ?? p.brand ?? "") as string,
    })).filter(r => r.title);

    return NextResponse.json({ results });
  } catch (e) {
    console.error("Amazon search exception:", e);
    return NextResponse.json({ results: [] });
  }
}
