"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  auctionId: string;
  status: string;
}


export default function AuctionStatusButtons({ auctionId, status }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const confirmMessages: Record<string, string> = {
    OPEN: "Open this auction? All draft items will go live and bidders can start bidding.",
    CLOSING: "Mark this auction as closing soon? Bidders will see a warning banner.",
    SETTLED: "Mark this auction as settled? This indicates all winners have been processed.",
  };

  const updateStatus = async (newStatus: string) => {
    const msg = confirmMessages[newStatus] || `Change auction status to ${newStatus.toLowerCase()}?`;
    if (!confirm(msg)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/auctions/${auctionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        router.refresh();
      } else {
        alert("Error: " + data.error);
      }
    } catch {
      alert("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const closeAuction = async () => {
    if (!confirm("Close this auction? This will mark all winning bids and notify winners via GHL.")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/auctions/${auctionId}/close`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        alert(`Auction closed. ${data.winnersCount} winner(s) notified.`);
        router.refresh();
      } else {
        alert("Error: " + data.error);
      }
    } catch {
      alert("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const deleteAuction = async () => {
    if (!confirm("Delete this draft auction? All items will be unlinked (not deleted) and can be re-assigned. This cannot be undone.")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/auctions/${auctionId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        router.push("/admin/auctions");
      } else {
        alert("Error: " + data.error);
      }
    } catch {
      alert("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <span className="text-gray-400 text-sm">Updating...</span>;
  }

  return (
    <div className="flex items-center gap-2">
      {status === "DRAFT" && (
        <>
          <button
            onClick={() => updateStatus("OPEN")}
            className="bg-emerald-500 hover:bg-emerald-400 text-white text-sm px-4 py-2 rounded-lg font-medium"
          >
            Open Auction
          </button>
          <button
            onClick={deleteAuction}
            className="bg-transparent hover:bg-red-500/10 text-red-400 hover:text-red-300 border border-red-500/30 text-sm px-3 py-2 rounded-lg font-medium"
          >
            Delete
          </button>
        </>
      )}
      {status === "OPEN" && (
        <>
          <button
            onClick={() => updateStatus("CLOSING")}
            className="bg-yellow-500 hover:bg-yellow-400 text-black text-sm px-4 py-2 rounded-lg font-medium"
          >
            Mark Closing Soon
          </button>
          <button
            onClick={closeAuction}
            className="bg-red-500 hover:bg-red-400 text-white text-sm px-4 py-2 rounded-lg font-medium"
          >
            Close Auction
          </button>
        </>
      )}
      {status === "CLOSING" && (
        <button
          onClick={closeAuction}
          className="bg-red-500 hover:bg-red-400 text-white text-sm px-4 py-2 rounded-lg font-medium"
        >
          Close Auction
        </button>
      )}
      {status === "CLOSED" && (
        <button
          onClick={() => updateStatus("SETTLED")}
          className="bg-purple-500 hover:bg-purple-400 text-white text-sm px-4 py-2 rounded-lg font-medium"
        >
          Mark Settled
        </button>
      )}
    </div>
  );
}
