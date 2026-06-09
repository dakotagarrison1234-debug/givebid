export const dynamic = "force-dynamic";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserOrg } from "@/lib/auth";

export default async function AdminDashboard() {
  const membership = await requireUserOrg();
  const orgId = membership.organization.id;

  const [items, auctions, recentBids] = await Promise.all([
    prisma.item.findMany({ where: { organizationId: orgId }, include: { bids: true } }),
    prisma.auction.findMany({
      where: { organizationId: orgId },
      orderBy: { endAt: "asc" },
      include: { items: true },
    }),
    prisma.bid.findMany({
      where: { item: { organizationId: orgId } },
      include: { item: true },
      orderBy: { placedAt: "desc" },
      take: 6,
    }),
  ]);

  const totalRaised = items.reduce((sum, item) => sum + item.currentBid, 0);
  const activeAuction = auctions.find((a) => a.status === "OPEN") || auctions[0];
  const uniqueBidders = new Set(recentBids.map((b) => b.clerkUserId)).size;

  return (
    <>
      <header className="border-b border-gray-800 px-8 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <Link href="/admin/items/new" className="bg-emerald-500 hover:bg-emerald-400 text-white text-sm px-4 py-2 rounded-lg">
          + Add Item
        </Link>
      </header>

      <div className="px-8 py-6 grid grid-cols-4 gap-4">
        {[
          { label: "Total Raised", value: `$${totalRaised.toLocaleString()}` },
          { label: "Items Listed", value: items.length },
          { label: "Active Bidders", value: uniqueBidders },
          { label: "Bids Placed", value: recentBids.length },
        ].map((stat) => (
          <div key={stat.label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="text-gray-500 text-sm mb-1">{stat.label}</div>
            <div className="text-2xl font-bold">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="px-8 pb-6 grid grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="font-semibold mb-4">Recent Bids</h2>
          {recentBids.length === 0 ? (
            <p className="text-gray-500 text-sm">No bids yet.</p>
          ) : (
            <div className="space-y-3">
              {recentBids.map((bid) => (
                <div key={bid.id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                  <div>
                    <div className="text-sm font-medium">{bid.item.title}</div>
                    <div className="text-xs text-gray-500">
                      {bid.clerkUserId.substring(0, 8)}*** · {new Date(bid.placedAt).toLocaleTimeString()}
                    </div>
                  </div>
                  <span className="text-emerald-400 font-semibold">${bid.amount}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="font-semibold mb-4">Active Auction</h2>
          {!activeAuction ? (
            <div>
              <p className="text-gray-500 text-sm mb-4">No auctions yet.</p>
              <Link href="/admin/auctions/new" className="block text-center bg-emerald-500 hover:bg-emerald-400 text-white text-sm px-4 py-2 rounded-lg">
                Create Auction
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <div className="text-lg font-semibold">{activeAuction.title}</div>
                <div className="text-gray-500 text-sm">
                  Closes {new Date(activeAuction.endAt).toLocaleDateString()}
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Items</span>
                  <span>{activeAuction.items.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Status</span>
                  <span className={`capitalize ${activeAuction.status === "OPEN" ? "text-emerald-400" : "text-gray-400"}`}>
                    {activeAuction.status.toLowerCase()}
                  </span>
                </div>
              </div>
              <Link href={`/admin/auctions/${activeAuction.id}`} className="mt-4 block text-center bg-gray-800 hover:bg-gray-700 text-white text-sm px-4 py-2 rounded-lg">
                Manage Auction
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  );
}
