import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { studentSchema } from "@/schemas";
import { calculateStudentDueStatus } from "@/lib/due-calculator";
import { Student, Payment } from "@/types";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const db = await getDb();

    let query: Record<string, any> = {};
    if (ObjectId.isValid(id)) {
      query = { _id: new ObjectId(id) };
    } else {
      query = { studentId: id };
    }

    const s = await db.collection("students").findOne(query);
    if (!s) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const student: Student = {
      _id: s._id.toString(),
      studentId: s.studentId,
      name: s.name,
      class: s.class,
      monthlyFee: s.monthlyFee,
      parentName: s.parentName,
      parentMobile: s.parentMobile,
      alternateMobile: s.alternateMobile,
      admissionDate: s.admissionDate,
      status: s.status,
      address: s.address,
      remarks: s.remarks,
      createdAt: s.createdAt?.toISOString(),
      updatedAt: s.updatedAt?.toISOString(),
    };

    // Fetch payments for this student
    const paymentsRaw = await db
      .collection("payments")
      .find({ studentId: student.studentId })
      .sort({ year: -1, month: -1 })
      .toArray();

    const payments: Payment[] = paymentsRaw.map((p: any) => ({
      _id: p._id.toString(),
      studentId: p.studentId,
      paymentDate: p.paymentDate,
      month: p.month,
      year: p.year,
      amount: p.amount,
      mode: p.mode,
      receiptNo: p.receiptNo,
      collectedBy: p.collectedBy,
      remarks: p.remarks,
    }));

    const dueInfo = calculateStudentDueStatus(student, payments);

    // Find siblings (students with same parentMobile)
    const siblingsRaw = await db
      .collection("students")
      .find({ parentMobile: student.parentMobile, studentId: { $ne: student.studentId } })
      .toArray();

    const siblings = await Promise.all(
      siblingsRaw.map(async (sib: any) => {
        const sibPaymentsRaw = await db
          .collection("payments")
          .find({ studentId: sib.studentId })
          .toArray();

        const sibPayments: Payment[] = sibPaymentsRaw.map((p: any) => ({
          _id: p._id.toString(),
          studentId: p.studentId,
          paymentDate: p.paymentDate,
          month: p.month,
          year: p.year,
          amount: p.amount,
          mode: p.mode,
          receiptNo: p.receiptNo,
          collectedBy: p.collectedBy,
        }));

        const sibStudent: Student = {
          _id: sib._id.toString(),
          studentId: sib.studentId,
          name: sib.name,
          class: sib.class,
          monthlyFee: sib.monthlyFee,
          parentName: sib.parentName,
          parentMobile: sib.parentMobile,
          admissionDate: sib.admissionDate,
          status: sib.status,
        };

        const sibDueInfo = calculateStudentDueStatus(sibStudent, sibPayments);

        return {
          student: sibStudent,
          dueInfo: sibDueInfo,
        };
      })
    );

    return NextResponse.json({
      student,
      payments,
      dueInfo,
      siblings,
    });
  } catch (error: any) {
    console.error("GET /api/students/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch student details" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const parsed = studentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const rawClass = parsed.data.class;
    const cleanClassNumber = rawClass.replace(/^class\s+/i, "").trim();
    const formattedClass = cleanClassNumber ? `Class ${cleanClassNumber}` : rawClass;

    const db = await getDb();
    const filter = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { studentId: id };

    const updateDoc = {
      $set: {
        ...parsed.data,
        class: formattedClass,
        updatedAt: new Date(),
      },
    };

    const result = await db.collection("students").updateOne(filter, updateDoc);

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Student updated successfully" });
  } catch (error: any) {
    console.error("PUT /api/students/[id] error:", error);
    return NextResponse.json({ error: "Failed to update student" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const db = await getDb();

    const filter = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { studentId: id };
    const student = await db.collection("students").findOne(filter);

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Delete student and associated payments
    await db.collection("students").deleteOne(filter);
    await db.collection("payments").deleteMany({ studentId: student.studentId });

    return NextResponse.json({ success: true, message: "Student deleted successfully" });
  } catch (error: any) {
    console.error("DELETE /api/students/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete student" }, { status: 500 });
  }
}
