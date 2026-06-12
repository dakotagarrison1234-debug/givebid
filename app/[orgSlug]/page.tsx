export const dynamic = "force-dynamic";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import LocalDate from "@/app/components/LocalDate";
import OrgLogo from "@/app/components/OrgLogo";
import UserMenu from "@/app/components/UserMenu";
import PusherRefresh from "@/app/components/PusherRefresh";

interface Props {
  params: Promise<{ orgSlug: string }>;
}

export default async function OrgPage({ params }: Props) {
  const { orgSlug } = await params;

  const org = await prisma.organization.findUnique({
    where: { slug: orgSlug },
    include: {
      auctions: {
        include: { items: { select: { currentBid: true, status: true } } },
        orderBy: { endAt: "asc" },
      },
    },
  });

  if (!org) {
    return (
      <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Organization not found</h1>
          <Link href="/" className="text-emerald-400">Go home</Link>
        </div>
      </main>
    );
  }

  const SOLD = ["SOLD", "PENDING_PICKUP", "PICKED_UP"];
  const liveAuctions = org.auctions.filter(a => a.status === "OPEN");
  const pastAuctions = org.auctions.filter(a => a.status === "CLOSED" || a.status === "SETTLED");

  const totalRaised = org.auctions.flatMap(a => a.items)
    .filter(i => SOLD.includes(i.status))
    .reduce((sum, i) => sum + Number(i.currentBid), 0);

  const totalItems = org.auctions.flatMap(a => a.items).length;

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <PusherRefresh channel="auctions" event="auction-updated" />
      {/* Header */}
      <header className="border-b border-gray-800/60 px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3 bg-gray-950/95 backdrop-blur-md sticky top-0 z-40">
        <Link href="/" className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent shrink-0">
          PurposeBid
        </Link>
        <UserMenu />
      </header>

      {/* Org hero */}
      <div className="relative overflow-hidden bg-gray-900/30 border-b border-gray-800/60 px-4 sm:px-6 py-8 sm:py-12">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-emerald-500/5 rounded-full blur-[60px]" />
        </div>
        <div className="relative max-w-4xl mx-auto flex items-center gap-5 sm:gap-7">
          <OrgLogo name={org.name} logoUrl={org.logoUrl} size="lg" />
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight truncate">{org.name}</h1>
            <p className="text-gray-400 text-sm mt-1.5 line-clamp-2 leading-relaxed">
              {org.description || "Supporting our community through fundraising auctions"}
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 text-sm">
              {liveAuctions.length > 0 && (
                <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                  {liveAuctions.length} live auction{liveAuctions.length !== 1 ? "s" : ""}
                </span>
              )}
              {totalRaised > 0 && <span className="text-gray-500">${totalRaised.toLocaleString()} raised</span>}
              {totalItems > 0 && <span className="text-gray-500">{totalItems} items auctioned</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-10">
        {/* Live Auctions */}
        {liveAuctions.length > 0 && (
          <section>
            <div className="flex items-center gap-2.5 mb-5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block shrink-0" />
              <h2 className="text-lg font-extrabold tracking-tight">Live Auctions</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {liveAuctions.map((auction) => {
                const raised = auction.items.reduce((sum, i) => sum + Number(i.currentBid), 0);
                const activeItems = auction.items.filter(i => i.status === "ACTIVE").length;
                return (
                  <Link
                    key={auction.id}
                    href={`/${orgSlug}/${auction.slug}`}
                    className="bg-gray-900 border border-gray-800 hover:border-emerald-500/40 rounded-2xl p-5 transition-all hover:shadow-[0_0_25px_rgba(52,211,153,0.07)] group"
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <h3 className="font-bold group-hover:text-emerald-400 transition-colors leading-tight">{auction.title}</h3>
                      <span className="text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full shrink-0 font-semibold">Live</span>
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-gray-500 mb-2">
                      <span>{activeItems} item{activeItems !== 1 ? "s" : ""}</span>
                      {raised > 0 && <span className="text-emerald-400 font-semibold">${raised.toLocaleString()} raised</span>}
                    </div>
                    <div className="text-xs text-gray-600">
                      Closes <LocalDate iso={auction.endAt.toISOString()} />
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {liveAuctions.length === 0 && (
          <div className="text-center py-12 text-gray-600 bg-gray-900/50 rounded-2xl border border-gray-800">
            <p className="text-base mb-1 text-gray-400 font-semibold">No live auctions right now</p>
            <p className="text-sm">Check back soon for upcoming auctions from {org.name}.</p>
          </div>
        )}

        {/* Past Auctions */}
        {pastAuctions.length > 0 && (
          <section>
            <h2 className="text-xs font-bold text-gray-600 uppercase tracking-[0.12em] mb-4">
              Past Auctions ({pastAuctions.length})
            </h2>
            <div className="space-y-2">
              {pastAuctions.map((auction) => {
                const raised = auction.items
                  .filter(i => SOLD.includes(i.status))
                  .reduce((sum, i) => sum + Number(i.currentBid), 0);
                return (
                  <Link
                    key={auction.id}
                    href={`/${orgSlug}/${auction.slug}`}
                    className="flex items-center justify-between gap-4 bg-gray-900/40 border border-gray-800/60 hover:border-gray-700/80 rounded-2xl px-5 py-4 transition-colors group"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-gray-300 group-hover:text-white transition-colors truncate">
                        {auction.title}
                      </div>
                      <div className="text-xs text-gray-600 mt-0.5">
                        {auction.items.length} items · ${raised.toLocaleString()} raised ·{" "}
                        Closed <LocalDate iso={auction.endAt.toISOString()} format="date" />
                      </div>
                    </div>
                    <span className="text-xs text-gray-600 border border-gray-800 px-2.5 py-0.5 rounded-full shrink-0 font-medium">
                      Closed
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
