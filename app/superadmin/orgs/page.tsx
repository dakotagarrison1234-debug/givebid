export const dynamic = "force-dynamic";
import { requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function SuperAdminOrgsPage() {
  await requireSuperAdmin();

  const orgs = await prisma.organization.findMany({
    include: {
      members: true,
      auctions: { select: { id: true, status: true } },
      items: { select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <header className="border-b border-gray-800/60 px-4 sm:px-8 py-4">
        <h1 className="text-lg font-bold">All Organizations</h1>
        <p className="text-gray-500 text-sm mt-0.5">{orgs.length} total</p>
      </header>

      <div className="px-4 sm:px-8 py-5 max-w-4xl">
        {orgs.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center text-gray-500 text-sm">
            No organizations yet.
          </div>
        ) : (
          <div className="space-y-2.5">
            {orgs.map((org) => {
              const openAuctions = org.auctions.filter((a) => a.status === "OPEN").length;
              return (
                <div
                  key={org.id}
                  className="bg-gray-900 border border-gray-800/60 rounded-2xl px-4 sm:px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold truncate">{org.name}</div>
                    <div className="text-gray-500 text-sm mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5">
                      <span>/{org.slug}</span>
                      <span>{org.members.length} member{org.members.length !== 1 ? "s" : ""}</span>
                      <span>{org.items.length} items</span>
                      <span>{org.auctions.length} auctions</span>
                      {openAuctions > 0 && (
                        <span className="text-emerald-400 font-medium">{openAuctions} live</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                      org.isActive
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-gray-800 text-gray-500"
                    }`}>
                      {org.isActive ? "Active" : "Inactive"}
                    </span>
                    <Link
                      href={`/superadmin/orgs/${org.id}`}
                      className="bg-gray-800 hover:bg-gray-700 text-white text-sm px-4 py-1.5 rounded-xl transition-colors font-medium"
                    >
                      Manage
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
