"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const router = useRouter();
  const [orgName, setOrgName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!orgName || orgName.trim().length < 2) {
      setError("Please enter your organization name.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/orgs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: orgName }),
      });
      const data = await res.json();
      if (data.success) {
        router.push("/admin/dashboard");
      } else {
        setError(data.error || "Something went wrong.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 max-w-md w-full">
        <div className="text-emerald-400 font-bold text-2xl mb-2">GiveBid</div>
        <h1 className="text-2xl font-bold mb-2">Set up your organization</h1>
        <p className="text-gray-400 mb-8">
          Enter your school, church, or nonprofit name. You&apos;ll be able to create auctions and add items right after.
        </p>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Organization Name *</label>
            <input
              type="text"
              value={orgName}
              onChange={e => setOrgName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              placeholder="e.g. Owosso High School Booster Club"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={saving}
            className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-semibold py-3 rounded-xl"
          >
            {saving ? "Creating..." : "Create Organization"}
          </button>
        </div>
      </div>
    </main>
  );
}
