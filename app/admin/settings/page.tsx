"use client";
import { useState, useEffect, useRef } from "react";
import OrgLogo from "@/app/components/OrgLogo";

interface Org {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
}

export default function AdminSettingsPage() {
  const [org, setOrg] = useState<Org | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then(r => r.json())
      .then(d => {
        if (d.org) {
          setOrg(d.org);
          setName(d.org.name);
          setDescription(d.org.description || "");
          setLogoUrl(d.org.logoUrl || null);
        }
      });
  }, []);

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !org) return;

    setUploading(true);
    setMsg(null);
    try {
      // Get presigned URL
      const res = await fetch("/api/upload/org-logo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, fileType: file.type, orgId: org.id }),
      });
      const { signedUrl, publicUrl } = await res.json();

      // Upload to R2
      await fetch(signedUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });

      // Save to DB immediately
      await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId: org.id, logoUrl: publicUrl }),
      });

      setLogoUrl(publicUrl);
      setOrg(o => o ? { ...o, logoUrl: publicUrl } : o);
      setMsg({ text: "Logo updated!", ok: true });
    } catch {
      setMsg({ text: "Logo upload failed. Try again.", ok: false });
    } finally {
      setUploading(false);
    }
  };

  const removeLogo = async () => {
    if (!org) return;
    setSaving(true);
    await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orgId: org.id, logoUrl: null }),
    });
    setLogoUrl(null);
    setOrg(o => o ? { ...o, logoUrl: null } : o);
    setSaving(false);
    setMsg({ text: "Logo removed.", ok: true });
  };

  const saveDetails = async () => {
    if (!org || !name.trim()) return;
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId: org.id, name, description }),
      });
      const d = await res.json();
      if (d.success) {
        setOrg(o => o ? { ...o, name: d.org.name, description: d.org.description } : o);
        setMsg({ text: "Settings saved.", ok: true });
      } else {
        setMsg({ text: d.error || "Failed to save.", ok: false });
      }
    } catch {
      setMsg({ text: "Something went wrong.", ok: false });
    } finally {
      setSaving(false);
    }
  };

  if (!org) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading…</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-bold mb-6">Organization Settings</h1>

      {/* Logo section */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-5">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Logo</h2>
        <div className="flex items-center gap-5">
          <OrgLogo name={name} logoUrl={logoUrl} size="xl" />
          <div className="space-y-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={handleLogoChange}
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="block bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white text-sm px-4 py-2 rounded-xl disabled:opacity-50 transition-colors"
            >
              {uploading ? "Uploading…" : logoUrl ? "Change Logo" : "Upload Logo"}
            </button>
            {logoUrl && (
              <button
                onClick={removeLogo}
                disabled={saving}
                className="block text-red-400 hover:text-red-300 text-sm px-4 py-2 rounded-xl hover:bg-red-500/10 transition-colors"
              >
                Remove Logo
              </button>
            )}
            <p className="text-xs text-gray-600 px-4">PNG, JPG or WebP · Recommended 256×256px</p>
          </div>
        </div>
      </div>

      {/* Details section */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-5">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Details</h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 mb-1.5 block">Organization Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1.5 block">Description <span className="text-gray-600">(optional)</span></label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              placeholder="Tell bidders about your organization…"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 resize-none"
            />
          </div>
        </div>

        <div className="mt-2">
          <p className="text-xs text-gray-600 mb-4">
            Public URL:{" "}
            <a
              href={`/${org.slug}`}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-emerald-500 hover:underline"
            >
              {typeof window !== "undefined" ? window.location.origin : ""}/{org.slug}
            </a>
          </p>
        </div>
      </div>

      {msg && (
        <p className={`text-sm px-4 py-3 rounded-xl mb-4 ${msg.ok ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
          {msg.text}
        </p>
      )}

      <button
        onClick={saveDetails}
        disabled={saving || !name.trim()}
        className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-xl w-full sm:w-auto"
      >
        {saving ? "Saving…" : "Save Settings"}
      </button>
    </div>
  );
}
