export const dynamic = "force-dynamic";
import { requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ApplicationReviewCard from "./ApplicationReviewCard";

export default async function SuperAdminPage() {
  await requireSuperAdmin();

  const applications = await prisma.orgApplication.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  const pending = applications.filter((a) => a.status === "PENDING");
  const reviewed = applications.filter((a) => a.status !== "PENDING");

  return (
    <>
      <header className="border-b border-gray-800 px-8 py-4">
        <h1 className="text-xl font-semibold">Org Applications</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          {pending.length} pending · {reviewed.length} reviewed
        </p>
      </header>

      <div className="px-8 py-6 max-w-4xl">
        {pending.length === 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center text-gray-500 mb-8">
            No pending applications.
          </div>
        )}

        {pending.length > 0 && (
          <section className="mb-10">
            <h2 className="text-sm font-semibold text-orange-400 uppercase tracking-wider mb-4">
              Pending Review ({pending.length})
            </h2>
            <div className="space-y-4">
              {pending.map((app) => (
                <ApplicationReviewCard key={app.id} application={app} />
              ))}
            </div>
          </section>
        )}

        {reviewed.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Reviewed ({reviewed.length})
            </h2>
            <div className="space-y-3">
              {reviewed.map((app) => (
                <div
                  key={app.id}
                  className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-4 flex items-center justify-between"
                >
                  <div>
                    <div className="font-medium">{app.orgName}</div>
                    <div className="text-gray-500 text-sm">{app.contactEmail} · {new Date(app.createdAt).toLocaleDateString()}</div>
                    {app.reviewNote && <div className="text-gray-600 text-xs mt-1">Note: {app.reviewNote}</div>}
                  </div>
                  <span
                    className={`text-xs px-3 py-1 rounded-full font-semibold ${
                      app.status === "APPROVED"
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {app.status}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
