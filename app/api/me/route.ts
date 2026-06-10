export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getUserOrg, isSuperAdmin } from "@/lib/auth";

export async function GET() {
  const [membership, superAdmin] = await Promise.all([getUserOrg(), isSuperAdmin()]);

  if (!membership) {
    return NextResponse.json({ orgId: null, orgName: null, role: null, isSuperAdmin: superAdmin });
  }

  return NextResponse.json({
    orgId: membership.organization.id,
    orgName: membership.organization.name,
    orgSlug: membership.organization.slug,
    role: membership.role,
    isSuperAdmin: superAdmin,
  });
}
