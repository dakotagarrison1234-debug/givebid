export const dynamic = "force-dynamic";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import HomeHeader from "@/app/components/HomeHeader";
import SearchBar from "@/app/components/SearchBar";
import LocalDate from "@/app/components/LocalDate";
import OrgLogo from "@/app/components/OrgLogo";

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: Props) {
  const { q = "" } = await searchParams;
  const query = q.trim();

  if (query.length < 2) {
    return (
      <main className="min-h-screen bg-gray-950 text-white">
        <HomeHeader />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16">
          <SearchBar size="large" />
          <p className="text-gray-600 text-sm text-center mt-6">Type at least 2 characters to search</p>
        </div>
      </main>
    );
  }

  const [items, auctions, orgs] = await Promise.all([
    prisma.item.findMany({
      where: {
        status: "ACTIVE",
        auction: { status: "OPEN" },
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { category: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
          { donorName: { contains: query, mode: "insensitive" } },
        ],
      },
      include: {
        organization: { select: { name: true, slug: true } },
        auction: { select: { slug: true, title: true, endAt: true } },
        photos: { take: 1, orderBy: { isPrimary: "desc" } },
      },
      orderBy: { currentBid: "desc" },
    }),
    prisma.auction.findMany({
      where: {
        status: "OPEN",
        title: { contains: query, mode: "insensitive" },
      },
      include: {
        organization: { select: { name: true, slug: true } },
        items: { select: { currentBid: true } },
      },
    }),
    prisma.organization.findMany({
      where: { isActive: true, name: { contains: query, mode: "insensitive" } },
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        _count: { select: { auctions: true } },
        auctions: { where: { status: "OPEN" }, select: { id: true } },
      },
    }),
  ]);

  const total = items.length + auctions.length + orgs.length;

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <HomeHeader />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Search bar pre-filled */}
        <div className="mb-6">
          <SearchBar defaultValue={query} size="large" />
        </div>

        <p className="text-gray-500 text-sm mb-8">
          {total === 0
            ? <>No results for <span className="text-white font-medium">&ldquo;{query}&rdquo;</span></>
            : <>{total} result{total !== 1 ? "s" : ""} for <span className="text-white font-medium">&ldquo;{query}&rdquo;</span> · only active items and live auctions shown</>
          }
        </p>

        {/* Items */}
        {items.length > 0 && (
          <section className="mb-10">
            <h2 className="text-base font-semibold text-gray-400 uppercase tracking-wider mb-4">
              Items ({items.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {items.map(item => (
                <Link
                  key={item.id}
                  href={`/${item.organization.slug}/${item.auction?.slug}/item/${item.id}`}
                  className="bg-gray-900 border border-gray-800 hover:border-emerald-500 rounded-xl p-4 flex items-center gap-4 transition-colors group"
                >
                  {item.photos[0] ? (
                    <img
                      src={item.photos[0].url}
                      alt={item.title}
                      className="w-16 h-16 object-cover rounded-lg shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-800 rounded-lg shrink-0 flex items-center justify-center text-gray-600 text-sm">
                      ?
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate group-hover:text-emerald-400 transition-colors">
                      {item.title}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">{item.organization.name}</div>
                    {item.auction && (
                      <div className="text-xs text-gray-600 mt-0.5 truncate">{item.auction.title}</div>
                    )}
                    {item.auction?.endAt && (
                      <div className="text-xs text-gray-600 mt-1">
                        Closes <LocalDate iso={new Date(item.auction.endAt).toISOString()} />
                      </div>
                    )}
                  </div>
                  <div className="text-emerald-400 font-bold text-lg shrink-0">
                    ${(item.currentBid || 0).toLocaleString()}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Auctions */}
        {auctions.length > 0 && (
          <section className="mb-10">
            <h2 className="text-base font-semibold text-gray-400 uppercase tracking-wider mb-4">
              Live Auctions ({auctions.length})
            </h2>
            <div className="space-y-3">
              {auctions.map(auction => {
                const raised = auction.items.reduce((sum, i) => sum + i.currentBid, 0);
                return (
                  <Link
                    key={auction.id}
                    href={`/${auction.organization.slug}/${auction.slug}`}
                    className="bg-gray-900 border border-gray-800 hover:border-emerald-500 rounded-xl p-4 flex items-center justify-between gap-4 transition-colors group"
                  >
                    <div className="min-w-0">
                      <div className="font-medium truncate group-hover:text-emerald-400 transition-colors">
                        {auction.title}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {auction.organization.name} · {auction.items.length} items · ${raised.toLocaleString()} raised
                      </div>
                    </div>
                    <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full shrink-0">
                      Live
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Organizations */}
        {orgs.length > 0 && (
          <section className="mb-10">
            <h2 className="text-base font-semibold text-gray-400 uppercase tracking-wider mb-4">
              Organizations ({orgs.length})
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {orgs.map(org => (
                <Link
                  key={org.id}
                  href={`/${org.slug}`}
                  className="bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-xl p-4 transition-colors group"
                >
                  <div className="mb-3">
                    <OrgLogo name={org.name} logoUrl={org.logoUrl} size="sm" />
                  </div>
                  <div className="font-medium text-sm truncate group-hover:text-emerald-400 transition-colors">
                    {org.name}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {org.auctions.length > 0
                      ? <span className="text-emerald-500">{org.auctions.length} live now</span>
                      : `${org._count.auctions} auctions`
                    }
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {total === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-600 mb-2 text-sm">
              Only active items in live auctions appear in search results.
            </p>
            <Link href="/" className="text-emerald-400 text-sm hover:underline">
              Browse all live auctions →
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
