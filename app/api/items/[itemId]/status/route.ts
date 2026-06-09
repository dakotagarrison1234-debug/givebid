import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canAccessOrg } from "@/lib/auth";

interface Props {
  params: Promise<{ itemId: string }>;
}

export async function PATCH(request: NextRequest, { params }: Props) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { itemId } = await params;
    const { status } = await request.json();

    const validStatuses = ["DRAFT", "ACTIVE", "SOLD", "UNSOLD", "PENDING_PICKUP", "PICKED_UP"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Verify org membership
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      select: { organizationId: true },
    });
    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    if (!(await canAccessOrg(item.organizationId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await prisma.item.update({
      where: { id: itemId },
      data: { status },
    });

    return NextResponse.json({ success: true, item: updated });
  } catch (error) {
    console.error("Item status update error:", error);
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
  }
}
