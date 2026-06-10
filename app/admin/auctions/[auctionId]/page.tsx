export const dynamic = "force-dynamic";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import AuctionStatusButtons from "@/app/components/AuctionStatusButtons";
import LocalDate from "@/app/components/LocalDate";

interface Props {
  params: Promise<{ auctionId: string }>;
}

export default async function ManageAuctionPage({ params }: Props) {
  const { auctionId } = await params;

  const auction = await prisma.auction.findUnique({
    where: { id: auctionId },
    include: {
      items: { include: { photos: true, bids: true } },
      organization: true,
    },
  });

  if (!auction) {
    return (
      <div className="flex items-center justify-center flex-1">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Auction not found</h1>
          <Link href="/admin/auctions" className="text-emerald-400">Back to auctions</Link>
        </div>
      </div>
    );
  }

  const totalRaised = auction.items.reduce((sum, item) => sum + item.currentBid, 0);
  const totalBids = auction.items.reduce((sum, item) => sum + item.bids.length, 0);

  return (
    <>
      <header className="border-b border-gray-800 px-4 sm:px-8 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Link href="/admin/auctions" className="text-gray-400 hover:text-white text-sm shrink-0">← Auctions</Link>
          <span className="text-gray-600">/</span>
          <h1 className="text-lg sm:text-xl font-semibold truncate">{auction.title}</h1>
          <span className={`text-xs px-2 py-1 rounded-full shrink-0 ${
            auction.status === "OPEN" ? "bg-emerald-500/20 text-emerald-400"
            : auction.status === "CLOSED" ? "bg-red-500/20 text-red-400"
            : "bg-gray-700 text-gray-400"
          }`}>
            {auction.status.toLowerCase()}
          </span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Link
            href={`/${auction.organization.slug}/${auction.slug}`}
            target="_blank"
            className="text-gray-400 hover:text-white text-xs sm:text-sm border border-gray-700 px-3 py-2 rounded-lg whitespace-nowrap"
          >
            View ↗
          </Link>
          <AuctionStatusButtons auctionId={auction.id} status={auction.status} />
        </div>
      </header>

      <div className="px-4 sm:px-8 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {[
            { label: "Total Raised", value: `$${totalRaised.toLocaleString()}` },
            { label: "Items", value: auction.items.length },
            { label: "Total Bids", value: totalBids },
            { label: "Closes", value: <LocalDate iso={auction.endAt.toISOString()} /> },
          ].map((stat) => (
            <div key={stat.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-5">
              <div className="text-gray-500 text-xs sm:text-sm mb-1">{stat.label}</div>
              <div className="text-xl sm:text-2xl font-bold">{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Items */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-5 sm:px-6 py-4 border-b border-gray-800 flex items-center justify-between">
            <h2 className="font-semibold">Items ({auction.items.length})</h2>
            <Link
              href={`/admin/items/new?auctionId=${auction.id}`}
              className="bg-emerald-500 hover:bg-emerald-400 text-white text-sm px-4 py-2 rounded-lg"
            >
              + Add Item
            </Link>
          </div>

          {auction.items.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="text-4xl mb-4">📦</div>
              <p className="text-gray-400 font-medium mb-1">No items yet</p>
              <p className="text-gray-600 text-sm mb-6">Add items to this auction so bidders can start bidding.</p>
              <Link
                href={`/admin/items/new?auctionId=${auction.id}`}
                className="bg-emerald-500 hover:bg-emerald-400 text-white text-sm px-6 py-3 rounded-lg inline-block"
              >
                + Add First Item
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[580px]">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="w-14 px-4 py-3"></th>
                    <th className="text-left px-4 py-3 text-gray-500 text-sm font-medium">Item</th>
                    <th className="text-left px-4 py-3 text-gray-500 text-sm font-medium">Start</th>
                    <th className="text-left px-4 py-3 text-gray-500 text-sm font-medium">Current</th>
                    <th className="text-left px-4 py-3 text-gray-500 text-sm font-medium">Bids</th>
                    <th className="text-left px-4 py-3 text-gray-500 text-sm font-medium">Status</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {auction.items.map((item) => {
                    const photo = item.photos.find(p => p.isPrimary) ?? item.photos[0];
                    return (
                      <tr key={item.id} className="border-b border-gray-800 last:border-0 hover:bg-gray-800/40 transition-colors">
                        <td className="px-4 py-3 w-14">
                          {photo ? (
                            <img
                              src={photo.url}
                              alt={item.title}
                              className="w-10 h-10 object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center text-gray-600 text-xs">
                              ?
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-sm">{item.title}</div>
                          {item.category && <div className="text-xs text-gray-600">{item.category}</div>}
                          {item.storageLocation && (
                            <div className="text-xs font-mono text-emerald-600 mt-0.5">📍 {item.storageLocation}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-sm">${item.startingBid}</td>
                        <td className="px-4 py-3 text-emerald-400 font-semibold text-sm">${item.currentBid}</td>
                        <td className="px-4 py-3 text-gray-400 text-sm">{item.bids.length}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            item.status === "ACTIVE" ? "bg-emerald-500/20 text-emerald-400"
                            : item.status === "SOLD" ? "bg-blue-500/20 text-blue-400"
                            : (item.status as string) === "PENDING_PICKUP" ? "bg-yellow-500/20 text-yellow-400"
                            : (item.status as string) === "PICKED_UP" ? "bg-purple-500/20 text-purple-400"
                            : "bg-gray-700 text-gray-400"
                          }`}>
                            {item.status.replace(/_/g, " ").toLowerCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/admin/items/${item.id}`}
                            className="text-xs bg-gray-800 hover:bg-gray-700 text-white px-3 py-1.5 rounded-lg whitespace-nowrap"
                          >
                            Edit
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
