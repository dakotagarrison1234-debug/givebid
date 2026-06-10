export const dynamic = "force-dynamic";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import LocalDate from "@/app/components/LocalDate";
import UserMenu from "@/app/components/UserMenu";

interface Props {
  params: Promise<{ orgSlug: string; auctionSlug: string }>;
}

export default async function AuctionPage({ params }: Props) {
  const { orgSlug, auctionSlug } = await params;

  const org = await prisma.organization.findUnique({
    where: { slug: orgSlug },
  });

  const auction = org ? await prisma.auction.findFirst({
    where: { organizationId: org.id, slug: auctionSlug },
    include: {
      items: {
        include: { photos: true, bids: true },
      },
    },
  }) : null;

  if (!auction) {
    return (
      <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Auction not found</h1>
          <Link href="/" className="text-emerald-400">Go home</Link>
        </div>
      </main>
    );
  }

  const isClosed = auction.status === "CLOSED" || auction.status === "SETTLED";
  const totalRaised = auction.items.reduce((sum, item) => sum + item.currentBid, 0);

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 overflow-hidden">
          <Link href="/" className="text-emerald-400 font-bold text-lg sm:text-xl shrink-0">GiveBid</Link>
          <span className="text-gray-600 hidden sm:inline">/</span>
          <Link href={`/${orgSlug}`} className="text-gray-400 hover:text-white capitalize hidden sm:inline truncate max-w-[120px]">
            {orgSlug.replace(/-/g, " ")}
          </Link>
          <span className="text-gray-600 hidden sm:inline">/</span>
          <span className="text-white capitalize truncate">{auctionSlug.replace(/-/g, " ")}</span>
        </div>
        <UserMenu />
      </header>

      {isClosed && (
        <div className="bg-gray-800 border-b border-gray-700 px-4 sm:px-6 py-3 flex items-center gap-3">
          <span className="text-gray-400 text-sm">🔒</span>
          <span className="text-gray-300 text-sm font-medium">This auction has closed — bidding is no longer available.</span>
        </div>
      )}

      <div className="bg-gray-900 border-b border-gray-800 px-4 sm:px-6 py-6 sm:py-8">
        <div className="max-w-6xl mx-auto flex items-start sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2 truncate">{auction.title}</h1>
            <p className="text-gray-400 text-sm sm:text-base">
              {auction.items.length} items ·{" "}
              {isClosed ? "Closed" : "Closes"}{" "}
              <LocalDate iso={auction.endAt.toISOString()} />
            </p>
          </div>
          <div className="text-right shrink-0">
            <div className="text-2xl sm:text-3xl font-bold text-emerald-400">${totalRaised.toLocaleString()}</div>
            <div className="text-gray-500 text-sm">total raised</div>
          </div>
        </div>
      </div>

      <section className="px-4 sm:px-6 py-8 sm:py-10 max-w-6xl mx-auto">
        {auction.items.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p className="text-lg">No items in this auction yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {auction.items.map((item) => {
              const isSold = item.status !== "ACTIVE";
              const bidLabel = isClosed || isSold ? "Sold" : "Bid Now";
              const bidClass = isClosed || isSold
                ? "bg-gray-700 text-gray-400 text-sm px-4 py-2 rounded-lg"
                : "bg-emerald-500 hover:bg-emerald-400 text-white text-sm px-4 py-2 rounded-lg";

              return (
                <Link
                  key={item.id}
                  href={`/${orgSlug}/${auctionSlug}/item/${item.id}`}
                  className={`bg-gray-900 border rounded-xl overflow-hidden transition-colors ${
                    isClosed || isSold
                      ? "border-gray-800 opacity-80 hover:border-gray-700"
                      : "border-gray-800 hover:border-emerald-500"
                  }`}
                >
                  <div className="w-full h-48 bg-gray-800 flex items-center justify-center text-gray-600 overflow-hidden relative">
                    {item.photos.length > 0 ? (
                      <img
                        src={item.photos.find(p => p.isPrimary)?.url || item.photos[0].url}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-sm">No photo</span>
                    )}
                    {(isClosed || isSold) && (
                      <div className="absolute top-2 right-2 bg-gray-900/80 text-gray-300 text-xs px-2 py-1 rounded-full font-medium">
                        Sold
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded">
                        {item.category || "Uncategorized"}
                      </span>
                      <span className="text-xs text-gray-500">{item.condition.replace("_", " ").toLowerCase()}</span>
                    </div>
                    <h3 className="font-semibold text-lg mt-2 mb-1">{item.title}</h3>
                    {item.retailValue && (
                      <p className="text-gray-500 text-sm mb-3">Retail value: ${item.retailValue}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs text-gray-500">{isClosed || isSold ? "Winning bid" : "Current bid"}</div>
                        <div className="text-emerald-400 font-bold text-lg">
                          ${item.currentBid || item.startingBid}
                        </div>
                      </div>
                      <span className={bidClass}>{bidLabel}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
