"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { label: "General", href: "/admin/settings" },
  { label: "Payments", href: "/admin/settings/payments" },
];

export default function SettingsNav() {
  const path = usePathname();
  return (
    <div className="flex gap-1 mb-8 bg-gray-900 border border-gray-800 rounded-xl p-1 max-w-xs">
      {tabs.map((tab) => {
        const active = path === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex-1 text-center text-sm px-4 py-2 rounded-lg transition-colors ${
              active
                ? "bg-gray-800 text-white font-semibold"
                : "text-gray-400 hover:text-white hover:bg-gray-800"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
