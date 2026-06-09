import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const membership = await prisma.orgMember.findFirst({
    where: { clerkUserId: userId },
    include: { organization: true },
  });

  if (!membership) {
    return NextResponse.json({ orgId: null, orgName: null, role: null });
  }

  return NextResponse.json({
    orgId: membership.organization.id,
    orgName: membership.organization.name,
    orgSlug: membership.organization.slug,
    role: membership.role,
  });
}
