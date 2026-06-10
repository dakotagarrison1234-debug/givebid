export const dynamic = "force-dynamic";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import HomeHeader from "./components/HomeHeader";
import LocalDate from "./components/LocalDate";
import OrgLogo from "./components/OrgLogo";

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
      take: 9,
    }),
    prisma.organization.findMany({
      where: { isActive: true },
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

  const sortedOrgs = [...allOrgs].sort((a, b) => b.auctions.length - a.auctions.length);

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <HomeHeader />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden px-4 sm:px-6 pt-16 pb-20 sm:pt-24 sm:pb-28">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-emerald-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-3xl mx-auto text-center">
          {activeAuctions.length > 0 && (
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
              {activeAuctions.length} live auction{activeAuctions.length !== 1 ? "s" : ""} happening now
            </div>
          )}

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight mb-5">
            Bid on items.<br />
            <span className="text-emerald-400">Support causes</span> you love.
          </h1>

          <p className="text-gray-400 text-base sm:text-lg max-w-xl mx-auto mb-8 leading-relaxed">
            Live online auctions from local schools, churches, and nonprofits.
            Browse items, place bids from your phone, and win something great — all while giving back.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="#live-auctions"
              className="bg-emerald-500 hover:bg-emerald-400 text-white font-semibold px-8 py-3.5 rounded-xl text-base transition-colors w-full sm:w-auto text-center"
            >
              {activeAuctions.length > 0 ? "Browse Live Auctions →" : "Explore Organizations →"}
            </a>
            {!userId && (
              <Link
                href="/sign-up"
                className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white font-semibold px-8 py-3.5 rounded-xl text-base transition-colors w-full sm:w-auto text-center"
              >
                Create Free Account
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ── How bidding works ── */}
      <section className="border-t border-gray-800/60 bg-gray-900/40 px-4 sm:px-6 py-12 sm:py-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-center text-gray-500 text-xs font-semibold uppercase tracking-widest mb-10">
            How bidding works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 mb-12">
            {[
              {
                icon: "🔍",
                title: "Find an auction",
                desc: "Browse live auctions from organizations in your community. Each one has a set end time — when it hits zero, the highest bidder wins.",
              },
              {
                icon: "⚡",
                title: "Place your bid",
                desc: "Enter any amount at or above the minimum increment. Bids update in real time — if you're outbid, you'll get an instant notification.",
              },
              {
                icon: "🏆",
                title: "Win & pick up",
                desc: "Highest bid when the clock runs out wins the item. Pay securely online and pick up your item at the organization's location.",
              },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="flex flex-col items-center text-center gap-3">
                <div className="w-14 h-14 bg-gray-800 border border-gray-700 rounded-2xl flex items-center justify-center text-2xl mb-1">
                  {icon}
                </div>
                <h3 className="font-bold text-base">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          {/* ── What makes GiveBid different ── */}
          <div className="border-t border-gray-800 pt-10">
            <h3 className="text-center text-gray-500 text-xs font-semibold uppercase tracking-widest mb-8">
              Built for fair, stress-free bidding
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  icon: "🤖",
                  title: "Proxy bidding",
                  desc: "Set your max and we'll automatically bid for you — up to your limit. Your max stays private.",
                },
                {
                  icon: "📲",
                  title: "Outbid alerts",
                  desc: "Get an SMS or email the moment someone outbids you, so you never miss a chance to respond.",
                },
                {
                  icon: "⏱️",
                  title: "Popcorn timer",
                  desc: "A bid in the final 2:30 extends the clock — giving everyone a fair shot until the real last bid.",
                },
                {
                  icon: "🔒",
                  title: "Secure checkout",
                  desc: "Pay online via Stripe when you win. No cash, no awkward exchanges — just a simple checkout link.",
                },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <div className="text-2xl mb-2">{icon}</div>
                  <h4 className="font-semibold text-sm mb-1">{title}</h4>
                  <p className="text-gray-500 text-xs leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Live Auctions ── */}
      <section id="live-auctions" className="px-4 sm:px-6 py-10 sm:py-14 max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block shrink-0" />
          <h2 className="text-xl sm:text-2xl font-bold">Live Auctions</h2>
          {activeAuctions.length > 0 && (
            <span className="text-gray-600 text-sm">({activeAuctions.length})</span>
          )}
        </div>

        {activeAuctions.length > 0 ? (
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
                    <span>{activeItems} item{activeItems !== 1 ? "s" : ""}</span>
                    {raised > 0 && (
                      <span className="text-emerald-400 font-medium">${raised.toLocaleString()} raised</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-600 mt-2">
                    Closes <LocalDate iso={auction.endAt.toISOString()} />
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-14 text-gray-600 bg-gray-900 rounded-2xl border border-gray-800">
            <div className="text-4xl mb-3">📅</div>
            <p className="text-base font-medium mb-1 text-gray-400">No live auctions right now</p>
            <p className="text-sm">Check back soon — or explore organizations below to see what&apos;s coming up.</p>
          </div>
        )}
      </section>

      {/* ── Organizations ── */}
      {sortedOrgs.length > 0 && (
        <section className="px-4 sm:px-6 py-10 sm:py-14 max-w-6xl mx-auto border-t border-gray-800/50">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-xl sm:text-2xl font-bold">Browse by Organization</h2>
            <span className="text-gray-600 text-sm">({sortedOrgs.length})</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {sortedOrgs.map((org) => (
              <Link
                key={org.id}
                href={`/${org.slug}`}
                className="bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-xl p-4 transition-colors group"
              >
                <div className="mb-3">
                  <OrgLogo name={org.name} logoUrl={org.logoUrl} size="sm" />
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

    </main>
  );
}
