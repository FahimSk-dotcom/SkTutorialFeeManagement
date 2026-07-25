import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { paymentSchema } from "@/schemas";
import { ObjectId } from "mongodb";

export async function GET(req: Request) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const mode = searchParams.get("mode") || "All";
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    const db = await getDb();
    const query: Record<string, any> = {};

    if (mode !== "All") {
      query.mode = mode;
    }
    if (month && month !== "All") {
      query.month = parseInt(month, 10);
    }
    if (year && year !== "All") {
      query.year = parseInt(year, 10);
    }

    const paymentsRaw = await db
      .collection("payments")
      .find(query)
      .sort({ paymentDate: -1, createdAt: -1 })
      .toArray();

    // Fetch associated student names & classes
    const studentIds = Array.from(new Set(paymentsRaw.map((p: any) => p.studentId)));
    const studentsRaw = await db
      .collection("students")
      .find({ studentId: { $in: studentIds } })
      .toArray();

    const studentMap: Record<string, { name: string; class: string; parentMobile: string }> = {};
    studentsRaw.forEach((s: any) => {
      studentMap[s.studentId] = {
        name: s.name,
        class: s.class,
        parentMobile: s.parentMobile,
      };
    });

    const enrichedPayments = paymentsRaw.map((p: any) => {
      const st = studentMap[p.studentId] || { name: "Student", class: "-", parentMobile: "" };
      return {
        _id: p._id.toString(),
        studentId: p.studentId,
        studentName: st.name,
        class: st.class,
        parentMobile: st.parentMobile,
        paymentDate: p.paymentDate,
        month: p.month,
        year: p.year,
        amount: p.amount,
        mode: p.mode,
        receiptNo: p.receiptNo,
        collectedBy: p.collectedBy || "Prof. Fahim Sir",
        remarks: p.remarks,
        createdAt: p.createdAt?.toISOString(),
      };
    });

    // Client search filter if provided
    let finalPayments = enrichedPayments;
    if (search.trim()) {
      const reg = new RegExp(search.trim(), "i");
      finalPayments = enrichedPayments.filter(
        (p: any) =>
          reg.test(p.studentName) ||
          reg.test(p.studentId) ||
          reg.test(p.receiptNo) ||
          reg.test(p.parentMobile)
      );
    }

    return NextResponse.json({ payments: finalPayments });
  } catch (error: any) {
    console.error("GET /api/payments error:", error);
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = paymentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { studentId, paymentDate, month, year, amount, mode, remarks } = parsed.data;
    const db = await getDb();

    // Verify student exists
    const student = await db.collection("students").findOne({ studentId });
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Check duplicate payment for exact same student, month & year
    const existingPayment = await db
      .collection("payments")
      .findOne({ studentId, month, year });

    if (existingPayment) {
      return NextResponse.json(
        { error: `Payment for month ${month}/${year} has already been collected for this student.` },
        { status: 400 }
      );
    }

    // Auto-generate receipt number: REC-YYYYMM-XXXX
    const count = await db.collection("payments").countDocuments({});
    const receiptNo = `REC-${year}${String(month).padStart(2, "0")}-${String(count + 1001)}`;

    const newPayment = {
      studentId,
      paymentDate,
      month,
      year,
      amount,
      mode,
      receiptNo,
      collectedBy: "Prof. Fahim Sir",
      remarks: remarks || "",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("payments").insertOne(newPayment);

    return NextResponse.json({
      success: true,
      payment: {
        _id: result.insertedId.toString(),
        studentName: student.name,
        class: student.class,
        ...newPayment,
      },
    });
  } catch (error: any) {
    console.error("POST /api/payments error:", error);
    return NextResponse.json({ error: "Failed to collect payment" }, { status: 500 });
  }
}
