import Link from "next/link";
import { prisma } from "@/lib/prisma";

interface Props {
  params: Promise<{ orgSlug: string }>;
}

export default async function OrgPage({ params }: Props) {
  const { orgSlug } = await params;

  const org = await prisma.organization.findUnique({
    where: { slug: orgSlug },
    include: {
      auctions: {
        include: { items: true },
        orderBy: { createdAt: "desc" },
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

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-emerald-400 font-bold text-xl">GiveBid</Link>
        <div className="flex items-center gap-4">
          <Link href="/sign-in" className="text-gray-300 hover:text-white text-sm">Sign In</Link>
          <Link href="/sign-up" className="bg-emerald-500 hover:bg-emerald-400 text-white text-sm px-4 py-2 rounded-lg">
            Register to Bid
          </Link>
        </div>
      </header>

      <div className="bg-gray-900 border-b border-gray-800 px-6 py-12">
        <div className="max-w-4xl mx-auto flex items-center gap-6">
          <div className="w-20 h-20 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-3xl font-bold text-emerald-400">
            {org.name[0].toUpperCase()}
          </div>
          <div>
            <h1 className="text-3xl font-bold">{org.name}</h1>
            <p className="text-gray-400 mt-1">
              {org.description || "Supporting our community through fundraising auctions"}
            </p>
          </div>
        </div>
      </div>

      <section className="px-6 py-12 max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold mb-8">Active Auctions</h2>
        {org.auctions.length === 0 ? (
          <p className="text-gray-500">No active auctions right now.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {org.auctions.map((auction) => (
              <Link
                key={auction.id}
                href={`/${orgSlug}/${auction.slug}`}
                className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-emerald-500 transition-colors"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg">{auction.title}</h3>
                  <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-1 rounded-full capitalize">
                    {auction.status.toLowerCase()}
                  </span>
                </div>
                <p className="text-gray-500 text-sm mb-4">
                  {auction.items.length} items · Closes {new Date(auction.endAt).toLocaleDateString()}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-emerald-400 font-semibold">
                    ${auction.items.reduce((sum, item) => sum + item.currentBid, 0)} raised
                  </span>
                  <span className="text-gray-400 text-sm">View Auction →</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}