"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface Org { id: string; name: string }

export default function OrgSwitcher({ orgs, currentOrgId }: { orgs: Org[]; currentOrgId: string }) {
  const router = useRouter();
  const [switching, setSwitching] = useState(false);

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const orgId = e.target.value;
    if (orgId === currentOrgId) return;
    setSwitching(true);
    await fetch("/api/superadmin/act-as", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orgId }),
    });
    router.push("/admin/dashboard");
    router.refresh();
    setSwitching(false);
  };

  return (
    <div className="mb-2">
      <label className="text-xs text-orange-400 uppercase tracking-wider mb-1 block">⚡ Viewing Org</label>
      <select
        value={currentOrgId}
        onChange={handleChange}
        disabled={switching}
        className="w-full bg-gray-800 border border-orange-500/30 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-orange-500 disabled:opacity-50"
      >
        {orgs.map((org) => (
          <option key={org.id} value={org.id}>{org.name}</option>
        ))}
      </select>
    </div>
  );
}
