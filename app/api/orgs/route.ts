import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name } = await request.json();
    if (!name || name.trim().length < 2) {
      return NextResponse.json({ error: "Organization name is required" }, { status: 400 });
    }

    // Check if user already has an org
    const existing = await prisma.orgMember.findFirst({ where: { clerkUserId: userId } });
    if (existing) {
      return NextResponse.json({ error: "Already belongs to an organization" }, { status: 409 });
    }

    const slug = name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    // Ensure slug is unique
    const slugExists = await prisma.organization.findUnique({ where: { slug } });
    const finalSlug = slugExists ? `${slug}-${Date.now()}` : slug;

    const org = await prisma.organization.create({
      data: {
        name: name.trim(),
        slug: finalSlug,
        members: {
          create: {
            clerkUserId: userId,
            role: "OWNER",
          },
        },
      },
    });

    return NextResponse.json({ success: true, org });
  } catch (error) {
    console.error("Org creation error:", error);
    return NextResponse.json({ error: "Failed to create organization" }, { status: 500 });
  }
}
