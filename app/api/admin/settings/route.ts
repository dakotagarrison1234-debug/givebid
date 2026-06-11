import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canAccessOrg, getUserOrg } from "@/lib/auth";

// GET /api/admin/settings — return current org details (respects act-as cookie)
export async function GET() {
  const membership = await getUserOrg();
  if (!membership) return NextResponse.json({ error: "No organization found" }, { status: 404 });

  const o = membership.organization;
  return NextResponse.json({
    org: {
      ...o,
      platformFeePercent: Number(o.platformFeePercent),
    },
  });
}

// PATCH /api/admin/settings — update org name, description, logoUrl
export async function PATCH(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { name, description, logoUrl, orgId } = body;

  if (!orgId) return NextResponse.json({ error: "orgId required" }, { status: 400 });

  if (!(await canAccessOrg(orgId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updated = await prisma.organization.update({
    where: { id: orgId },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(description !== undefined && { description: description.trim() || null }),
      ...(logoUrl !== undefined && { logoUrl }),
    },
  });

  return NextResponse.json({ success: true, org: updated });
}
