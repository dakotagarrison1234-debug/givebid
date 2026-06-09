import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface Props { params: Promise<{ orgId: string }> }

export async function GET(_req: NextRequest, { params }: Props) {
  await requireSuperAdmin();
  const { orgId } = await params;

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    include: {
      members: true,
      auctions: {
        include: { items: { select: { id: true, status: true, currentBid: true } } },
        orderBy: { createdAt: "desc" },
      },
      items: {
        include: { photos: { where: { isPrimary: true }, take: 1 }, auction: { select: { title: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!org) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ org });
}

export async function PATCH(request: NextRequest, { params }: Props) {
  await requireSuperAdmin();
  const { orgId } = await params;
  const body = await request.json();

  const { name, description, isActive } = body;

  let slug: string | undefined;
  if (name) {
    const raw = name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const existing = await prisma.organization.findFirst({ where: { slug: raw, NOT: { id: orgId } } });
    slug = existing ? `${raw}-${Date.now()}` : raw;
  }

  const org = await prisma.organization.update({
    where: { id: orgId },
    data: {
      ...(name && { name: name.trim(), slug }),
      ...(description !== undefined && { description }),
      ...(isActive !== undefined && { isActive }),
    },
  });

  return NextResponse.json({ success: true, org });
}

export async function DELETE(_req: NextRequest, { params }: Props) {
  await requireSuperAdmin();
  const { orgId } = await params;

  // Delete in dependency order
  await prisma.$transaction([
    prisma.orgInvite.deleteMany({ where: { organizationId: orgId } }),
    prisma.orgMember.deleteMany({ where: { organizationId: orgId } }),
    prisma.itemPhoto.deleteMany({ where: { item: { organizationId: orgId } } }),
    prisma.bid.deleteMany({ where: { item: { organizationId: orgId } } }),
    prisma.payment.deleteMany({ where: { item: { organizationId: orgId } } }),
    prisma.item.deleteMany({ where: { organizationId: orgId } }),
    prisma.auction.deleteMany({ where: { organizationId: orgId } }),
    prisma.organization.delete({ where: { id: orgId } }),
  ]);

  return NextResponse.json({ success: true });
}
