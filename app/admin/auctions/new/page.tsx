"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NewAuctionPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startAt: "",
    endAt: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (!formData.title || !formData.startAt || !formData.endAt) {
      alert("Please fill in title, start date, and end date");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/auctions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          organizationId: "cmq5ozlfd0000jpzmrienwolj",
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert("Auction created!");
        router.push("/admin/auctions");
      } else {
        alert("Error: " + data.error);
      }
    } catch {
      alert("Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex">
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="px-6 py-5 border-b border-gray-800">
          <span className="text-emerald-400 font-bold text-xl">GiveBid</span>
          <p className="text-gray-500 text-xs mt-1">Owosso Schools</p>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1">
          {[
            { label: "Overview", href: "/admin/dashboard", icon: "▦" },
            { label: "Items", href: "/admin/items", icon: "☰" },
            { label: "Auctions", href: "/admin/auctions", icon: "◷" },
            { label: "Winners", href: "/admin/winners", icon: "✓" },
            { label: "Settings", href: "/admin/settings", icon: "⚙" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="border-b border-gray-800 px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin/auctions" className="text-gray-400 hover:text-white text-sm">← Auctions</Link>
            <span className="text-gray-600">/</span>
            <h1 className="text-xl font-semibold">New Auction</h1>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white text-sm px-6 py-2 rounded-lg font-semibold"
          >
            {saving ? "Creating..." : "Create Auction"}
          </button>
        </header>

        <div className="px-8 py-6 max-w-2xl">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-6">

            <div>
              <label className="text-sm text-gray-400 mb-1 block">Auction Title *</label>
              <input
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Spring Gala 2025"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-1 block">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                placeholder="Tell bidders about this auction..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Start Date & Time *</label>
                <input
                  name="startAt"
                  value={formData.startAt}
                  onChange={handleChange}
                  type="datetime-local"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">End Date & Time *</label>
                <input
                  name="endAt"
                  value={formData.endAt}
                  onChange={handleChange}
                  type="datetime-local"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}