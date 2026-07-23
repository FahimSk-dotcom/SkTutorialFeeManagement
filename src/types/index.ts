export type DueStatus = "PAID" | "DUE_TODAY" | "OVERDUE";

export interface Student {
  _id?: string;
  studentId: string; // Auto generated short code (e.g. SK-1001)
  name: string;
  class: string;
  batch: string;
  monthlyFee: number;
  parentName: string;
  parentMobile: string;
  alternateMobile?: string;
  admissionDate: string; // YYYY-MM-DD or ISO string
  status: "Active" | "Inactive";
  address?: string;
  remarks?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Payment {
  _id?: string;
  studentId: string;
  studentName?: string;
  class?: string;
  paymentDate: string; // YYYY-MM-DD
  month: number; // 1-12
  year: number; // e.g. 2026
  amount: number;
  mode: "Cash" | "UPI";
  receiptNo: string; // e.g. REC-202607-1001
  collectedBy: string;
  remarks?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Expense {
  _id?: string;
  name: string;
  category: string;
  amount: number;
  date: string; // YYYY-MM-DD
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Settings {
  _id?: string;
  instituteName: string;
  logoUrl?: string;
  upiId?: string;
  upiQrUrl?: string;
  receiptFooter?: string;
  whatsappTemplate?: string;
  updatedAt?: string;
}

export interface Admin {
  _id?: string;
  email: string;
  passwordHash: string;
  name: string;
  createdAt?: string;
}

export interface PendingMonthDetail {
  month: number; // 1-12
  year: number;
  monthName: string;
  dueDate: string; // YYYY-MM-DD
  amount: number;
  isDueToday: boolean;
  isOverdue: boolean;
}

export interface DynamicDueResult {
  status: DueStatus; // "PAID" | "DUE_TODAY" | "OVERDUE"
  totalDueMonths: number;
  totalPendingAmount: number;
  pendingMonths: PendingMonthDetail[];
  nextDueDate?: string;
  paidMonthsCount: number;
}

export interface SiblingGroupInfo {
  parentMobile: string;
  parentName: string;
  students: Student[];
  siblingCount: number;
  totalGroupPendingAmount: number;
  combinedWhatsAppUrl: string;
}
