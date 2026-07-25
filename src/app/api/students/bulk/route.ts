import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getAuthenticatedAdmin } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action, studentIds } = await req.json();

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json({ error: "No students selected" }, { status: 400 });
    }

    const db = await getDb();

    if (action === "delete") {
      await db.collection("students").deleteMany({ studentId: { $in: studentIds } });
      await db.collection("payments").deleteMany({ studentId: { $in: studentIds } });
      return NextResponse.json({ success: true, message: "Selected students deleted" });
    } else if (action === "activate") {
      await db
        .collection("students")
        .updateMany(
          { studentId: { $in: studentIds } },
          { $set: { status: "Active", updatedAt: new Date() } }
        );
      return NextResponse.json({ success: true, message: "Selected students activated" });
    } else if (action === "deactivate") {
      await db
        .collection("students")
        .updateMany(
          { studentId: { $in: studentIds } },
          { $set: { status: "Inactive", updatedAt: new Date() } }
        );
      return NextResponse.json({ success: true, message: "Selected students deactivated" });
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("POST /api/students/bulk error:", error);
    return NextResponse.json({ error: "Bulk operation failed" }, { status: 500 });
  }
}
