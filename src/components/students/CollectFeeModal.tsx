"use client";

import React, { useState, useEffect } from "react";
import { X, CreditCard, CheckCircle2, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { Student, Payment } from "@/types";
import { getMonthName } from "@/lib/due-calculator";

interface CollectFeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (payment: Payment) => void;
  student: Student | null;
}

const MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

export function CollectFeeModal({
  isOpen,
  onClose,
  onSuccess,
  student,
}: CollectFeeModalProps) {
  const currentDate = new Date();
  const [paymentDate, setPaymentDate] = useState(
    currentDate.toISOString().split("T")[0]
  );
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [year, setYear] = useState(currentDate.getFullYear());
  const [amount, setAmount] = useState<number>(student ? student.monthlyFee : 1500);
  const [mode, setMode] = useState<"Cash" | "UPI">("Cash");
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (student) {
      setAmount(student.monthlyFee);
    }
  }, [student]);

  if (!isOpen || !student) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: student.studentId,
          paymentDate,
          month,
          year,
          amount,
          mode,
          remarks,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Payment collection failed");
        setLoading(false);
        return;
      }

      toast.success(`Fee collected successfully for ${getMonthName(month)} ${year}`);
      onSuccess(json.payment);
      onClose();
    } catch (err) {
      toast.error("Failed to submit payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-card text-card-foreground border border-border rounded-3xl p-6 shadow-elevated relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-muted-foreground hover:bg-muted transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 flex items-center justify-center font-bold">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-lg">Collect Tuition Fee</h2>
            <p className="text-xs text-muted-foreground">
              {student.name} ({student.studentId}) • Class {student.class}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Fee Month & Year */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">Fee Month *</label>
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-sm bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-medium"
              >
                {MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Year *</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-sm bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-medium"
              />
            </div>
          </div>

          {/* Amount & Mode */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">Amount (₹) *</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-sm bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-bold text-emerald-600 dark:text-emerald-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Payment Mode *</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMode("Cash")}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${
                    mode === "Cash"
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                      : "bg-muted/50 border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  💵 Cash
                </button>
                <button
                  type="button"
                  onClick={() => setMode("UPI")}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${
                    mode === "UPI"
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                      : "bg-muted/50 border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  📱 UPI
                </button>
              </div>
            </div>
          </div>

          {/* Payment Date */}
          <div>
            <label className="block text-xs font-semibold mb-1">Payment Collection Date *</label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-xs font-semibold mb-1">Remarks (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Paid in full via GPay"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-all active:scale-95 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{loading ? "Recording..." : "Record Payment"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
