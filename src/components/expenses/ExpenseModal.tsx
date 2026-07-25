"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, ReceiptText, Save } from "lucide-react";
import { toast } from "sonner";
import { expenseSchema, ExpenseInput } from "@/schemas";
import { Expense } from "@/types";

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  expenseToEdit?: Expense | null;
}

const CATEGORIES = ["Rent", "Utilities", "Stationery", "Salaries", "Maintenance", "Marketing", "Other"];

export function ExpenseModal({
  isOpen,
  onClose,
  onSuccess,
  expenseToEdit,
}: ExpenseModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseInput>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      name: "",
      category: "Rent",
      amount: 5000,
      date: new Date().toISOString().split("T")[0],
      notes: "",
    },
  });

  useEffect(() => {
    if (expenseToEdit) {
      reset({
        name: expenseToEdit.name,
        category: expenseToEdit.category,
        amount: Number(expenseToEdit.amount),
        date: expenseToEdit.date,
        notes: expenseToEdit.notes || "",
      });
    } else {
      reset({
        name: "",
        category: "Rent",
        amount: 5000,
        date: new Date().toISOString().split("T")[0],
        notes: "",
      });
    }
  }, [expenseToEdit, reset]);

  if (!isOpen) return null;

  const onSubmit = async (data: ExpenseInput) => {
    try {
      const url = expenseToEdit ? `/api/expenses/${expenseToEdit._id}` : "/api/expenses";
      const method = expenseToEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Operation failed");
        return;
      }

      toast.success(expenseToEdit ? "Expense record updated" : "Expense recorded successfully");
      onSuccess();
      onClose();
    } catch (err) {
      toast.error("Failed to save expense");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-card text-card-foreground border border-border rounded-3xl p-6 shadow-elevated relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-muted-foreground hover:bg-muted transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 flex items-center justify-center font-bold">
            <ReceiptText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-lg">
              {expenseToEdit ? "Edit Expense" : "Add Institute Expense"}
            </h2>
            <p className="text-xs text-muted-foreground">
              Record operational expenses for SK Tutorials
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1">Expense Name *</label>
            <input
              type="text"
              placeholder="e.g. Center Monthly Rent"
              {...register("name")}
              className="w-full px-3.5 py-2 text-sm bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/50"
            />
            {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">Category *</label>
              <select
                {...register("category")}
                className="w-full px-3.5 py-2 text-sm bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/50 font-medium"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Amount (₹) *</label>
              <input
                type="number"
                placeholder="5000"
                {...register("amount", { valueAsNumber: true })}
                className="w-full px-3.5 py-2 text-sm bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/50 font-bold text-rose-600 dark:text-rose-400"
              />
              {errors.amount && <p className="text-xs text-rose-500 mt-1">{errors.amount.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Date *</label>
            <input
              type="date"
              {...register("date")}
              className="w-full px-3.5 py-2 text-sm bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Notes (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Paid via UPI to Landlord"
              {...register("notes")}
              className="w-full px-3.5 py-2 text-sm bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/50"
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
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm transition-all active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? "Saving..." : expenseToEdit ? "Update Expense" : "Add Expense"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
