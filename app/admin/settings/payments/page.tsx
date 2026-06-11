"use client";
import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";

interface OrgStripeStatus {
  id: string;
  stripeAccountId: string | null;
  stripeChargesEnabled: boolean;
  stripePayoutsEnabled: boolean;
  stripeDetailsSubmitted: boolean;
  platformFeePercent: number;
}

function StatusDot({ enabled }: { enabled: boolean }) {
  return (
    <span
      className={`inline-block w-2.5 h-2.5 rounded-full mr-2 ${
        enabled ? "bg-emerald-400" : "bg-gray-600"
      }`}
    />
  );
}

function PaymentsContent() {
  const [org, setOrg] = useState<OrgStripeStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const searchParams = useSearchParams();

  const fetchOrg = useCallback(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.org) setOrg(d.org);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchOrg();

    const onboarded = searchParams.get("onboarded");
    const refresh = searchParams.get("refresh");

    if (onboarded === "1") {
      setMsg({
        text: "Setup submitted — your account is being reviewed by Stripe. This page will update automatically once approved.",
        ok: true,
      });
    } else if (refresh === "1") {
      setMsg({
        text: "Your onboarding link expired. Click below to get a new one.",
        ok: false,
      });
    }
  }, [fetchOrg, searchParams]);

  const handleConnect = async () => {
    if (!org) return;
    setConnecting(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/orgs/${org.id}/stripe/onboard`, { method: "POST" });
      const d = await res.json();
      if (d.url) {
        window.location.href = d.url;
      } else {
        setMsg({ text: d.error || "Failed to start onboarding.", ok: false });
        setConnecting(false);
      }
    } catch {
      setMsg({ text: "Something went wrong. Try again.", ok: false });
      setConnecting(false);
    }
  };

  const handleDashboard = async () => {
    if (!org) return;
    setConnecting(true);
    try {
      const res = await fetch(`/api/orgs/${org.id}/stripe/dashboard-link`, { method: "POST" });
      const d = await res.json();
      if (d.url) {
        window.open(d.url, "_blank");
      } else {
        setMsg({ text: d.error || "Could not open dashboard.", ok: false });
      }
    } catch {
      setMsg({ text: "Something went wrong. Try again.", ok: false });
    } finally {
      setConnecting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading…</p>
      </div>
    );
  }

  if (!org) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Could not load payment settings.</p>
      </div>
    );
  }

  const isLive = org.stripeChargesEnabled;
  const hasAccount = !!org.stripeAccountId;
  const isPending = hasAccount && !isLive;

  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-bold mb-6">Payments</h1>

      {/* Connection status card */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-5">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Stripe Connection
        </h2>

        {isLive ? (
          /* ── LIVE ── */
          <div className="space-y-4">
            <div className="flex items-center">
              <StatusDot enabled={true} />
              <span className="text-white font-semibold">Connected and live</span>
            </div>
            <div className="text-sm text-gray-400 space-y-1">
              <div className="flex items-center">
                <StatusDot enabled={org.stripeChargesEnabled} />
                Accepting charges
              </div>
              <div className="flex items-center">
                <StatusDot enabled={org.stripePayoutsEnabled} />
                Payouts enabled
              </div>
            </div>
            <p className="text-xs text-gray-600">
              Platform fee: {org.platformFeePercent}% per transaction
            </p>
            <button
              onClick={handleDashboard}
              disabled={connecting}
              className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white text-sm px-5 py-2.5 rounded-xl disabled:opacity-50 transition-colors"
            >
              {connecting ? "Opening…" : "Manage payout details"}
            </button>
          </div>
        ) : isPending ? (
          /* ── PENDING / INCOMPLETE ── */
          <div className="space-y-4">
            <div className="flex items-center">
              <StatusDot enabled={false} />
              <span className="text-yellow-400 font-semibold">Onboarding incomplete</span>
            </div>
            <p className="text-sm text-gray-400">
              You started connecting Stripe but haven&apos;t finished. Resume to start accepting
              payments.
            </p>
            <p className="text-xs text-gray-600">
              Platform fee: {org.platformFeePercent}% per transaction
            </p>
            <button
              onClick={handleConnect}
              disabled={connecting}
              className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors"
            >
              {connecting ? "Loading…" : "Resume Stripe setup"}
            </button>
          </div>
        ) : (
          /* ── NOT CONNECTED ── */
          <div className="space-y-4">
            <div className="flex items-center">
              <StatusDot enabled={false} />
              <span className="text-gray-300 font-semibold">Not connected</span>
            </div>
            <p className="text-sm text-gray-400">
              Connect a Stripe account to accept payments from bidders. GiveBid uses Stripe Connect
              — your organization is the merchant of record and receives funds directly.
            </p>
            <p className="text-xs text-gray-600">
              Platform fee: {org.platformFeePercent}% per transaction
            </p>
            <button
              onClick={handleConnect}
              disabled={connecting}
              className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors"
            >
              {connecting ? "Loading…" : "Connect Stripe"}
            </button>
          </div>
        )}
      </div>

      {msg && (
        <p
          className={`text-sm px-4 py-3 rounded-xl mb-4 ${
            msg.ok
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
          }`}
        >
          {msg.text}
        </p>
      )}

      {/* Info block */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          How it works
        </h2>
        <ul className="text-sm text-gray-400 space-y-2">
          <li>Bidders pay your organization directly through Stripe.</li>
          <li>
            GiveBid collects a {org.platformFeePercent}% platform fee automatically on each
            transaction.
          </li>
          <li>Funds are deposited into your bank account on a rolling daily schedule.</li>
          <li>
            You&apos;re the merchant of record — your organization name appears on bidder receipts.
          </li>
        </ul>
      </div>
    </div>
  );
}

export default function PaymentsSettingsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><p className="text-gray-500">Loading…</p></div>}>
      <PaymentsContent />
    </Suspense>
  );
}
