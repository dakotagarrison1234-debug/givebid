import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    dbUrl: process.env.DATABASE_URL?.substring(0, 40) || "NOT SET",
    nodeEnv: process.env.NODE_ENV,
  });
}