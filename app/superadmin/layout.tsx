import { requireSuperAdmin } from "@/lib/auth";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  await requireSuperAdmin();

  return (
    <div className="min-h-screen bg-gray-950 text-white flex">
      <aside className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col shrink-0">
        <div className="px-6 py-5 border-b border-gray-800">
          <Link href="/" className="text-emerald-400 font-bold text-xl">GiveBid</Link>
          <p className="text-xs text-orange-400 mt-1 font-semibold">SUPER ADMIN</p>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1">
          {[
            { label: "Applications", href: "/superadmin" },
            { label: "Organizations", href: "/superadmin/orgs" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-gray-800 flex items-center gap-3">
          <UserButton />
          <div className="text-sm text-gray-500 truncate">Account</div>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">{children}</div>
    </div>
  );
}
