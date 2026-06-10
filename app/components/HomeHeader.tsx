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
    <header className="border-b border-gray-800/60 px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3 bg-gray-950/95 backdrop-blur-md sticky top-0 z-40">
      <Link href="/" className="flex items-center shrink-0">
        <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">
          GiveBid
        </span>
      </Link>

      {searchOpen ? (
        <form onSubmit={handleSearch} className="flex-1 flex items-center gap-2">
          <input
            autoFocus
            type="text"
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            placeholder="Search items, auctions, orgs…"
            className="flex-1 bg-gray-900 border border-gray-700/80 rounded-xl px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/60 text-sm transition-colors"
          />
          <button
            type="submit"
            className="bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2 rounded-xl text-sm font-semibold shrink-0 transition-colors"
          >
            Search
          </button>
          <button
            type="button"
            onClick={() => { setSearchOpen(false); setSearchQ(""); }}
            className="text-gray-500 hover:text-gray-300 text-xl px-1 shrink-0 leading-none transition-colors"
          >
            ×
          </button>
        </form>
      ) : (
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => setSearchOpen(true)}
            className="text-gray-400 hover:text-white p-2 rounded-xl hover:bg-gray-900 transition-colors"
            aria-label="Search"
          >
            <svg className="w-[18px] h-[18px]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </button>
          <UserMenu />
        </div>
      )}
    </header>
  );
}
