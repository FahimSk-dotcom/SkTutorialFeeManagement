import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { calculateStudentDueStatus } from "@/lib/due-calculator";
import { Student, Payment } from "@/types";

export async function GET() {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDb();
    const todayStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // Fetch active students
    const activeStudentsRaw = await db.collection("students").find({ status: "Active" }).toArray();
    const totalActiveStudents = activeStudentsRaw.length;

    // Fetch all students for map
    const allStudentsRaw = await db.collection("students").find({}).toArray();
    const studentMap: Record<string, any> = {};
    allStudentsRaw.forEach((s: any) => {
      studentMap[s.studentId] = s;
    });

    // Fetch all payments
    const allPaymentsRaw = await db.collection("payments").find({}).sort({ paymentDate: -1, createdAt: -1 }).toArray();

    const paymentsByStudent: Record<string, Payment[]> = {};
    let todaysCollection = 0;
    let currentMonthCollection = 0;

    const monthlyCollectionMap: Record<string, number> = {}; // "Jan", "Feb" etc

    allPaymentsRaw.forEach((p: any) => {
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
      });

      // Todays collection
      if (p.paymentDate === todayStr) {
        todaysCollection += p.amount;
      }

      // Current month collection
      if (p.year === currentYear && p.month === currentMonth) {
        currentMonthCollection += p.amount;
      }

      // Chart month map for current year
      if (p.year === currentYear) {
        const monthKey = new Date(p.year, p.month - 1, 1).toLocaleString("en-US", { month: "short" });
        monthlyCollectionMap[monthKey] = (monthlyCollectionMap[monthKey] || 0) + p.amount;
      }
    });

    // Dynamic Due Calculations for Active Students
    let totalPendingAmount = 0;
    let studentsWithDueCount = 0;
    let studentsDueTodayCount = 0;
    const dueStudentsList: any[] = [];

    activeStudentsRaw.forEach((s: any) => {
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

      const studentPayments = paymentsByStudent[s.studentId] || [];
      const dueInfo = calculateStudentDueStatus(student, studentPayments, now);

      if (dueInfo.status === "OVERDUE" || dueInfo.status === "DUE_TODAY") {
        studentsWithDueCount++;
        totalPendingAmount += dueInfo.totalPendingAmount;

        if (dueInfo.status === "DUE_TODAY") {
          studentsDueTodayCount++;
        }

        dueStudentsList.push({
          student,
          dueInfo,
        });
      }
    });

    // Fetch Expenses (Today, Month, Year)
    const allExpensesRaw = await db.collection("expenses").find({}).toArray();
    let todaysExpense = 0;
    let monthlyExpense = 0;
    let yearlyExpense = 0;

    allExpensesRaw.forEach((e: any) => {
      const eDate = new Date(e.date);
      if (e.date === todayStr) {
        todaysExpense += e.amount;
      }
      if (eDate.getFullYear() === currentYear && eDate.getMonth() + 1 === currentMonth) {
        monthlyExpense += e.amount;
      }
      if (eDate.getFullYear() === currentYear) {
        yearlyExpense += e.amount;
      }
    });

    // Recent Payments (top 5)
    const recentPayments = allPaymentsRaw.slice(0, 5).map((p: any) => {
      const st = studentMap[p.studentId] || { name: "Unknown", class: "-" };
      return {
        _id: p._id.toString(),
        studentId: p.studentId,
        studentName: st.name,
        class: st.class,
        amount: p.amount,
        mode: p.mode,
        paymentDate: p.paymentDate,
        receiptNo: p.receiptNo,
      };
    });

    // Format Monthly Collection Chart data
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const collectionChartData = monthNames.map((m) => ({
      month: m,
      amount: monthlyCollectionMap[m] || 0,
    }));

    return NextResponse.json({
      stats: {
        totalActiveStudents,
        todaysCollection,
        currentMonthCollection,
        totalPendingAmount,
        studentsWithDueCount,
        studentsDueTodayCount,
        todaysExpense,
        monthlyExpense,
        yearlyExpense,
      },
      recentPayments,
      dueStudentsList,
      collectionChartData,
    });
  } catch (error: any) {
    console.error("GET /api/dashboard error:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}
