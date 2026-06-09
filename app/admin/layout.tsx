import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { prisma } from "@/lib/prisma";
import { isSuperAdmin } from "@/lib/auth";
import { cookies } from "next/headers";
import ActAsExitButton from "./ActAsExitButton";
import OrgSwitcher from "./OrgSwitcher";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const superAdmin = await isSuperAdmin();

  // Check for act-as cookie (super admin only)
  const cookieStore = await cookies();
  const actAsOrgId = superAdmin ? cookieStore.get("sa_org_id")?.value : undefined;

  type MembershipWithOrg = NonNullable<Awaited<ReturnType<typeof prisma.orgMember.findFirst<{ include: { organization: true } }>>>>;

  let membership = await prisma.orgMember.findFirst({
    where: { clerkUserId: userId },
    include: { organization: true },
  }) as MembershipWithOrg | null;

  let actingAsOrg = null;

  if (superAdmin && actAsOrgId) {
    actingAsOrg = await prisma.organization.findUnique({ where: { id: actAsOrgId } });
    if (actingAsOrg) {
      membership = {
        id: membership?.id ?? "superadmin_synthetic",
        clerkUserId: userId,
        organizationId: actingAsOrg.id,
        role: "OWNER",
        createdAt: membership?.createdAt ?? new Date(),
        organization: actingAsOrg,
      } as MembershipWithOrg;
    }
  }

  if (!membership) {
    if (superAdmin) redirect("/superadmin");
    redirect("/apply");
  }

  const org = membership.organization;
  const isOwnerOrAdmin = membership.role === "OWNER" || membership.role === "ADMIN";

  // Load all orgs for switcher (super admin only)
  const allOrgs = superAdmin
    ? await prisma.organization.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } })
    : [];

  const navItems = [
    { label: "Overview", href: "/admin/dashboard", icon: "▦" },
    { label: "Items", href: "/admin/items", icon: "☰" },
    { label: "Auctions", href: "/admin/auctions", icon: "◷" },
    { label: "Winners", href: "/admin/winners", icon: "✓" },
    ...(isOwnerOrAdmin ? [{ label: "Team", href: "/admin/staff", icon: "👥" }] : []),
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Act-as banner */}
      {actingAsOrg && (
        <div className="bg-orange-500/20 border-b border-orange-500/40 px-6 py-2 flex items-center justify-between text-sm">
          <span className="text-orange-300">
            ⚡ Acting as <span className="font-semibold text-orange-200">{actingAsOrg.name}</span> — you have full owner access
          </span>
          <ActAsExitButton />
        </div>
      )}

      <div className="flex flex-1 min-h-0">
        <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col shrink-0">
          <div className="px-6 py-5 border-b border-gray-800">
            <Link href="/admin/dashboard">
              <span className="text-emerald-400 font-bold text-xl">GiveBid</span>
            </Link>
            <p className="text-gray-500 text-xs mt-1 truncate">{org.name}</p>
            <span className="text-xs text-gray-600 capitalize">{membership.role.toLowerCase()}</span>
          </div>

          {/* Org switcher for super admin */}
          {superAdmin && allOrgs.length > 1 && (
            <div className="px-4 pt-4">
              <OrgSwitcher orgs={allOrgs} currentOrgId={org.id} />
            </div>
          )}

          <nav className="flex-1 px-4 py-4 space-y-1">
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
            <div className="pt-2 border-t border-gray-800 mt-2">
              <Link
                href="/dashboard"
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
              >
                <span>↑</span>
                <span>My Bids</span>
              </Link>
            </div>
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
    </div>
  );
}
