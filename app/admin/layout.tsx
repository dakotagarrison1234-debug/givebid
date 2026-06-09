import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { prisma } from "@/lib/prisma";
import { isSuperAdmin } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const membership = await prisma.orgMember.findFirst({
    where: { clerkUserId: userId },
    include: { organization: true },
  });

  if (!membership) redirect("/apply");

  const org = membership.organization;
  const isOwnerOrAdmin = membership.role === "OWNER" || membership.role === "ADMIN";
  const superAdmin = await isSuperAdmin();

  const navItems = [
    { label: "Overview", href: "/admin/dashboard", icon: "▦" },
    { label: "Items", href: "/admin/items", icon: "☰" },
    { label: "Auctions", href: "/admin/auctions", icon: "◷" },
    { label: "Winners", href: "/admin/winners", icon: "✓" },
    ...(isOwnerOrAdmin ? [{ label: "Team", href: "/admin/staff", icon: "👥" }] : []),
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white flex">
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col shrink-0">
        <div className="px-6 py-5 border-b border-gray-800">
          <Link href="/admin/dashboard">
            <span className="text-emerald-400 font-bold text-xl">GiveBid</span>
          </Link>
          <p className="text-gray-500 text-xs mt-1 truncate">{org.name}</p>
          <span className="text-xs text-gray-600 capitalize">{membership.role.toLowerCase()}</span>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navItems.map((item) => (
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

        {superAdmin && (
          <div className="px-4 pb-2">
            <Link
              href="/superadmin"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-orange-400 hover:text-orange-300 hover:bg-orange-500/10 transition-colors text-sm"
            >
              <span>⚡</span>
              <span>Super Admin</span>
            </Link>
          </div>
        )}

        <div className="px-4 py-4 border-t border-gray-800 flex items-center gap-3">
          <UserButton />
          <div className="text-sm text-gray-500 truncate">Account</div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {children}
      </div>
    </div>
  );
}
