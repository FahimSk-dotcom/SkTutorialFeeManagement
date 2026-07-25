"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  User,
  Phone,
  Calendar,
  CreditCard,
  Printer,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Receipt,
  MessageSquare,
} from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { WhatsAppButton } from "@/components/shared/WhatsAppButton";
import { CollectFeeModal } from "@/components/students/CollectFeeModal";
import { ReceiptModal } from "@/components/payments/ReceiptModal";
import { Student, Payment, DynamicDueResult } from "@/types";
import { getMonthName } from "@/lib/due-calculator";
import { generateWhatsAppLink } from "@/lib/whatsapp";

export default function StudentDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isCollectFeeOpen, setIsCollectFeeOpen] = useState(false);
  const [receiptPayment, setReceiptPayment] = useState<Payment | null>(null);

  const fetchStudentData = async () => {
    try {
      const res = await fetch(`/api/students/${id}`);
      const json = await res.json();
      if (res.ok) {
        setData(json);
      }
    } catch (err) {
      console.error("Student detail fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentData();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-10 w-32 bg-card rounded-2xl" />
        <div className="h-48 bg-card rounded-3xl" />
        <div className="h-64 bg-card rounded-3xl" />
      </div>
    );
  }

  if (!data || !data.student) {
    return (
      <div className="text-center py-12">
        <p className="font-bold text-lg">Student not found</p>
        <Link href="/students" className="text-indigo-600 font-semibold text-xs hover:underline mt-2 block">
          Back to Students
        </Link>
      </div>
    );
  }

  const student: Student = data.student;
  const payments: Payment[] = data.payments || [];
  const dueInfo: DynamicDueResult = data.dueInfo;
  const siblings: any[] = data.siblings || [];

  // Construct sibling dues for WhatsApp link
  const allFamilyDues = [
    { student, dueInfo },
    ...siblings.map((sib: any) => ({ student: sib.student, dueInfo: sib.dueInfo })),
  ];
  const combinedWhatsAppUrl = generateWhatsAppLink(student.parentMobile, allFamilyDues);

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div>
        <Link
          href="/students"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Students Directory</span>
        </Link>
      </div>

      {/* Student Main Profile Header */}
      <div className="bg-card border border-border p-6 rounded-3xl shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-md shadow-indigo-500/20">
            {student.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-extrabold tracking-tight">{student.name}</h1>
              <StatusBadge status={dueInfo.status} size="sm" />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              ID: <span className="font-bold text-foreground">{student.studentId}</span> • Class{" "}
              <span className="font-bold text-foreground">{student.class}</span>
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Admission Date: {student.admissionDate ? student.admissionDate.split("T")[0] : "-"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsCollectFeeOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all active:scale-95"
          >
            <CreditCard className="w-4 h-4" />
            <span>Collect Fee</span>
          </button>

          <a
            href={combinedWhatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all active:scale-95"
          >
            <MessageSquare className="w-4 h-4 fill-current" />
            <span>Send WhatsApp Reminder</span>
          </a>
        </div>
      </div>

      {/* Details & Due Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Student Information Card */}
        <div className="bg-card border border-border p-5 rounded-3xl shadow-soft space-y-4">
          <h2 className="font-bold text-sm text-foreground border-b border-border pb-2">
            Student Information
          </h2>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-muted-foreground block text-[10px]">Monthly Tuition Fee:</span>
              <span className="font-extrabold text-sm text-indigo-600 dark:text-indigo-400">
                ₹{student.monthlyFee} / month
              </span>
            </div>

            <div>
              <span className="text-muted-foreground block text-[10px]">Parent / Guardian Name:</span>
              <span className="font-bold text-foreground">{student.parentName}</span>
            </div>

            <div>
              <span className="text-muted-foreground block text-[10px]">Parent Mobile Number:</span>
              <span className="font-bold text-foreground">{student.parentMobile}</span>
            </div>

            {student.alternateMobile && (
              <div>
                <span className="text-muted-foreground block text-[10px]">Alternate Contact:</span>
                <span className="font-bold text-foreground">{student.alternateMobile}</span>
              </div>
            )}

            {student.address && (
              <div>
                <span className="text-muted-foreground block text-[10px]">Address:</span>
                <span className="font-medium text-foreground">{student.address}</span>
              </div>
            )}

            {student.remarks && (
              <div>
                <span className="text-muted-foreground block text-[10px]">Remarks:</span>
                <span className="font-medium text-foreground">{student.remarks}</span>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Pending Fee Status Card */}
        <div className="bg-card border border-border p-5 rounded-3xl shadow-soft space-y-4 md:col-span-2">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h2 className="font-bold text-sm text-foreground">Dynamic Due Status</h2>
            <StatusBadge status={dueInfo.status} size="sm" />
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-2xl bg-muted/40 border border-border/60">
              <span className="text-muted-foreground text-[10px] block font-semibold">
                Total Pending Months
              </span>
              <span className="text-xl font-extrabold text-foreground">{dueInfo.totalDueMonths}</span>
            </div>

            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20">
              <span className="text-rose-600 dark:text-rose-400 text-[10px] block font-semibold">
                Total Pending Amount
              </span>
              <span className="text-xl font-black text-rose-600 dark:text-rose-400">
                ₹{dueInfo.totalPendingAmount}
              </span>
            </div>
          </div>

          {/* Pending Month Breakdown List */}
          <div>
            <h3 className="text-xs font-bold text-muted-foreground mb-2">Unpaid Pending Months:</h3>
            {dueInfo.pendingMonths.length === 0 ? (
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>All tuition fees up to date!</span>
              </div>
            ) : (
              <div className="space-y-2">
                {dueInfo.pendingMonths.map((pm) => (
                  <div
                    key={`${pm.year}-${pm.month}`}
                    className="flex items-center justify-between p-3 rounded-2xl bg-muted/40 border border-border/60 text-xs"
                  >
                    <div>
                      <span className="font-bold text-foreground">{pm.monthName}</span>
                      <span className="text-[10px] text-muted-foreground block">
                        Due Date: {pm.dueDate}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="font-extrabold text-rose-600 dark:text-rose-400 block">
                        ₹{pm.amount}
                      </span>
                      {pm.isDueToday ? (
                        <span className="text-[10px] font-bold text-amber-500">Due Today</span>
                      ) : (
                        <span className="text-[10px] font-bold text-rose-500">Overdue</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sibling Group Family Card */}
      {siblings.length > 0 && (
        <div className="bg-card border border-border p-5 rounded-3xl shadow-soft space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-500" />
              <span>Family Siblings (Same Mobile: {student.parentMobile})</span>
            </h2>
            <span className="text-xs text-muted-foreground font-medium">
              Auto-grouped into 1 WhatsApp reminder
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {siblings.map((sib: any) => (
              <div
                key={sib.student._id}
                className="p-3 rounded-2xl bg-muted/30 border border-border/60 flex items-center justify-between"
              >
                <div>
                  <Link
                    href={`/students/${sib.student._id}`}
                    className="font-bold text-xs hover:text-indigo-600"
                  >
                    {sib.student.name}
                  </Link>
                  <p className="text-[10px] text-muted-foreground">
                    Class {sib.student.class} • Fee: ₹{sib.student.monthlyFee}
                  </p>
                </div>

                <div className="text-right">
                  <StatusBadge status={sib.dueInfo.status} size="sm" />
                  <p className="text-[10px] text-rose-500 font-bold mt-0.5">
                    Due: ₹{sib.dueInfo.totalPendingAmount}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment History Ledger */}
      <div className="bg-card border border-border p-5 rounded-3xl shadow-soft space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-extrabold text-base flex items-center gap-2">
            <Receipt className="w-4.5 h-4.5 text-indigo-500" />
            <span>Payment History Ledger</span>
          </h2>
          <span className="text-xs text-muted-foreground font-semibold">
            {payments.length} payment(s) recorded
          </span>
        </div>

        {payments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-2xl text-xs">
            No payments collected yet for this student.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground uppercase tracking-wider">
                  <th className="p-3">Receipt No</th>
                  <th className="p-3">Paid Date</th>
                  <th className="p-3">Fee Month</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Mode</th>
                  <th className="p-3 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {payments.map((p) => (
                  <tr key={p._id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3 font-bold text-foreground">{p.receiptNo}</td>
                    <td className="p-3 text-muted-foreground">{p.paymentDate}</td>
                    <td className="p-3 font-semibold text-foreground">
                      {getMonthName(p.month)} {p.year}
                    </td>
                    <td className="p-3 font-extrabold text-emerald-600 dark:text-emerald-400">
                      ₹{p.amount}
                    </td>
                    <td className="p-3 font-medium text-foreground">{p.mode}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setReceiptPayment(p)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-indigo-500/10 text-indigo-600 font-semibold hover:bg-indigo-500/20 transition-all"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <CollectFeeModal
        isOpen={isCollectFeeOpen}
        onClose={() => setIsCollectFeeOpen(false)}
        onSuccess={(payment) => {
          fetchStudentData();
          setReceiptPayment(payment);
        }}
        student={student}
      />

      <ReceiptModal
        isOpen={!!receiptPayment}
        onClose={() => setReceiptPayment(null)}
        payment={receiptPayment}
      />
    </div>
  );
}
