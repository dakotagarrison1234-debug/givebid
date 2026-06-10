export const dynamic = "force-dynamic";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserOrg } from "@/lib/auth";
import LocalDate from "@/app/components/LocalDate";

export default async function AdminDashboard() {
  const membership = await requireUserOrg();
  const orgId = membership.organization.id;

  const [items, auctions, allBids] = await Promise.all([
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
    }),
  ]);

  const soldStatuses = ["SOLD", "PENDING_PICKUP", "PICKED_UP"];
  const totalRaised = items
    .filter((i) => soldStatuses.includes(i.status))
    .reduce((sum, i) => sum + i.currentBid, 0);
  const activeAuction = auctions.find((a) => a.status === "OPEN") || auctions[0];
  const uniqueBidders = new Set(allBids.map((b) => b.clerkUserId)).size;
  const recentBids = allBids.slice(0, 6);

  // Resolve bidder display names for recent bids
  const recentIds = [...new Set(recentBids.map((b) => b.clerkUserId))];
  const profiles = recentIds.length
    ? await prisma.bidderProfile.findMany({ where: { clerkUserId: { in: recentIds } } })
    : [];
  const profileMap = new Map(profiles.map((p) => [p.clerkUserId, p]));

  return (
    <>
      <header className="border-b border-gray-800 px-4 sm:px-8 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <Link
          href="/admin/auctions/new"
          className="bg-emerald-500 hover:bg-emerald-400 text-white text-sm px-4 py-2 rounded-lg"
        >
          + New Auction
        </Link>
      </header>

      {/* Stats */}
      <div className="px-4 sm:px-8 py-6 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: "Total Raised", value: `$${totalRaised.toLocaleString()}` },
          { label: "Items Listed", value: items.length },
          { label: "Active Bidders", value: uniqueBidders },
          { label: "Bids Placed", value: allBids.length },
        ].map((stat) => (
          <div key={stat.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-5">
            <div className="text-gray-500 text-xs sm:text-sm mb-1">{stat.label}</div>
            <div className="text-xl sm:text-2xl font-bold">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Recent bids + active auction */}
      <div className="px-4 sm:px-8 pb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 sm:p-6">
          <h2 className="font-semibold mb-4">Recent Bids</h2>
          {recentBids.length === 0 ? (
            <p className="text-gray-500 text-sm">No bids yet.</p>
          ) : (
            <div>
              {recentBids.map((bid) => {
                const p = profileMap.get(bid.clerkUserId);
                const name = p?.name || p?.email || `${bid.clerkUserId.substring(0, 8)}…`;
                return (
                  <div
                    key={bid.id}
                    className="flex items-center justify-between py-3 border-b border-gray-800 last:border-0"
                  >
                    <div className="min-w-0 pr-3">
                      <div className="text-sm font-medium truncate">{bid.item.title}</div>
                      <div className="text-xs text-gray-500 truncate">
                        {name} ·{" "}
                        {new Date(bid.placedAt).toLocaleTimeString([], {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                    <span className="text-emerald-400 font-semibold shrink-0">
                      ${bid.amount.toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 sm:p-6">
          <h2 className="font-semibold mb-4">Active Auction</h2>
          {!activeAuction ? (
            <div>
              <p className="text-gray-500 text-sm mb-4">No auctions yet.</p>
              <Link
                href="/admin/auctions/new"
                className="block text-center bg-emerald-500 hover:bg-emerald-400 text-white text-sm px-4 py-2 rounded-lg"
              >
                Create Auction
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <div className="text-lg font-semibold">{activeAuction.title}</div>
                <div className="text-gray-500 text-sm mt-0.5">
                  Closes <LocalDate iso={activeAuction.endAt.toISOString()} />
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Items</span>
                  <span>{activeAuction.items.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Raised</span>
                  <span className="text-emerald-400 font-semibold">
                    ${activeAuction.items
                      .filter((i) => soldStatuses.includes(i.status))
                      .reduce((s, i) => s + i.currentBid, 0)
                      .toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Status</span>
                  <span
                    className={`capitalize ${
                      activeAuction.status === "OPEN" ? "text-emerald-400" : "text-gray-400"
                    }`}
                  >
                    {activeAuction.status.toLowerCase()}
                  </span>
                </div>
              </div>
              <Link
                href={`/admin/auctions/${activeAuction.id}`}
                className="block text-center bg-gray-800 hover:bg-gray-700 text-white text-sm px-4 py-2 rounded-lg"
              >
                Manage Auction
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div className="px-4 sm:px-8 pb-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Auctions", href: "/admin/auctions", icon: "◷" },
            { label: "Winners", href: "/admin/winners", icon: "✓" },
            { label: "Pickup", href: "/admin/pickup", icon: "📦" },
            { label: "Team", href: "/admin/staff", icon: "👥" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl p-4 flex items-center gap-3 transition-colors"
            >
              <span className="text-gray-400 text-sm">{link.icon}</span>
              <span className="text-sm font-medium text-gray-300">{link.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
