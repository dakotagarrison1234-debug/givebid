"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import Pusher from "pusher-js";
import UserMenu from "@/app/components/UserMenu";
import CardSetupModal from "@/app/components/CardSetupModal";

type Tab = "overview" | "winning" | "losing" | "past" | "profile";

interface BidBase {
  itemId: string;
  itemTitle: string;
  itemStatus: string;
  photo: string | null;
  auctionTitle: string;
  auctionSlug: string;
  auctionEndAt: string;
  auctionStatus: string;
  orgName: string;
  orgSlug: string;
}
interface WinningBid extends BidBase { myBid: number; currentBid: number; itemEndAt: string | null; }
interface LosingBid extends BidBase { myBid: number; currentBid: number; itemEndAt: string | null; }
interface PastBid extends BidBase { myBid: number; finalBid: number; outcome: "won" | "lost" | "unsold"; paid: boolean; pickedUp?: boolean; storageLocation?: string | null; }
interface UnpaidWin extends BidBase { amountOwed: number; paymentFailed?: boolean; orgId?: string; orgStripeAccountId?: string | null; }
interface Profile { name: string | null; email: string | null; phone: string | null; }
interface DashboardData { profile: Profile | null; winning: WinningBid[]; losing: LosingBid[]; past: PastBid[]; unpaidWins: UnpaidWin[]; }

// ── SVG Nav Icons ─────────────────────────────────────────────────────────────
function IcoGrid() {
  return (
    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 20 20" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="7" height="7" rx="1.5" />
      <rect x="11" y="2" width="7" height="7" rx="1.5" />
      <rect x="2" y="11" width="7" height="7" rx="1.5" />
      <rect x="11" y="11" width="7" height="7" rx="1.5" />
    </svg>
  );
}
function IcoUp() {
  return (
    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 20 20" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 15V5M5 10l5-5 5 5" />
    </svg>
  );
}
function IcoDown() {
  return (
    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 20 20" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 5v10M15 10l-5 5-5-5" />
    </svg>
  );
}
function IcoClock() {
  return (
    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 20 20" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
      <circle cx="10" cy="10" r="8" />
      <path d="M10 6v4l3 2.5" />
    </svg>
  );
}
function IcoUser() {
  return (
    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 20 20" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="7" r="4" />
      <path d="M2.5 18c0-4.14 3.36-7.5 7.5-7.5s7.5 3.36 7.5 7.5" />
    </svg>
  );
}
function IcoArrow() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  );
}
function IcoPackage() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <path d="M3.27 6.96 12 12.01l8.73-5.05M12 22.08V12" />
    </svg>
  );
}

function Photo({ url, title }: { url: string | null; title: string }) {
  return url ? (
    <img src={url} alt={title} className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover shrink-0" />
  ) : (
    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gray-800 rounded-xl flex items-center justify-center text-gray-600 text-xs shrink-0">—</div>
  );
}

