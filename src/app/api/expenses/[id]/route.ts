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
      return NextResponse.json({ error: "Invalid expense ID" }, { status: 400 });
    }

    const db = await getDb();
    const updateDoc = {
      $set: {
        name: body.name,
        category: body.category,
        amount: Number(body.amount),
        date: body.date,
        notes: body.notes || "",
        updatedAt: new Date(),
      },
    };

    const result = await db
      .collection("expenses")
      .updateOne({ _id: new ObjectId(id) }, updateDoc);

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Expense updated" });
  } catch (error: any) {
    console.error("PUT /api/expenses/[id] error:", error);
    return NextResponse.json({ error: "Failed to update expense" }, { status: 500 });
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
      return NextResponse.json({ error: "Invalid expense ID" }, { status: 400 });
    }

    const db = await getDb();
    const result = await db.collection("expenses").deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Expense deleted" });
  } catch (error: any) {
    console.error("DELETE /api/expenses/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete expense" }, { status: 500 });
  }
}
