"use client";

import React, { useEffect, useState } from "react";
import {
  ReceiptText,
  Plus,
  Search,
  Trash2,
  Edit,
} from "lucide-react";
import { ExpenseModal } from "@/components/expenses/ExpenseModal";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Expense } from "@/types";
import { toast } from "sonner";

const CATEGORIES = ["All", "Rent", "Utilities", "Stationery", "Salaries", "Maintenance", "Marketing", "Other"];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  // Modals
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ search, category: categoryFilter });
      const res = await fetch(`/api/expenses?${params.toString()}`);
      const json = await res.json();
      if (res.ok) {
        setExpenses(json.expenses || []);
      }
    } catch (err) {
      toast.error("Failed to load expenses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [search, categoryFilter]);

  const handleDeleteExpense = async () => {
    if (!expenseToDelete) return;
    try {
      const res = await fetch(`/api/expenses/${expenseToDelete._id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Expense deleted");
        fetchExpenses();
      } else {
        toast.error("Delete failed");
      }
    } catch (err) {
      toast.error("Delete error");
    }
  };

  // Calculate Aggregations: Today, Month, Year
  const todayStr = new Date().toISOString().split("T")[0];
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  let todaysTotal = 0;
  let monthlyTotal = 0;
  let yearlyTotal = 0;

  expenses.forEach((e) => {
    const d = new Date(e.date);
    if (e.date === todayStr) todaysTotal += e.amount;
    if (d.getFullYear() === currentYear && d.getMonth() + 1 === currentMonth) monthlyTotal += e.amount;
    if (d.getFullYear() === currentYear) yearlyTotal += e.amount;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <ReceiptText className="w-6 h-6 text-rose-600 dark:text-rose-400" />
            <span>Institute Expenses</span>
          </h1>
          <p className="text-xs text-muted-foreground">
            Track operational costs, center rent, stationery, and utility bills
          </p>
        </div>

        <button
          onClick={() => {
            setExpenseToEdit(null);
            setIsAddExpenseOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add Expense</span>
        </button>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border p-4 rounded-3xl shadow-soft">
          <span className="text-xs font-semibold text-muted-foreground block">Today&apos;s Expense</span>
          <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">₹{todaysTotal}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{todayStr}</p>
        </div>

        <div className="bg-card border border-border p-4 rounded-3xl shadow-soft">
          <span className="text-xs font-semibold text-muted-foreground block">Monthly Expense</span>
          <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">₹{monthlyTotal}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">This Month</p>
        </div>

        <div className="bg-card border border-border p-4 rounded-3xl shadow-soft">
          <span className="text-xs font-semibold text-muted-foreground block">Yearly Expense</span>
          <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">₹{yearlyTotal}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{currentYear}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-card border border-border p-4 rounded-3xl shadow-soft space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search expense name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              suppressHydrationWarning
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-muted/50 border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-500/50"
            />
          </div>

          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              suppressHydrationWarning
              className="w-full px-3 py-2 text-xs sm:text-sm bg-muted/50 border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-500/50 font-medium"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c === "All" ? "All Categories" : c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Expenses Table View */}
      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-card border border-border rounded-2xl" />
          ))}
        </div>
      ) : expenses.length === 0 ? (
        <div className="text-center py-12 bg-card border border-dashed border-border rounded-3xl">
          <p className="text-base font-bold text-foreground">No expenses recorded</p>
          <p className="text-xs text-muted-foreground mt-1">Add operational expenses to track outflows</p>
        </div>
      ) : (
        <div>
          {/* Desktop Table */}
          <div className="hidden md:block bg-card border border-border rounded-3xl overflow-hidden shadow-soft">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground uppercase tracking-wider">
                  <th className="p-4">Expense Name</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Notes</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {expenses.map((e) => (
                  <tr key={e._id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4 font-bold text-foreground">{e.name}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 font-semibold">
                        {e.category}
                      </span>
                    </td>
                    <td className="p-4 text-muted-foreground">{e.date}</td>
                    <td className="p-4 font-extrabold text-rose-600 dark:text-rose-400">
                      ₹{e.amount}
                    </td>
                    <td className="p-4 text-muted-foreground">{e.notes || "-"}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setExpenseToEdit(e);
                            setIsAddExpenseOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-indigo-600 hover:bg-muted"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setExpenseToDelete(e)}
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

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {expenses.map((e) => (
              <div key={e._id} className="bg-card border border-border p-4 rounded-3xl shadow-soft space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-sm">{e.name}</h3>
                    <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400">
                      {e.category}
                    </span>
                  </div>
                  <span className="font-extrabold text-sm text-rose-600 dark:text-rose-400">
                    ₹{e.amount}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/50">
                  <span>Date: {e.date}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setExpenseToEdit(e);
                        setIsAddExpenseOpen(true);
                      }}
                      className="p-1.5 rounded-xl text-muted-foreground hover:bg-muted"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setExpenseToDelete(e)}
                      className="p-1.5 rounded-xl text-muted-foreground hover:text-rose-600 hover:bg-muted"
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

      {/* Modals */}
      <ExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => {
          setIsAddExpenseOpen(false);
          setExpenseToEdit(null);
        }}
        onSuccess={fetchExpenses}
        expenseToEdit={expenseToEdit}
      />

      <ConfirmDialog
        isOpen={!!expenseToDelete}
        title="Delete Expense?"
        description={`Are you sure you want to delete expense "${expenseToDelete?.name}" (₹${expenseToDelete?.amount})?`}
        onConfirm={handleDeleteExpense}
        onClose={() => setExpenseToDelete(null)}
      />
    </div>
  );
}