function formatEnd(endAt: string) {
  return new Date(endAt).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function BidderDashboard() {
  const { user, isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [retryingItemId, setRetryingItemId] = useState<string | null>(null);
  const [retryMsg, setRetryMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [cardModal, setCardModal] = useState<{ orgId: string; stripeAccountId: string } | null>(null);

  const load = useCallback(() => {
    fetch("/api/my-bids").then((r) => r.json()).then((d: DashboardData) => {
      setData(d);
      setEditName(d.profile?.name || "");
      setEditEmail(d.profile?.email || user?.primaryEmailAddress?.emailAddress || "");
      setEditPhone(d.profile?.phone || "");
      setLoading(false);
    });
  }, [user]);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) { router.push("/sign-in?redirect_url=/dashboard"); return; }
    load();
  }, [isLoaded, isSignedIn, router, load]);

  // Real-time Pusher updates — re-fetch when any active bid item gets a new bid
  useEffect(() => {
    if (!data) return;
    const activeItems = [...(data.winning ?? []), ...(data.losing ?? [])];
    if (activeItems.length === 0) return;

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });

    const channels = activeItems.map((b) => {
      const ch = pusher.subscribe(`item-${b.itemId}`);
      ch.bind("new-bid", () => load());
      return ch;
    });

    return () => {
      channels.forEach((ch) => ch.unbind_all());
      pusher.disconnect();
    };
  }, [data, load]);

  const saveProfile = async () => {
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, email: editEmail, phone: editPhone }),
      });
      const d = await res.json();
      setProfileMsg(d.success ? { text: "Profile saved.", ok: true } : { text: d.error || "Failed to save.", ok: false });
      if (d.success) load();
    } catch { setProfileMsg({ text: "Something went wrong.", ok: false }); }
    finally { setSavingProfile(false); }
  };

  const retryPayment = async (itemId: string) => {
    setRetryingItemId(itemId);
    setRetryMsg(null);
    try {
      const res = await fetch("/api/retry-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      });
      const d = await res.json();
      if (d.success) {
        setRetryMsg({ text: "Payment successful! Your item is ready for pickup.", ok: true });
        load(); // Refresh to move item from unpaidWins to past
      } else {
        setRetryMsg({ text: d.error || "Payment failed. Please update your card in Settings.", ok: false });
      }
    } catch {
      setRetryMsg({ text: "Something went wrong. Please try again.", ok: false });
    } finally {
      setRetryingItemId(null);
    }
  };

  if (!isLoaded || loading) {
    return (
      <main className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin" />
          <p className="text-gray-500 text-sm">Loading your dashboard…</p>
        </div>
      </main>
    );
  }
  if (!data) return null;

  const { winning, losing, past, unpaidWins } = data;
  const totalOwed = unpaidWins.reduce((s, i) => s + i.amountOwed, 0);
  const failedWins = unpaidWins.filter((w) => w.paymentFailed);
  const pendingWins = unpaidWins.filter((w) => !w.paymentFailed);

  const navItems: { id: Tab; label: string; shortLabel: string; count?: number; icon: React.ReactNode }[] = [
    { id: "overview", label: "Overview",      shortLabel: "Overview", icon: <IcoGrid /> },
    { id: "winning",  label: "Active Bids",   shortLabel: "Active",   count: winning.length, icon: <IcoUp /> },
    { id: "losing",   label: "Losing Bids",   shortLabel: "Losing",   count: losing.length,  icon: <IcoDown /> },
    { id: "past",     label: "Past Bids",     shortLabel: "Past",     icon: <IcoClock /> },
    { id: "profile",  label: "My Profile",    shortLabel: "Profile",  icon: <IcoUser /> },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col md:flex-row">

      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex w-60 bg-gray-900/80 border-r border-gray-800/60 flex-col shrink-0">
        <div className="px-5 py-5 border-b border-gray-800/60">
          <Link href="/" className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">
            PurposeBid
          </Link>
          <p className="text-gray-600 text-xs mt-0.5">Bidder Portal</p>
        </div>
        <nav className="flex-1 px-3 py-3 space-y-0.5">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                tab === item.id
                  ? "bg-gray-800 text-white"
                  : "text-gray-500 hover:text-white hover:bg-gray-800/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={tab === item.id ? "text-emerald-400" : ""}>{item.icon}</span>
                <span className="text-sm font-medium">{item.label}</span>
              </div>
              {item.count !== undefined && item.count > 0 && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                  item.id === "losing"
                    ? "bg-red-500/15 text-red-400"
                    : "bg-emerald-500/15 text-emerald-400"
                }`}>
                  {item.count}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="px-3 pb-3">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-600 hover:text-white hover:bg-gray-800/50 text-sm transition-colors"
          >
            <IcoArrow />
            <span>Browse Auctions</span>
          </Link>
        </div>
        <div className="px-3 py-4 border-t border-gray-800/60 flex items-center gap-3">
          <UserMenu />
          <div className="min-w-0">
            <div className="text-sm text-white font-semibold truncate">{user?.firstName || "Account"}</div>
            <div className="text-xs text-gray-600 truncate">{user?.primaryEmailAddress?.emailAddress}</div>
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-0">

        {/* Mobile top bar */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-gray-800/60 bg-gray-900/80">
          <Link href="/" className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">
            PurposeBid
          </Link>
          <div className="flex items-center gap-2">
            {unpaidWins.length > 0 && (
              <span className="bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {unpaidWins.length}
              </span>
            )}
            <UserMenu />
          </div>
        </header>

        {/* Failed charge banner */}
        {failedWins.length > 0 && (
          <div className="bg-red-500/8 border-b border-red-500/20 px-4 sm:px-8 py-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
              <div className="text-sm">
                <span className="text-red-300 font-bold">Payment failed</span>
                <span className="text-gray-400"> — we couldn&apos;t charge your card for {failedWins.length} item{failedWins.length !== 1 ? "s" : ""}.</span>
              </div>
            </div>
            {retryMsg && (
              <p className={`text-sm mt-1 ${retryMsg.ok ? "text-emerald-400" : "text-red-400"}`}>
                {retryMsg.text}
              </p>
            )}
          </div>
        )}

        {/* Pending wins banner (no card — legacy fallback) */}
        {pendingWins.length > 0 && (
          <div className="bg-orange-500/8 border-b border-orange-500/20 px-4 sm:px-8 py-3">
            <div className="text-sm">
              <span className="text-orange-300 font-bold">{pendingWins.length} win{pendingWins.length !== 1 ? "s" : ""} pending payment</span>
              <span className="text-gray-400"> · ${pendingWins.reduce((s, i) => s + i.amountOwed, 0).toLocaleString()} total</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Your auction organizer will process payment.</p>
          </div>
        )}

        {/* Desktop page title */}
        <header className="hidden md:block border-b border-gray-800/60 px-8 py-4">
          <h1 className="text-lg font-bold">
            {tab === "overview" && "Overview"}
            {tab === "winning" && "Active Bids"}
            {tab === "losing" && "Losing Bids"}
            {tab === "past" && "Past Bids"}
            {tab === "profile" && "My Profile"}
          </h1>
        </header>

        <div className="flex-1 overflow-auto px-4 sm:px-8 py-5 sm:py-7">

          {/* ── Overview ── */}
          {tab === "overview" && (
            <div className="space-y-5 max-w-3xl">

              {/* Ready for pickup callout */}
              {(() => {
                const awaitingPickup = past.filter(b => b.outcome === "won" && b.paid && !b.pickedUp);
                if (awaitingPickup.length === 0) return null;
                return (
                  <div className="bg-emerald-500/8 border border-emerald-500/25 rounded-2xl px-5 py-4">
                    <div className="flex items-center gap-2 mb-1">
                      <IcoPackage />
                      <span className="font-bold text-emerald-300 text-sm">
                        {awaitingPickup.length} item{awaitingPickup.length !== 1 ? "s" : ""} ready for pickup
                      </span>
                    </div>
                    <p className="text-gray-400 text-xs mb-4">
                      Payment confirmed. Contact the organization to arrange collection.
                    </p>
                    <div className="space-y-3">
                      {awaitingPickup.map((b) => (
                        <div key={b.itemId} className="flex items-center gap-3">
                          <Photo url={b.photo} title={b.itemTitle} />
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold truncate">{b.itemTitle}</div>
                            <div className="text-xs text-gray-500 truncate">{b.auctionTitle} · {b.orgName}</div>
                            {b.storageLocation && (
                              <div className="text-xs text-gray-600 mt-0.5">Pickup: {b.storageLocation}</div>
                            )}
                          </div>
                          <div className="shrink-0 text-emerald-400 font-bold text-sm ml-auto">
                            ${b.finalBid.toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Stat cards */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div className={`bg-gray-900 border rounded-2xl p-3 sm:p-5 transition-all ${
                  winning.length > 0
                    ? "border-emerald-500/25 shadow-[0_0_20px_rgba(52,211,153,0.06)]"
                    : "border-gray-800"
                }`}>
                  <div className="text-gray-500 text-xs sm:text-sm mb-1">Winning</div>
                  <div className={`text-xl sm:text-2xl font-extrabold ${winning.length > 0 ? "text-emerald-400" : "text-gray-400"}`}>
                    {winning.length}
                  </div>
                </div>
                <div className={`bg-gray-900 border rounded-2xl p-3 sm:p-5 transition-all ${
                  losing.length > 0
                    ? "border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.05)]"
                    : "border-gray-800"
                }`}>
                  <div className="text-gray-500 text-xs sm:text-sm mb-1">Outbid</div>
                  <div className={`text-xl sm:text-2xl font-extrabold ${losing.length > 0 ? "text-red-400" : "text-gray-400"}`}>
                    {losing.length}
                  </div>
                </div>
                <div className={`bg-gray-900 border rounded-2xl p-3 sm:p-5 transition-all ${
                  totalOwed > 0
                    ? "border-orange-500/20 shadow-[0_0_20px_rgba(249,115,22,0.05)]"
                    : "border-gray-800"
                }`}>
                  <div className="text-gray-500 text-xs sm:text-sm mb-1">Owed</div>
                  <div className={`text-xl sm:text-2xl font-extrabold ${totalOwed > 0 ? "text-orange-400" : "text-gray-400"}`}>
                    ${totalOwed.toLocaleString()}
                  </div>
                </div>
              </div>

              {winning.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-bold text-gray-300 text-xs uppercase tracking-wider">Currently Winning</h2>
                    <button onClick={() => setTab("winning")} className="text-emerald-400 text-sm hover:text-emerald-300 transition-colors flex items-center gap-1">
                      View all <IcoArrow />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {winning.slice(0, 3).map((b) => (
                      <Link
                        key={b.itemId}
                        href={`/${b.orgSlug}/${b.auctionSlug}/item/${b.itemId}`}
                        className="flex items-center gap-3 bg-gray-900 border border-emerald-500/15 rounded-2xl px-4 py-3 hover:border-emerald-500/35 transition-all hover:shadow-[0_0_20px_rgba(52,211,153,0.05)]"
                      >
                        <Photo url={b.photo} title={b.itemTitle} />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm truncate">{b.itemTitle}</div>
                          <div className="text-gray-500 text-xs truncate">{b.auctionTitle}</div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-emerald-400 font-bold text-sm">${b.myBid.toLocaleString()}</div>
                          <div className="text-xs text-emerald-600 mt-0.5">Winning</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {losing.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-bold text-gray-300 text-xs uppercase tracking-wider">You&apos;ve Been Outbid</h2>
                    <button onClick={() => setTab("losing")} className="text-red-400 text-sm hover:text-red-300 transition-colors flex items-center gap-1">
                      View all <IcoArrow />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {losing.slice(0, 3).map((b) => (
                      <Link
                        key={b.itemId}
                        href={`/${b.orgSlug}/${b.auctionSlug}/item/${b.itemId}`}
                        className="flex items-center gap-3 bg-gray-900 border border-red-500/15 rounded-2xl px-4 py-3 hover:border-red-500/30 transition-all"
                      >
                        <Photo url={b.photo} title={b.itemTitle} />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm truncate">{b.itemTitle}</div>
                          <div className="text-gray-500 text-xs truncate">{b.auctionTitle}</div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-gray-400 font-semibold text-sm">${b.myBid.toLocaleString()}</div>
                          <div className="text-red-400 text-xs mt-0.5">High: ${b.currentBid.toLocaleString()}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {winning.length === 0 && losing.length === 0 && unpaidWins.length === 0 && (
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center">
                  <div className="text-gray-700 mb-4 flex justify-center">
                    <svg className="w-10 h-10" fill="none" viewBox="0 0 40 40" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="20" cy="20" r="16" />
                      <path d="M13 27c0-3.87 3.13-7 7-7s7 3.13 7 7" />
                      <circle cx="20" cy="15" r="4" />
                    </svg>
                  </div>
                  <p className="text-gray-500 mb-5 text-sm">You haven&apos;t placed any bids yet.</p>
                  <Link
                    href="/"
                    className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-6 py-3 rounded-2xl text-sm transition-all hover:shadow-[0_0_25px_rgba(52,211,153,0.25)]"
                  >
                    Browse Auctions
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* ── Active Bids ── */}
          {tab === "winning" && (
            <div className="max-w-3xl">
              {winning.length === 0 ? (
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center">
                  <p className="text-gray-500 mb-4 text-sm">Not currently winning any items.</p>
                  <Link href="/" className="text-emerald-400 hover:text-emerald-300 text-sm transition-colors">Browse auctions</Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {winning.map((b) => (
                    <Link
                      key={b.itemId}
                      href={`/${b.orgSlug}/${b.auctionSlug}/item/${b.itemId}`}
                      className="flex items-center gap-4 bg-gray-900 border border-emerald-500/15 rounded-2xl px-4 sm:px-6 py-4 hover:border-emerald-500/35 transition-all hover:shadow-[0_0_20px_rgba(52,211,153,0.05)]"
                    >
                      <Photo url={b.photo} title={b.itemTitle} />
                      <div className="flex-1 min-w-0">
                        <div className="font-bold truncate">{b.itemTitle}</div>
                        <div className="text-gray-500 text-xs sm:text-sm mt-0.5 truncate">{b.auctionTitle} · {b.orgName}</div>
                        <div className="text-gray-600 text-xs mt-1">Ends {formatEnd(b.itemEndAt ?? b.auctionEndAt)}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-emerald-400 font-extrabold text-lg">${b.myBid.toLocaleString()}</div>
                        <div className="text-xs text-emerald-600 mt-0.5 font-semibold">Winning</div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Losing Bids ── */}
          {tab === "losing" && (
            <div className="max-w-3xl">
              {losing.length === 0 ? (
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center">
                  <p className="text-gray-500 text-sm">You&apos;re not being outbid on anything right now.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {losing.map((b) => (
                    <Link
                      key={b.itemId}
                      href={`/${b.orgSlug}/${b.auctionSlug}/item/${b.itemId}`}
                      className="flex items-center gap-4 bg-gray-900 border border-red-500/15 rounded-2xl px-4 sm:px-6 py-4 hover:border-red-500/30 transition-all"
                    >
                      <Photo url={b.photo} title={b.itemTitle} />
                      <div className="flex-1 min-w-0">
                        <div className="font-bold truncate">{b.itemTitle}</div>
                        <div className="text-gray-500 text-xs sm:text-sm mt-0.5 truncate">{b.auctionTitle} · {b.orgName}</div>
                        <div className="text-gray-600 text-xs mt-1">Ends {formatEnd(b.itemEndAt ?? b.auctionEndAt)}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-gray-500 text-xs">your bid</div>
                        <div className="text-gray-400 font-bold">${b.myBid.toLocaleString()}</div>
                        <div className="text-gray-600 text-xs mt-1">high bid</div>
                        <div className="text-red-400 font-extrabold">${b.currentBid.toLocaleString()}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Past Bids ── */}
          {tab === "past" && (
            <div className="max-w-3xl">
              {past.length === 0 && unpaidWins.length === 0 ? (
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center">
                  <p className="text-gray-500 text-sm">No past bids yet.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {unpaidWins.map((b) => (
                    <div
                      key={b.itemId}
                      className={`flex items-center gap-4 bg-gray-900 border rounded-2xl px-4 sm:px-6 py-4 ${
                        b.paymentFailed ? "border-red-500/25" : "border-orange-500/25"
                      }`}
                    >
                      <Photo url={b.photo} title={b.itemTitle} />
                      <div className="flex-1 min-w-0">
                        <div className="font-bold truncate">{b.itemTitle}</div>
                        <div className="text-gray-500 text-xs sm:text-sm mt-0.5 truncate">{b.auctionTitle} · {b.orgName}</div>
                        {b.paymentFailed && (
                          <div className="text-xs text-red-400 mt-1">Card was declined. Update your card and retry.</div>
                        )}
                      </div>
                      <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
                        <div className="text-emerald-400 font-extrabold">${b.amountOwed.toLocaleString()}</div>
                        {b.paymentFailed ? (
                          <>
                            <button
                              onClick={() => retryPayment(b.itemId)}
                              disabled={retryingItemId === b.itemId}
                              className="text-xs bg-red-500 hover:bg-red-400 disabled:opacity-50 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors"
                            >
                              {retryingItemId === b.itemId ? "Retrying…" : "Retry Payment"}
                            </button>
                            {b.orgId && b.orgStripeAccountId && (
                              <button
                                onClick={() => setCardModal({ orgId: b.orgId!, stripeAccountId: b.orgStripeAccountId! })}
                                className="text-xs text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 px-3 py-1.5 rounded-lg transition-colors"
                              >
                                Update Card
                              </button>
                            )}
                          </>
                        ) : (
                          <div className="text-xs text-orange-400 font-semibold">Payment due</div>
                        )}
                      </div>
                    </div>
                  ))}
                  {past.map((b, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-4 bg-gray-900 border rounded-2xl px-4 sm:px-6 py-4 ${
                        b.outcome === "won" ? "border-emerald-500/12" : "border-gray-800/60"
                      }`}
                    >
                      <Photo url={b.photo} title={b.itemTitle} />
                      <div className="flex-1 min-w-0">
                        <div className="font-bold truncate">{b.itemTitle}</div>
                        <div className="text-gray-500 text-xs sm:text-sm mt-0.5 truncate">{b.auctionTitle} · {b.orgName}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className={`font-extrabold ${b.outcome === "won" ? "text-emerald-400" : "text-gray-500"}`}>
                          ${b.myBid.toLocaleString()}
                        </div>
                        <div className={`text-xs mt-0.5 font-medium ${
                          b.outcome === "won"
                            ? b.pickedUp ? "text-gray-500" : "text-emerald-600"
                            : "text-gray-600"
                        }`}>
                          {b.outcome === "won"
                            ? b.pickedUp
                              ? "Picked up"
                              : b.paid
                              ? "Paid — awaiting pickup"
                              : "Won"
                            : b.outcome === "unsold"
                            ? "Went unsold"
                            : `Lost · $${b.finalBid.toLocaleString()}`}
                        </div>
                        {b.outcome === "won" && b.paid && !b.pickedUp && b.storageLocation && (
                          <div className="text-xs text-gray-600 mt-0.5">
                            Pickup: {b.storageLocation}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Profile ── */}
          {tab === "profile" && (
            <div className="max-w-lg">
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-800/60">
                <UserMenu />
                <div>
                  <div className="font-bold">{user?.fullName || "Your Account"}</div>
                  <div className="text-gray-500 text-sm">{user?.primaryEmailAddress?.emailAddress}</div>
                </div>
              </div>
              <div className="space-y-4">
                {[
                  { label: "Full Name", type: "text", value: editName, set: setEditName, placeholder: "Your name" },
                  { label: "Email Address", type: "email", value: editEmail, set: setEditEmail, placeholder: "you@example.com", hint: "Used for outbid alerts and receipts." },
                  { label: "Phone Number", type: "tel", value: editPhone, set: setEditPhone, placeholder: "+1 (555) 000-0000", hint: "Used for SMS notifications." },
                ].map((f) => (
                  <div key={f.label}>
                    <label className="text-sm text-gray-400 mb-1.5 block font-medium">{f.label}</label>
                    <input
                      type={f.type}
                      value={f.value}
                      onChange={(e) => f.set(e.target.value)}
                      placeholder={f.placeholder}
                      className="w-full bg-gray-900 border border-gray-700/80 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/60 transition-colors"
                    />
                    {f.hint && <p className="text-gray-600 text-xs mt-1.5">{f.hint}</p>}
                  </div>
                ))}
                {profileMsg && (
                  <p className={`text-sm px-4 py-3 rounded-xl font-medium ${
                    profileMsg.ok
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-red-500/10 text-red-400 border border-red-500/20"
                  }`}>
                    {profileMsg.text}
                  </p>
                )}
                <button
                  onClick={saveProfile}
                  disabled={savingProfile}
                  className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-2xl w-full transition-all hover:shadow-[0_0_25px_rgba(52,211,153,0.2)]"
                >
                  {savingProfile ? "Saving…" : "Save Profile"}
                </button>
                <div className="pt-2 border-t border-gray-800/60">
                  <Link
                    href="/"
                    className="flex items-center justify-center gap-2 text-gray-600 hover:text-white text-sm py-2 transition-colors"
                  >
                    Browse Auctions <IcoArrow />
                  </Link>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Card update modal */}
      {cardModal && (
        <CardSetupModal
          orgId={cardModal.orgId}
          stripeAccountId={cardModal.stripeAccountId}
          onSuccess={() => {
            setCardModal(null);
            setRetryMsg({ text: "Card updated. You can now retry the payment.", ok: true });
          }}
          onClose={() => setCardModal(null)}
        />
      )}

      {/* ── Mobile bottom tab bar ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-md border-t border-gray-800/60 flex z-50 safe-area-pb">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-1 relative transition-colors ${
              tab === item.id ? "text-emerald-400" : "text-gray-600 hover:text-gray-400"
            }`}
          >
            {item.icon}
            <span className="text-[9px] font-semibold leading-none tracking-wide uppercase">{item.shortLabel}</span>
            {item.count !== undefined && item.count > 0 && (
              <span className={`absolute top-1.5 right-[18%] text-[9px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-bold ${
                item.id === "losing" ? "bg-red-500 text-white" : "bg-emerald-500 text-white"
              }`}>
                {item.count}
              </span>
            )}
          </button>
        ))}
      </nav>

    </div>
  );
}
