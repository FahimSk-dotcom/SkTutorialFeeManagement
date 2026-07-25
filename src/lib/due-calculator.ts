import { Student, Payment, DynamicDueResult, PendingMonthDetail, DueStatus } from "@/types";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function getMonthName(month: number): string {
  return MONTH_NAMES[month - 1] || "";
}

/**
 * Calculates dynamic fee due status for a student given their payments
 */
export function calculateStudentDueStatus(
  student: Student,
  payments: Payment[],
  currentDateObj: Date = new Date()
): DynamicDueResult {
  const admission = new Date(student.admissionDate);
  const admissionDay = admission.getDate();
  const admissionYear = admission.getFullYear();
  const admissionMonth = admission.getMonth() + 1; // 1-indexed

  const targetYear = currentDateObj.getFullYear();
  const targetMonth = currentDateObj.getMonth() + 1;
  const targetDay = currentDateObj.getDate();

  // Create a map of paid year-months
  const paidSet = new Set<string>();
  payments.forEach((p) => {
    paidSet.add(`${p.year}-${p.month}`);
  });

  const pendingMonths: PendingMonthDetail[] = [];
  let paidMonthsCount = 0;

  let y = admissionYear;
  let m = admissionMonth;

  while (y < targetYear || (y === targetYear && m <= targetMonth)) {
    // Days in current iteration month
    const daysInMonth = new Date(y, m, 0).getDate();
    const actualDueDay = Math.min(admissionDay, daysInMonth);

    const isCurrentIterationMonth = y === targetYear && m === targetMonth;
    const isDueDayPassed = targetDay > actualDueDay;
    const isDueToday = isCurrentIterationMonth && targetDay === actualDueDay;

    const isMonthDue = !isCurrentIterationMonth || isDueToday || isDueDayPassed;

    const key = `${y}-${m}`;
    const isPaid = paidSet.has(key);

    if (isPaid) {
      paidMonthsCount++;
    } else if (isMonthDue) {
      // It is due and unpaid
      const isOverdue = !isDueToday && (y < targetYear || (y === targetYear && m < targetMonth) || (isCurrentIterationMonth && isDueDayPassed));

      const monthName = getMonthName(m);
      const dueDateFormatted = `${y}-${String(m).padStart(2, "0")}-${String(actualDueDay).padStart(2, "0")}`;

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

    // Move to next month
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
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
