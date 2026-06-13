"use client";
import Link from "next/link";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-5">
      <div className="text-center max-w-sm w-full">
        <div className="text-emerald-400 font-extrabold text-xl mb-6">PurposeBid</div>
        <h1 className="text-2xl font-extrabold mb-2">Something went wrong</h1>
        <p className="text-gray-400 text-sm mb-8">
          We hit a snag loading this page. Try again, or head back.
        </p>
        <div className="flex flex-col gap-2.5">
          <button
            onClick={reset}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            Try again
          </button>
          <Link href="/auctions" className="w-full border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white font-medium py-3 rounded-xl transition-colors">
            Browse auctions
          </Link>
        </div>
      </div>
    </main>
  );
}
