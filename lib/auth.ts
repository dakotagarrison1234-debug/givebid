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
  if (!membership) redirect("/onboarding");
  return membership;
}

export async function requireAuth() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  return userId;
}
