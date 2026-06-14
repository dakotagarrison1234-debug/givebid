"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface PaymentItem { id: string; title: string; auction: { title: string; slug: string; organization: { id: string; name: string; slug: string } } | null; }
interface Payment {
  id: string;
  clerkUserId: string;
  amount: number;
  applicationFeeAmount: number | null;
  taxAmount: number | null;
  status: string;
  stripePaymentIntentId: string | null;
  failureReason: string | null;
  createdAt: string;
  item: PaymentItem | null;
  user: { clerkUserId: string; name: string | null; email: string | null } | null;
}

const STATUS_COLORS: Record<string, string> = {
  PAID: "bg-[#09a7ad]/20 text-[#09a7ad]",
  FAILED: "bg-red-500/20 text-red-600",
  PENDING: "bg-yellow-500/20 text-amber-600",
  REFUNDED: "bg-[#e8e4dc] text-[#6b6659]",
};

export default function SuperAdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/superadmin/payments?status=${statusFilter}`)
      .then((r) => r.json())
      .then((d) => { setPayments(d.payments || []); setLoading(false); });
  }, [statusFilter]);

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

  const totals = {
    paid: payments.filter((p) => p.status === "PAID").reduce((s, p) => s + p.amount, 0),
    failed: payments.filter((p) => p.status === "FAILED").length,
    pending: payments.filter((p) => p.status === "PENDING").length,
  };

  return (
    <>
      <header className="border-b border-[#e5e0d5]/60 px-4 sm:px-8 py-4 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-lg font-bold">Payments</h1>
          <p className="text-[#8c8778] text-sm mt-0.5">{payments.length} records · ${totals.paid.toLocaleString()} collected</p>
        </div>
        <div className="flex items-center gap-2">
          {["", "PAID", "FAILED", "PENDING", "REFUNDED"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                statusFilter === s
                  ? "bg-emerald-600 text-[#1a1916]"
                  : "bg-[#f2efe8] text-[#6b6659] hover:text-[#1a1916] border border-[#d4cfc4]"
              }`}
            >
              {s || "All"}
            </button>
          ))}
        </div>
      </header>

      {/* Summary chips */}
      <div className="px-4 sm:px-8 pt-4 flex gap-3 flex-wrap">
        <div className="bg-[#09a7ad]/10 border border-[#09a7ad]/20 rounded-xl px-4 py-2 text-sm">
          <span className="text-[#6b6659]">Collected: </span>
          <span className="text-[#09a7ad] font-bold">${totals.paid.toLocaleString()}</span>
        </div>
        {totals.failed > 0 && (
          <div className="bg-red-50 border border-red-500/20 rounded-xl px-4 py-2 text-sm">
            <span className="text-[#6b6659]">Failed charges: </span>
            <span className="text-red-600 font-bold">{totals.failed}</span>
          </div>
        )}
        {totals.pending > 0 && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-2 text-sm">
            <span className="text-[#6b6659]">Pending: </span>
            <span className="text-amber-600 font-bold">{totals.pending}</span>
          </div>
        )}
      </div>

      <div className="px-4 sm:px-8 py-4 max-w-6xl">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 rounded-full border-2 border-[#09a7ad]/30 border-t-[#09a7ad] animate-spin" />
          </div>
        ) : payments.length === 0 ? (
          <div className="bg-white border border-[#e5e0d5] rounded-2xl p-8 text-center text-[#8c8778] text-sm">
            No payments found.
          </div>
        ) : (
          <div className="space-y-2">
            {payments.map((p) => (
              <div
                key={p.id}
                className={`bg-white border rounded-xl px-4 sm:px-5 py-3.5 ${
                  p.status === "FAILED" ? "border-red-500/20" : p.status === "PAID" ? "border-[#09a7ad]/10" : "border-[#e5e0d5]"
                }`}
              >
                <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
                  {/* Item + org */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{p.item?.title || "Unknown item"}</div>
                    <div className="text-[#8c8778] text-xs mt-0.5 flex items-center gap-1.5 flex-wrap">
                      {p.item?.auction?.organization && (
                        <Link href={`/superadmin/orgs/${p.item.auction.organization.id}`} className="hover:text-[#1a1916] transition-colors">
                          {p.item.auction.organization.name}
                        </Link>
                      )}
                      {p.item?.auction && <span>· {p.item.auction.title}</span>}
                    </div>
                    {p.failureReason && <div className="text-red-600 text-xs mt-1">{p.failureReason}</div>}
                  </div>

                  {/* User */}
                  <div className="text-sm min-w-[140px] hidden sm:block">
                    {p.user ? (
                      <Link href={`/superadmin/users/${p.clerkUserId}`} className="hover:text-[#09a7ad] transition-colors">
                        <div className="font-medium text-[#1a1916] truncate">{p.user.name || <span className="italic text-[#8c8778]">No name</span>}</div>
                        <div className="text-[#8c8778] text-xs truncate">{p.user.email || "—"}</div>
                      </Link>
                    ) : (
                      <div className="text-[#8c8778] text-xs font-mono truncate">{p.clerkUserId.slice(0, 16)}…</div>
                    )}
                  </div>

                  {/* Amount */}
                  <div className="text-right shrink-0">
                    <div className="font-bold text-sm">${p.amount.toLocaleString()}</div>
                    {(p.taxAmount || p.applicationFeeAmount) && (
                      <div className="text-[#8c8778] text-xs">
                        {p.taxAmount ? `+$${p.taxAmount} tax` : ""}
                        {p.applicationFeeAmount ? ` · $${p.applicationFeeAmount} fee` : ""}
                      </div>
                    )}
                  </div>

                  {/* Status badge */}
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${STATUS_COLORS[p.status] || "bg-[#e8e4dc] text-[#6b6659]"}`}>
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
            ))}
          </div>
        )}
      </div>
    </>
  );
}
