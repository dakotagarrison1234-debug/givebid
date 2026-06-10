"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface Application {
  id: string;
  orgName: string;
  slug: string;
  description: string | null;
  website: string | null;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  clerkUserId: string;
  createdAt: Date;
}

export default function ApplicationReviewCard({ application }: { application: Application }) {
  const router = useRouter();
  const [reviewNote, setReviewNote] = useState("");
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);
  const [expanded, setExpanded] = useState(false);

  const handleAction = async (action: "approve" | "reject") => {
    setLoading(action);
    try {
      const res = await fetch(`/api/superadmin/applications/${application.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reviewNote }),
      });
      const data = await res.json();
      if (data.success) {
        router.refresh();
      } else {
        alert(data.error || "Something went wrong");
      }
    } catch {
      alert("Request failed");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="bg-gray-900 border border-orange-500/25 rounded-2xl p-4 sm:p-5">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <div className="font-bold text-base truncate">{application.orgName}</div>
          <div className="text-gray-400 text-sm mt-0.5">{application.contactName}</div>
          <div className="text-gray-500 text-sm truncate">{application.contactEmail}</div>
          {application.contactPhone && (
            <div className="text-gray-600 text-xs mt-0.5">{application.contactPhone}</div>
          )}
          <div className="text-gray-700 text-xs mt-1">
            Submitted {new Date(application.createdAt).toLocaleDateString()}
          </div>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-gray-500 hover:text-white border border-gray-700 hover:border-gray-500 px-2.5 py-1.5 rounded-lg transition-colors shrink-0"
        >
          {expanded ? "Less" : "Details"}
        </button>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="mb-4 p-3 bg-gray-800/60 rounded-xl space-y-2 text-sm">
          {application.description && (
            <div>
              <span className="text-gray-500 text-xs font-medium uppercase tracking-wide">Description</span>
              <p className="text-gray-300 mt-0.5 text-sm leading-relaxed">{application.description}</p>
            </div>
          )}
          {application.website && (
            <div>
              <span className="text-gray-500 text-xs font-medium uppercase tracking-wide">Website</span>
              <div className="mt-0.5">
                <a href={application.website} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline text-sm break-all">
                  {application.website}
                </a>
              </div>
            </div>
          )}
          <div>
            <span className="text-gray-500 text-xs font-medium uppercase tracking-wide">Proposed slug</span>
            <p className="text-gray-300 font-mono text-sm mt-0.5">/{application.slug}</p>
          </div>
        </div>
      )}

      {/* Review note + actions */}
      <div className="border-t border-gray-800/60 pt-3 space-y-3">
        <input
          type="text"
          value={reviewNote}
          onChange={(e) => setReviewNote(e.target.value)}
          placeholder="Optional note (shown on rejection)"
          className="w-full bg-gray-800 border border-gray-700/80 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/60 transition-colors"
        />
        <div className="flex gap-2.5">
          <button
            onClick={() => handleAction("approve")}
            disabled={loading !== null}
            className="flex-1 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-sm transition-colors"
          >
            {loading === "approve" ? "Approving…" : "Approve"}
          </button>
          <button
            onClick={() => handleAction("reject")}
            disabled={loading !== null}
            className="flex-1 bg-red-500/15 hover:bg-red-500/25 disabled:opacity-50 text-red-400 border border-red-500/25 font-bold py-2.5 rounded-xl text-sm transition-colors"
          >
            {loading === "reject" ? "Rejecting…" : "Reject"}
          </button>
        </div>
      </div>
    </div>
  );
}
