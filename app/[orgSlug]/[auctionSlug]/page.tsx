export const dynamic = "force-dynamic";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import LocalDate from "@/app/components/LocalDate";
import UserMenu from "@/app/components/UserMenu";

interface Props {
  params: Promise<{ orgSlug: string; auctionSlug: string }>;
}

function IcoLock() {
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="7" width="10" height="7" rx="2" />
      <path d="M5 7V5a3 3 0 0 1 6 0v2" />
    </svg>
  );
}
function IcoClock() {
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
      <circle cx="8" cy="8" r="6" />
      <path d="M8 5v3l2 1.5" />
    </svg>
  );
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
  const isClosing = auction.status === "CLOSING";

  // Only show items that are visible to bidders (not DRAFT)
  const visibleItems = auction.items.filter(i => i.status !== "DRAFT");

  const SOLD_STATUSES = ["SOLD", "PENDING_PICKUP", "PICKED_UP"];
  const totalRaised = visibleItems
    .filter(i => SOLD_STATUSES.includes(i.status))
    .reduce((sum, item) => sum + Number(item.currentBid), 0);

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800/60 px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3 bg-gray-950/95 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 overflow-hidden text-sm">
          <Link href="/" className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent shrink-0">
            PurposeBid
          </Link>
          <span className="text-gray-700 hidden sm:inline">/</span>
          <Link href={`/${orgSlug}`} className="text-gray-500 hover:text-white capitalize hidden sm:inline truncate max-w-[120px] transition-colors">
            {orgSlug.replace(/-/g, " ")}
          </Link>
          <span className="text-gray-700 hidden sm:inline">/</span>
          <span className="text-gray-300 capitalize truncate text-sm">{auctionSlug.replace(/-/g, " ")}</span>
        </div>
        <UserMenu />
      </header>

      {/* Status banners */}
      {isClosed && (
        <div className="bg-gray-800/40 border-b border-gray-700/50 px-4 sm:px-6 py-3 flex items-center gap-2.5">
          <IcoLock />
          <span className="text-gray-400 text-sm font-medium">This auction has closed — bidding is no longer available.</span>
        </div>
      )}
      {isClosing && !isClosed && (
        <div className="bg-amber-500/8 border-b border-amber-500/20 px-4 sm:px-6 py-3 flex items-center gap-2.5">
          <span className="text-amber-400"><IcoClock /></span>
          <span className="text-amber-300 text-sm font-semibold">This auction is closing soon — place your final bids now.</span>
        </div>
      )}

      {/* Auction hero */}
      <div className="relative overflow-hidden bg-gray-900/30 border-b border-gray-800/60 px-4 sm:px-6 py-6 sm:py-8">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-emerald-500/4 rounded-full blur-[60px]" />
        </div>
        <div className="relative max-w-6xl mx-auto flex items-start sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Link href={`/${orgSlug}`} className="text-xs text-gray-500 hover:text-emerald-400 transition-colors font-medium">
                {orgSlug.replace(/-/g, " ")}
              </Link>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">{auction.title}</h1>
            <p className="text-gray-400 text-sm">
              {visibleItems.length} item{visibleItems.length !== 1 ? "s" : ""} ·{" "}
              {isClosed ? "Closed" : isClosing ? "Closing" : "Closes"}{" "}
              <LocalDate iso={auction.endAt.toISOString()} />
            </p>
          </div>
          {totalRaised > 0 && (
            <div className="text-right shrink-0">
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400">${totalRaised.toLocaleString()}</div>
              <div className="text-gray-500 text-xs mt-0.5">total raised</div>
            </div>
          )}
        </div>
      </div>

      {/* Item grid */}
      <section className="px-4 sm:px-6 py-8 sm:py-10 max-w-6xl mx-auto">
        {visibleItems.length === 0 ? (
          <div className="text-center py-20 text-gray-600">
            <p className="text-lg font-medium">No items in this auction yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {visibleItems.map((item) => {
              const isItemSold = SOLD_STATUSES.includes(item.status);
              const isItemUnsold = item.status === "UNSOLD";
              const isItemClosed = isItemSold || isItemUnsold;
              const bidLabel = isItemUnsold ? "Ended" : isItemSold ? "Sold" : isClosed ? "Closed" : "Bid Now";
              const bidClass = isClosed || isItemClosed
                ? "bg-gray-800 text-gray-500 text-xs px-3 py-1.5 rounded-xl font-medium"
                : "bg-emerald-500 hover:bg-emerald-400 text-white text-xs px-3 py-1.5 rounded-xl font-bold transition-colors";

              const primaryPhoto = item.photos.find(p => p.isPrimary)?.url || item.photos[0]?.url;

              return (
                <Link
                  key={item.id}
                  href={`/${orgSlug}/${auctionSlug}/item/${item.id}`}
                  className={`bg-gray-900 border rounded-2xl overflow-hidden transition-all group ${
                    isClosed || isItemClosed
                      ? "border-gray-800/60 opacity-80 hover:border-gray-700"
                      : "border-gray-800 hover:border-emerald-500/40 hover:shadow-[0_0_25px_rgba(52,211,153,0.06)]"
                  }`}
                >
                  {/* Photo */}
                  <div className="w-full h-48 bg-gray-800 flex items-center justify-center text-gray-600 overflow-hidden relative">
                    {primaryPhoto ? (
                      <img
                        src={primaryPhoto}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-gray-700">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <rect x="3" y="3" width="18" height="18" rx="3" />
                          <circle cx="8.5" cy="8.5" r="2" />
                          <path d="m21 15-5-5L5 21" />
                        </svg>
                        <span className="text-xs">No photo</span>
                      </div>
                    )}
                    {isItemSold && (
                      <div className="absolute top-2.5 right-2.5 bg-gray-950/80 backdrop-blur-sm text-gray-300 text-xs px-2.5 py-1 rounded-full font-semibold">
                        Sold
                      </div>
                    )}
                    {isItemUnsold && (
                      <div className="absolute top-2.5 right-2.5 bg-gray-950/80 backdrop-blur-sm text-gray-500 text-xs px-2.5 py-1 rounded-full font-medium">
                        Ended
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      {item.category && (
                        <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-lg font-medium">
                          {item.category}
                        </span>
                      )}
                      <span className="text-xs text-gray-600 ml-auto">
                        {item.condition.replace("_", " ").toLowerCase()}
                      </span>
                    </div>
                    <h3 className="font-bold text-base mt-1 mb-1 leading-tight group-hover:text-emerald-400 transition-colors line-clamp-2">
                      {item.title}
                    </h3>
                    {item.retailValue && (
                      <p className="text-gray-600 text-xs mb-3">Retail: ${Number(item.retailValue).toLocaleString()}</p>
                    )}
                    <div className="flex items-center justify-between mt-3">
                      <div>
                        <div className="text-xs text-gray-500">
                          {isItemSold ? "Winning bid" : isItemUnsold ? "Final bid" : "Current bid"}
                        </div>
                        <div className={`font-extrabold text-xl ${isItemUnsold ? "text-gray-500" : "text-emerald-400"}`}>
                          ${(Number(item.currentBid) || Number(item.startingBid)).toLocaleString()}
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
