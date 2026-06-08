import Link from "next/link";

interface Props {
  params: Promise<{ orgSlug: string }>;
}

export default async function OrgPage({ params }: Props) {
  const { orgSlug } = await params;

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-emerald-400">
          GiveBid
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/sign-in" className="text-gray-300 hover:text-white text-sm">
            Sign In
          </Link>
          <Link href="/sign-up" className="bg-emerald-500 hover:bg-emerald-400 text-white text-sm px-4 py-2 rounded-lg">
            Register to Bid
          </Link>
        </div>
      </header>

      {/* Org Banner */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-12">
        <div className="max-w-4xl mx-auto flex items-center gap-6">
          <div className="w-20 h-20 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-3xl font-bold text-emerald-400">
            {orgSlug[0].toUpperCase()}
          </div>
          <div>
            <h1 className="text-3xl font-bold capitalize">
              {orgSlug.replace(/-/g, " ")}
            </h1>
            <p className="text-gray-400 mt-1">
              Supporting our community through fundraising auctions
            </p>
          </div>
        </div>
      </div>

      {/* Active Auctions */}
      <section className="px-6 py-12 max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold mb-8">Active Auctions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {["Spring Gala 2025", "Tech Drive"].map((auction, i) => (
            <Link
              key={i}
              href={`/${orgSlug}/${auction.toLowerCase().replace(/ /g, "-")}`}
              className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-emerald-500 transition-colors"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">{auction}</h3>
                <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-1 rounded-full">
                  Live
                </span>
              </div>
              <p className="text-gray-500 text-sm mb-4">
                24 items · Closes in 3 days
              </p>
              <div className="flex items-center justify-between">
                <span className="text-emerald-400 font-semibold">
                  $2,450 raised
                </span>
                <span className="text-gray-400 text-sm">View Auction →</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}