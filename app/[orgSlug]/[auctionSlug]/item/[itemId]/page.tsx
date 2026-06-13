"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useUser, SignInButton } from "@clerk/nextjs";
import UserMenu from "@/app/components/UserMenu";
import Pusher from "pusher-js";
import Countdown from "@/app/components/Countdown";
import { getNextValidBid, getProxySuggestions } from "@/lib/bidIncrements";
import CardSetupModal from "@/app/components/CardSetupModal";

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
  status: string;
  itemEndAt: string | null;
  photos: { url: string; isPrimary: boolean }[];
  bids: { id: string; amount: number; clerkUserId?: string; bidder?: string; placedAt: string; isProxy?: boolean }[];
  auction: { title: string; endAt: string; status: string } | null;
  org?: { id: string; stripeAccountId: string | null; stripeChargesEnabled: boolean; platformFeePercent?: number; taxPercent?: number } | null;
}

type LiveBid = { user: string; amount: number; time: string; isProxy?: boolean };

export default function ItemPage() {
  const params = useParams();
  const router = useRouter();
  const { orgSlug, auctionSlug, itemId } = params as {
    orgSlug: string; auctionSlug: string; itemId: string;
  };
  const { isSignedIn, isLoaded, user } = useUser();

  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);

  // Manual bid
  const [bidAmount, setBidAmount] = useState("");
  const [placing, setPlacing] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Proxy bid
  const [proxyAmount, setProxyAmount] = useState("");
  const [proxyPlacing, setProxyPlacing] = useState(false);
  const [proxyMessage, setProxyMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [userProxy, setUserProxy] = useState<{ maxAmount: number } | null>(null);
  const [hasActiveProxy, setHasActiveProxy] = useState(false);
  const [cancellingProxy, setCancellingProxy] = useState(false);
  const [proxyWasBeaten, setProxyWasBeaten] = useState(false);

  // Winning state
  const [isWinning, setIsWinning] = useState(false);

  const [liveBids, setLiveBids] = useState<LiveBid[]>([]);

  // Card-on-file gate
  // null = not yet checked, true = has card, false = no card
  const [hasCard, setHasCard] = useState<boolean | null>(null);
  const [cardLast4, setCardLast4] = useState<string | null>(null);
  const [cardBrand, setCardBrand] = useState<string | null>(null);
  const [showCardModal, setShowCardModal] = useState(false);

  // Stable bidder anonymization map
  const bidderMapRef = useRef<Map<string, string>>(new Map());
  const bidderCounterRef = useRef(0);
  const assignBidder = (uid: string): string => {
    if (!bidderMapRef.current.has(uid)) {
      bidderCounterRef.current += 1;
      bidderMapRef.current.set(uid, `Bidder ${bidderCounterRef.current}`);
    }
    return bidderMapRef.current.get(uid)!;
  };

  const [effectiveEndAt, setEffectiveEndAt] = useState<string | null>(null);
  const [biddingEnded, setBiddingEnded] = useState(false);
  const userProxyRef = useRef<{ maxAmount: number } | null>(null);
  userProxyRef.current = userProxy;

  // Load item data
  useEffect(() => {
    fetch(`/api/items/${itemId}`)
      .then(r => r.json())
      .then(d => {
        if (d.item) {
          setItem(d.item);
          const end = d.item.itemEndAt ?? d.item.auction?.endAt ?? null;
          setEffectiveEndAt(end);
          if (end && new Date(end) <= new Date()) setBiddingEnded(true);
          const sorted = [...d.item.bids].sort(
            (a: Item["bids"][0], b: Item["bids"][0]) =>
              new Date(a.placedAt).getTime() - new Date(b.placedAt).getTime()
          );
          // Fix #1: only show last 5 bids
          setLiveBids(sorted.reverse().slice(0, 5).map((b: Item["bids"][0]) => ({
            user: assignBidder(b.bidder ?? b.clerkUserId ?? ""),
            amount: b.amount,
            time: new Date(b.placedAt).toLocaleTimeString(),
            isProxy: b.isProxy ?? false,
          })));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [itemId]);

  // Helper: refresh proxy status from server
  const refreshProxyStatus = useCallback(() => {
    const hadProxy = !!userProxyRef.current;
    fetch(`/api/proxy-bids/${itemId}`)
      .then(r => r.json())
      .then(d => {
        // Fix #5: detect beaten proxy and auto-reset to set form
        if (hadProxy && !d.userProxy) {
          setProxyWasBeaten(true);
        }
        setUserProxy(d.userProxy ?? null);
        setHasActiveProxy(d.hasActiveProxy ?? false);
        // Fix #4: update winning state
        setIsWinning(d.isWinning ?? false);
      })
      .catch(() => {/* non-critical */});
  }, [itemId]);

  // Load proxy status on mount
  useEffect(() => {
    if (!itemId) return;
    refreshProxyStatus();
  }, [itemId, refreshProxyStatus]);

  // Check if the signed-in user has a card on file for this org
  const refreshCardStatus = useCallback(() => {
    if (!isSignedIn || !item?.org?.id) return;
    fetch(`/api/orgs/${item.org.id}/stripe/payment-method`)
      .then((r) => r.json())
      .then((d) => {
        setHasCard(d.hasCard === true);
        setCardLast4(d.last4 ?? null);
        setCardBrand(d.brand ?? null);
      })
      .catch(() => setHasCard(null)); // null = unknown, don't block bidding
  }, [isSignedIn, item?.org?.id]);

  useEffect(() => {
    refreshCardStatus();
  }, [refreshCardStatus]);

  // Pusher real-time updates
  useEffect(() => {
    if (!itemId) return;
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });
    const channel = pusher.subscribe(`item-${itemId}`);

    channel.bind("new-bid", (data: {
      amount: number;
      userId: string;
      isProxy?: boolean;
      hasActiveProxy?: boolean;
      newEndAt?: string;
    }) => {
      setItem(prev => prev ? { ...prev, currentBid: data.amount } : prev);
      // Fix #1: cap live bids at 5
      setLiveBids(prev => [
        {
          user: assignBidder(data.userId),
          amount: data.amount,
          time: "just now",
          isProxy: data.isProxy ?? false,
        },
        ...prev,
      ].slice(0, 5));
      if (data.hasActiveProxy !== undefined) setHasActiveProxy(data.hasActiveProxy);
      if (data.newEndAt) {
        setEffectiveEndAt(data.newEndAt);
        setBiddingEnded(false);
      }
      // Fix #4 + #5: re-fetch proxy status on every bid to detect beaten proxy + winning state
      refreshProxyStatus();
    });

    channel.bind("proxy-update", (data: { hasActiveProxy: boolean }) => {
      setHasActiveProxy(data.hasActiveProxy);
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`item-${itemId}`);
    };
  }, [itemId, refreshProxyStatus]);

  // Fix #7: auto-refresh 75s after bidding ends (to pick up cron job results)
  const handleExpire = useCallback(() => {
    setBiddingEnded(true);
    setTimeout(() => window.location.reload(), 75_000);
  }, []);

  // Manual bid handler
  const handleBid = async () => {
    if (!isSignedIn) {
      router.push(`/sign-in?redirect_url=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    const amount = parseFloat(bidAmount);
    const currentBid = item?.currentBid || 0;
    const minBid = currentBid > 0 ? getNextValidBid(currentBid) : (item?.startingBid || 0);
    if (!bidAmount || amount < minBid) {
      setMessage({ text: `Minimum bid is $${minBid.toLocaleString()}`, type: "error" });
      return;
    }

    // Card gate — show modal if no card on file
    if (hasCard === false) {
      setShowCardModal(true);
      return;
    }

    setPlacing(true);
    setMessage(null);
    try {
      const res = await fetch("/api/bids", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, amount }),
      });
      const data = await res.json();
      if (data.success) {
        setBidAmount("");
        if (data.proxyFired) {
          setMessage({ text: `Bid of $${amount.toLocaleString()} placed — instantly outbid by an active proxy.`, type: "error" });
        } else {
          setMessage({ text: `Bid of $${amount.toLocaleString()} placed!`, type: "success" });
        }
        if (data.newEndAt) {
          setEffectiveEndAt(data.newEndAt);
          setBiddingEnded(false);
        }
      } else if (data.requiresRegistration) {
        router.push(`/register?redirect_url=${encodeURIComponent(window.location.pathname)}`);
      } else if (data.requiresPaymentMethod) {
        setShowCardModal(true);
      } else {
        setMessage({ text: data.error, type: "error" });
      }
    } catch {
      setMessage({ text: "Something went wrong", type: "error" });
    } finally {
      setPlacing(false);
    }
  };

  // Set / update proxy bid handler
  const handleSetProxy = async () => {
    if (!isSignedIn) {
      router.push(`/sign-in?redirect_url=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    const amount = parseFloat(proxyAmount);
    const currentBid = item?.currentBid || 0;
    const minProxy = currentBid > 0 ? getNextValidBid(currentBid) : (item?.startingBid || 1);
    if (!proxyAmount || isNaN(amount) || amount < minProxy) {
      setProxyMessage({ text: `Proxy max must be at least $${minProxy.toLocaleString()}`, type: "error" });
      return;
    }

    // Card gate — show modal if no card on file
    if (hasCard === false) {
      setShowCardModal(true);
      return;
    }

    setProxyPlacing(true);
    setProxyMessage(null);
    try {
      const res = await fetch("/api/proxy-bids", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, maxAmount: amount }),
      });
      const data = await res.json();
      if (data.success) {
        setUserProxy({ maxAmount: amount });
        setHasActiveProxy(true);
        setProxyWasBeaten(false);
        setProxyAmount("");
        setProxyMessage({
          text: data.proxyFired
            ? `Proxy set at $${amount.toLocaleString()} — auto-bid placed!`
            : `Proxy set at $${amount.toLocaleString()}. We'll bid for you automatically.`,
          type: "success",
        });
        if (data.newEndAt) {
          setEffectiveEndAt(data.newEndAt);
          setBiddingEnded(false);
        }
      } else if (data.requiresRegistration) {
        router.push(`/register?redirect_url=${encodeURIComponent(window.location.pathname)}`);
      } else if (data.requiresPaymentMethod) {
        setShowCardModal(true);
      } else {
        setProxyMessage({ text: data.error, type: "error" });
      }
    } catch {
      setProxyMessage({ text: "Something went wrong", type: "error" });
    } finally {
      setProxyPlacing(false);
    }
  };

  // Cancel proxy handler
  const handleCancelProxy = async () => {
    setCancellingProxy(true);
    setProxyMessage(null);
    try {
      const res = await fetch(`/api/proxy-bids/${itemId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setUserProxy(null);
        setProxyWasBeaten(false);
        setProxyMessage({ text: "Proxy cancelled. Your existing bids remain active.", type: "success" });
      } else {
        setProxyMessage({ text: data.error || "Failed to cancel proxy", type: "error" });
      }
    } catch {
      setProxyMessage({ text: "Something went wrong", type: "error" });
    } finally {
      setCancellingProxy(false);
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
      <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-5">
        <div className="text-center max-w-sm w-full">
          <h1 className="text-2xl font-bold mb-2">Item not found</h1>
          <p className="text-gray-400 text-sm mb-6">This item may have been removed or the link is incorrect.</p>
          <div className="flex flex-col gap-2.5">
            <Link href={`/${orgSlug}/${auctionSlug}`} className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-semibold py-3 rounded-xl transition-colors">
              Back to auction
            </Link>
            <Link href="/auctions" className="w-full border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white font-medium py-3 rounded-xl transition-colors">
              Browse all auctions
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const currentBid = item.currentBid || item.startingBid;
  const minBid = item.currentBid > 0 ? getNextValidBid(item.currentBid) : item.startingBid;
  const minProxy = item.currentBid > 0 ? getNextValidBid(item.currentBid) : (item.startingBid > 0 ? item.startingBid : 1);
  // Fix #2: use getProxySuggestions — jumps are far apart so they can't accidentally reveal a competing proxy's max
  const proxySuggestions = getProxySuggestions(item.currentBid || 0, 4);
  const auctionClosed = item.auction?.status === "CLOSED" || item.auction?.status === "SETTLED";
  const itemSold = item.status === "SOLD" || item.status === "PENDING_PICKUP" || item.status === "PICKED_UP";
  const itemNotActive = item.status !== "ACTIVE";
  const biddingLocked = auctionClosed || itemSold || itemNotActive || biddingEnded;
  // Fix #4: determine if current user is winning (only show when signed in)
  const showWinning = isSignedIn && isLoaded && isWinning && !biddingEnded;

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800/60 px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3 bg-gray-950/95 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-2 text-sm min-w-0">
          <Link href="/" className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent shrink-0">PurposeBid</Link>
          <span className="text-gray-700 hidden sm:inline">/</span>
          <Link href={`/${orgSlug}`} className="text-gray-500 hover:text-white capitalize hidden sm:inline truncate max-w-[100px] transition-colors">
            {orgSlug.replace(/-/g, " ")}
          </Link>
          <span className="text-gray-700 hidden sm:inline">/</span>
          <Link href={`/${orgSlug}/${auctionSlug}`} className="text-gray-500 hover:text-white capitalize hidden sm:inline truncate max-w-[100px] transition-colors">
            {auctionSlug.replace(/-/g, " ")}
          </Link>
          <Link href={`/${orgSlug}/${auctionSlug}`} className="text-gray-500 hover:text-white sm:hidden shrink-0 flex items-center gap-1 transition-colors text-xs font-medium">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M8 2L4 6l4 4" /></svg>
            Auction
          </Link>
          <span className="text-gray-700 hidden sm:inline">/</span>
          <span className="text-gray-300 truncate hidden sm:inline">{item.title}</span>
        </div>
        <UserMenu />
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-12">
        {/* Left: photos */}
        <div>
          <div className="w-full aspect-square bg-gray-900 rounded-2xl overflow-hidden mb-3 flex items-center justify-center">
            {item.photos.length > 0 ? (
              <img
                src={item.photos.find(p => p.isPrimary)?.url || item.photos[0].url}
                alt={item.title}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-gray-600 text-sm">No photo</div>
            )}
          </div>
          {item.photos.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {item.photos.slice(0, 4).map((photo, i) => (
                <div key={i} className="aspect-square bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center">
                  <img src={photo.url} alt={`Photo ${i + 1}`} className="w-full h-full object-contain" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: bidding */}
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

          <h1 className="text-2xl sm:text-3xl font-bold mb-2">{item.title}</h1>
          {item.description && <p className="text-gray-400 mb-6">{item.description}</p>}

          {/* Countdown */}
          {effectiveEndAt && !auctionClosed && !itemSold && !itemNotActive && (
            <div className={`rounded-2xl px-4 py-3 mb-6 flex items-center justify-between border transition-all ${
              biddingEnded
                ? "bg-gray-900 border-gray-800"
                : "bg-gray-900 border-gray-800 shadow-[0_0_20px_rgba(52,211,153,0.04)]"
            }`}>
              <span className="text-gray-500 text-sm font-medium">
                {biddingEnded ? "Bidding ended" : "Time remaining"}
              </span>
              {!biddingEnded ? (
                <Countdown endAt={effectiveEndAt} onExpire={handleExpire} />
              ) : (
                <span className="text-gray-500 font-semibold text-sm">Refreshing results shortly…</span>
              )}
            </div>
          )}

          {/* Donor / retail value */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {item.retailValue && (
              <div className="bg-gray-900 rounded-xl p-4">
                <div className="text-gray-500 text-sm mb-1">Retail Value</div>
                <div className="text-white font-bold text-xl">${item.retailValue.toLocaleString()}</div>
              </div>
            )}
            {item.donorName && (
              <div className="bg-gray-900 rounded-xl p-4">
                <div className="text-gray-500 text-sm mb-1">Donated by</div>
                <div className="text-white font-bold">{item.donorName}</div>
              </div>
            )}
          </div>

          {/* Current bid + bidding UI */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-4 shadow-[0_0_25px_rgba(52,211,153,0.04)]">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="text-gray-500 text-sm">Current Bid</div>
                <div className="text-emerald-400 font-bold text-3xl sm:text-4xl">${currentBid.toLocaleString()}</div>
                {/* Fix #4: You're Winning badge */}
                {showWinning && (
                  <div className="mt-1.5">
                    <span className="inline-flex items-center gap-1.5 text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-semibold">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 5H1V3h2M9 5h2V3h-2M3 5h6v3a3 3 0 0 1-6 0V5zM4 11h4M6 8v3" />
                      </svg>
                      You&apos;re Winning
                    </span>
                  </div>
                )}
              </div>
              <div className="text-right flex flex-col items-end gap-2">
                <div>
                  <div className="text-gray-500 text-sm">Bids</div>
                  <div className="text-white font-bold text-xl">{liveBids.length}</div>
                </div>
                {hasActiveProxy && (
                  <div className="flex items-center gap-1">
                    <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full font-medium">
                      Proxy Active
                    </span>
                  </div>
                )}
              </div>
            </div>

            {biddingLocked ? (
              <div className="bg-gray-800 rounded-xl px-4 py-3 text-center text-gray-400">
                {itemSold
                  ? "This item has been sold."
                  : auctionClosed
                  ? "Bidding has closed for this auction."
                  : itemNotActive
                  ? "This item is not currently available for bidding."
                  : "Bidding for this item has ended."}
              </div>
            ) : !isLoaded ? null : !isSignedIn ? (
              <div className="text-center">
                <p className="text-gray-400 text-sm mb-3">You must be signed in to place a bid.</p>
                <SignInButton mode="modal">
                  <button className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-semibold py-3 rounded-xl">
                    Sign In to Bid
                  </button>
                </SignInButton>
              </div>
            ) : (
              <>
                <div className="text-gray-500 text-sm mb-4 mt-4">Minimum next bid: ${minBid.toLocaleString()}</div>
                {message && (
                  <div className={`text-sm mb-3 px-3 py-2 rounded-lg ${
                    message.type === "success" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                  }`}>
                    {message.text}
                  </div>
                )}
                <div className="flex gap-3">
                  <input
                    type="number"
                    value={bidAmount}
                    min={minBid}
                    step="1"
                    onChange={e => setBidAmount(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && !placing && handleBid()}
                    placeholder={`Enter $${minBid.toLocaleString()} or more`}
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    onClick={handleBid}
                    disabled={placing}
                    className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-xl transition-all hover:shadow-[0_0_20px_rgba(52,211,153,0.3)] shrink-0"
                  >
                    {placing ? "Placing…" : "Place Bid"}
                  </button>
                </div>
                {/* Total-due preview — live breakdown of what the bidder actually commits to */}
                {(() => {
                  const feePct = item.org?.platformFeePercent ?? 0;
                  const taxPct = item.org?.taxPercent ?? 0;
                  const entered = parseFloat(bidAmount);
                  const baseBid = Number.isFinite(entered) && entered > 0 ? entered : minBid;
                  // Same cent math as the auto-charge
                  const bidCents = Math.round(baseBid * 100);
                  const feeCents = Math.round(baseBid * feePct / 100 * 100);
                  const taxCents = Math.round(baseBid * taxPct / 100 * 100);
                  const totalCents = bidCents + feeCents + taxCents;
                  const fmt = (c: number) =>
                    (c / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                  return (
                    <div className="mt-3 bg-gray-800/60 border border-gray-700/60 rounded-xl px-4 py-3 text-xs space-y-1">
                      <div className="flex justify-between text-gray-400">
                        <span>{Number.isFinite(entered) && entered > 0 ? "Your bid" : "Minimum bid"}</span>
                        <span className="tabular-nums">${fmt(bidCents)}</span>
                      </div>
                      {feePct > 0 && (
                        <div className="flex justify-between text-gray-400">
                          <span>Buyer premium ({feePct}%)</span>
                          <span className="tabular-nums">${fmt(feeCents)}</span>
                        </div>
                      )}
                      {taxPct > 0 && (
                        <div className="flex justify-between text-gray-400">
                          <span>Tax ({taxPct}%)</span>
                          <span className="tabular-nums">${fmt(taxCents)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-white font-bold border-t border-gray-700/60 pt-1.5 mt-1.5">
                        <span>Total if you win</span>
                        <span className="tabular-nums">${fmt(totalCents)}</span>
                      </div>
                      <p className="text-gray-600 pt-0.5">
                        Charged automatically to your card on file when the auction closes.
                      </p>
                    </div>
                  );
                })()}
                {/* Payment method indicator */}
                {item.org?.stripeChargesEnabled && hasCard !== null && (
                  <div className="flex items-center justify-between mt-3 px-1">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 20 20" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round">
                        <rect x="2" y="5" width="16" height="12" rx="2" />
                        <path d="M2 9h16" />
                      </svg>
                      {hasCard
                        ? cardBrand
                          ? <span className="text-gray-400">{cardBrand.charAt(0).toUpperCase() + cardBrand.slice(1)} ···· {cardLast4}</span>
                          : <span className="text-gray-400">Card on file</span>
                        : <span className="text-yellow-500">No card — required to bid</span>
                      }
                    </div>
                    <button
                      onClick={() => setShowCardModal(true)}
                      className="text-xs text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                    >
                      {hasCard ? "Update card" : "Add card"}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Proxy bidding section */}
          {!biddingLocked && isLoaded && isSignedIn && (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="font-semibold text-sm">Proxy Bidding</h3>
              </div>

              {/* Fix #8: Proper proxy explanation (always visible) */}
              <div className="bg-gray-800/60 rounded-xl px-4 py-3 mb-4 text-xs text-gray-400 leading-relaxed">
                <p className="font-medium text-gray-300 mb-1">How proxy bidding works</p>
                Set your maximum and we&apos;ll automatically bid for you in the smallest increments needed to keep you in the lead — up to your limit. Your max stays private. If someone else sets a higher max, you&apos;ll be notified so you can decide whether to bid again.
              </div>

              {proxyMessage && (
                <div className={`text-sm mb-3 px-3 py-2 rounded-lg ${
                  proxyMessage.type === "success" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                }`}>
                  {proxyMessage.text}
                </div>
              )}

              {userProxy ? (
                /* User has an active proxy */
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">
                      Your max:{" "}
                      <span className="text-indigo-300 font-semibold">${userProxy.maxAmount.toLocaleString()}</span>
                    </p>
                    <p className="text-gray-600 text-xs mt-0.5">We&apos;re bidding automatically on your behalf.</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setProxyAmount(String(userProxy.maxAmount));
                        setUserProxy(null);
                      }}
                      className="text-xs text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Update
                    </button>
                    <button
                      onClick={handleCancelProxy}
                      disabled={cancellingProxy}
                      className="text-xs text-red-400 hover:text-red-300 border border-red-900 hover:border-red-700 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {cancellingProxy ? "Cancelling..." : "Cancel"}
                    </button>
                  </div>
                </div>
              ) : (
                /* Fix #5: No proxy — show set form. If proxy was beaten, show alert. */
                <div>
                  {proxyWasBeaten && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 mb-3 text-xs text-red-400">
                      Your proxy was outbid. Set a new maximum to get back in the lead.
                    </div>
                  )}
                  <p className="text-gray-500 text-xs mb-3">
                    Set a max and we&apos;ll bid for you. Quick picks:
                  </p>
                  <div className="flex gap-2 mb-3 flex-wrap">
                    {proxySuggestions.map(s => (
                      <button
                        key={s}
                        onClick={() => setProxyAmount(String(s))}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                          proxyAmount === String(s)
                            ? "bg-indigo-600 border-indigo-500 text-white"
                            : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
                        }`}
                      >
                        ${s.toLocaleString()}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-3">
                    <input
                      type="number"
                      value={proxyAmount}
                      min={minProxy}
                      step="1"
                      onChange={e => setProxyAmount(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && !proxyPlacing && handleSetProxy()}
                      placeholder={`Max $${minProxy.toLocaleString()} or more`}
                      className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      onClick={handleSetProxy}
                      disabled={proxyPlacing}
                      className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-xl"
                    >
                      {proxyPlacing ? "Setting..." : "Set Proxy"}
                    </button>
                  </div>
                  {/* Worst-case commitment preview for the proxy max */}
                  {(() => {
                    const amt = parseFloat(proxyAmount);
                    if (!Number.isFinite(amt) || amt <= 0) return null;
                    const feePct = item.org?.platformFeePercent ?? 0;
                    const taxPct = item.org?.taxPercent ?? 0;
                    const totalCents =
                      Math.round(amt * 100) +
                      Math.round(amt * feePct / 100 * 100) +
                      Math.round(amt * taxPct / 100 * 100);
                    return (
                      <p className="text-xs text-gray-500 mt-2">
                        If your proxy wins at its max, your total would be{" "}
                        <span className="text-gray-300 font-semibold tabular-nums">
                          ${(totalCents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        {feePct > 0 ? ` (incl. ${feePct}% buyer premium${taxPct > 0 ? ` + ${taxPct}% tax` : ""})` : ""}.
                      </p>
                    );
                  })()}
                </div>
              )}
            </div>
          )}

          {/* Bid history — Fix #1: capped at 5 via state */}
          {liveBids.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Recent Bids</h3>
              <div className="space-y-2">
                {liveBids.map((bid, i) => (
                  <div key={i} className="flex items-center justify-between bg-gray-900 rounded-lg px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">{bid.user}</span>
                      {bid.isProxy && (
                        <span className="text-xs text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">auto</span>
                      )}
                    </div>
                    <span className="text-emerald-400 font-semibold">${bid.amount.toLocaleString()}</span>
                    <span className="text-gray-600 text-sm">{bid.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Card setup modal — shown when user tries to bid without a card on file */}
      {showCardModal && (
        item.org?.stripeAccountId ? (
          <CardSetupModal
            orgId={item.org.id}
            stripeAccountId={item.org.stripeAccountId}
            onSuccess={() => {
              setShowCardModal(false);
              setHasCard(true);
              refreshCardStatus();
              setMessage({
                text: "Card saved! Click Place Bid to confirm your bid.",
                type: "success",
              });
            }}
            onClose={() => setShowCardModal(false)}
          />
        ) : (
          <div className="fixed inset-0 z-50 bg-gray-950/90 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-sm text-center">
              <p className="text-gray-300 mb-2 font-semibold">Payments not yet enabled</p>
              <p className="text-gray-500 text-sm mb-5">This organization hasn&apos;t finished setting up payments. Try again later.</p>
              <button onClick={() => setShowCardModal(false)} className="w-full bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-xl text-sm font-semibold">
                Close
              </button>
            </div>
          </div>
        )
      )}
    </main>
  );
}
