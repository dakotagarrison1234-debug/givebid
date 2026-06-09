import { prisma } from "@/lib/prisma";

/**
 * Close a single auction: mark winning bids as WON, items as SOLD/UNSOLD,
 * update auction status to CLOSED, fire GHL won webhooks.
 *
 * Safe to call from both the manual close endpoint and the cron job.
 */
export async function closeAuction(auctionId: string): Promise<{ winnersCount: number }> {
  const auction = await prisma.auction.findUnique({
    where: { id: auctionId },
    include: {
      organization: true,
      items: {
        where: { status: "ACTIVE" },
        include: {
          bids: { where: { status: "ACTIVE" }, orderBy: { amount: "desc" }, take: 1 },
        },
      },
    },
  });

  if (!auction) throw new Error(`Auction ${auctionId} not found`);

  let winnersCount = 0;
  const winnerNotifications: Promise<void>[] = [];

  for (const item of auction.items) {
    const winningBid = item.bids[0];

    if (winningBid) {
      await prisma.bid.update({ where: { id: winningBid.id }, data: { status: "WON" } });
      await prisma.item.update({ where: { id: item.id }, data: { status: "SOLD" } });

      const winnerProfile = await prisma.bidderProfile.findUnique({
        where: { clerkUserId: winningBid.clerkUserId },
      });

      winnersCount++;

      if (process.env.GHL_AUCTION_WON_WEBHOOK) {
        winnerNotifications.push(
          fetch(process.env.GHL_AUCTION_WON_WEBHOOK, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              event: "auction_won",
              bidderEmail: winnerProfile?.email || winningBid.clerkUserId,
              bidderPhone: winnerProfile?.phone || "",
              bidderName: winnerProfile?.name || "Winner",
              itemTitle: item.title,
              itemId: item.id,
              winningAmount: winningBid.amount,
              auctionName: auction.title,
              orgName: auction.organization.name,
              paymentUrl: `${process.env.NEXT_PUBLIC_APP_URL}/my-bids`,
            }),
          })
            .then(() => {})
            .catch((err) => console.error("GHL won webhook failed:", err))
        );
      }
    } else {
      await prisma.item.update({ where: { id: item.id }, data: { status: "UNSOLD" } });
    }
  }

  await prisma.auction.update({ where: { id: auctionId }, data: { status: "CLOSED" } });
  await Promise.allSettled(winnerNotifications);

  return { winnersCount };
}
