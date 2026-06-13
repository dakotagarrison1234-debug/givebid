export const dynamic = "force-dynamic";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import HomeHeader from "./components/HomeHeader";
import LocalDate from "./components/LocalDate";
import OrgLogo from "./components/OrgLogo";

// ── SVG icon helpers ──────────────────────────────────────────────────────────
function IconSearch() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}
function IconBid() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 7l4 4-8 8H5v-4l8-8z" />
      <path d="m18.5 2.5 3 3" />
      <path d="m16 5 3 3" />
    </svg>
  );
}
function IconTrophy() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4a2 2 0 0 1-2-2V5h4" />
      <path d="M18 9h2a2 2 0 0 0 2-2V5h-4" />
      <path d="M8 21h8" />
      <path d="M12 17v4" />
      <path d="M6 3h12v8a6 6 0 0 1-12 0V3z" />
    </svg>
  );
}
function IconBot() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <circle cx="9" cy="16" r="1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="16" r="1" fill="currentColor" stroke="none" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
      <path d="M12 3v2" />
    </svg>
  );
}
function IconBell() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}
function IconClock() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}
function IconShield() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
function IconCalendar() {
  return (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

export default async function HomePage() {
  const { userId } = await auth();

  const now = new Date();

  const [activeAuctions, upcomingAuctions, allOrgs] = await Promise.all([
    prisma.auction.findMany({
      where: { status: "OPEN" },
      include: {
        organization: true,
        items: { select: { currentBid: true, status: true } },
      },
      orderBy: { endAt: "asc" },
      take: 9,
    }),
    // Scheduled auctions that haven't opened yet — shown so bidders can plan ahead.
    prisma.auction.findMany({
      where: { status: "DRAFT", startAt: { gt: now } },
      include: {
        organization: true,
        _count: { select: { items: true } },
      },
      orderBy: { startAt: "asc" },
      take: 6,
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

      {/* ── Hero (compact, marketplace-first) ─────────────────────────────────── */}
      <section className="relative overflow-hidden px-4 sm:px-6 pt-10 pb-8 sm:pt-14 sm:pb-10">
        {/* Background glow orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-emerald-500/8 rounded-full blur-[80px]" />
        </div>

        <div className="relative max-w-6xl mx-auto text-center">
          {activeAuctions.length > 0 && (
            <a href="#live-auctions" className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold px-3.5 py-1.5 rounded-full mb-5 hover:bg-emerald-500/15 transition-colors">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
              {activeAuctions.length} live auction{activeAuctions.length !== 1 ? "s" : ""} happening now
            </a>
          )}

          <h1 className="text-3xl sm:text-5xl font-extrabold leading-[1.1] tracking-tight mb-4">
            Find your next{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">
              winning bid
            </span>
          </h1>

          <p className="text-gray-400 text-base sm:text-lg max-w-xl mx-auto mb-7 leading-relaxed">
            Bid live from your phone on one-of-a-kind items. Real-time updates, instant outbid alerts, secure checkout when you win.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="#live-auctions"
              className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-8 py-3.5 rounded-2xl text-base transition-all hover:shadow-[0_0_30px_rgba(52,211,153,0.3)] w-full sm:w-auto text-center"
            >
              {activeAuctions.length > 0 ? "Start Bidding" : "Browse Auctions"}
            </a>
            {!userId && (
              <Link
                href="/sign-up"
                className="bg-gray-900 hover:bg-gray-800 border border-gray-700 hover:border-gray-600 text-white font-semibold px-8 py-3.5 rounded-2xl text-base transition-colors w-full sm:w-auto text-center"
              >
                Create Free Account
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ── Live Auctions (front and center) ──────────────────────────────────── */}
      <section id="live-auctions" className="px-4 sm:px-6 pt-6 pb-12 sm:pb-16 max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-7">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block shrink-0" />
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">Live Auctions</h2>
          {activeAuctions.length > 0 && (
            <span className="text-gray-600 text-sm">({activeAuctions.length})</span>
          )}
        </div>

        {activeAuctions.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeAuctions.map((auction) => {
              const raised = auction.items.reduce((sum, i) => sum + Number(i.currentBid), 0);
              const activeItems = auction.items.filter(i => i.status === "ACTIVE").length;
              return (
                <Link
                  key={auction.id}
                  href={`/${auction.organization.slug}/${auction.slug}`}
                  className="bg-gray-900 border border-gray-800 hover:border-emerald-500/40 rounded-2xl p-5 transition-all hover:shadow-[0_0_30px_rgba(52,211,153,0.07)] group"
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="min-w-0">
                      <div className="text-xs text-emerald-400 font-semibold mb-1 truncate">
                        {auction.organization.name}
                      </div>
                      <h3 className="font-bold text-base group-hover:text-emerald-400 transition-colors leading-tight">
                        {auction.title}
                      </h3>
                    </div>
                    <span className="text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full shrink-0 font-semibold">
                      Live
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500 mb-2">
                    <span>{activeItems} item{activeItems !== 1 ? "s" : ""}</span>
                    {raised > 0 && (
                      <span className="text-emerald-400 font-semibold">${raised.toLocaleString()} raised</span>
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
          <div className="text-center py-16 text-gray-600 bg-gray-900/60 rounded-2xl border border-gray-800">
            <div className="flex justify-center mb-4 text-gray-700">
              <IconCalendar />
            </div>
            <p className="text-base font-semibold mb-1 text-gray-400">No live auctions right now</p>
            <p className="text-sm">{upcomingAuctions.length > 0 ? "See what's coming up below." : "Check back soon — or explore organizations below."}</p>
          </div>
        )}
      </section>

      {/* ── Upcoming Auctions ─────────────────────────────────────────────────── */}
      {upcomingAuctions.length > 0 && (
        <section className="px-4 sm:px-6 pb-12 sm:pb-16 max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-7">
            <span className="text-gray-500"><IconClock /></span>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">Coming Soon</h2>
            <span className="text-gray-600 text-sm">({upcomingAuctions.length})</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingAuctions.map((auction) => (
              <Link
                key={auction.id}
                href={`/${auction.organization.slug}`}
                className="bg-gray-900/60 border border-gray-800 hover:border-gray-700 rounded-2xl p-5 transition-all group"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0">
                    <div className="text-xs text-gray-500 font-semibold mb-1 truncate">
                      {auction.organization.name}
                    </div>
                    <h3 className="font-bold text-base group-hover:text-white transition-colors leading-tight">
                      {auction.title}
                    </h3>
                  </div>
                  <span className="text-xs bg-gray-800 text-gray-400 border border-gray-700 px-2 py-0.5 rounded-full shrink-0 font-semibold">
                    Upcoming
                  </span>
                </div>
                <div className="text-sm text-gray-500 mb-2">
                  {auction._count.items} item{auction._count.items !== 1 ? "s" : ""}
                </div>
                <div className="text-xs text-emerald-400/90 font-medium mt-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/60 inline-block" />
                  Opens <LocalDate iso={auction.startAt.toISOString()} />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Organizations ────────────────────────────────────────────────────── */}
      {sortedOrgs.length > 0 && (
        <section className="px-4 sm:px-6 py-12 sm:py-16 max-w-6xl mx-auto border-t border-gray-800/40">
          <div className="flex items-center gap-3 mb-7">
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">Browse by Organization</h2>
            <span className="text-gray-600 text-sm">({sortedOrgs.length})</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {sortedOrgs.map((org) => (
              <Link
                key={org.id}
                href={`/${org.slug}`}
                className="bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-2xl p-4 transition-all hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)] group"
              >
                <div className="mb-3">
                  <OrgLogo name={org.name} logoUrl={org.logoUrl} size="sm" />
                </div>
                <div className="font-semibold text-sm group-hover:text-emerald-400 transition-colors truncate leading-tight">
                  {org.name}
                </div>
                <div className="text-xs mt-1.5">
                  {org.auctions.length > 0 ? (
                    <span className="text-emerald-500 font-medium">{org.auctions.length} live now</span>
                  ) : (
                    <span className="text-gray-600">{org._count.auctions} auction{org._count.auctions !== 1 ? "s" : ""}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── How it works (slim strip) ─────────────────────────────────────────── */}
      <section className="border-t border-gray-800/50 bg-gray-900/30 px-4 sm:px-6 py-12 sm:py-14">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-gray-500 text-xs font-bold uppercase tracking-[0.15em] mb-8">
            How bidding works
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            {[
              { icon: <IconSearch />, title: "Find an auction", desc: "Browse live auctions and watch the countdown — when it hits zero, the highest bid wins." },
              { icon: <IconBid />, title: "Place your bid", desc: "Bid in real time, or set a proxy max and we auto-bid for you. Get alerts the moment you're outbid." },
              { icon: <IconTrophy />, title: "Win & pick up", desc: "Win and your card is charged automatically. Arrange pickup with the organization." },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3.5">
                <div className="w-10 h-10 bg-gray-900 border border-gray-800 rounded-xl flex items-center justify-center text-emerald-400 shrink-0">
                  {icon}
                </div>
                <div>
                  <h3 className="font-bold text-sm mb-1">{title}</h3>
                  <p className="text-gray-500 text-xs leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-gray-600">
            <span className="flex items-center gap-1.5"><span className="text-emerald-500/70"><IconBot /></span> Proxy bidding</span>
            <span className="flex items-center gap-1.5"><span className="text-emerald-500/70"><IconBell /></span> Outbid alerts</span>
            <span className="flex items-center gap-1.5"><span className="text-emerald-500/70"><IconClock /></span> Anti-sniping timer</span>
            <span className="flex items-center gap-1.5"><span className="text-emerald-500/70"><IconShield /></span> Secure Stripe checkout</span>
          </div>
        </div>
      </section>
    </main>
  );
}
