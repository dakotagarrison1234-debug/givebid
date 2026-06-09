export const dynamic = "force-dynamic";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AuctionsPage() {
  const auctions = await prisma.auction.findMany({
    orderBy: { createdAt: "desc" },
    include: { items: true },
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
        <header className="border-b border-gray-800 px-8 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Auctions ({auctions.length})</h1>
          <Link href="/admin/auctions/new" className="bg-emerald-500 hover:bg-emerald-400 text-white text-sm px-4 py-2 rounded-lg">
            + New Auction
          </Link>
        </header>

        <div className="px-8 py-6">
          {auctions.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <p className="text-lg mb-4">No auctions yet</p>
              <Link href="/admin/auctions/new" className="bg-emerald-500 hover:bg-emerald-400 text-white px-6 py-3 rounded-lg">
                Create your first auction
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {auctions.map((auction) => (
                <div key={auction.id} className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{auction.title}</h3>
                    <p className="text-gray-500 text-sm mt-1">
                      {auction.items.length} items · {new Date(auction.startAt).toLocaleDateString()} — {new Date(auction.endAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-xs px-3 py-1 rounded-full ${
                      auction.status === "OPEN"
                        ? "bg-emerald-500/20 text-emerald-400"
                        : auction.status === "DRAFT"
                        ? "bg-gray-700 text-gray-400"
                        : "bg-red-500/20 text-red-400"
                    }`}>
                      {auction.status.toLowerCase()}
                    </span>
                    <Link href={`/admin/auctions/${auction.id}`} className="text-gray-400 hover:text-white text-sm">
                      Manage →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}