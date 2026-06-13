import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-5">
      <div className="text-center max-w-sm w-full">
        <div className="text-emerald-400 font-extrabold text-xl mb-6">PurposeBid</div>
        <h1 className="text-3xl font-extrabold mb-2">Page not found</h1>
        <p className="text-gray-400 text-sm mb-8">
          The page you&apos;re looking for doesn&apos;t exist or may have moved.
        </p>
        <div className="flex flex-col gap-2.5">
          <Link href="/auctions" className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-semibold py-3 rounded-xl transition-colors">
            Browse auctions
          </Link>
          <Link href="/" className="w-full border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white font-medium py-3 rounded-xl transition-colors">
            Go home
          </Link>
        </div>
      </div>
    </main>
  );
}
