import { Student, DynamicDueResult } from "@/types";

export interface StudentWithDue {
  student: Student;
  dueInfo: DynamicDueResult;
}

export function cleanPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `91${digits}`;
  }
  return digits;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN").format(amount);
}

export function cleanClassDisplay(classStr: string): string {
  if (!classStr) return "-";
  // Strips duplicate "Class " or "class " prefix if present
  const cleaned = classStr.replace(/^class\s+/i, "").trim();
  return cleaned;
}

export function generateWhatsAppLink(
  parentMobile: string,
  siblingStudentsWithDues: StudentWithDue[]
): string {
  const formattedPhone = cleanPhoneNumber(parentMobile);

  if (!siblingStudentsWithDues || siblingStudentsWithDues.length === 0) {
    return `https://wa.me/${formattedPhone}`;
  }

  let message = "";

  if (siblingStudentsWithDues.length === 1) {
    const { student, dueInfo } = siblingStudentsWithDues[0];
    const pendingMonthsText =
      dueInfo.pendingMonths && dueInfo.pendingMonths.length > 0
        ? dueInfo.pendingMonths.map((p) => p.monthName).join(", ")
        : "Current Month";
    const totalDue = dueInfo.totalPendingAmount ?? student.monthlyFee;
    const studentClass = cleanClassDisplay(student.class);

    message = `*Assalamualaikum,*

This is a gentle reminder from *SK Tutorials* regarding your ward’s pending tuition fees.

*👨🎓 Student: ${student.name}*
*🏫 Class: ${studentClass}*
*💰 Monthly Fee: ₹${formatCurrency(student.monthlyFee)}*
*📅 Pending Month: ${pendingMonthsText}*
*💳 Total Due: ₹${formatCurrency(totalDue)}*

We kindly request you to clear the pending fees at the earliest to avoid any inconvenience.

If you have already made the payment, please ignore this message.

*Regards,*
*Prof. Fahim Sir*
*SK Tutorials*`;
  } else {
    // Consolidated Sibling Message for 2, 3, 4, or ANY number of siblings
    let studentBreakdown = "";
    let grandTotal = 0;

    siblingStudentsWithDues.forEach((item, idx) => {
      const { student, dueInfo } = item;
      const pendingMonthsText =
        dueInfo.pendingMonths && dueInfo.pendingMonths.length > 0
          ? dueInfo.pendingMonths.map((p) => p.monthName).join(", ")
          : "Current Month";
      const dueAmount = dueInfo.totalPendingAmount ?? student.monthlyFee;
      grandTotal += dueAmount;
      const studentClass = cleanClassDisplay(student.class);

      studentBreakdown += `*👨🎓 Student ${idx + 1}: ${student.name}*
*🏫 Class: ${studentClass}*
*💰 Monthly Fee: ₹${formatCurrency(student.monthlyFee)}*
*📅 Pending Month: ${pendingMonthsText}*
*💳 Pending Amount: ₹${formatCurrency(dueAmount)}*\n\n`;
    });

    message = `*Assalamualaikum,*

This is a gentle reminder from *SK Tutorials* regarding your wards’ pending tuition fees.

${studentBreakdown.trim()}

*--------------------------------*
*💳 Grand Total Due: ₹${formatCurrency(grandTotal)}*

We kindly request you to clear the pending fees at the earliest to avoid any inconvenience.

If you have already made the payment, please ignore this message.

*Regards,*
*Prof. Fahim Sir*
*SK Tutorials*`;
  }

  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
}
