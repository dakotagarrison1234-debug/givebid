"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import HomeHeader from "@/app/components/HomeHeader";

function RegisterForm() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect_url") || "/dashboard";

  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;
    fetch("/api/profile")
      .then(res => res.json())
      .then(data => {
        if (data.profile?.phone) {
          router.push(redirectUrl);
        } else {
          setChecking(false);
        }
      })
      .catch(() => setChecking(false));
  }, [isLoaded, router, redirectUrl]);

  const handleSubmit = async () => {
    if (!phone || phone.length < 10) {
      alert("Please enter a valid phone number");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          email: user?.primaryEmailAddress?.emailAddress,
          name: user?.fullName,
        }),
      });
      const data = await res.json();
      if (data.success) {
        router.push(redirectUrl);
      } else {
        alert("Error saving profile");
      }
    } catch {
      alert("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  if (checking) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </main>
    );
  }

  return (
    <main className="flex-1 flex items-center justify-center">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 max-w-md w-full mx-4">
        <h1 className="text-2xl font-bold mb-2">One more step</h1>
        <p className="text-gray-400 mb-6">
          Add your phone number to receive outbid alerts via SMS so you never miss a winning opportunity.
        </p>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !saving && handleSubmit()}
              placeholder="+1 (555) 000-0000"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-semibold py-3 rounded-xl"
          >
            {saving ? "Saving..." : "Save & Continue"}
          </button>
          <button
            onClick={() => router.push(redirectUrl)}
            className="w-full text-gray-500 hover:text-gray-300 text-sm py-2"
          >
            Skip for now
          </button>
        </div>
      </div>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <HomeHeader />
      <Suspense fallback={
        <main className="flex-1 flex items-center justify-center">
          <p className="text-gray-400">Loading...</p>
        </main>
      }>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
