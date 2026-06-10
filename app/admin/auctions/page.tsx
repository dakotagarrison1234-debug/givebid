export const dynamic = "force-dynamic";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserOrg } from "@/lib/auth";
import LocalDate from "@/app/components/LocalDate";

export default async function AuctionsPage() {
  const membership = await requireUserOrg();

  const auctions = await prisma.auction.findMany({
    where: { organizationId: membership.organization.id },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  return (
    <>
      <header className="border-b border-gray-800 px-4 sm:px-8 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Auctions ({auctions.length})</h1>
        <Link href="/admin/auctions/new" className="bg-emerald-500 hover:bg-emerald-400 text-white text-sm px-4 py-2 rounded-lg">
          + New Auction
        </Link>
      </header>

      <div className="px-4 sm:px-8 py-6">
        {auctions.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p className="text-lg mb-4">No auctions yet</p>
            <Link href="/admin/auctions/new" className="bg-emerald-500 hover:bg-emerald-400 text-white px-6 py-3 rounded-lg">
              Create your first auction
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {auctions.map((auction) => (
              <div key={auction.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-semibold text-lg truncate">{auction.title}</h3>
                  <p className="text-gray-500 text-sm mt-1">
                    {auction.items.length} items · <LocalDate iso={auction.startAt.toISOString()} format="date" /> — <LocalDate iso={auction.endAt.toISOString()} format="date" />
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-xs px-3 py-1 rounded-full ${
                    auction.status === "OPEN" ? "bg-emerald-500/20 text-emerald-400"
                    : auction.status === "DRAFT" ? "bg-gray-700 text-gray-400"
                    : "bg-red-500/20 text-red-400"
                  }`}>
                    {auction.status.toLowerCase()}
                  </span>
                  <Link href={`/admin/auctions/${auction.id}`} className="text-gray-400 hover:text-white text-sm whitespace-nowrap">
                    Manage →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
