"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import UserMenu from "@/app/components/UserMenu";

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
interface PastBid extends BidBase { myBid: number; finalBid: number; outcome: "won" | "lost" | "unsold"; paid: boolean; pickedUp?: boolean; }
interface UnpaidWin extends BidBase { amountOwed: number; }
interface Profile { name: string | null; email: string | null; phone: string | null; }
interface DashboardData { profile: Profile | null; winning: WinningBid[]; losing: LosingBid[]; past: PastBid[]; unpaidWins: UnpaidWin[]; }

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
  const [paying, setPaying] = useState(false);

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

  const payAll = async () => {
    if (!data?.unpaidWins.length) return;
    setPaying(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemIds: data.unpaidWins.map((i) => i.itemId) }),
      });
      const d = await res.json();
      if (d.url) { window.location.href = d.url; }
      else { alert(d.error || "Failed to start checkout"); setPaying(false); }
    } catch { alert("Something went wrong"); setPaying(false); }
  };

  if (!isLoaded || loading) {
    return (
      <main className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </main>
    );
  }
  if (!data) return null;

  const { winning, losing, past, unpaidWins } = data;
  const totalOwed = unpaidWins.reduce((s, i) => s + i.amountOwed, 0);

  const navItems: { id: Tab; label: string; count?: number; icon: string }[] = [
    { id: "overview",  label: "Overview",    icon: "▦" },
    { id: "winning",   label: "Active",      count: winning.length,  icon: "↑" },
    { id: "losing",    label: "Losing",      count: losing.length,   icon: "↓" },
    { id: "past",      label: "Past",        icon: "◷" },
    { id: "profile",   label: "Profile",     icon: "◎" },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col md:flex-row">

      {/* ── Desktop sidebar (hidden on mobile) ── */}
      <aside className="hidden md:flex w-64 bg-gray-900 border-r border-gray-800 flex-col shrink-0">
        <div className="px-6 py-5 border-b border-gray-800">
          <Link href="/" className="text-emerald-400 font-bold text-xl">GiveBid</Link>
          <p className="text-gray-500 text-xs mt-1">Bidder Portal</p>
        </div>
        <nav className="flex-1 px-4 py-4 space-y-1">
          {navItems.map((item) => (
            <button key={item.id} onClick={() => setTab(item.id)}
              className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                tab === item.id ? "bg-gray-800 text-white" : "text-gray-400 hover:text-white hover:bg-gray-800/50"
              }`}>
              <div className="flex items-center gap-3">
                <span className="text-sm">{item.icon}</span>
                <span className="text-sm font-medium">{item.label === "Active" ? "Active Bids" : item.label === "Losing" ? "Losing Bids" : item.label === "Past" ? "Past Bids" : item.label}</span>
              </div>
              {item.count !== undefined && item.count > 0 && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${item.id === "losing" ? "bg-red-500/20 text-red-400" : "bg-emerald-500/20 text-emerald-400"}`}>
                  {item.count}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="px-4 pb-4">
          <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 hover:text-white hover:bg-gray-800/50 text-sm transition-colors">
            <span>↗</span><span>Browse Auctions</span>
          </Link>
        </div>
        <div className="px-4 py-4 border-t border-gray-800 flex items-center gap-3">
          <UserMenu />
          <div className="min-w-0">
            <div className="text-sm text-white font-medium truncate">{user?.firstName || "Account"}</div>
            <div className="text-xs text-gray-500 truncate">{user?.primaryEmailAddress?.emailAddress}</div>
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-0">

        {/* Mobile top bar */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-900">
          <Link href="/" className="text-emerald-400 font-bold text-lg">GiveBid</Link>
          <div className="flex items-center gap-3">
            {unpaidWins.length > 0 && (
              <span className="bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{unpaidWins.length}</span>
            )}
            <UserMenu />
          </div>
        </header>

        {/* Pay banner */}
        {unpaidWins.length > 0 && (
          <div className="bg-orange-500/10 border-b border-orange-500/30 px-4 sm:px-8 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="text-sm">
              <span className="text-orange-300 font-semibold">{unpaidWins.length} unpaid win{unpaidWins.length !== 1 ? "s" : ""}</span>
              <span className="text-gray-400"> · ${totalOwed.toLocaleString()} total due</span>
            </div>
            <button onClick={payAll} disabled={paying}
              className="bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2 rounded-lg sm:ml-auto w-full sm:w-auto">
              {paying ? "Redirecting..." : `Pay $${totalOwed.toLocaleString()} Now`}
            </button>
          </div>
        )}

        {/* Desktop page title */}
        <header className="hidden md:block border-b border-gray-800 px-8 py-4">
          <h1 className="text-xl font-semibold">
            {tab === "overview" && "Overview"}
            {tab === "winning" && "Active Bids"}
            {tab === "losing" && "Losing Bids"}
            {tab === "past" && "Past Bids"}
            {tab === "profile" && "My Profile"}
          </h1>
        </header>

        <div className="flex-1 overflow-auto px-4 sm:px-8 py-4 sm:py-6">

          {/* ── Overview ── */}
          {tab === "overview" && (
            <div className="space-y-6 max-w-3xl">
              <div className="grid grid-cols-3 gap-2 sm:gap-4">
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 sm:p-5">
                  <div className="text-gray-500 text-xs sm:text-sm mb-1">Winning</div>
                  <div className="text-xl sm:text-2xl font-bold text-emerald-400">{winning.length}</div>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 sm:p-5">
                  <div className="text-gray-500 text-xs sm:text-sm mb-1">Outbid</div>
                  <div className="text-xl sm:text-2xl font-bold text-red-400">{losing.length}</div>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 sm:p-5">
                  <div className="text-gray-500 text-xs sm:text-sm mb-1">Owed</div>
                  <div className="text-xl sm:text-2xl font-bold text-orange-400">${totalOwed.toLocaleString()}</div>
                </div>
              </div>

              {winning.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-semibold text-gray-300 text-xs uppercase tracking-wider">Currently Winning</h2>
                    <button onClick={() => setTab("winning")} className="text-emerald-400 text-sm hover:underline">View all →</button>
                  </div>
                  <div className="space-y-2">
                    {winning.slice(0, 3).map((b) => (
                      <Link key={b.itemId} href={`/${b.orgSlug}/${b.auctionSlug}/item/${b.itemId}`}
                        className="flex items-center gap-3 bg-gray-900 border border-emerald-500/20 rounded-xl px-4 py-3 hover:border-emerald-500/40 transition-colors">
                        <Photo url={b.photo} title={b.itemTitle} />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{b.itemTitle}</div>
                          <div className="text-gray-500 text-xs truncate">{b.auctionTitle}</div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-emerald-400 font-bold text-sm">${b.myBid.toLocaleString()}</div>
                          <div className="text-xs text-emerald-600">Winning</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {losing.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-semibold text-gray-300 text-xs uppercase tracking-wider">You&apos;ve Been Outbid</h2>
                    <button onClick={() => setTab("losing")} className="text-red-400 text-sm hover:underline">View all →</button>
                  </div>
                  <div className="space-y-2">
                    {losing.slice(0, 3).map((b) => (
                      <Link key={b.itemId} href={`/${b.orgSlug}/${b.auctionSlug}/item/${b.itemId}`}
                        className="flex items-center gap-3 bg-gray-900 border border-red-500/20 rounded-xl px-4 py-3 hover:border-red-500/40 transition-colors">
                        <Photo url={b.photo} title={b.itemTitle} />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{b.itemTitle}</div>
                          <div className="text-gray-500 text-xs truncate">{b.auctionTitle}</div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-gray-400 font-semibold text-sm">${b.myBid.toLocaleString()}</div>
                          <div className="text-red-400 text-xs">High: ${b.currentBid.toLocaleString()}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {winning.length === 0 && losing.length === 0 && unpaidWins.length === 0 && (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-10 text-center">
                  <p className="text-gray-500 mb-4">You haven&apos;t placed any bids yet.</p>
                  <Link href="/" className="bg-emerald-500 hover:bg-emerald-400 text-white px-6 py-3 rounded-xl text-sm font-semibold">
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
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-10 text-center">
                  <p className="text-gray-500 mb-4">Not currently winning any items.</p>
                  <Link href="/" className="text-emerald-400 hover:underline text-sm">Browse auctions</Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {winning.map((b) => (
                    <Link key={b.itemId} href={`/${b.orgSlug}/${b.auctionSlug}/item/${b.itemId}`}
                      className="flex items-center gap-3 sm:gap-5 bg-gray-900 border border-emerald-500/20 rounded-xl px-4 sm:px-6 py-4 sm:py-5 hover:border-emerald-500/40 transition-colors">
                      <Photo url={b.photo} title={b.itemTitle} />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">{b.itemTitle}</div>
                        <div className="text-gray-500 text-xs sm:text-sm mt-0.5 truncate">{b.auctionTitle} · {b.orgName}</div>
                        <div className="text-gray-600 text-xs mt-1">Ends {formatEnd(b.itemEndAt ?? b.auctionEndAt)}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-emerald-400 font-bold text-lg">${b.myBid.toLocaleString()}</div>
                        <div className="text-xs text-emerald-600 mt-0.5">✓ Winning</div>
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
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-10 text-center">
                  <p className="text-gray-500">You&apos;re not being outbid on anything right now.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {losing.map((b) => (
                    <Link key={b.itemId} href={`/${b.orgSlug}/${b.auctionSlug}/item/${b.itemId}`}
                      className="flex items-center gap-3 sm:gap-5 bg-gray-900 border border-red-500/20 rounded-xl px-4 sm:px-6 py-4 sm:py-5 hover:border-red-500/40 transition-colors">
                      <Photo url={b.photo} title={b.itemTitle} />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">{b.itemTitle}</div>
                        <div className="text-gray-500 text-xs sm:text-sm mt-0.5 truncate">{b.auctionTitle} · {b.orgName}</div>
                        <div className="text-gray-600 text-xs mt-1">Ends {formatEnd(b.itemEndAt ?? b.auctionEndAt)}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-gray-500 text-xs">your bid</div>
                        <div className="text-gray-400 font-semibold">${b.myBid.toLocaleString()}</div>
                        <div className="text-gray-500 text-xs mt-1">high bid</div>
                        <div className="text-red-400 font-bold">${b.currentBid.toLocaleString()}</div>
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
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-10 text-center">
                  <p className="text-gray-500">No past bids yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {unpaidWins.map((b) => (
                    <div key={b.itemId} className="flex items-center gap-3 sm:gap-5 bg-gray-900 border border-orange-500/30 rounded-xl px-4 sm:px-6 py-4 sm:py-5">
                      <Photo url={b.photo} title={b.itemTitle} />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">{b.itemTitle}</div>
                        <div className="text-gray-500 text-xs sm:text-sm mt-0.5 truncate">{b.auctionTitle} · {b.orgName}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-emerald-400 font-bold">${b.amountOwed.toLocaleString()}</div>
                        <div className="text-xs text-orange-400 mt-0.5">Payment due</div>
                      </div>
                    </div>
                  ))}
                  {past.map((b, i) => (
                    <div key={i} className={`flex items-center gap-3 sm:gap-5 bg-gray-900 border rounded-xl px-4 sm:px-6 py-4 sm:py-5 ${b.outcome === "won" ? "border-emerald-500/15" : "border-gray-800"}`}>
                      <Photo url={b.photo} title={b.itemTitle} />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">{b.itemTitle}</div>
                        <div className="text-gray-500 text-xs sm:text-sm mt-0.5 truncate">{b.auctionTitle} · {b.orgName}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className={`font-bold ${b.outcome === "won" ? "text-emerald-400" : "text-gray-500"}`}>
                          ${b.myBid.toLocaleString()}
                        </div>
                        <div className={`text-xs mt-0.5 ${b.outcome === "won" ? "text-emerald-600" : "text-gray-600"}`}>
                          {b.outcome === "won"
                            ? b.pickedUp ? "Won · Picked up ✓" : b.paid ? "Won · Paid ✓" : "Won"
                            : b.outcome === "unsold" ? "Went unsold"
                            : `Lost · $${b.finalBid.toLocaleString()}`}
                        </div>
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
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-800">
                <UserMenu />
                <div>
                  <div className="font-semibold">{user?.fullName || "Your Account"}</div>
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
                    <label className="text-sm text-gray-400 mb-1.5 block">{f.label}</label>
                    <input type={f.type} value={f.value} onChange={(e) => f.set(e.target.value)} placeholder={f.placeholder}
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500" />
                    {f.hint && <p className="text-gray-600 text-xs mt-1">{f.hint}</p>}
                  </div>
                ))}
                {profileMsg && (
                  <p className={`text-sm px-4 py-3 rounded-xl ${profileMsg.ok ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
                    {profileMsg.text}
                  </p>
                )}
                <button onClick={saveProfile} disabled={savingProfile}
                  className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-xl w-full">
                  {savingProfile ? "Saving..." : "Save Profile"}
                </button>
                <div className="pt-2 border-t border-gray-800">
                  <Link href="/" className="flex items-center justify-center gap-2 text-gray-500 hover:text-white text-sm py-2 transition-colors">
                    <span>↗</span> Browse Auctions
                  </Link>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── Mobile bottom tab bar ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 flex z-50">
        {navItems.map((item) => (
          <button key={item.id} onClick={() => setTab(item.id)}
            className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 relative transition-colors ${
              tab === item.id ? "text-emerald-400" : "text-gray-500"
            }`}>
            <span className="text-base leading-none">{item.icon}</span>
            <span className="text-[10px] font-medium leading-none">{item.label}</span>
            {item.count !== undefined && item.count > 0 && (
              <span className={`absolute top-1 right-1/4 text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold ${
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
