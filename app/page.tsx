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

// ── Hero auction illustration ─────────────────────────────────────────────────
function HeroIllustration() {
  return (
    <svg viewBox="0 0 480 420" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" aria-hidden="true">
      <defs>
        <radialGradient id="hg1" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="hg2" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#34d399" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="gavelGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Glow orbs */}
      <circle cx="240" cy="210" r="160" fill="url(#hg1)" />
      <circle cx="240" cy="210" r="100" fill="url(#hg2)" />

      {/* Outer ring */}
      <circle cx="240" cy="210" r="150" stroke="#10b981" strokeOpacity="0.1" strokeWidth="1" strokeDasharray="4 8" />
      <circle cx="240" cy="210" r="120" stroke="#10b981" strokeOpacity="0.07" strokeWidth="1" />

      {/* Auction podium */}
      <rect x="140" y="300" width="200" height="12" rx="6" fill="#1f2937" />
      <rect x="170" y="258" width="140" height="44" rx="8" fill="#111827" stroke="#374151" strokeWidth="1" />
      <rect x="186" y="270" width="108" height="6" rx="3" fill="#1f2937" />
      <rect x="186" y="282" width="80" height="6" rx="3" fill="#1f2937" />

      {/* Gavel handle */}
      <rect x="218" y="170" width="10" height="90" rx="5" fill="#374151" transform="rotate(-35 218 170)" />

      {/* Gavel head */}
      <rect x="188" y="118" width="60" height="28" rx="8" fill="url(#gavelGrad)" filter="url(#glow)" />
      <rect x="188" y="118" width="60" height="28" rx="8" fill="url(#gavelGrad)" opacity="0.6" />
      <rect x="192" y="122" width="52" height="20" rx="6" fill="none" stroke="#6ee7b7" strokeWidth="0.5" strokeOpacity="0.5" />

      {/* Impact spark lines */}
      <line x1="155" y1="140" x2="140" y2="128" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.7" />
      <line x1="152" y1="150" x2="134" y2="150" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.5" />
      <line x1="162" y1="132" x2="150" y2="116" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.4" />

      {/* Floating bid card 1 */}
      <rect x="330" y="120" width="110" height="52" rx="12" fill="#111827" stroke="#374151" strokeWidth="1" />
      <rect x="330" y="120" width="110" height="52" rx="12" stroke="#10b981" strokeOpacity="0.3" strokeWidth="1" />
      <text x="344" y="142" fontSize="10" fill="#6b7280" fontFamily="system-ui, sans-serif">Current Bid</text>
      <text x="344" y="162" fontSize="18" fontWeight="700" fill="#34d399" fontFamily="system-ui, sans-serif">$240</text>
      {/* Pulse dot */}
      <circle cx="424" cy="128" r="5" fill="#10b981" opacity="0.4" />
      <circle cx="424" cy="128" r="3" fill="#10b981" />

      {/* Floating bid card 2 */}
      <rect x="36" y="180" width="108" height="50" rx="12" fill="#111827" stroke="#374151" strokeWidth="1" />
      <rect x="36" y="180" width="108" height="50" rx="12" stroke="#6366f1" strokeOpacity="0.3" strokeWidth="1" />
      <text x="50" y="201" fontSize="10" fill="#6b7280" fontFamily="system-ui, sans-serif">Proxy Max</text>
      <text x="50" y="220" fontSize="16" fontWeight="700" fill="#a5b4fc" fontFamily="system-ui, sans-serif">$350</text>
      <text x="94" y="220" fontSize="9" fill="#818cf8" fontFamily="system-ui, sans-serif">auto</text>

      {/* Floating bid card 3 — winning badge */}
      <rect x="320" y="240" width="120" height="46" rx="12" fill="#111827" stroke="#374151" strokeWidth="1" />
      <rect x="320" y="240" width="120" height="46" rx="12" stroke="#10b981" strokeOpacity="0.25" strokeWidth="1" />
      <text x="334" y="260" fontSize="10" fill="#6b7280" fontFamily="system-ui, sans-serif">Status</text>
      <circle cx="334" cy="274" r="4" fill="#10b981" opacity="0.8" />
      <text x="344" y="278" fontSize="11" fontWeight="600" fill="#34d399" fontFamily="system-ui, sans-serif">You&apos;re Winning</text>

      {/* Connecting dashed lines */}
      <line x1="330" y1="146" x2="260" y2="180" stroke="#374151" strokeWidth="1" strokeDasharray="3 5" />
      <line x1="144" y1="205" x2="178" y2="230" stroke="#374151" strokeWidth="1" strokeDasharray="3 5" />

      {/* Sparkle dots */}
      <circle cx="110" cy="140" r="2.5" fill="#34d399" opacity="0.6" />
      <circle cx="380" cy="190" r="2" fill="#34d399" opacity="0.5" />
      <circle cx="85" cy="280" r="2" fill="#6366f1" opacity="0.5" />
      <circle cx="430" cy="310" r="3" fill="#34d399" opacity="0.3" />
      <circle cx="290" cy="80" r="2" fill="#34d399" opacity="0.4" />
    </svg>
  );
}

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

      {/* ── Hero ──────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-4 sm:px-6 pt-14 pb-16 sm:pt-20 sm:pb-24">
        {/* Background glow orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-emerald-500/8 rounded-full blur-[80px]" />
          <div className="absolute top-20 right-0 w-[400px] h-[400px] bg-emerald-500/4 rounded-full blur-[100px]" />
        </div>

        <div className="relative max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-8 items-center">
          {/* Left: copy + CTAs */}
          <div className="text-center lg:text-left">
            {activeAuctions.length > 0 && (
              <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold px-3.5 py-1.5 rounded-full mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                {activeAuctions.length} live auction{activeAuctions.length !== 1 ? "s" : ""} happening now
              </div>
            )}

            <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold leading-[1.1] tracking-tight mb-5">
              Bid on things<br />
              you love.{" "}
              <span className="bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">
                Give back.
              </span>
            </h1>

            <p className="text-gray-400 text-base sm:text-lg max-w-lg mx-auto lg:mx-0 mb-8 leading-relaxed">
              Live online auctions from schools, churches, and nonprofits near you. Place bids from your phone and win something great.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
              <a
                href="#live-auctions"
                className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-8 py-3.5 rounded-2xl text-base transition-all hover:shadow-[0_0_30px_rgba(52,211,153,0.3)] w-full sm:w-auto text-center"
              >
                {activeAuctions.length > 0 ? "Browse Live Auctions" : "Explore Organizations"}
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

          {/* Right: illustration (hidden on mobile) */}
          <div className="hidden lg:block h-[360px] relative">
            <HeroIllustration />
          </div>
        </div>
      </section>

      {/* ── How bidding works ─────────────────────────────────────────────────── */}
      <section className="border-t border-gray-800/50 bg-gray-900/30 px-4 sm:px-6 py-14 sm:py-20">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-gray-500 text-xs font-bold uppercase tracking-[0.15em] mb-12">
            How it works
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-10 mb-14">
            {[
              {
                icon: <IconSearch />,
                step: "01",
                title: "Find an auction",
                desc: "Browse live auctions from organizations in your community. Each has a countdown clock — when it hits zero, the highest bidder wins.",
              },
              {
                icon: <IconBid />,
                step: "02",
                title: "Place your bid",
                desc: "Enter any amount at or above the minimum increment. Bids update in real time — if you're outbid, you'll get an instant notification.",
              },
              {
                icon: <IconTrophy />,
                step: "03",
                title: "Win and pick up",
                desc: "Highest bid when the clock runs out wins. Pay securely online and pick up your item at the organization's location.",
              },
            ].map(({ icon, step, title, desc }) => (
              <div key={title} className="flex flex-col items-center text-center sm:items-start sm:text-left gap-4">
                <div className="relative">
                  <div className="w-14 h-14 bg-gray-900 border border-gray-800 rounded-2xl flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.08)]">
                    {icon}
                  </div>
                  <span className="absolute -top-2 -right-2 text-[10px] font-bold text-emerald-500/60 bg-gray-950 px-1.5 py-0.5 rounded-full border border-emerald-500/20">
                    {step}
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-base mb-2">{title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Feature grid */}
          <div className="border-t border-gray-800/60 pt-12">
            <p className="text-center text-gray-500 text-xs font-bold uppercase tracking-[0.15em] mb-8">
              Built for fair, stress-free bidding
            </p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {[
                {
                  icon: <IconBot />,
                  title: "Proxy bidding",
                  desc: "Set your max and we auto-bid for you up to your limit. Your max stays private.",
                },
                {
                  icon: <IconBell />,
                  title: "Outbid alerts",
                  desc: "Get an SMS or email the moment someone outbids you, so you never miss a chance.",
                },
                {
                  icon: <IconClock />,
                  title: "Popcorn timer",
                  desc: "A late bid extends the clock by 2:30 — giving everyone a fair shot at the last bid.",
                },
                {
                  icon: <IconShield />,
                  title: "Secure checkout",
                  desc: "Pay online via Stripe when you win. Simple, safe, no cash exchanges.",
                },
              ].map(({ icon, title, desc }) => (
                <div
                  key={title}
                  className="bg-gray-900 border border-gray-800 hover:border-emerald-500/30 rounded-2xl p-4 sm:p-5 transition-all hover:shadow-[0_0_25px_rgba(52,211,153,0.06)]"
                >
                  <div className="text-emerald-400 mb-3">{icon}</div>
                  <h4 className="font-semibold text-sm mb-1.5">{title}</h4>
                  <p className="text-gray-500 text-xs leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Live Auctions ────────────────────────────────────────────────────── */}
      <section id="live-auctions" className="px-4 sm:px-6 py-12 sm:py-16 max-w-6xl mx-auto">
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
              const raised = auction.items.reduce((sum, i) => sum + i.currentBid, 0);
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
            <p className="text-sm">Check back soon — or explore organizations below to see what&apos;s coming up.</p>
          </div>
        )}
      </section>

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
    </main>
  );
}
