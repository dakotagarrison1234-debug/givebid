export const dynamic = "force-dynamic";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

interface Props {
  params: Promise<{ orgSlug: string; auctionSlug: string }>;
}

export default async function AuctionPage({ params }: Props) {
  const { orgSlug, auctionSlug } = await params;
  const { userId } = await auth();

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

  const totalRaised = auction.items.reduce((sum, item) => sum + item.currentBid, 0);

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-emerald-400 font-bold text-xl">GiveBid</Link>
          <span className="text-gray-600">/</span>
          <Link href={`/${orgSlug}`} className="text-gray-400 hover:text-white capitalize">
            {orgSlug.replace(/-/g, " ")}
          </Link>
          <span className="text-gray-600">/</span>
          <span className="text-white capitalize">{auctionSlug.replace(/-/g, " ")}</span>
        </div>
        {userId ? (
          <Link href="/my-bids" className="bg-gray-800 hover:bg-gray-700 text-white text-sm px-4 py-2 rounded-lg">
            My Bids
          </Link>
        ) : (
          <Link href="/sign-in" className="bg-emerald-500 hover:bg-emerald-400 text-white text-sm px-4 py-2 rounded-lg">
            Sign In to Bid
          </Link>
        )}
      </header>

      <div className="bg-gray-900 border-b border-gray-800 px-6 py-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{auction.title}</h1>
            <p className="text-gray-400">
              {auction.items.length} items · Closes {new Date(auction.endAt).toLocaleDateString()}
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-emerald-400">${totalRaised}</div>
            <div className="text-gray-500 text-sm">total raised</div>
          </div>
        </div>
      </div>

      <section className="px-6 py-10 max-w-6xl mx-auto">
        {auction.items.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p className="text-lg">No items in this auction yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {auction.items.map((item) => (
              <Link
                key={item.id}
                href={`/${orgSlug}/${auctionSlug}/item/${item.id}`}
                className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-emerald-500 transition-colors"
              >
                <div className="w-full h-48 bg-gray-800 flex items-center justify-center text-gray-600 overflow-hidden">
                  {item.photos.length > 0 ? (
                    <img
                      src={item.photos.find(p => p.isPrimary)?.url || item.photos[0].url}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-sm">No photo</span>
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
                      <div className="text-xs text-gray-500">Current bid</div>
                      <div className="text-emerald-400 font-bold text-lg">
                        ${item.currentBid || item.startingBid}
                      </div>
                    </div>
                    <span className="bg-emerald-500 hover:bg-emerald-400 text-white text-sm px-4 py-2 rounded-lg">
                      Bid Now
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}