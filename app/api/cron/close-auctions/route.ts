import { NextRequest, NextResponse } from "next/server";
import { closeExpiredItems } from "@/lib/closeAuction";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { closedItems, closedAuctions } = await closeExpiredItems();
  console.log(`[cron] Closed ${closedItems} item(s), ${closedAuctions} auction(s)`);
  return NextResponse.json({ closedItems, closedAuctions });
}
