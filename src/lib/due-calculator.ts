import { Student, Payment, DynamicDueResult, PendingMonthDetail, DueStatus } from "@/types";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function getMonthName(month: number): string {
  return MONTH_NAMES[month - 1] || "";
}

/**
 * Calculates dynamic fee due status for a student given their payments.
 * 
 * Logic:
 * - When a student takes admission on a date (e.g., 27-07-2026):
 * - The 1st tuition month is July 2026 (Month 7).
 * - The fee for July 2026 becomes DUE 1 month later on 27-08-2026.
 * - Before 27-08-2026, July 2026 is NOT due yet.
 * - On/After 27-08-2026, July 2026 is Due/Overdue until paid.
 * - The 2nd tuition month (August 2026) becomes DUE on 27-09-2026, and so on.
 */
export function calculateStudentDueStatus(
  student: Student,
  payments: Payment[],
  currentDateObj: Date = new Date()
): DynamicDueResult {
  if (!student.admissionDate) {
    return {
      status: "PAID",
      totalDueMonths: 0,
      totalPendingAmount: 0,
      pendingMonths: [],
      paidMonthsCount: 0,
    };
  }

  const admission = new Date(student.admissionDate);
  const admissionYear = admission.getFullYear();
  const admissionMonth = admission.getMonth() + 1; // 1-indexed (1-12)
  const admissionDay = admission.getDate();

  // Reset time portions for exact date comparison
  const curDate = new Date(currentDateObj.getFullYear(), currentDateObj.getMonth(), currentDateObj.getDate());

  // Create a set of paid year-months
  const paidSet = new Set<string>();
  payments.forEach((p) => {
    paidSet.add(`${p.year}-${p.month}`);
  });

  const pendingMonths: PendingMonthDetail[] = [];
  let paidMonthsCount = 0;

  // Iterate tuition cycles starting from admission month (k = 0)
  let k = 0;
  while (true) {
    // Determine tuition month m & year y for cycle index k
    let m = admissionMonth + k;
    let y = admissionYear;
    while (m > 12) {
      m -= 12;
      y += 1;
    }

    // Due date for tuition month (m, y) is 1 month AFTER tuition month starts (i.e., k+1 months after admission)
    let dueY = admissionYear;
    let dueM = admissionMonth + (k + 1);
    while (dueM > 12) {
      dueM -= 12;
      dueY += 1;
    }
    const maxDaysInDueMonth = new Date(dueY, dueM, 0).getDate();
    const actualDueDay = Math.min(admissionDay, maxDaysInDueMonth);
    const dueDate = new Date(dueY, dueM - 1, actualDueDay);

    // If due date for this tuition month is in the future beyond today, stop checking
    if (dueDate > curDate) {
      break;
    }

    const key = `${y}-${m}`;
    const isPaid = paidSet.has(key);

    if (isPaid) {
      paidMonthsCount++;
    } else {
      // Due date has arrived or passed and fee for month (m, y) is unpaid
      const isDueToday =
        curDate.getFullYear() === dueDate.getFullYear() &&
        curDate.getMonth() === dueDate.getMonth() &&
        curDate.getDate() === dueDate.getDate();
      const isOverdue = curDate > dueDate;

      const monthName = getMonthName(m);
      const dueDateFormatted = `${dueY}-${String(dueM).padStart(2, "0")}-${String(actualDueDay).padStart(2, "0")}`;

      pendingMonths.push({
        month: m,
        year: y,
        monthName: `${monthName} ${y}`,
        dueDate: dueDateFormatted,
        amount: student.monthlyFee,
        isDueToday,
        isOverdue,
      });
    }

    k++;
  }

  // Status determination
  let status: DueStatus = "PAID";
  if (pendingMonths.length > 0) {
    const hasOverdue = pendingMonths.some((p) => p.isOverdue);
    if (hasOverdue) {
      status = "OVERDUE";
    } else {
      status = "DUE_TODAY";
    }
  }

  const totalPendingAmount = pendingMonths.length * student.monthlyFee;

  return {
    status,
    totalDueMonths: pendingMonths.length,
    totalPendingAmount,
    pendingMonths,
    paidMonthsCount,
  };
}
