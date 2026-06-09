"use client";
import Link from "next/link";
import { useAuth, UserButton } from "@clerk/nextjs";
import { useState, useEffect } from "react";

interface MeData {
  orgId?: string;
  role?: string;
  orgSlug?: string;
}

export default function HomeHeader() {
  const { isSignedIn, isLoaded } = useAuth();
  const [me, setMe] = useState<MeData | null>(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => setMe(d))
      .catch(() => {});
  }, [isLoaded, isSignedIn]);

  return (
    <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-2xl font-bold text-emerald-400">GiveBid</span>
        <span className="text-gray-500 text-sm">Nonprofit Auctions</span>
      </div>
      <div className="flex items-center gap-4">
        {!isLoaded ? null : !isSignedIn ? (
          <>
            <Link href="/sign-in" className="text-gray-300 hover:text-white text-sm">
              Sign In
            </Link>
            <Link href="/sign-up" className="bg-emerald-500 hover:bg-emerald-400 text-white text-sm px-4 py-2 rounded-lg">
              Sign Up
            </Link>
          </>
        ) : me?.orgId ? (
          // Has an org — show org dashboard link
          <>
            <Link href="/admin/dashboard" className="text-gray-300 hover:text-white text-sm">
              Dashboard
            </Link>
            <Link href="/my-bids" className="text-gray-300 hover:text-white text-sm">
              My Bids
            </Link>
            <UserButton />
          </>
        ) : (
          // Signed in but no org — bidder
          <>
            <Link href="/my-bids" className="text-gray-300 hover:text-white text-sm">
              My Bids
            </Link>
            <Link href="/apply" className="bg-emerald-500 hover:bg-emerald-400 text-white text-sm px-4 py-2 rounded-lg">
              Host an Auction
            </Link>
            <UserButton />
          </>
        )}
      </div>
    </header>
  );
}
