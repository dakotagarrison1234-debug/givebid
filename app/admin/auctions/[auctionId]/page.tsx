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
            { label: "Total Bids", value: auction.items.reduce((sum, item) => sum + item.bids.length, 0) },
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
          <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
            <h2 className="font-semibold">Items in this Auction</h2>
            <Link href={`/admin/items/new?auctionId=${auction.id}`} className="bg-emerald-500 hover:bg-emerald-400 text-white text-sm px-4 py-2 rounded-lg">
              + Add Item
            </Link>
          </div>
          {auction.items.length === 0 ? (
            <div className="px-6 py-10 text-center text-gray-500">
              No items yet — add items and assign them to this auction.
            </div>
          ) : (
            <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left px-6 py-4 text-gray-500 text-sm font-medium">Item</th>
                  <th className="text-left px-6 py-4 text-gray-500 text-sm font-medium">Starting Bid</th>
                  <th className="text-left px-6 py-4 text-gray-500 text-sm font-medium">Current Bid</th>
                  <th className="text-left px-6 py-4 text-gray-500 text-sm font-medium">Bids</th>
                  <th className="text-left px-6 py-4 text-gray-500 text-sm font-medium">Status</th>
                  <th className="text-left px-6 py-4 text-gray-500 text-sm font-medium">Photos</th>
                  <th className="text-left px-6 py-4 text-gray-500 text-sm font-medium">Edit</th>
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
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        item.status === "ACTIVE" ? "bg-emerald-500/20 text-emerald-400"
                        : item.status === "SOLD" ? "bg-blue-500/20 text-blue-400"
                        : "bg-gray-700 text-gray-400"
                      }`}>
                        {item.status.replace("_", " ").toLowerCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {item.photos.length > 0 ? (
                        <span className="text-xs text-emerald-400">✓ {item.photos.length}</span>
                      ) : (
                        <span className="text-xs text-gray-600">None</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Link href={`/admin/items/${item.id}`} className="text-xs bg-gray-800 hover:bg-gray-700 text-white px-3 py-1 rounded-lg">
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
