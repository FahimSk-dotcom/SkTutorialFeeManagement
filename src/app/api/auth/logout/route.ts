import { NextResponse } from "next/server";
import { removeAdminCookie } from "@/lib/auth";

export async function POST() {
  await removeAdminCookie();
  return NextResponse.json({ success: true, message: "Logged out successfully" });
}
