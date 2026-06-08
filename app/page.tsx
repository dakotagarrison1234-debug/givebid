import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-emerald-400">GiveBid</span>
          <span className="text-gray-500 text-sm">Nonprofit Auctions</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/sign-in" className="text-gray-300 hover:text-white text-sm">
            Sign In
          </Link>
          <Link href="/sign-up" className="bg-emerald-500 hover:bg-emerald-400 text-white text-sm px-4 py-2 rounded-lg">
            Start Your Auction
          </Link>
        </div>
      </header>

      {/* Hero */}
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

      {/* Active Auctions */}
      <section className="px-6 py-12 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold">Live Auctions</h2>
          <Link href="/auctions" className="text-emerald-400 hover:text-emerald-300 text-sm">
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Placeholder cards */}
          {["Owosso Schools Spring Gala", "Life In Christ Annual Fund", "Habitat for Humanity Build"].map((name, i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-emerald-500 transition-colors">
              <div className="w-full h-32 bg-gray-800 rounded-lg mb-4" />
              <h3 className="font-semibold text-lg mb-1">{name}</h3>
              <p className="text-gray-500 text-sm mb-4">24 items · Closes in 3 days</p>
              <div className="flex items-center justify-between">
                <span className="text-emerald-400 font-semibold">$2,450 raised</span>
                <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-1 rounded-full">Live</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}