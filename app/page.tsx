export const dynamic = "force-dynamic";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import HomeHeader from "./components/HomeHeader";
import LocalDate from "./components/LocalDate";
import SearchBar from "./components/SearchBar";

export default async function HomePage() {
  const { userId } = await auth();

  const [activeAuctions, allOrgs] = await Promise.all([
    prisma.auction.findMany({
      where: { status: "OPEN" },
      include: {
        organization: true,
        items: { select: { currentBid: true, status: true } },
      },
      orderBy: { endAt: "asc" },
    }),
    prisma.organization.findMany({
      include: {
        auctions: {
          where: { status: "OPEN" },
          select: { id: true },
        },
        _count: { select: { auctions: true } },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  // Orgs with live auctions first
  const sortedOrgs = [...allOrgs].sort((a, b) => b.auctions.length - a.auctions.length);

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <HomeHeader />

      {/* Search hero */}
      <section className="bg-gray-900 border-b border-gray-800 px-4 sm:px-6 py-10 sm:py-14">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Find something to bid on</h1>
          <p className="text-gray-500 text-sm sm:text-base mb-6">
            Search items, auctions, and organizations
          </p>
          <SearchBar size="large" />
          {!userId && (
            <p className="text-gray-600 text-xs mt-4">
              Want to run your own auction?{" "}
              <Link href="/apply" className="text-emerald-400 hover:underline">Apply here</Link>
            </p>
          )}
        </div>
      </section>

      {/* Live Auctions */}
      {activeAuctions.length > 0 && (
        <section className="px-4 sm:px-6 py-8 sm:py-10 max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block shrink-0" />
            <h2 className="text-lg sm:text-xl font-bold">Live Auctions</h2>
            <span className="text-gray-600 text-sm">({activeAuctions.length})</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeAuctions.map((auction) => {
              const raised = auction.items.reduce((sum, i) => sum + i.currentBid, 0);
              const activeItems = auction.items.filter(i => i.status === "ACTIVE").length;
              return (
                <Link
                  key={auction.id}
                  href={`/${auction.organization.slug}/${auction.slug}`}
                  className="bg-gray-900 border border-gray-800 hover:border-emerald-500 rounded-xl p-5 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="min-w-0">
                      <div className="text-xs text-emerald-400 font-medium mb-1 truncate">
                        {auction.organization.name}
                      </div>
                      <h3 className="font-semibold text-base group-hover:text-emerald-400 transition-colors truncate">
                        {auction.title}
                      </h3>
                    </div>
                    <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full shrink-0">
                      Live
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500">
                    <span>{activeItems} items</span>
                    <span className="text-emerald-400 font-medium">${raised.toLocaleString()} raised</span>
                  </div>
                  <div className="text-xs text-gray-600 mt-2">
                    Closes <LocalDate iso={auction.endAt.toISOString()} />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {activeAuctions.length === 0 && (
        <section className="px-4 sm:px-6 py-10 max-w-6xl mx-auto">
          <div className="text-center py-12 text-gray-600">
            <p className="text-lg mb-1">No live auctions right now</p>
            <p className="text-sm">Check back soon — auctions open automatically when they&apos;re scheduled.</p>
          </div>
        </section>
      )}

      {/* Organizations */}
      {sortedOrgs.length > 0 && (
        <section className="px-4 sm:px-6 py-8 sm:py-10 max-w-6xl mx-auto border-t border-gray-800/50">
          <div className="flex items-center gap-3 mb-5">
            <h2 className="text-lg sm:text-xl font-bold">Organizations</h2>
            <span className="text-gray-600 text-sm">({sortedOrgs.length})</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {sortedOrgs.map((org) => (
              <Link
                key={org.id}
                href={`/${org.slug}`}
                className="bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-xl p-4 transition-colors group"
              >
                <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400 font-bold text-lg mb-3">
                  {org.name[0].toUpperCase()}
                </div>
                <div className="font-medium text-sm group-hover:text-emerald-400 transition-colors truncate leading-tight">
                  {org.name}
                </div>
                <div className="text-xs mt-1.5">
                  {org.auctions.length > 0 ? (
                    <span className="text-emerald-500">{org.auctions.length} live now</span>
                  ) : (
                    <span className="text-gray-600">{org._count.auctions} auction{org._count.auctions !== 1 ? "s" : ""}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Org CTA */}
      {!userId && (
        <section className="px-4 sm:px-6 py-12 sm:py-16 text-center border-t border-gray-800 mt-4">
          <h2 className="text-xl sm:text-2xl font-bold mb-2">Run your own auction</h2>
          <p className="text-gray-500 text-sm mb-6">
            For churches, schools, and nonprofits. Free to apply.
          </p>
          <Link
            href="/apply"
            className="bg-emerald-500 hover:bg-emerald-400 text-white px-8 py-3 rounded-xl font-semibold"
          >
            Apply for Your Organization
          </Link>
        </section>
      )}
    </main>
  );
}
