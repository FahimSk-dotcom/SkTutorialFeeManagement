import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { calculateStudentDueStatus } from "@/lib/due-calculator";
import { Student, Payment } from "@/types";

export async function GET(req: Request) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "collection"; // collection | pending | ledger | expenses
    const studentId = searchParams.get("studentId");
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    const db = await getDb();

    if (type === "collection") {
      const query: Record<string, any> = {};
      if (month && month !== "All") query.month = parseInt(month, 10);
      if (year && year !== "All") query.year = parseInt(year, 10);

      const payments = await db.collection("payments").find(query).sort({ paymentDate: -1 }).toArray();

      const studentIds = Array.from(new Set(payments.map((p: any) => p.studentId)));
      const students = await db.collection("students").find({ studentId: { $in: studentIds } }).toArray();
      const stMap: Record<string, any> = {};
      students.forEach((s: any) => { stMap[s.studentId] = s; });

      const collectionReport = payments.map((p: any) => ({
        receiptNo: p.receiptNo,
        studentId: p.studentId,
        studentName: stMap[p.studentId]?.name || "Unknown",
        class: stMap[p.studentId]?.class || "-",
        parentMobile: stMap[p.studentId]?.parentMobile || "-",
        paymentDate: p.paymentDate,
        feeMonth: `${p.month}/${p.year}`,
        amount: p.amount,
        mode: p.mode,
      }));

      const totalCollected = collectionReport.reduce((sum: number, item: any) => sum + item.amount, 0);

      return NextResponse.json({ report: collectionReport, totalCollected });
    } else if (type === "pending") {
      const activeStudents = await db.collection("students").find({ status: "Active" }).toArray();
      const allPayments = await db.collection("payments").find({}).toArray();

      const paymentsByStudent: Record<string, Payment[]> = {};
      allPayments.forEach((p: any) => {
        if (!paymentsByStudent[p.studentId]) paymentsByStudent[p.studentId] = [];
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
        });
      });

      const pendingReport: any[] = [];
      let totalPending = 0;

      activeStudents.forEach((s: any) => {
        const student: Student = {
          _id: s._id.toString(),
          studentId: s.studentId,
          name: s.name,
          class: s.class,
          batch: s.batch,
          monthlyFee: s.monthlyFee,
          parentName: s.parentName,
          parentMobile: s.parentMobile,
          admissionDate: s.admissionDate,
          status: s.status,
        };

        const dueInfo = calculateStudentDueStatus(student, paymentsByStudent[s.studentId] || []);

        if (dueInfo.status === "OVERDUE" || dueInfo.status === "DUE_TODAY") {
          totalPending += dueInfo.totalPendingAmount;
          pendingReport.push({
            studentId: s.studentId,
            studentName: s.name,
            class: s.class,
            batch: s.batch,
            parentName: s.parentName,
            parentMobile: s.parentMobile,
            status: dueInfo.status,
            pendingMonths: dueInfo.pendingMonths.map((p) => p.monthName).join(", "),
            totalPendingAmount: dueInfo.totalPendingAmount,
          });
        }
      });

      return NextResponse.json({ report: pendingReport, totalPending });
    } else if (type === "ledger" && studentId) {
      const student = await db.collection("students").findOne({ studentId });
      if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

      const payments = await db
        .collection("payments")
        .find({ studentId })
        .sort({ year: 1, month: 1 })
        .toArray();

      return NextResponse.json({ student, payments });
    } else if (type === "expenses") {
      const expenses = await db.collection("expenses").find({}).sort({ date: -1 }).toArray();
      const totalExpense = expenses.reduce((sum: number, e: any) => sum + e.amount, 0);
      return NextResponse.json({ report: expenses, totalExpense });
    }

    return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
  } catch (error: any) {
    console.error("GET /api/reports error:", error);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
