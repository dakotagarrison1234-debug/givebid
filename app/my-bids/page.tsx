"use client";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface WonItem {
  id: string;
  title: string;
  currentBid: number;
  photos: { url: string; isPrimary: boolean }[];
  status: string;
  auction: { title: string; organization: { name: string; slug: string }; slug: string } | null;
}

interface ActiveBid {
  id: string;
  amount: number;
  item: {
    id: string;
    title: string;
    currentBid: number;
    photos: { url: string; isPrimary: boolean }[];
    auction: { title: string; slug: string; endAt: string; status: string; organization: { slug: string } } | null;
  };
}

export default function MyBidsPage() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const [wonItems, setWonItems] = useState<WonItem[]>([]);
  const [activeBids, setActiveBids] = useState<ActiveBid[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.push("/sign-in?redirect_url=/my-bids");
      return;
    }
    fetch("/api/my-bids")
      .then((r) => r.json())
      .then((d) => {
        setWonItems(d.wonItems || []);
        setActiveBids(d.activeBids || []);
        setLoading(false);
      });
  }, [isLoaded, isSignedIn, router]);

  const handlePay = async (itemId: string) => {
    setPaying(itemId);
    setMessage(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setMessage({ text: data.error || "Failed to start checkout", type: "error" });
        setPaying(null);
      }
    } catch {
      setMessage({ text: "Something went wrong", type: "error" });
      setPaying(null);
    }
  };

  if (!isLoaded || loading) {
    return (
      <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-emerald-400 font-bold text-xl">GiveBid</Link>
          <span className="text-gray-600">/</span>
          <span className="text-white">My Bids</span>
        </div>
        <Link href="/" className="text-gray-400 hover:text-white text-sm">Browse Auctions</Link>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-10">
        {message && (
          <div className={`mb-6 px-4 py-3 rounded-lg text-sm ${message.type === "error" ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"}`}>
            {message.text}
          </div>
        )}

        {/* Won Items — need payment */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-2">You Won 🎉</h2>
          <p className="text-gray-500 text-sm mb-6">Complete your payment to claim these items.</p>

          {wonItems.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center text-gray-500">
              No winning bids yet. Keep bidding!
            </div>
          ) : (
            <div className="space-y-4">
              {wonItems.map((item) => {
                const isPaid = item.status === "PAID";
                const photo = item.photos.find((p) => p.isPrimary) || item.photos[0];
                return (
                  <div key={item.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex items-center gap-5">
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-800 flex-shrink-0">
                      {photo ? (
                        <img src={photo.url} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">No photo</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-lg truncate">{item.title}</div>
                      {item.auction && (
                        <div className="text-gray-500 text-sm">{item.auction.organization.name} · {item.auction.title}</div>
                      )}
                      <div className="text-emerald-400 font-bold mt-1">${item.currentBid.toLocaleString()}</div>
                    </div>
                    <div className="flex-shrink-0">
                      {isPaid ? (
                        <span className="bg-emerald-500/20 text-emerald-400 text-sm px-4 py-2 rounded-lg border border-emerald-500/30">
                          Paid ✓
                        </span>
                      ) : (
                        <button
                          onClick={() => handlePay(item.id)}
                          disabled={paying === item.id}
                          className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white text-sm px-6 py-2 rounded-lg font-semibold"
                        >
                          {paying === item.id ? "Loading..." : "Pay Now"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Active Bids */}
        <section>
          <h2 className="text-2xl font-bold mb-2">Active Bids</h2>
          <p className="text-gray-500 text-sm mb-6">Items you're currently bidding on.</p>

          {activeBids.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center text-gray-500">
              No active bids. <Link href="/" className="text-emerald-400 hover:underline">Browse auctions</Link>
            </div>
          ) : (
            <div className="space-y-4">
              {activeBids.map((bid) => {
                const { item } = bid;
                const isWinning = item.currentBid === bid.amount;
                const photo = item.photos.find((p) => p.isPrimary) || item.photos[0];
                return (
                  <Link
                    key={bid.id}
                    href={item.auction ? `/${item.auction.organization.slug}/${item.auction.slug}/item/${item.id}` : "#"}
                    className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex items-center gap-5 hover:border-emerald-500 transition-colors block"
                  >
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-800 flex-shrink-0">
                      {photo ? (
                        <img src={photo.url} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">No photo</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-lg truncate">{item.title}</div>
                      {item.auction && (
                        <div className="text-gray-500 text-sm">{item.auction.title}</div>
                      )}
                      <div className="mt-1 flex items-center gap-3">
                        <span className="text-gray-400 text-sm">Your bid: <span className="text-white font-semibold">${bid.amount.toLocaleString()}</span></span>
                        <span className="text-gray-400 text-sm">Current: <span className={`font-semibold ${isWinning ? "text-emerald-400" : "text-red-400"}`}>${item.currentBid.toLocaleString()}</span></span>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <span className={`text-xs px-3 py-1 rounded-full ${isWinning ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"}`}>
                        {isWinning ? "Winning" : "Outbid"}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
