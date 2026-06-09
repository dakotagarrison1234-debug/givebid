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
    <div className="bg-gray-900 border border-orange-500/30 rounded-xl p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-lg">{application.orgName}</div>
          <div className="text-gray-500 text-sm">
            {application.contactName} · {application.contactEmail}
            {application.contactPhone && ` · ${application.contactPhone}`}
          </div>
          <div className="text-gray-600 text-xs mt-1">
            Submitted {new Date(application.createdAt).toLocaleDateString()} · Clerk ID: {application.clerkUserId.substring(0, 16)}...
          </div>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-gray-500 hover:text-white text-sm shrink-0"
        >
          {expanded ? "Less" : "Details"}
        </button>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-gray-800 space-y-2 text-sm">
          {application.description && (
            <div>
              <span className="text-gray-500">Description: </span>
              <span className="text-gray-300">{application.description}</span>
            </div>
          )}
          {application.website && (
            <div>
              <span className="text-gray-500">Website: </span>
              <a href={application.website} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">
                {application.website}
              </a>
            </div>
          )}
          <div>
            <span className="text-gray-500">Proposed slug: </span>
            <span className="text-gray-300 font-mono">{application.slug}</span>
          </div>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-800">
        <div className="mb-3">
          <input
            type="text"
            value={reviewNote}
            onChange={(e) => setReviewNote(e.target.value)}
            placeholder="Optional note (shown to applicant on rejection)"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500"
          />
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => handleAction("approve")}
            disabled={loading !== null}
            className="flex-1 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-semibold py-2 rounded-lg text-sm"
          >
            {loading === "approve" ? "Approving..." : "✓ Approve"}
          </button>
          <button
            onClick={() => handleAction("reject")}
            disabled={loading !== null}
            className="flex-1 bg-red-500/20 hover:bg-red-500/30 disabled:opacity-50 text-red-400 border border-red-500/30 font-semibold py-2 rounded-lg text-sm"
          >
            {loading === "reject" ? "Rejecting..." : "✕ Reject"}
          </button>
        </div>
      </div>
    </div>
  );
}
