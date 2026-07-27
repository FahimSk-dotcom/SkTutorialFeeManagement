import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { studentSchema } from "@/schemas";
import { calculateStudentDueStatus } from "@/lib/due-calculator";
import { Student, Payment } from "@/types";

export async function GET(req: Request) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "All";
    const className = searchParams.get("class") || "All";
    const dueFilter = searchParams.get("dueFilter") || "All"; // All | PAID | DUE_TODAY | OVERDUE

    const db = await getDb();

    // Query filter for MongoDB
    const query: Record<string, any> = {};

    if (status !== "All") {
      query.status = status;
    }

    // Flexible class filter supporting both "Class Sr.Kg" and "Sr.Kg", "Class 6" and "6"
    if (className !== "All") {
      const clean = className.replace(/^class\s+/i, "").trim();
      const escaped = clean.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.class = new RegExp(`^(Class\\s+)?${escaped}$`, "i");
    }

    if (search.trim()) {
      const reg = new RegExp(search.trim(), "i");
      query.$or = [
        { name: reg },
        { parentName: reg },
        { parentMobile: reg },
        { class: reg },
        { studentId: reg },
      ];
    }

    const studentsRaw = await db.collection("students").find(query).sort({ createdAt: -1 }).toArray();

    // Fetch all payments to compute dynamic due status for each student
    const studentIds = studentsRaw.map((s: any) => s.studentId);
    const paymentsRaw = await db
      .collection("payments")
      .find({ studentId: { $in: studentIds } })
      .toArray();

    const paymentsByStudent: Record<string, Payment[]> = {};
    paymentsRaw.forEach((p: any) => {
      if (!paymentsByStudent[p.studentId]) {
        paymentsByStudent[p.studentId] = [];
      }
      paymentsByStudent[p.studentId].push({
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
      });
    });

    const enrichedStudents = studentsRaw.map((s: any) => {
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

      const studentPayments = paymentsByStudent[s.studentId] || [];
      const dueInfo = calculateStudentDueStatus(student, studentPayments);

      return {
        ...student,
        dueInfo,
      };
    });

    // Filter by dynamic due status if requested
    let finalStudents = enrichedStudents;
    if (dueFilter !== "All") {
      finalStudents = enrichedStudents.filter((s: any) => s.dueInfo.status === dueFilter);
    }

    return NextResponse.json({ students: finalStudents });
  } catch (error: any) {
    console.error("GET /api/students error:", error);
    return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = studentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    // Clean class input to avoid "Class Class 6" or duplicate prefixes
    const rawClass = parsed.data.class;
    const cleanClassNumber = rawClass.replace(/^class\s+/i, "").trim();
    const formattedClass = cleanClassNumber ? `Class ${cleanClassNumber}` : rawClass;

    const db = await getDb();

    // Auto generate studentId SK-1001, SK-1002, etc.
    const lastStudent = await db
      .collection("students")
      .find({})
      .sort({ studentId: -1 })
      .limit(1)
      .toArray();

    let nextNumber = 1001;
    if (lastStudent.length > 0 && lastStudent[0].studentId) {
      const match = lastStudent[0].studentId.match(/SK-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    const studentId = `SK-${nextNumber}`;

    const newStudent = {
      studentId,
      ...parsed.data,
      class: formattedClass,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("students").insertOne(newStudent);

    return NextResponse.json({
      success: true,
      student: { _id: result.insertedId.toString(), ...newStudent },
    });
  } catch (error: any) {
    console.error("POST /api/students error:", error);
    return NextResponse.json({ error: "Failed to create student" }, { status: 500 });
  }
}
