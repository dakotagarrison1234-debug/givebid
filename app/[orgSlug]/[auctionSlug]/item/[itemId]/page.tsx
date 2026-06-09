"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Pusher from "pusher-js";

interface Item {
  id: string;
  title: string;
  description: string | null;
  condition: string;
  category: string | null;
  retailValue: number | null;
  startingBid: number;
  currentBid: number;
  donorName: string | null;
  taxDeductible: boolean;
  storageLocation: string | null;
  photos: { url: string; isPrimary: boolean }[];
  bids: { id: string; amount: number; clerkUserId: string; placedAt: string }[];
}

export default function ItemPage() {
  const params = useParams();
  const { orgSlug, auctionSlug, itemId } = params as {
    orgSlug: string;
    auctionSlug: string;
    itemId: string;
  };

  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState("");
  const [placing, setPlacing] = useState(false);
  const [liveBids, setLiveBids] = useState<{user: string, amount: number, time: string}[]>([]);

  useEffect(() => {
    fetch(`/api/items/${itemId}`)
      .then(res => res.json())
      .then(data => {
        if (data.item) {
          setItem(data.item);
          setLiveBids(data.item.bids.map((b: Item["bids"][0]) => ({
            user: b.clerkUserId.substring(0, 6) + "***",
            amount: b.amount,
            time: new Date(b.placedAt).toLocaleTimeString(),
          })));
        }
        setLoading(false);
      });
  }, [itemId]);

  useEffect(() => {
    if (!itemId) return;

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });

    const channel = pusher.subscribe(`item-${itemId}`);

    channel.bind("new-bid", (data: { amount: number; userId: string }) => {
      setItem(prev => prev ? { ...prev, currentBid: data.amount } : prev);
      setLiveBids(prev => [
        { user: data.userId + "***", amount: data.amount, time: "just now" },
        ...prev,
      ]);
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`item-${itemId}`);
    };
  }, [itemId]);

  const handleBid = async () => {
    const amount = parseFloat(bidAmount);
    const currentBid = item?.currentBid || 0;
    const minBid = currentBid + 5;

    if (!bidAmount || amount < minBid) {
      alert(`Minimum bid is $${minBid}`);
      return;
    }

    setPlacing(true);
    try {
      const res = await fetch("/api/bids", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, amount }),
      });
      const data = await res.json();
      if (data.success) {
        setBidAmount("");
      } else {
        alert(data.error);
      }
    } catch {
      alert("Something went wrong");
    } finally {
      setPlacing(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </main>
    );
  }

  if (!item) {
    return (
      <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Item not found</h1>
          <Link href="/" className="text-emerald-400">Go home</Link>
        </div>
      </main>
    );
  }

  const currentBid = item.currentBid || item.startingBid;
  const minBid = currentBid + 5;

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3 text-sm">
          <Link href="/" className="text-emerald-400 font-bold text-xl">GiveBid</Link>
          <span className="text-gray-600">/</span>
          <Link href={`/${orgSlug}`} className="text-gray-400 hover:text-white capitalize">
            {orgSlug.replace(/-/g, " ")}
          </Link>
          <span className="text-gray-600">/</span>
          <Link href={`/${orgSlug}/${auctionSlug}`} className="text-gray-400 hover:text-white capitalize">
            {auctionSlug.replace(/-/g, " ")}
          </Link>
          <span className="text-gray-600">/</span>
          <span className="text-white">{item.title}</span>
        </div>
        <Link href="/sign-in" className="bg-emerald-500 hover:bg-emerald-400 text-white text-sm px-4 py-2 rounded-lg">
          Sign In to Bid
        </Link>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div>
          <div className="w-full h-96 bg-gray-800 rounded-2xl overflow-hidden mb-4">
            {item.photos.length > 0 ? (
              <img
                src={item.photos.find(p => p.isPrimary)?.url || item.photos[0].url}
                alt={item.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-600">No photo</div>
            )}
          </div>
          {item.photos.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {item.photos.slice(0, 4).map((photo, i) => (
                <div key={i} className="h-20 bg-gray-800 rounded-lg overflow-hidden">
                  <img src={photo.url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3">
            {item.category && (
              <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">{item.category}</span>
            )}
            <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded capitalize">
              {item.condition.replace("_", " ").toLowerCase()}
            </span>
            {item.taxDeductible && (
              <span className="text-xs text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded">Tax Deductible</span>
            )}
          </div>

          <h1 className="text-3xl font-bold mb-2">{item.title}</h1>
          {item.description && (
            <p className="text-gray-400 mb-6">{item.description}</p>
          )}

          <div className="grid grid-cols-2 gap-4 mb-6">
            {item.retailValue && (
              <div className="bg-gray-900 rounded-xl p-4">
                <div className="text-gray-500 text-sm mb-1">Retail Value</div>
                <div className="text-white font-bold text-xl">${item.retailValue}</div>
              </div>
            )}
            {item.storageLocation && (
              <div className="bg-gray-900 rounded-xl p-4">
                <div className="text-gray-500 text-sm mb-1">Storage Location</div>
                <div className="text-white font-bold">{item.storageLocation}</div>
              </div>
            )}
            {item.donorName && (
              <div className="bg-gray-900 rounded-xl p-4">
                <div className="text-gray-500 text-sm mb-1">Donated by</div>
                <div className="text-white font-bold">{item.donorName}</div>
              </div>
            )}
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-gray-500 text-sm">Current Bid</div>
                <div className="text-emerald-400 font-bold text-4xl">${currentBid}</div>
              </div>
              <div className="text-right">
                <div className="text-gray-500 text-sm">Bids</div>
                <div className="text-white font-bold text-xl">{liveBids.length}</div>
              </div>
            </div>
            <div className="text-gray-500 text-sm mb-4">Minimum next bid: ${minBid}</div>
            <div className="flex gap-3">
              <input
                type="number"
                value={bidAmount}
                onChange={e => setBidAmount(e.target.value)}
                placeholder={`Enter $${minBid} or more`}
                className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500"
              />
              <button
                onClick={handleBid}
                disabled={placing}
                className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-xl"
              >
                {placing ? "Placing..." : "Place Bid"}
              </button>
            </div>
          </div>

          {liveBids.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Bid History</h3>
              <div className="space-y-2">
                {liveBids.map((bid, i) => (
                  <div key={i} className="flex items-center justify-between bg-gray-900 rounded-lg px-4 py-3">
                    <span className="text-gray-400">{bid.user}</span>
                    <span className="text-emerald-400 font-semibold">${bid.amount}</span>
                    <span className="text-gray-600 text-sm">{bid.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}