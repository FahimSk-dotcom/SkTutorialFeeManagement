"use client";

import React, { useEffect, useState } from "react";
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  Calendar,
  AlertTriangle,
  ReceiptText,
} from "lucide-react";
import { exportToCSV, exportToExcel, exportTableToPDF } from "@/lib/export-utils";
import { toast } from "sonner";

export default function ReportsPage() {
  const [reportType, setReportType] = useState<"collection" | "pending" | "expenses">("collection");
  const [month, setMonth] = useState("All");
  const [year, setYear] = useState(new Date().getFullYear().toString());

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ type: reportType, month, year });
      const res = await fetch(`/api/reports?${params.toString()}`);
      const json = await res.json();
      if (res.ok) {
        setData(json);
      }
    } catch (err) {
      toast.error("Failed to load report data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [reportType, month, year]);

  const handleExportCSV = () => {
    if (!data || !data.report || data.report.length === 0) {
      toast.error("No data to export");
      return;
    }
    exportToCSV(`SK_Tutorials_${reportType}_Report`, data.report);
    toast.success("CSV file downloaded");
  };

  const handleExportExcel = () => {
    if (!data || !data.report || data.report.length === 0) {
      toast.error("No data to export");
      return;
    }
    exportToExcel(`SK_Tutorials_${reportType}_Report`, data.report);
    toast.success("Excel file downloaded");
  };

  const handleExportPDF = () => {
    if (!data || !data.report || data.report.length === 0) {
      toast.error("No data to export");
      return;
    }

    if (reportType === "collection") {
      const headers = ["Receipt No", "Student Name", "Class", "Date", "Month/Year", "Amount", "Mode"];
      const rows = data.report.map((item: any) => [
        item.receiptNo,
        item.studentName,
        item.class,
        item.paymentDate,
        item.feeMonth,
        `Rs. ${item.amount}`,
        item.mode,
      ]);
      exportTableToPDF("SK Tutorials - Monthly Collection Report", headers, rows, "Collection_Report");
    } else if (reportType === "pending") {
      const headers = ["Student ID", "Student Name", "Class", "Parent Mobile", "Status", "Pending Months", "Amount"];
      const rows = data.report.map((item: any) => [
        item.studentId,
        item.studentName,
        item.class,
        item.parentMobile,
        item.status,
        item.pendingMonths,
        `Rs. ${item.totalPendingAmount}`,
      ]);
      exportTableToPDF("SK Tutorials - Pending Fees Report", headers, rows, "Pending_Fees_Report");
    } else if (reportType === "expenses") {
      const headers = ["Expense Name", "Category", "Date", "Amount", "Notes"];
      const rows = data.report.map((item: any) => [
        item.name,
        item.category,
        item.date,
        `Rs. ${item.amount}`,
        item.notes || "-",
      ]);
      exportTableToPDF("SK Tutorials - Expenses Report", headers, rows, "Expenses_Report");
    }
    toast.success("PDF generated");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <span>Institute Reports & Exports</span>
          </h1>
          <p className="text-xs text-muted-foreground">
            Generate printable and exportable reports in PDF, Excel, or CSV format
          </p>
        </div>

        {/* Export Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-bold transition-all"
          >
            <FileText className="w-4 h-4 text-emerald-500" />
            <span>CSV</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Excel</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Tabs and Filters */}
      <div className="bg-card border border-border p-4 rounded-3xl shadow-soft space-y-4">
        {/* Report Type Selector */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setReportType("collection")}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
              reportType === "collection"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            }`}
          >
            Monthly Collection
          </button>
          <button
            onClick={() => setReportType("pending")}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
              reportType === "pending"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            }`}
          >
            Pending Fees
          </button>
          <button
            onClick={() => setReportType("expenses")}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
              reportType === "expenses"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            }`}
          >
            Expense Ledger
          </button>
        </div>

        {/* Date Filter */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-border/50">
          <div>
            <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Month</label>
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-muted/50 border border-border rounded-xl font-medium"
            >
              <option value="All">All Months</option>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  Month {i + 1}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Year</label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-muted/50 border border-border rounded-xl font-medium"
            />
          </div>
        </div>
      </div>

      {/* Report Data Display */}
      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-card border border-border rounded-2xl" />
          ))}
        </div>
      ) : !data || !data.report || data.report.length === 0 ? (
        <div className="text-center py-12 bg-card border border-dashed border-border rounded-3xl">
          <p className="text-base font-bold text-foreground">No data available for this report</p>
          <p className="text-xs text-muted-foreground mt-1">Try selecting a different filter range</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-soft">
          {/* Collection Report Table */}
          {reportType === "collection" && (
            <div>
              <div className="p-4 bg-muted/40 border-b border-border flex items-center justify-between">
                <span className="font-extrabold text-xs uppercase tracking-wider text-muted-foreground">
                  Collection Breakdown
                </span>
                <span className="font-black text-sm text-emerald-600 dark:text-emerald-400">
                  Total Collected: ₹{data.totalCollected || 0}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground font-semibold uppercase">
                      <th className="p-3">Receipt No</th>
                      <th className="p-3">Student Name</th>
                      <th className="p-3">Class</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Fee Month</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">Mode</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {data.report.map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-muted/30">
                        <td className="p-3 font-bold text-foreground">{item.receiptNo}</td>
                        <td className="p-3 font-semibold text-foreground">{item.studentName}</td>
                        <td className="p-3 text-muted-foreground">{item.class}</td>
                        <td className="p-3 text-muted-foreground">{item.paymentDate}</td>
                        <td className="p-3 font-medium text-foreground">{item.feeMonth}</td>
                        <td className="p-3 font-extrabold text-emerald-600 dark:text-emerald-400">
                          ₹{item.amount}
                        </td>
                        <td className="p-3 font-medium text-foreground">{item.mode}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pending Fees Report Table */}
          {reportType === "pending" && (
            <div>
              <div className="p-4 bg-muted/40 border-b border-border flex items-center justify-between">
                <span className="font-extrabold text-xs uppercase tracking-wider text-muted-foreground">
                  Pending Fees Breakdown
                </span>
                <span className="font-black text-sm text-rose-600 dark:text-rose-400">
                  Total Pending: ₹{data.totalPending || 0}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground font-semibold uppercase">
                      <th className="p-3">Student ID</th>
                      <th className="p-3">Student Name</th>
                      <th className="p-3">Class</th>
                      <th className="p-3">Parent Mobile</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Pending Months</th>
                      <th className="p-3">Pending Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {data.report.map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-muted/30">
                        <td className="p-3 font-bold text-foreground">{item.studentId}</td>
                        <td className="p-3 font-semibold text-foreground">{item.studentName}</td>
                        <td className="p-3 text-muted-foreground">{item.class}</td>
                        <td className="p-3 text-muted-foreground">{item.parentMobile}</td>
                        <td className="p-3 font-bold text-rose-500">{item.status}</td>
                        <td className="p-3 font-medium text-foreground">{item.pendingMonths}</td>
                        <td className="p-3 font-extrabold text-rose-600 dark:text-rose-400">
                          ₹{item.totalPendingAmount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Expenses Report Table */}
          {reportType === "expenses" && (
            <div>
              <div className="p-4 bg-muted/40 border-b border-border flex items-center justify-between">
                <span className="font-extrabold text-xs uppercase tracking-wider text-muted-foreground">
                  Expense Ledger
                </span>
                <span className="font-black text-sm text-rose-600 dark:text-rose-400">
                  Total Expenses: ₹{data.totalExpense || 0}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground font-semibold uppercase">
                      <th className="p-3">Expense Name</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {data.report.map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-muted/30">
                        <td className="p-3 font-bold text-foreground">{item.name}</td>
                        <td className="p-3 font-semibold text-muted-foreground">{item.category}</td>
                        <td className="p-3 text-muted-foreground">{item.date}</td>
                        <td className="p-3 font-extrabold text-rose-600 dark:text-rose-400">
                          ₹{item.amount}
                        </td>
                        <td className="p-3 text-muted-foreground">{item.notes || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
