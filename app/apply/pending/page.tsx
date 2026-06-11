"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function ApplyPendingPage() {
  const [status, setStatus] = useState<"PENDING" | "APPROVED" | "REJECTED" | null>(null);
  const [reviewNote, setReviewNote] = useState<string | null>(null);
  const [orgName, setOrgName] = useState("");

  useEffect(() => {
    fetch("/api/apply")
      .then((r) => r.json())
      .then((d) => {
        if (d.application) {
          setStatus(d.application.status);
          setReviewNote(d.application.reviewNote);
          setOrgName(d.application.orgName);
        }
      });
  }, []);

  return (
    <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <Link href="/" className="text-emerald-400 font-bold text-xl block mb-8">PurposeBid</Link>

        {status === "PENDING" || status === null ? (
          <>
            <div className="flex justify-center mb-6">
              <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
                <circle cx="28" cy="28" r="26" stroke="#374151" strokeWidth="1.5"/>
                <circle cx="28" cy="28" r="18" stroke="#f59e0b" strokeWidth="1.2" strokeOpacity="0.4"/>
                <circle cx="28" cy="28" r="12" fill="rgba(245,158,11,0.12)" stroke="#f59e0b" strokeWidth="1.5"/>
                <path d="M28 20v8.5l4 3" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-3">Application Under Review</h1>
            <p className="text-gray-400 mb-6">
              {orgName ? (
                <>Your application for <span className="text-white font-semibold">{orgName}</span> has been received.</>
              ) : (
                <>Your application has been received.</>
              )}{" "}
              We typically review applications within 1 business day. You&apos;ll receive an email when a decision is made.
            </p>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-sm text-gray-500">
              In the meantime, you can still{" "}
              <Link href="/" className="text-emerald-400 hover:underline">browse and bid on auctions</Link>.
            </div>
          </>
        ) : status === "APPROVED" ? (
          <>
            <div className="flex justify-center mb-6">
              <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
                <circle cx="28" cy="28" r="26" stroke="#374151" strokeWidth="1.5"/>
                <circle cx="28" cy="28" r="18" stroke="#10b981" strokeWidth="1.2" strokeOpacity="0.4"/>
                <circle cx="28" cy="28" r="12" fill="rgba(16,185,129,0.12)" stroke="#10b981" strokeWidth="1.5"/>
                <path d="M21 28l5 5 9-9" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-3">You&apos;re Approved!</h1>
            <p className="text-gray-400 mb-6">
              Your organization <span className="text-white font-semibold">{orgName}</span> is ready to go.
            </p>
            <Link href="/admin/dashboard" className="bg-emerald-500 hover:bg-emerald-400 text-white font-semibold px-8 py-3 rounded-xl inline-block">
              Go to Dashboard
            </Link>
          </>
        ) : (
          <>
            <div className="flex justify-center mb-6">
              <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
                <circle cx="28" cy="28" r="26" stroke="#374151" strokeWidth="1.5"/>
                <circle cx="28" cy="28" r="18" stroke="#ef4444" strokeWidth="1.2" strokeOpacity="0.4"/>
                <circle cx="28" cy="28" r="12" fill="rgba(239,68,68,0.10)" stroke="#ef4444" strokeWidth="1.5"/>
                <path d="M23 23l10 10M33 23L23 33" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-3">Application Not Approved</h1>
            {reviewNote && (
              <p className="text-gray-400 mb-4">
                Reason: <span className="text-white">{reviewNote}</span>
              </p>
            )}
            <p className="text-gray-500 text-sm mb-6">
              If you have questions, please contact us.
            </p>
            <Link href="/" className="text-emerald-400 hover:underline text-sm">
              Browse Auctions
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
