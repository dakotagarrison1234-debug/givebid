import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { prisma } from "@/lib/prisma";
import { canAccessOrg } from "@/lib/auth";

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
});

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { fileName, fileType, orgId } = await request.json();
  if (!fileName || !fileType || !orgId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (!(await canAccessOrg(orgId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const ext = fileName.split(".").pop() || "png";
  const key = `orgs/${orgId}/logo-${Date.now()}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: process.env.CLOUDFLARE_R2_BUCKET,
    Key: key,
    ContentType: fileType,
  });

  const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
  const publicUrl = `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${key}`;

  return NextResponse.json({ signedUrl, publicUrl });
}
