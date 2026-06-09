"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Pusher from "pusher-js";

export default function ItemPage() {
  const params = useParams();
  const { orgSlug, auctionSlug, itemId } = params as {
    orgSlug: string;
    auctionSlug: string;
    itemId: string;
  };

  const [currentBid, setCurrentBid] = useState(450);
  const [bidAmount, setBidAmount] = useState("");
  const [placing, setPlacing] = useState(false);
  const [bids, setBids] = useState([
    { user: "J***n", amount: 450, time: "2 min ago" },
    { user: "S***h", amount: 425, time: "15 min ago" },
    { user: "M***e", amount: 400, time: "1 hr ago" },
  ]);

  useEffect(() => {
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });

    const channel = pusher.subscribe(`item-${itemId}`);

    channel.bind("new-bid", (data: { amount: number; userId: string }) => {
      setCurrentBid(data.amount);
      setBids(prev => [
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
          <span className="text-white">Item #{itemId}</span>
        </div>
        <Link href="/sign-in" className="bg-emerald-500 hover:bg-emerald-400 text-white text-sm px-4 py-2 rounded-lg">
          Sign In to Bid
        </Link>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div>
          <div className="w-full h-96 bg-gray-800 rounded-2xl flex items-center justify-center text-gray-600 mb-4">
            Main Photo
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[1,2,3,4].map((i) => (
              <div key={i} className="h-20 bg-gray-800 rounded-lg flex items-center justify-center text-gray-700 text-xs">
                Photo {i}
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">Electronics</span>
            <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">Like New</span>
            <span className="text-xs text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded">Tax Deductible</span>
          </div>

          <h1 className="text-3xl font-bold mb-2">iPad Pro 12.9"</h1>
          <p className="text-gray-400 mb-6">
            Apple iPad Pro 12.9" with M2 chip. Includes original box and charger.
          </p>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-900 rounded-xl p-4">
              <div className="text-gray-500 text-sm mb-1">Retail Value</div>
              <div className="text-white font-bold text-xl">$1,099</div>
            </div>
            <div className="bg-gray-900 rounded-xl p-4">
              <div className="text-gray-500 text-sm mb-1">Storage Location</div>
              <div className="text-white font-bold">Shelf A / Bin 3</div>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-gray-500 text-sm">Current Bid</div>
                <div className="text-emerald-400 font-bold text-4xl">${currentBid}</div>
              </div>
              <div className="text-right">
                <div className="text-gray-500 text-sm">Time Remaining</div>
                <div className="text-white font-bold text-xl">3d 4h 22m</div>
              </div>
            </div>
            <div className="text-gray-500 text-sm mb-4">
              {bids.length} bids · Minimum next bid: ${minBid}
            </div>
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

          <div>
            <h3 className="font-semibold mb-3">Bid History</h3>
            <div className="space-y-2">
              {bids.map((bid, i) => (
                <div key={i} className="flex items-center justify-between bg-gray-900 rounded-lg px-4 py-3">
                  <span className="text-gray-400">{bid.user}</span>
                  <span className="text-emerald-400 font-semibold">${bid.amount}</span>
                  <span className="text-gray-600 text-sm">{bid.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}