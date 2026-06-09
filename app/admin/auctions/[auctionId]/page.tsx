import Link from "next/link";
import { prisma } from "@/lib/prisma";

interface Props {
  params: Promise<{ auctionId: string }>;
}

export default async function ManageAuctionPage({ params }: Props) {
  const { auctionId } = await params;

  const auction = await prisma.auction.findUnique({
    where: { id: auctionId },
    include: {
      items: {
        include: { photos: true, bids: true },
      },
      organization: true,
    },
  });

  if (!auction) {
    return (
      <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Auction not found</h1>
          <Link href="/admin/auctions" className="text-emerald-400">Back to auctions</Link>
        </div>
      </main>
    );
  }

  const totalRaised = auction.items.reduce((sum, item) => sum + item.currentBid, 0);

  return (
    <div className="min-h-screen bg-gray-950 text-white flex">
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="px-6 py-5 border-b border-gray-800">
          <span className="text-emerald-400 font-bold text-xl">GiveBid</span>
          <p className="text-gray-500 text-xs mt-1">{auction.organization.name}</p>
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
          <div className="flex items-center gap-3">
            <Link href="/admin/auctions" className="text-gray-400 hover:text-white text-sm">← Auctions</Link>
            <span className="text-gray-600">/</span>
            <h1 className="text-xl font-semibold">{auction.title}</h1>
            <span className={`text-xs px-2 py-1 rounded-full ${
              auction.status === "OPEN"
                ? "bg-emerald-500/20 text-emerald-400"
                : "bg-gray-700 text-gray-400"
            }`}>
              {auction.status.toLowerCase()}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/${auction.organization.slug}/${auction.slug}`}
              target="_blank"
              className="text-gray-400 hover:text-white text-sm border border-gray-700 px-4 py-2 rounded-lg"
            >
              View Public Page ↗
            </Link>
          </div>
        </header>

        <div className="px-8 py-6 space-y-6">

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: "Total Raised", value: `$${totalRaised}` },
              { label: "Items", value: auction.items.length },
              { label: "Total Bids", value: auction.items.reduce((sum, item) => sum + item.bids.length, 0) },
              { label: "Closes", value: new Date(auction.endAt).toLocaleDateString() },
            ].map((stat) => (
              <div key={stat.label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <div className="text-gray-500 text-sm mb-1">{stat.label}</div>
                <div className="text-2xl font-bold">{stat.value}</div>
              </div>
            ))}
          </div>

          {/* Items */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
              <h2 className="font-semibold">Items in this Auction</h2>
              <Link href="/admin/items/new" className="bg-emerald-500 hover:bg-emerald-400 text-white text-sm px-4 py-2 rounded-lg">
                + Add Item
              </Link>
            </div>
            {auction.items.length === 0 ? (
              <div className="px-6 py-10 text-center text-gray-500">
                No items yet — add items and assign them to this auction.
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left px-6 py-4 text-gray-500 text-sm font-medium">Item</th>
                    <th className="text-left px-6 py-4 text-gray-500 text-sm font-medium">Starting Bid</th>
                    <th className="text-left px-6 py-4 text-gray-500 text-sm font-medium">Current Bid</th>
                    <th className="text-left px-6 py-4 text-gray-500 text-sm font-medium">Bids</th>
                    <th className="text-left px-6 py-4 text-gray-500 text-sm font-medium">Photo</th>
                  </tr>
                </thead>
                <tbody>
                  {auction.items.map((item) => (
                    <tr key={item.id} className="border-b border-gray-800 last:border-0 hover:bg-gray-800/50">
                      <td className="px-6 py-4">
                        <div className="font-medium">{item.title}</div>
                        {item.category && <div className="text-xs text-gray-500">{item.category}</div>}
                      </td>
                      <td className="px-6 py-4 text-gray-400">${item.startingBid}</td>
                      <td className="px-6 py-4 text-emerald-400 font-semibold">${item.currentBid}</td>
                      <td className="px-6 py-4 text-gray-400">{item.bids.length}</td>
                      <td className="px-6 py-4">
                        {item.photos.length > 0 ? (
                          <span className="text-xs text-emerald-400">✓ {item.photos.length} photo{item.photos.length > 1 ? "s" : ""}</span>
                        ) : (
                          <span className="text-xs text-gray-600">No photos</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}