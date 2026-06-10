"use client";
import Link from "next/link";
import { useAuth, UserButton } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface MeData {
  orgId?: string;
  role?: string;
  orgSlug?: string;
}

export default function HomeHeader() {
  const { isSignedIn, isLoaded } = useAuth();
  const [me, setMe] = useState<MeData | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => setMe(d))
      .catch(() => {});
  }, [isLoaded, isSignedIn]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQ.trim().length >= 2) {
      router.push(`/search?q=${encodeURIComponent(searchQ.trim())}`);
      setSearchOpen(false);
      setSearchQ("");
    }
  };

  return (
    <header className="border-b border-gray-800 px-4 sm:px-6 py-3 flex items-center justify-between gap-3 bg-gray-950/95 backdrop-blur sticky top-0 z-40">
      <Link href="/" className="flex items-center gap-2 shrink-0">
        <span className="text-xl font-bold text-emerald-400">GiveBid</span>
        <span className="text-gray-600 text-sm hidden sm:inline">Nonprofit Auctions</span>
      </Link>

      {/* Inline search (expands when open) */}
      {searchOpen ? (
        <form onSubmit={handleSearch} className="flex-1 flex items-center gap-2">
          <input
            autoFocus
            type="text"
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            placeholder="Search items, auctions, orgs…"
            className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 text-sm"
          />
          <button type="submit" className="bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2 rounded-xl text-sm font-medium shrink-0">
            Go
          </button>
          <button type="button" onClick={() => { setSearchOpen(false); setSearchQ(""); }} className="text-gray-500 hover:text-gray-300 text-xl px-1 shrink-0">
            ×
          </button>
        </form>
      ) : (
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Search icon */}
          <button
            onClick={() => setSearchOpen(true)}
            className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-gray-800 transition-colors"
            aria-label="Search"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>

          {/* Nav links */}
          {!isLoaded ? null : !isSignedIn ? (
            <>
              <Link href="/sign-in" className="text-gray-400 hover:text-white text-sm hidden sm:inline">
                Sign In
              </Link>
              <Link href="/sign-up" className="bg-emerald-500 hover:bg-emerald-400 text-white text-sm px-4 py-2 rounded-lg whitespace-nowrap">
                Sign Up
              </Link>
            </>
          ) : me?.orgId ? (
            <>
              <Link href="/admin/dashboard" className="text-gray-400 hover:text-white text-sm hidden sm:inline">
                Admin
              </Link>
              <Link href="/dashboard" className="text-gray-400 hover:text-white text-sm hidden sm:inline">
                My Bids
              </Link>
              <UserButton />
            </>
          ) : (
            <>
              <Link href="/dashboard" className="text-gray-400 hover:text-white text-sm hidden sm:inline">
                My Bids
              </Link>
              <Link href="/apply" className="bg-emerald-500 hover:bg-emerald-400 text-white text-sm px-4 py-2 rounded-lg hidden sm:inline whitespace-nowrap">
                Host an Auction
              </Link>
              <UserButton />
            </>
          )}
        </div>
      )}
    </header>
  );
}
