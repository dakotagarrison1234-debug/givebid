import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { closeAuction } from "@/lib/closeAuction";

// Secured by Vercel's CRON_SECRET — only Vercel's cron scheduler can call this.
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find all OPEN auctions whose endAt has passed
  const expiredAuctions = await prisma.auction.findMany({
    where: {
      status: "OPEN",
      endAt: { lte: new Date() },
    },
    select: { id: true, title: true },
  });

  if (expiredAuctions.length === 0) {
    return NextResponse.json({ closed: 0 });
  }

  const results = await Promise.allSettled(
    expiredAuctions.map((a) => closeAuction(a.id))
  );

  const closed = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;

  console.log(`[cron] Closed ${closed} auction(s), ${failed} failed`);
  if (failed > 0) {
    results.forEach((r, i) => {
      if (r.status === "rejected") {
        console.error(`[cron] Failed to close auction ${expiredAuctions[i].title}:`, r.reason);
      }
    });
  }

  return NextResponse.json({ closed, failed });
}
