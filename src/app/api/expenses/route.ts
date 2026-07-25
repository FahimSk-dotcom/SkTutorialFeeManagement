import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { expenseSchema } from "@/schemas";
import { ObjectId } from "mongodb";

export async function GET(req: Request) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") || "All";
    const search = searchParams.get("search") || "";

    const db = await getDb();
    const query: Record<string, any> = {};

    if (category !== "All") {
      query.category = category;
    }
    if (search.trim()) {
      query.name = new RegExp(search.trim(), "i");
    }

    const expensesRaw = await db
      .collection("expenses")
      .find(query)
      .sort({ date: -1, createdAt: -1 })
      .toArray();

    const expenses = expensesRaw.map((e: any) => ({
      _id: e._id.toString(),
      name: e.name,
      category: e.category,
      amount: e.amount,
      date: e.date,
      notes: e.notes || "",
      createdAt: e.createdAt?.toISOString(),
    }));

    return NextResponse.json({ expenses });
  } catch (error: any) {
    console.error("GET /api/expenses error:", error);
    return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = expenseSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const db = await getDb();
    const newExpense = {
      ...parsed.data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("expenses").insertOne(newExpense);

    return NextResponse.json({
      success: true,
      expense: { _id: result.insertedId.toString(), ...newExpense },
    });
  } catch (error: any) {
    console.error("POST /api/expenses error:", error);
    return NextResponse.json({ error: "Failed to add expense" }, { status: 500 });
  }
}
