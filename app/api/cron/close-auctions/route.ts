export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { openScheduledAuctions, closeExpiredItems } from "@/lib/closeAuction";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Open auctions whose startAt has passed and activate their items
  const { openedAuctions } = await openScheduledAuctions();

  // Close items/auctions whose endAt has passed
  const { closedItems, closedAuctions } = await closeExpiredItems();

  console.log(`[cron] Opened ${openedAuctions} auction(s), closed ${closedItems} item(s), ${closedAuctions} auction(s)`);
  return NextResponse.json({ openedAuctions, closedItems, closedAuctions });
}
