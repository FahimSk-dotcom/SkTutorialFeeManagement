import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  rememberMe: z.boolean().optional(),
});

export const studentSchema = z.object({
  name: z.string().min(2, "Student name is required"),
  class: z.string().min(1, "Class is required"),
  batch: z.string().optional(),
  monthlyFee: z.number().positive("Monthly fee must be positive"),
  parentName: z.string().min(2, "Parent name is required"),
  parentMobile: z
    .string()
    .regex(/^[0-9]{10}$/, "Parent mobile number must be exactly 10 digits"),
  alternateMobile: z
    .string()
    .regex(/^[0-9]{10}$/, "Alternate mobile must be 10 digits")
    .optional()
    .or(z.literal("")),
  admissionDate: z.string().min(1, "Admission date is required"),
  status: z.enum(["Active", "Inactive"]),
  address: z.string().optional(),
  remarks: z.string().optional(),
});

export const paymentSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  paymentDate: z.string().min(1, "Payment date is required"),
  month: z.number().min(1).max(12),
  year: z.number().min(2020).max(2100),
  amount: z.number().positive("Amount must be positive"),
  mode: z.enum(["Cash", "UPI"]),
  remarks: z.string().optional(),
});

export const expenseSchema = z.object({
  name: z.string().min(2, "Expense name is required"),
  category: z.string().min(1, "Category is required"),
  amount: z.number().positive("Amount must be positive"),
  date: z.string().min(1, "Date is required"),
  notes: z.string().optional(),
});

export const settingsSchema = z.object({
  instituteName: z.string().min(2, "Institute name is required"),
  logoUrl: z.string().optional(),
  upiId: z.string().optional(),
  upiQrUrl: z.string().optional(),
  receiptFooter: z.string().optional(),
  whatsappTemplate: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type StudentInput = z.infer<typeof studentSchema>;
export type PaymentInput = z.infer<typeof paymentSchema>;
export type ExpenseInput = z.infer<typeof expenseSchema>;
export type SettingsInput = z.infer<typeof settingsSchema>;
