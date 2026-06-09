"use client";
import Link from "next/link";
import { useAuth, UserButton } from "@clerk/nextjs";

export default function HomeHeader() {
  const { isSignedIn } = useAuth();

  return (
    <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-2xl font-bold text-emerald-400">GiveBid</span>
        <span className="text-gray-500 text-sm">Nonprofit Auctions</span>
      </div>
      <div className="flex items-center gap-4">
        {!isSignedIn ? (
          <>
            <Link href="/sign-in" className="text-gray-300 hover:text-white text-sm">
              Sign In
            </Link>
            <Link href="/sign-up" className="bg-emerald-500 hover:bg-emerald-400 text-white text-sm px-4 py-2 rounded-lg">
              Start Your Auction
            </Link>
          </>
        ) : (
          <>
            <Link href="/admin/dashboard" className="text-gray-300 hover:text-white text-sm">
              Dashboard
            </Link>
            <UserButton />
          </>
        )}
      </div>
    </header>
  );
}