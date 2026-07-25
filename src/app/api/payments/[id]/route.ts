import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { getAuthenticatedAdmin } from "@/lib/auth";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid payment ID" }, { status: 400 });
    }

    const db = await getDb();
    const updateFields: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (body.paymentDate) updateFields.paymentDate = body.paymentDate;
    if (body.amount) updateFields.amount = Number(body.amount);
    if (body.mode) updateFields.mode = body.mode;
    if (body.remarks !== undefined) updateFields.remarks = body.remarks;

    const result = await db
      .collection("payments")
      .updateOne({ _id: new ObjectId(id) }, { $set: updateFields });

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Payment record not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Payment record updated" });
  } catch (error: any) {
    console.error("PUT /api/payments/[id] error:", error);
    return NextResponse.json({ error: "Failed to update payment record" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid payment ID" }, { status: 400 });
    }

    const db = await getDb();
    const result = await db.collection("payments").deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Payment record not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Payment record deleted" });
  } catch (error: any) {
    console.error("DELETE /api/payments/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete payment record" }, { status: 500 });
  }
}
