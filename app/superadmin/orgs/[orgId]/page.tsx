export const dynamic = "force-dynamic";
import { requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import OrgCommandCenter from "./OrgCommandCenter";

interface Props { params: Promise<{ orgId: string }> }

export default async function OrgDetailPage({ params }: Props) {
  await requireSuperAdmin();
  const { orgId } = await params;

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    include: {
      members: true,
      auctions: {
        include: {
          items: { select: { id: true, status: true, currentBid: true, title: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      items: {
        include: {
          photos: { where: { isPrimary: true }, take: 1 },
          auction: { select: { title: true, id: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!org) notFound();

  return <OrgCommandCenter org={org} />;
}
