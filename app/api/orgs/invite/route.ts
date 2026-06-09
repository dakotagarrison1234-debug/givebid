import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET — list all invites + current members for the user's org
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await prisma.orgMember.findFirst({
    where: { clerkUserId: userId, role: { in: ["OWNER", "ADMIN"] } },
    include: { organization: { include: { members: true, invites: true } } },
  });
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return NextResponse.json({
    members: membership.organization.members,
    invites: membership.organization.invites.filter((i) => !i.accepted),
  });
}

// POST — send an invite to a new staff member
export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await prisma.orgMember.findFirst({
    where: { clerkUserId: userId, role: { in: ["OWNER", "ADMIN"] } },
  });
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { email, role } = await request.json();
  if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });

  const validRole = role === "ADMIN" ? "ADMIN" : "STAFF";

  // Check if email already has a pending invite for this org
  const existing = await prisma.orgInvite.findFirst({
    where: {
      organizationId: membership.organizationId,
      email: email.toLowerCase(),
      accepted: false,
      expiresAt: { gt: new Date() },
    },
  });
  if (existing) {
    return NextResponse.json({ error: "An active invite already exists for this email." }, { status: 409 });
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7-day invite

  const invite = await prisma.orgInvite.create({
    data: {
      organizationId: membership.organizationId,
      email: email.trim().toLowerCase(),
      role: validRole,
      expiresAt,
    },
  });

  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/join?token=${invite.token}`;

  return NextResponse.json({ success: true, invite, inviteUrl });
}
