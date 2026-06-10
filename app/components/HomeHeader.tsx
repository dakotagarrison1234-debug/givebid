"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import UserMenu from "./UserMenu";

export default function HomeHeader() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const router = useRouter();

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
          <button type="button" onClick={() => { setSearchOpen(false); setSearchQ(""); }}
            className="text-gray-500 hover:text-gray-300 text-xl px-1 shrink-0">
            ×
          </button>
        </form>
      ) : (
        <div className="flex items-center gap-2 sm:gap-3">
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

          {/* Single user menu — handles all auth states, roles, and sign out */}
          <UserMenu />
        </div>
      )}
    </header>
  );
}
