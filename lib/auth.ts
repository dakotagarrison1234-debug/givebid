import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function getUserOrg() {
  const { userId } = await auth();
  if (!userId) return null;

  const membership = await prisma.orgMember.findFirst({
    where: { clerkUserId: userId },
    include: { organization: true },
  });

  return membership;
}

export async function requireUserOrg() {
  const membership = await getUserOrg();
  if (!membership) redirect("/apply");
  return membership;
}

export async function requireAuth() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  return userId;
}

// ─── Super Admin ────────────────────────────────────────────────────────────

function getSuperAdminIds(): string[] {
  return (process.env.SUPER_ADMIN_IDS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function isSuperAdmin(): Promise<boolean> {
  const { userId } = await auth();
  if (!userId) return false;
  return getSuperAdminIds().includes(userId);
}

export async function requireSuperAdmin() {
  const ok = await isSuperAdmin();
  if (!ok) redirect("/");
}

// Returns the current user's Clerk ID — useful for setting up SUPER_ADMIN_IDS
export async function getCurrentUserId(): Promise<string | null> {
  const { userId } = await auth();
  return userId;
}
