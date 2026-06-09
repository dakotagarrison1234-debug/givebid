export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getUserOrg } from "@/lib/auth";

export async function GET() {
  const membership = await getUserOrg();

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
