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
        <Link href="/" className="text-emerald-400 font-bold text-xl block mb-8">GiveBid</Link>

        {status === "PENDING" || status === null ? (
          <>
            <div className="text-5xl mb-6">⏳</div>
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
            <div className="text-5xl mb-6">🎉</div>
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
            <div className="text-5xl mb-6">❌</div>
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
