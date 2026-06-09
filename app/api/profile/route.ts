import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { phone, email, name } = await request.json();
    const profile = await prisma.bidderProfile.upsert({
      where: { clerkUserId: userId },
      update: { phone, email, name },
      create: { clerkUserId: userId, phone, email, name },
    });
    return NextResponse.json({ success: true, profile });
  } catch (error) {
    console.error("Profile error:", error);
    return NextResponse.json({ error: "Failed to save profile" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const profile = await prisma.bidderProfile.findUnique({
      where: { clerkUserId: userId },
    });
    return NextResponse.json({ profile });
  } catch (error) {
    console.error("Profile error:", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}