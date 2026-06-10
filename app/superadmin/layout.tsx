import { requireSuperAdmin } from "@/lib/auth";
import Link from "next/link";
import UserMenu from "@/app/components/UserMenu";

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  await requireSuperAdmin();

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col md:flex-row">
      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex w-56 bg-gray-900/80 border-r border-gray-800/60 flex-col shrink-0">
        <div className="px-6 py-5 border-b border-gray-800/60">
          <Link href="/" className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">
            GiveBid
          </Link>
          <p className="text-xs text-orange-400 mt-1 font-bold tracking-wide">SUPER ADMIN</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {[
            { label: "Applications", href: "/superadmin" },
            { label: "Organizations", href: "/superadmin/orgs" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/60 transition-colors text-sm font-medium"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-gray-800/60">
          <UserMenu />
        </div>
      </aside>

      {/* ── Mobile top bar ── */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-gray-900/80 border-b border-gray-800/60 sticky top-0 z-40">
        <div>
          <Link href="/" className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">
            GiveBid
          </Link>
          <span className="ml-2 text-xs text-orange-400 font-bold">SUPER ADMIN</span>
        </div>
        <UserMenu />
      </header>

      {/* ── Mobile bottom nav ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-md border-t border-gray-800/60 flex z-50">
        {[
          { label: "Applications", href: "/superadmin" },
          { label: "Organizations", href: "/superadmin/orgs" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex-1 flex items-center justify-center py-3 text-xs font-semibold text-gray-500 hover:text-white transition-colors"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        {children}
      </div>
    </div>
  );
}
