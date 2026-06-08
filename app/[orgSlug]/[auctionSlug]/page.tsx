import Link from "next/link";

interface Props {
  params: Promise<{ orgSlug: string; auctionSlug: string }>;
}

export default async function AuctionPage({ params }: Props) {
  const { orgSlug, auctionSlug } = await params;

  const items = [
    { id: 1, title: "iPad Pro 12.9\"", condition: "Like New", retail: 1099, currentBid: 450, category: "Electronics" },
    { id: 2, title: "Signed Jersey", condition: "New", retail: 250, currentBid: 120, category: "Sports" },
    { id: 3, title: "Dinner for Two", condition: "New", retail: 200, currentBid: 85, category: "Experiences" },
    { id: 4, title: "Yeti Cooler", condition: "New", retail: 350, currentBid: 180, category: "Outdoors" },
    { id: 5, title: "Apple Watch", condition: "Like New", retail: 399, currentBid: 210, category: "Electronics" },
    { id: 6, title: "Gift Basket", condition: "New", retail: 150, currentBid: 65, category: "Food" },
  ];

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-emerald-400 font-bold text-xl">GiveBid</Link>
          <span className="text-gray-600">/</span>
          <Link href={`/${orgSlug}`} className="text-gray-400 hover:text-white capitalize">
            {orgSlug.replace(/-/g, " ")}
          </Link>
          <span className="text-gray-600">/</span>
          <span className="text-white capitalize">{auctionSlug.replace(/-/g, " ")}</span>
        </div>
        <Link href="/sign-in" className="bg-emerald-500 hover:bg-emerald-400 text-white text-sm px-4 py-2 rounded-lg">
          Sign In to Bid
        </Link>
      </header>

      {/* Auction Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold capitalize mb-2">
              {auctionSlug.replace(/-/g, " ")}
            </h1>
            <p className="text-gray-400">
              {items.length} items · Closes in 3 days 4 hours
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-emerald-400">$2,450</div>
            <div className="text-gray-500 text-sm">total raised</div>
          </div>
        </div>
      </div>

      {/* Items Grid */}
      <section className="px-6 py-10 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/${orgSlug}/${auctionSlug}/item/${item.id}`}
              className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-emerald-500 transition-colors"
            >
              <div className="w-full h-48 bg-gray-800 flex items-center justify-center text-gray-600">
                No photo
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded">
                    {item.category}
                  </span>
                  <span className="text-xs text-gray-500">{item.condition}</span>
                </div>
                <h3 className="font-semibold text-lg mt-2 mb-1">{item.title}</h3>
                <p className="text-gray-500 text-sm mb-3">
                  Retail value: ${item.retail}
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-gray-500">Current bid</div>
                    <div className="text-emerald-400 font-bold text-lg">
                      ${item.currentBid}
                    </div>
                  </div>
                  <button className="bg-emerald-500 hover:bg-emerald-400 text-white text-sm px-4 py-2 rounded-lg">
                    Bid Now
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}