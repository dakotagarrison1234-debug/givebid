import Link from "next/link";

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gray-950 text-white flex">

      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="px-6 py-5 border-b border-gray-800">
          <span className="text-emerald-400 font-bold text-xl">GiveBid</span>
          <p className="text-gray-500 text-xs mt-1">Owosso Schools</p>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1">
          {[
            { label: "Overview", href: "/admin/dashboard", icon: "▦" },
            { label: "Items", href: "/admin/items", icon: "☰" },
            { label: "Auctions", href: "/admin/auctions", icon: "◷" },
            { label: "Winners", href: "/admin/winners", icon: "✓" },
            { label: "Settings", href: "/admin/settings", icon: "⚙" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-gray-800">
          <Link href="/sign-in" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 hover:text-white hover:bg-gray-800 transition-colors text-sm">
            Sign Out
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">

        {/* Top Bar */}
        <header className="border-b border-gray-800 px-8 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <div className="flex items-center gap-3">
            <Link href="/admin/items/new" className="bg-emerald-500 hover:bg-emerald-400 text-white text-sm px-4 py-2 rounded-lg">
              + Add Item
            </Link>
          </div>
        </header>

        {/* Stats */}
        <div className="px-8 py-6 grid grid-cols-4 gap-4">
          {[
            { label: "Total Raised", value: "$2,450", change: "+$320 today" },
            { label: "Items Listed", value: "24", change: "6 unsold" },
            { label: "Active Bidders", value: "47", change: "12 new today" },
            { label: "Bids Placed", value: "183", change: "24 today" },
          ].map((stat) => (
            <div key={stat.label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="text-gray-500 text-sm mb-1">{stat.label}</div>
              <div className="text-2xl font-bold mb-1">{stat.value}</div>
              <div className="text-emerald-400 text-xs">{stat.change}</div>
            </div>
          ))}
        </div>

        {/* Recent Bids */}
        <div className="px-8 pb-6 grid grid-cols-2 gap-6">

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="font-semibold mb-4">Recent Bids</h2>
            <div className="space-y-3">
              {[
                { item: "iPad Pro 12.9\"", bidder: "J***n", amount: "$450", time: "2 min ago" },
                { item: "Signed Jersey", bidder: "S***h", amount: "$120", time: "8 min ago" },
                { item: "Yeti Cooler", bidder: "M***e", amount: "$180", time: "15 min ago" },
                { item: "Apple Watch", bidder: "R***s", amount: "$210", time: "22 min ago" },
              ].map((bid, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                  <div>
                    <div className="text-sm font-medium">{bid.item}</div>
                    <div className="text-xs text-gray-500">{bid.bidder} · {bid.time}</div>
                  </div>
                  <span className="text-emerald-400 font-semibold">{bid.amount}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="font-semibold mb-4">Active Auction</h2>
            <div className="mb-4">
              <div className="text-lg font-semibold">Spring Gala 2025</div>
              <div className="text-gray-500 text-sm">Closes in 3 days 4 hours</div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Items with bids</span>
                <span>18 / 24</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: "75%" }} />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Payment goal</span>
                <span>$2,450 / $5,000</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: "49%" }} />
              </div>
            </div>
            <Link href="/admin/auctions" className="mt-4 block text-center bg-gray-800 hover:bg-gray-700 text-white text-sm px-4 py-2 rounded-lg">
              Manage Auction
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}