"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";

function JoinPageInner() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"idle" | "joining" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.push(`/sign-in?redirect_url=${encodeURIComponent(`/join?token=${token}`)}`);
    }
  }, [isLoaded, isSignedIn, router, token]);

  const handleAccept = async () => {
    if (!token) return;
    setStatus("joining");
    try {
      const res = await fetch("/api/orgs/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus("success");
        setTimeout(() => router.push("/admin/dashboard"), 1500);
      } else {
        setStatus("error");
        setMessage(data.error || "Something went wrong.");
      }
    } catch {
      setStatus("error");
      setMessage("Request failed. Please try again.");
    }
  };

  if (!isLoaded) {
    return (
      <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <Link href="/" className="text-emerald-400 font-bold text-xl block mb-8">PurposeBid</Link>

        {!token ? (
          <>
            <h1 className="text-2xl font-bold mb-3">Invalid Invite</h1>
            <p className="text-gray-400">This invite link is missing a token. Please ask for a new invite.</p>
          </>
        ) : status === "success" ? (
          <>
            <div className="flex justify-center mb-5">
              <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
                <circle cx="28" cy="28" r="26" stroke="#374151" strokeWidth="1.5"/>
                <circle cx="28" cy="28" r="18" stroke="#10b981" strokeWidth="1.2" strokeOpacity="0.4"/>
                <circle cx="28" cy="28" r="12" fill="rgba(16,185,129,0.12)" stroke="#10b981" strokeWidth="1.5"/>
                <path d="M21 28l5 5 9-9" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-2">You&apos;re in!</h1>
            <p className="text-gray-400">Redirecting to your dashboard...</p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold mb-3">You&apos;ve Been Invited</h1>
            <p className="text-gray-400 mb-8">
              You&apos;ve been invited to join an organization on PurposeBid. Accept below to access the dashboard.
            </p>

            {status === "error" && (
              <p className="text-red-400 text-sm mb-4 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">{message}</p>
            )}

            <button
              onClick={handleAccept}
              disabled={status === "joining"}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-semibold py-3 rounded-xl"
            >
              {status === "joining" ? "Joining..." : "Accept Invite"}
            </button>
          </>
        )}
      </div>
    </main>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </main>
    }>
      <JoinPageInner />
    </Suspense>
  );
}
