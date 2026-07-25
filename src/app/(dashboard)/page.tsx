"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Wallet,
  CalendarCheck,
  AlertTriangle,
  Clock,
  UserPlus,
  CreditCard,
  ArrowUpRight,
  TrendingUp,
  ReceiptText,
  Plus,
} from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { WhatsAppButton } from "@/components/shared/WhatsAppButton";
import { StudentModal } from "@/components/students/StudentModal";
import { CollectFeeModal } from "@/components/students/CollectFeeModal";
import { ReceiptModal } from "@/components/payments/ReceiptModal";
import { Student, Payment } from "@/types";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [isCollectFeeOpen, setIsCollectFeeOpen] = useState(false);
  const [selectedStudentForCollect, setSelectedStudentForCollect] = useState<Student | null>(null);
  const [receiptPayment, setReceiptPayment] = useState<Payment | null>(null);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch("/api/dashboard");
      const json = await res.json();
      if (res.ok) {
        setData(json);
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-card border border-border rounded-3xl" />
          ))}
        </div>
        <div className="h-64 bg-card border border-border rounded-3xl" />
      </div>
    );
  }

  const stats = data?.stats || {};
  const recentPayments = data?.recentPayments || [];
  const dueStudentsList: any[] = data?.dueStudentsList || [];
  const collectionChartData = data?.collectionChartData || [];

  // Helper to group siblings by parentMobile for consolidated WhatsApp reminders
  const getFamilyDuesForDashboard = (parentMobile: string) => {
    const familyItems = dueStudentsList.filter(
      (item: any) => item.student.parentMobile === parentMobile
    );
    return familyItems.map((item: any) => ({
      student: item.student,
      dueInfo: item.dueInfo,
    }));
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-indigo-600 to-indigo-800 text-white p-6 rounded-3xl shadow-elevated">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            SK Tutorials Fee Management
          </h1>
          <p className="text-xs sm:text-sm text-indigo-100/80 mt-1 font-medium">
            Welcome back, Admin! Here is today&apos;s tuition overview.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsAddStudentOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-indigo-700 hover:bg-indigo-50 font-semibold text-xs rounded-2xl shadow-sm transition-all active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Student</span>
          </button>

          <button
            onClick={() => {
              if (dueStudentsList.length > 0) {
                setSelectedStudentForCollect(dueStudentsList[0].student);
              }
              setIsCollectFeeOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs rounded-2xl shadow-sm transition-all active:scale-95"
          >
            <CreditCard className="w-4 h-4" />
            <span>Collect Fee</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Active Students */}
        <div className="bg-card border border-border p-4 rounded-3xl shadow-soft">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground">Active Students</span>
            <div className="p-2 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
              <Users className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-foreground">
            {stats.totalActiveStudents || 0}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1 font-medium">Enrolled in institute</p>
        </div>

        {/* Today's Collection */}
        <div className="bg-card border border-border p-4 rounded-3xl shadow-soft">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground">Today&apos;s Collection</span>
            <div className="p-2 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
              <Wallet className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
            ₹{stats.todaysCollection || 0}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1 font-medium">Collected today</p>
        </div>

        {/* Current Month Collection */}
        <div className="bg-card border border-border p-4 rounded-3xl shadow-soft">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground">Month Collection</span>
            <div className="p-2 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
              <CalendarCheck className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400">
            ₹{stats.currentMonthCollection || 0}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1 font-medium">This month&apos;s total</p>
        </div>

        {/* Total Pending Amount */}
        <div className="bg-card border border-border p-4 rounded-3xl shadow-soft">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground">Pending Amount</span>
            <div className="p-2 rounded-2xl bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400">
              <AlertTriangle className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400">
            ₹{stats.totalPendingAmount || 0}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1 font-medium">
            {stats.studentsWithDueCount || 0} students due
          </p>
        </div>
      </div>

      {/* Due Students Quick Action Section */}
      <div className="bg-card border border-border rounded-3xl p-5 shadow-soft">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-extrabold text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>Students with Pending & Due Fees</span>
            </h2>
            <p className="text-xs text-muted-foreground">
              {stats.studentsDueTodayCount || 0} due today • Instant WhatsApp reminder triggers
            </p>
          </div>
          <Link
            href="/students?dueFilter=OVERDUE"
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {dueStudentsList.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-2xl">
            <p className="text-sm font-semibold">🎉 All tuition fees are fully collected!</p>
            <p className="text-xs">No pending or overdue fees found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {dueStudentsList.slice(0, 6).map((item: any) => (
              <div
                key={item.student.studentId}
                className="p-4 rounded-2xl border border-border/80 bg-muted/40 hover:bg-muted/70 transition-all space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-sm">{item.student.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {item.student.studentId} • Class {item.student.class}
                    </p>
                  </div>
                  <StatusBadge status={item.dueInfo.status} size="sm" />
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-border/50">
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Total Pending:</span>
                    <span className="font-extrabold text-rose-600 dark:text-rose-400">
                      ₹{item.dueInfo.totalPendingAmount}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setSelectedStudentForCollect(item.student);
                        setIsCollectFeeOpen(true);
                      }}
                      className="px-2.5 py-1 text-xs font-bold bg-indigo-600 text-white rounded-xl shadow-xs hover:bg-indigo-700 transition-all active:scale-95"
                    >
                      Collect
                    </button>

                    <WhatsAppButton
                      parentMobile={item.student.parentMobile}
                      studentDues={getFamilyDuesForDashboard(item.student.parentMobile)}
                      size="sm"
                      label="Remind"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Monthly Collection Visual Breakdown & Recent Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Collection Breakdown Cards */}
        <div className="bg-card border border-border rounded-3xl p-5 shadow-soft lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-extrabold text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <span>Monthly Fee Collection Overview</span>
              </h2>
              <p className="text-xs text-muted-foreground">Yearly progress breakdown per month</p>
            </div>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 pt-2">
            {collectionChartData.map((item: any) => (
              <div
                key={item.month}
                className="p-3 rounded-2xl bg-muted/40 border border-border/60 text-center space-y-1"
              >
                <span className="text-[11px] font-bold text-muted-foreground uppercase">{item.month}</span>
                <p className="font-extrabold text-xs text-foreground">₹{item.amount}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Collection Timeline */}
        <div className="bg-card border border-border rounded-3xl p-5 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-extrabold text-base flex items-center gap-2">
              <ReceiptText className="w-4 h-4 text-indigo-500" />
              <span>Recent Payments</span>
            </h2>
            <Link
              href="/payments"
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              All History
            </Link>
          </div>

          {recentPayments.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">No payments recorded yet</p>
          ) : (
            <div className="space-y-3">
              {recentPayments.map((p: any) => (
                <div
                  key={p._id}
                  onClick={() => setReceiptPayment(p)}
                  className="flex items-center justify-between p-3 rounded-2xl bg-muted/30 border border-border/40 hover:bg-muted/60 transition-all cursor-pointer"
                >
                  <div>
                    <p className="font-bold text-xs">{p.studentName}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {p.receiptNo} • {p.paymentDate}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-extrabold text-xs text-emerald-600 dark:text-emerald-400">
                      +₹{p.amount}
                    </p>
                    <span className="text-[10px] text-muted-foreground font-semibold">{p.mode}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Button for Mobile */}
      <button
        onClick={() => setIsAddStudentOpen(true)}
        className="md:hidden fixed bottom-20 right-4 z-40 w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/40 active:scale-95"
        title="Add New Student"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Modals */}
      <StudentModal
        isOpen={isAddStudentOpen}
        onClose={() => setIsAddStudentOpen(false)}
        onSuccess={fetchDashboardData}
      />

      <CollectFeeModal
        isOpen={isCollectFeeOpen}
        onClose={() => {
          setIsCollectFeeOpen(false);
          setSelectedStudentForCollect(null);
        }}
        onSuccess={(payment) => {
          fetchDashboardData();
          setReceiptPayment(payment);
        }}
        student={selectedStudentForCollect}
      />

      <ReceiptModal
        isOpen={!!receiptPayment}
        onClose={() => setReceiptPayment(null)}
        payment={receiptPayment}
      />
    </div>
  );
}
