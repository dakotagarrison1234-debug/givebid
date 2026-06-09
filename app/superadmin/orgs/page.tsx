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
      <header className="border-b border-gray-800 px-8 py-4">
        <h1 className="text-xl font-semibold">All Organizations</h1>
        <p className="text-gray-500 text-sm mt-0.5">{orgs.length} total</p>
      </header>

      <div className="px-8 py-6 max-w-4xl">
        {orgs.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center text-gray-500">
            No organizations yet.
          </div>
        ) : (
          <div className="space-y-3">
            {orgs.map((org) => {
              const openAuctions = org.auctions.filter((a) => a.status === "OPEN").length;
              return (
                <div key={org.id} className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-4 flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{org.name}</div>
                    <div className="text-gray-500 text-sm">
                      /{org.slug} · {org.members.length} member{org.members.length !== 1 ? "s" : ""} · {org.items.length} items · {org.auctions.length} auctions
                      {openAuctions > 0 && <span className="ml-2 text-emerald-400">{openAuctions} live</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${org.isActive ? "bg-emerald-500/20 text-emerald-400" : "bg-gray-700 text-gray-500"}`}>
                      {org.isActive ? "Active" : "Inactive"}
                    </span>
                    <Link
                      href={`/superadmin/orgs/${org.id}`}
                      className="bg-gray-800 hover:bg-gray-700 text-white text-sm px-4 py-1.5 rounded-lg"
                    >
                      Manage →
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
