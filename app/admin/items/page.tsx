export const dynamic = "force-dynamic";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function ItemsPage() {
  const items = await prisma.item.findMany({
    orderBy: { createdAt: "desc" },
    include: { photos: true, bids: true },
  });

  return (
    <div className="min-h-screen bg-gray-950 text-white flex">
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
            <Link key={item.href} href={item.href} className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="border-b border-gray-800 px-8 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Items ({items.length})</h1>
          <Link href="/admin/items/new" className="bg-emerald-500 hover:bg-emerald-400 text-white text-sm px-4 py-2 rounded-lg">
            + Add Item
          </Link>
        </header>

        <div className="px-8 py-6">
          {items.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <p className="text-lg mb-4">No items yet</p>
              <Link href="/admin/items/new" className="bg-emerald-500 hover:bg-emerald-400 text-white px-6 py-3 rounded-lg">
                Add your first item
              </Link>
            </div>
          ) : (
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left px-6 py-4 text-gray-500 text-sm font-medium">Item</th>
                    <th className="text-left px-6 py-4 text-gray-500 text-sm font-medium">Condition</th>
                    <th className="text-left px-6 py-4 text-gray-500 text-sm font-medium">Starting Bid</th>
                    <th className="text-left px-6 py-4 text-gray-500 text-sm font-medium">Current Bid</th>
                    <th className="text-left px-6 py-4 text-gray-500 text-sm font-medium">Bids</th>
                    <th className="text-left px-6 py-4 text-gray-500 text-sm font-medium">Status</th>
                    <th className="text-left px-6 py-4 text-gray-500 text-sm font-medium">Location</th>
                    <th className="text-left px-6 py-4 text-gray-500 text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b border-gray-800 last:border-0 hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium">{item.title}</div>
                        {item.donorName && <div className="text-xs text-gray-500">Donor: {item.donorName}</div>}
                        {item.category && <div className="text-xs text-gray-500">{item.category}</div>}
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-sm capitalize">
                        {item.condition.replace("_", " ").toLowerCase()}
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-sm">${item.startingBid}</td>
                      <td className="px-6 py-4 text-emerald-400 font-semibold text-sm">${item.currentBid}</td>
                      <td className="px-6 py-4 text-gray-400 text-sm">{item.bids.length}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          item.status === "ACTIVE"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-gray-700 text-gray-400"
                        }`}>
                          {item.status.toLowerCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-sm">{item.storageLocation || "—"}</td>
                      <td className="px-6 py-4">
                        <Link href={`/admin/items/${item.id}`} className="text-xs bg-gray-800 hover:bg-gray-700 text-white px-3 py-1 rounded-lg">
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}