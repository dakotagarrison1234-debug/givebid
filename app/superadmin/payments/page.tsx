"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Payment {
  id: string;
  clerkUserId: string;
  amount: number;
  applicationFeeAmount: number | null;
  taxAmount: number | null;
  status: string;
  failureReason: string | null;
  createdAt: string;
  item: {
    id: string;
    title: string;
    organizationId: string;
    auction: {
      title: string;
      organization: { id: string; name: string; slug: string } | null;
    } | null;
  } | null;
  user: { clerkUserId: string; name: string | null; email: string | null } | null;
}

interface OrgRevenue {
  orgId: string;
  orgName: string;
  orgSlug: string;
  totalTransacted: number;
  platformRevenue: number;
  paidCount: number;
  failedCount: number;
  pendingCount: number;
  lastActivity: string;
}

export default function SuperAdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"revenue" | "attention">("revenue");
  const [updating, setUpdating] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/superadmin/payments")
      .then((r) => r.json())
      .then((d) => { setPayments(d.payments || []); setLoading(false); });
  }, []);

  useEffect(() => { load(); }, [load]);

  const updatePayment = async (paymentId: string, status: string) => {
    setUpdating(paymentId);
    const res = await fetch("/api/superadmin/payments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentId, status }),
    });
    const d = await res.json();
    if (d.success) load();
    setUpdating(null);
  };

  // Aggregate by org
  const orgMap = new Map<string, OrgRevenue>();
  for (const p of payments) {
    const org = p.item?.auction?.organization;
    if (!org) continue;
    const key = org.id;
    if (!orgMap.has(key)) {
      orgMap.set(key, {
        orgId: org.id,
        orgName: org.name,
        orgSlug: org.slug,
        totalTransacted: 0,
        platformRevenue: 0,
        paidCount: 0,
        failedCount: 0,
        pendingCount: 0,
        lastActivity: p.createdAt,
      });
    }
    const entry = orgMap.get(key)!;
    if (p.status === "PAID") {
      entry.totalTransacted += p.amount;
      entry.platformRevenue += p.applicationFeeAmount ?? 0;
      entry.paidCount++;
    } else if (p.status === "FAILED") {
      entry.failedCount++;
    } else if (p.status === "PENDING") {
      entry.pendingCount++;
    }
    if (p.createdAt > entry.lastActivity) entry.lastActivity = p.createdAt;
  }
  const orgs = Array.from(orgMap.values()).sort((a, b) => b.platformRevenue - a.platformRevenue);

  // Platform-level stats
  const totalRevenue = payments
    .filter((p) => p.status === "PAID")
    .reduce((s, p) => s + (p.applicationFeeAmount ?? 0), 0);
  const totalTransacted = payments
    .filter((p) => p.status === "PAID")
    .reduce((s, p) => s + p.amount, 0);
  const failedPayments = payments.filter((p) => p.status === "FAILED");
  const pendingPayments = payments.filter((p) => p.status === "PENDING");
  const needsAttention = [...failedPayments, ...pendingPayments].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <>
      {/* Header */}
      <header className="border-b border-[#e5e0d5]/60 px-4 sm:px-8 py-5 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-lg font-bold">Revenue</h1>
          <p className="text-[#8c8778] text-sm mt-0.5">PurposeBid platform earnings</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView("revenue")}
            className={`text-xs px-4 py-2 rounded-xl font-semibold transition-colors ${
              view === "revenue"
                ? "bg-[#09a7ad] text-white"
                : "bg-[#f2efe8] text-[#6b6659] hover:text-[#1a1916] border border-[#d4cfc4]"
            }`}
          >
            By Organization
          </button>
          <button
            onClick={() => setView("attention")}
            className={`text-xs px-4 py-2 rounded-xl font-semibold transition-colors flex items-center gap-1.5 ${
              view === "attention"
                ? "bg-red-500 text-white"
                : "bg-[#f2efe8] text-[#6b6659] hover:text-[#1a1916] border border-[#d4cfc4]"
            }`}
          >
            Needs Attention
            {needsAttention.length > 0 && (
              <span className={`text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold ${
                view === "attention" ? "bg-white text-red-500" : "bg-red-500 text-white"
              }`}>
                {needsAttention.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Top stats — always visible */}
      <div className="px-4 sm:px-8 pt-5 pb-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-[#e5e0d5] rounded-2xl px-4 py-3.5">
          <div className="text-xs text-[#8c8778] font-medium mb-1">My Revenue</div>
          <div className="text-xl font-extrabold text-[#09a7ad]">${totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <div className="text-[10px] text-[#b0a99a] mt-0.5">platform fees collected</div>
        </div>
        <div className="bg-white border border-[#e5e0d5] rounded-2xl px-4 py-3.5">
          <div className="text-xs text-[#8c8778] font-medium mb-1">Total Transacted</div>
          <div className="text-xl font-extrabold text-[#1a1916]">${totalTransacted.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <div className="text-[10px] text-[#b0a99a] mt-0.5">across all orgs</div>
        </div>
        <div className={`bg-white border rounded-2xl px-4 py-3.5 ${failedPayments.length > 0 ? "border-red-500/25" : "border-[#e5e0d5]"}`}>
          <div className="text-xs text-[#8c8778] font-medium mb-1">Failed</div>
          <div className={`text-xl font-extrabold ${failedPayments.length > 0 ? "text-red-500" : "text-[#1a1916]"}`}>
            {failedPayments.length}
          </div>
          <div className="text-[10px] text-[#b0a99a] mt-0.5">payments failed</div>
        </div>
        <div className={`bg-white border rounded-2xl px-4 py-3.5 ${pendingPayments.length > 0 ? "border-amber-400/30" : "border-[#e5e0d5]"}`}>
          <div className="text-xs text-[#8c8778] font-medium mb-1">Pending</div>
          <div className={`text-xl font-extrabold ${pendingPayments.length > 0 ? "text-amber-500" : "text-[#1a1916]"}`}>
            {pendingPayments.length}
          </div>
          <div className="text-[10px] text-[#b0a99a] mt-0.5">awaiting charge</div>
        </div>
      </div>

      <div className="px-4 sm:px-8 py-4 max-w-5xl">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 rounded-full border-2 border-[#09a7ad]/30 border-t-[#09a7ad] animate-spin" />
          </div>
        ) : view === "revenue" ? (
          /* ── BY ORG VIEW ── */
          orgs.length === 0 ? (
            <div className="bg-white border border-[#e5e0d5] rounded-2xl p-8 text-center text-[#8c8778] text-sm">
              No revenue yet.
            </div>
          ) : (
            <div className="space-y-2">
              {/* Column headers */}
              <div className="hidden sm:grid grid-cols-[1fr_120px_120px_80px_80px_80px] gap-4 px-4 text-xs text-[#8c8778] font-semibold uppercase tracking-wide pb-1">
                <span>Organization</span>
                <span className="text-right">Transacted</span>
                <span className="text-right text-[#09a7ad]">My Cut</span>
                <span className="text-right">Paid</span>
                <span className="text-right text-red-400">Failed</span>
                <span className="text-right text-amber-400">Pending</span>
              </div>

              {orgs.map((org) => (
                <div
                  key={org.orgId}
                  className={`bg-white border rounded-xl px-4 sm:px-5 py-3.5 ${
                    org.failedCount > 0 ? "border-red-500/20" : "border-[#e5e0d5]"
                  }`}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px_120px_80px_80px_80px] gap-3 sm:gap-4 items-center">
                    {/* Org name */}
                    <div>
                      <Link
                        href={`/superadmin/orgs/${org.orgId}`}
                        className="font-semibold text-sm hover:text-[#09a7ad] transition-colors"
                      >
                        {org.orgName}
                      </Link>
                      <div className="text-xs text-[#8c8778] mt-0.5">
                        {org.paidCount} paid payment{org.paidCount !== 1 ? "s" : ""} · last {new Date(org.lastActivity).toLocaleDateString()}
                      </div>
                    </div>

                    {/* Transacted */}
                    <div className="sm:text-right">
                      <span className="text-sm font-medium text-[#4a4640]">
                        ${org.totalTransacted.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <span className="sm:hidden text-[#8c8778] text-xs"> transacted</span>
                    </div>

                    {/* My cut */}
                    <div className="sm:text-right">
                      <span className="text-sm font-bold text-[#09a7ad]">
                        ${org.platformRevenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <span className="sm:hidden text-[#8c8778] text-xs"> my cut</span>
                    </div>

                    {/* Paid */}
                    <div className="sm:text-right text-sm text-[#6b6659]">{org.paidCount}</div>

                    {/* Failed */}
                    <div className="sm:text-right">
                      {org.failedCount > 0 ? (
                        <span className="text-sm font-bold text-red-500">{org.failedCount}</span>
                      ) : (
                        <span className="text-sm text-[#c0b9aa]">—</span>
                      )}
                    </div>

                    {/* Pending */}
                    <div className="sm:text-right">
                      {org.pendingCount > 0 ? (
                        <span className="text-sm font-bold text-amber-500">{org.pendingCount}</span>
                      ) : (
                        <span className="text-sm text-[#c0b9aa]">—</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* ── NEEDS ATTENTION VIEW ── */
          needsAttention.length === 0 ? (
            <div className="bg-white border border-[#e5e0d5] rounded-2xl p-8 text-center text-[#8c8778] text-sm">
              No failed or pending payments.
            </div>
          ) : (
            <div className="space-y-2">
              {needsAttention.map((p) => {
                const org = p.item?.auction?.organization;
                return (
                  <div
                    key={p.id}
                    className={`bg-white border rounded-xl px-4 sm:px-5 py-3.5 ${
                      p.status === "FAILED" ? "border-red-500/25" : "border-amber-400/25"
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
                      {/* Org + bidder */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {org && (
                            <Link
                              href={`/superadmin/orgs/${org.id}`}
                              className="font-semibold text-sm hover:text-[#09a7ad] transition-colors"
                            >
                              {org.name}
                            </Link>
                          )}
                          {p.item?.auction && (
                            <span className="text-xs text-[#8c8778]">· {p.item.auction.title}</span>
                          )}
                        </div>
                        <div className="text-xs text-[#8c8778] mt-0.5">
                          {p.user?.name || "Unknown bidder"}
                          {p.user?.email && ` · ${p.user.email}`}
                        </div>
                        {p.failureReason && (
                          <div className="text-red-500 text-xs mt-1">{p.failureReason}</div>
                        )}
                      </div>

                      {/* Amount */}
                      <div className="text-right shrink-0">
                        <div className="font-bold text-sm">${p.amount.toFixed(2)}</div>
                        {p.applicationFeeAmount && (
                          <div className="text-[#09a7ad] text-xs">${p.applicationFeeAmount.toFixed(2)} my cut</div>
                        )}
                      </div>

                      {/* Status badge */}
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold shrink-0 ${
                        p.status === "FAILED"
                          ? "bg-red-500/15 text-red-600"
                          : "bg-amber-400/15 text-amber-600"
                      }`}>
                        {p.status}
                      </span>

                      {/* Status override */}
                      <select
                        value={p.status}
                        disabled={updating === p.id}
                        onChange={(e) => updatePayment(p.id, e.target.value)}
                        className="bg-[#f2efe8] border border-[#d4cfc4] rounded-lg px-2 py-1.5 text-xs text-[#1a1916] focus:outline-none disabled:opacity-50 shrink-0"
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="PAID">PAID</option>
                        <option value="FAILED">FAILED</option>
                        <option value="REFUNDED">REFUNDED</option>
                      </select>

                      {/* Date */}
                      <div className="text-[#8c8778] text-xs shrink-0 hidden sm:block">
                        {new Date(p.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>
    </>
  );
}
