export const dynamic = "force-dynamic";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function WinnersPage() {
  const wonBids = await prisma.bid.findMany({
    where: { status: "WON" },
    include: {
      item: {
        include: { photos: true },
      },
    },
    orderBy: { placedAt: "desc" },
  });

  const activeBids = await prisma.bid.findMany({
    where: { status: "ACTIVE" },
    include: {
      item: {
        include: {
          auction: true,
        },
      },
    },
    orderBy: { amount: "desc" },
  });

  return (
    <div className="min-h-screen bg-gray-950 text-white flex">
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="px-6 py-5 border-b border-gray-800">
          <span className="text-emerald-400 font-bold text-xl">GiveBid</span>
          <p className="text-gray-500 text-xs mt-1">Owosso Schools</p>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1">
          {[
            { label: "Overview", href: "/admin/dashboard", icon: "▦" },
            { label: "Items", href: "/admin/items", icon: "☰" },
            { label: "Auctions", href: "/admin/auctions", icon: "◷" },
            { label: "Winners", href: "/admin/winners", icon: "✓" },
            { label: "Settings", href: "/admin/settings", icon: "⚙" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="border-b border-gray-800 px-8 py-4">
          <h1 className="text-xl font-semibold">Winners & Payments</h1>
        </header>

        <div className="px-8 py-6 space-y-8">

          {/* Current Leaders */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Current Leading Bids</h2>
            {activeBids.length === 0 ? (
              <p className="text-gray-500">No active bids yet.</p>
            ) : (
              <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="text-left px-6 py-4 text-gray-500 text-sm font-medium">Item</th>
                      <th className="text-left px-6 py-4 text-gray-500 text-sm font-medium">Auction</th>
                      <th className="text-left px-6 py-4 text-gray-500 text-sm font-medium">Leading Bid</th>
                      <th className="text-left px-6 py-4 text-gray-500 text-sm font-medium">Bidder</th>
                      <th className="text-left px-6 py-4 text-gray-500 text-sm font-medium">Payment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeBids.map((bid) => (
                      <tr key={bid.id} className="border-b border-gray-800 last:border-0 hover:bg-gray-800/50">
                        <td className="px-6 py-4 font-medium">{bid.item.title}</td>
                        <td className="px-6 py-4 text-gray-400 text-sm">
                          {bid.item.auction?.title || "—"}
                        </td>
                        <td className="px-6 py-4 text-emerald-400 font-bold">${bid.amount}</td>
                        <td className="px-6 py-4 text-gray-400 text-sm">
                          {bid.clerkUserId.substring(0, 8)}...
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full">
                            Pending
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Confirmed Winners */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Confirmed Winners</h2>
            {wonBids.length === 0 ? (
              <p className="text-gray-500">No confirmed winners yet — winners are set when an auction closes.</p>
            ) : (
              <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="text-left px-6 py-4 text-gray-500 text-sm font-medium">Item</th>
                      <th className="text-left px-6 py-4 text-gray-500 text-sm font-medium">Winning Bid</th>
                      <th className="text-left px-6 py-4 text-gray-500 text-sm font-medium">Winner</th>
                      <th className="text-left px-6 py-4 text-gray-500 text-sm font-medium">Status</th>
                      <th className="text-left px-6 py-4 text-gray-500 text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wonBids.map((bid) => (
                      <tr key={bid.id} className="border-b border-gray-800 last:border-0 hover:bg-gray-800/50">
                        <td className="px-6 py-4 font-medium">{bid.item.title}</td>
                        <td className="px-6 py-4 text-emerald-400 font-bold">${bid.amount}</td>
                        <td className="px-6 py-4 text-gray-400 text-sm">
                          {bid.clerkUserId.substring(0, 8)}...
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full">
                            Won
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button className="text-xs bg-emerald-500 hover:bg-emerald-400 text-white px-3 py-1 rounded-lg">
                            Send Payment Link
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}