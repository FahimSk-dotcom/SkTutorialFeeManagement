"use client";

import React, { useEffect, useState } from "react";
import {
  CreditCard,
  Search,
  Printer,
  Trash2,
  Edit,
} from "lucide-react";
import { ReceiptModal } from "@/components/payments/ReceiptModal";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Payment } from "@/types";
import { getMonthName } from "@/lib/due-calculator";
import { toast } from "sonner";

const MONTHS = [
  { value: "All", label: "All Months" },
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

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [modeFilter, setModeFilter] = useState("All");
  const [monthFilter, setMonthFilter] = useState("All");
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString());

  // Modals
  const [receiptPayment, setReceiptPayment] = useState<Payment | null>(null);
  const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null);

  // Edit payment state
  const [paymentToEdit, setPaymentToEdit] = useState<Payment | null>(null);
  const [editAmount, setEditAmount] = useState<number>(0);
  const [editMode, setEditMode] = useState<"Cash" | "UPI">("Cash");
  const [editRemarks, setEditRemarks] = useState<string>("");

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search,
        mode: modeFilter,
        month: monthFilter,
        year: yearFilter,
      });

      const res = await fetch(`/api/payments?${params.toString()}`);
      const json = await res.json();
      if (res.ok) {
        setPayments(json.payments || []);
      }
    } catch (err) {
      toast.error("Failed to load payment history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [search, modeFilter, monthFilter, yearFilter]);

  const handleDeletePayment = async () => {
    if (!paymentToDelete) return;
    try {
      const res = await fetch(`/api/payments/${paymentToDelete._id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Payment record deleted");
        fetchPayments();
      } else {
        toast.error("Delete failed");
      }
    } catch (err) {
      toast.error("Delete error");
    }
  };

  const handleUpdatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentToEdit) return;

    try {
      const res = await fetch(`/api/payments/${paymentToEdit._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: editAmount,
          mode: editMode,
          remarks: editRemarks,
        }),
      });

      if (res.ok) {
        toast.success("Payment record updated");
        setPaymentToEdit(null);
        fetchPayments();
      } else {
        toast.error("Update failed");
      }
    } catch (err) {
      toast.error("Update error");
    }
  };

  const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <span>Fee Payment History</span>
          </h1>
          <p className="text-xs text-muted-foreground">
            Complete log of all collected tuition fees with printable receipts
          </p>
        </div>

        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-extrabold text-sm">
          Total Filtered: ₹{totalCollected}
        </div>
      </div>

      {/* Toolbar Filters */}
      <div className="bg-card border border-border p-4 rounded-3xl shadow-soft space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search Student, Receipt, Mobile..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              suppressHydrationWarning
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-muted/50 border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>

          {/* Payment Mode */}
          <div>
            <select
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
              suppressHydrationWarning
              className="w-full px-3 py-2 text-xs sm:text-sm bg-muted/50 border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-medium"
            >
              <option value="All">All Modes (Cash & UPI)</option>
              <option value="Cash">Cash Only</option>
              <option value="UPI">UPI Only</option>
            </select>
          </div>

          {/* Month */}
          <div>
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              suppressHydrationWarning
              className="w-full px-3 py-2 text-xs sm:text-sm bg-muted/50 border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-medium"
            >
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* Year */}
          <div>
            <input
              type="number"
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              suppressHydrationWarning
              className="w-full px-3 py-2 text-xs sm:text-sm bg-muted/50 border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-medium"
            />
          </div>
        </div>
      </div>

      {/* Payment Table View */}
      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-card border border-border rounded-2xl" />
          ))}
        </div>
      ) : payments.length === 0 ? (
        <div className="text-center py-12 bg-card border border-dashed border-border rounded-3xl">
          <p className="text-base font-bold text-foreground">No payments recorded</p>
          <p className="text-xs text-muted-foreground mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <div>
          {/* Desktop Table */}
          <div className="hidden md:block bg-card border border-border rounded-3xl overflow-hidden shadow-soft">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground uppercase tracking-wider">
                  <th className="p-4">Receipt No</th>
                  <th className="p-4">Student</th>
                  <th className="p-4">Fee Month</th>
                  <th className="p-4">Payment Date</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Mode</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {payments.map((p) => (
                  <tr key={p._id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4 font-bold text-foreground">{p.receiptNo}</td>
                    <td className="p-4">
                      <p className="font-bold text-foreground">{p.studentName}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {p.studentId} • Class {p.class}
                      </p>
                    </td>
                    <td className="p-4 font-semibold text-foreground">
                      {getMonthName(p.month)} {p.year}
                    </td>
                    <td className="p-4 text-muted-foreground">{p.paymentDate}</td>
                    <td className="p-4 font-extrabold text-emerald-600 dark:text-emerald-400">
                      ₹{p.amount}
                    </td>
                    <td className="p-4 font-medium text-foreground">{p.mode}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setReceiptPayment(p)}
                          className="px-3 py-1 rounded-xl bg-indigo-500/10 text-indigo-600 font-semibold hover:bg-indigo-500/20 transition-all"
                        >
                          Receipt
                        </button>

                        <button
                          onClick={() => {
                            setPaymentToEdit(p);
                            setEditAmount(p.amount);
                            setEditMode(p.mode);
                            setEditRemarks(p.remarks || "");
                          }}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-indigo-600 hover:bg-muted"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setPaymentToDelete(p)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-muted"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Responsive Cards */}
          <div className="md:hidden space-y-3">
            {payments.map((p) => (
              <div key={p._id} className="bg-card border border-border p-4 rounded-3xl shadow-soft space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-sm">{p.studentName}</h3>
                    <p className="text-xs text-muted-foreground">
                      {p.receiptNo} • Class {p.class}
                    </p>
                  </div>
                  <span className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400">
                    ₹{p.amount}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/50">
                  <span>
                    Month: <strong className="text-foreground">{getMonthName(p.month)} {p.year}</strong>
                  </span>
                  <span>Mode: <strong className="text-foreground">{p.mode}</strong></span>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => setReceiptPayment(p)}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs"
                  >
                    View Receipt
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setPaymentToEdit(p);
                        setEditAmount(p.amount);
                        setEditMode(p.mode);
                        setEditRemarks(p.remarks || "");
                      }}
                      className="p-2 rounded-xl text-muted-foreground hover:bg-muted"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setPaymentToDelete(p)}
                      className="p-2 rounded-xl text-muted-foreground hover:text-rose-600 hover:bg-muted"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Receipt View Modal */}
      <ReceiptModal
        isOpen={!!receiptPayment}
        onClose={() => setReceiptPayment(null)}
        payment={receiptPayment}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!paymentToDelete}
        title="Delete Payment Record?"
        description={`Are you sure you want to delete receipt ${paymentToDelete?.receiptNo} (₹${paymentToDelete?.amount})? This will revert the month's fee to unpaid status.`}
        onConfirm={handleDeletePayment}
        onClose={() => setPaymentToDelete(null)}
      />

      {/* Edit Payment Modal */}
      {paymentToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-card border border-border rounded-3xl p-6 shadow-elevated">
            <h2 className="font-bold text-lg mb-4">Edit Payment ({paymentToEdit.receiptNo})</h2>
            <form onSubmit={handleUpdatePayment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Amount (₹)</label>
                <input
                  type="number"
                  value={editAmount}
                  onChange={(e) => setEditAmount(Number(e.target.value))}
                  suppressHydrationWarning
                  className="w-full px-3.5 py-2 text-sm bg-muted/50 border border-border rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Payment Mode</label>
                <select
                  value={editMode}
                  onChange={(e) => setEditMode(e.target.value as "Cash" | "UPI")}
                  suppressHydrationWarning
                  className="w-full px-3.5 py-2 text-sm bg-muted/50 border border-border rounded-xl"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Remarks</label>
                <input
                  type="text"
                  value={editRemarks}
                  onChange={(e) => setEditRemarks(e.target.value)}
                  suppressHydrationWarning
                  className="w-full px-3.5 py-2 text-sm bg-muted/50 border border-border rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setPaymentToEdit(null)}
                  className="px-4 py-2 text-xs font-semibold text-muted-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
