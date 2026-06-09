"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ActAsExitButton() {
  const router = useRouter();
  const [exiting, setExiting] = useState(false);

  const exit = async () => {
    setExiting(true);
    await fetch("/api/superadmin/act-as", { method: "DELETE" });
    router.push("/superadmin/orgs");
    router.refresh();
  };

  return (
    <button
      onClick={exit}
      disabled={exiting}
      className="text-orange-300 hover:text-white border border-orange-500/40 hover:border-orange-400 text-xs px-3 py-1 rounded-lg transition-colors"
    >
      {exiting ? "Exiting..." : "Exit Org View"}
    </button>
  );
}
