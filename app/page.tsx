export const dynamic = "force-dynamic";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import HomeHeader from "./components/HomeHeader";

export default async function HomePage() {
  const auctions = await prisma.auction.findMany({
    where: { status: { in: ["OPEN", "DRAFT"] } },
    include: {
      organization: true,
      items: true,
    },
    orderBy: { endAt: "asc" },
    take: 6,
  });

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <HomeHeader />

      <section className="px-6 py-20 text-center max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold mb-6">
          Auctions that raise more.<br />
          <span className="text-emerald-400">For causes that matter.</span>
        </h1>
        <p className="text-gray-400 text-xl mb-10">
          The easiest way for churches, schools, and nonprofits to run online auctions and raise money.
        </p>
        <Link href="/sign-up" className="bg-emerald-500 hover:bg-emerald-400 text-white text-lg px-8 py-4 rounded-xl font-semibold">
          Start Your Free Auction
        </Link>
      </section>

      <section className="px-6 py-12 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold">Live Auctions</h2>
        </div>
        {auctions.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p className="text-lg">No active auctions right now.</p>
            <p className="text-sm mt-2">Check back soon or start your own!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {auctions.map((auction) => (
              <Link
                key={auction.id}
                href={`/${auction.organization.slug}/${auction.slug}`}
                className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-emerald-500 transition-colors"
              >
                <div className="w-full h-32 bg-gray-800 rounded-lg mb-4 flex items-center justify-center text-gray-600 text-sm">
                  {auction.organization.name}
                </div>
                <h3 className="font-semibold text-lg mb-1">{auction.title}</h3>
                <p className="text-gray-500 text-sm mb-4">
                  {auction.items.length} items · Closes {new Date(auction.endAt).toLocaleDateString()}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-emerald-400 font-semibold">
                    ${auction.items.reduce((sum, item) => sum + item.currentBid, 0)} raised
                  </span>
                  <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-1 rounded-full capitalize">
                    {auction.status.toLowerCase()}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}