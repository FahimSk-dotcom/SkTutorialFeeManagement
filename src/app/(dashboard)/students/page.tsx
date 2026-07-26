"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  Plus,
  Trash2,
  Edit,
} from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { WhatsAppButton } from "@/components/shared/WhatsAppButton";
import { StudentModal } from "@/components/students/StudentModal";
import { CollectFeeModal } from "@/components/students/CollectFeeModal";
import { ReceiptModal } from "@/components/payments/ReceiptModal";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Student, Payment } from "@/types";
import { toast } from "sonner";

const CLASSES = ["All","Jr.Kg","Sr.Kg", "Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8", "Class 9"];

export default function StudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [classFilter, setClassFilter] = useState("All");
  const [dueFilter, setDueFilter] = useState("All");

  // Selection for bulk actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
  const [studentForCollectFee, setStudentForCollectFee] = useState<Student | null>(null);
  const [receiptPayment, setReceiptPayment] = useState<Payment | null>(null);

  // Confirm deletion dialog
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [bulkConfirmAction, setBulkConfirmAction] = useState<"delete" | "activate" | "deactivate" | null>(null);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        search,
        status: statusFilter,
        class: classFilter,
        dueFilter,
      });

      const res = await fetch(`/api/students?${queryParams.toString()}`);
      const json = await res.json();
      if (res.ok) {
        setStudents(json.students || []);
      }
    } catch (err) {
      toast.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [search, statusFilter, classFilter, dueFilter]);

  // Helper to group siblings by parentMobile for consolidated WhatsApp messages
  const getFamilyDues = (targetStudent: any) => {
    const family = students.filter(
      (s) => s.parentMobile === targetStudent.parentMobile
    );
    return family.map((s) => ({ student: s, dueInfo: s.dueInfo }));
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === students.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(students.map((s) => s.studentId));
    }
  };

  const toggleSelect = (studentId: string) => {
    if (selectedIds.includes(studentId)) {
      setSelectedIds(selectedIds.filter((id) => id !== studentId));
    } else {
      setSelectedIds([...selectedIds, studentId]);
    }
  };

  const handleBulkAction = async (action: "delete" | "activate" | "deactivate") => {
    if (selectedIds.length === 0) return;
    try {
      const res = await fetch("/api/students/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, studentIds: selectedIds }),
      });
      const json = await res.json();
      if (res.ok) {
        toast.success(json.message);
        setSelectedIds([]);
        fetchStudents();
      } else {
        toast.error(json.error || "Action failed");
      }
    } catch (err) {
      toast.error("Bulk action failed");
    }
  };

  const handleDeleteSingle = async () => {
    if (!studentToDelete) return;
    try {
      const res = await fetch(`/api/students/${studentToDelete._id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Student deleted successfully");
        fetchStudents();
      } else {
        toast.error("Delete failed");
      }
    } catch (err) {
      toast.error("Delete error");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <span>Student Directory</span>
          </h1>
          <p className="text-xs text-muted-foreground">
            Manage tuition students, view dynamic fee statuses, and record payments
          </p>
        </div>

        <button
          onClick={() => {
            setStudentToEdit(null);
            setIsAddStudentOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Student</span>
        </button>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-card border border-border p-4 rounded-3xl shadow-soft space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Instant Search */}
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search Name, Parent, Mobile, ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              suppressHydrationWarning
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-muted/50 border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          {/* Due Status Filter */}
          <div>
            <select
              value={dueFilter}
              onChange={(e) => setDueFilter(e.target.value)}
              suppressHydrationWarning
              className="w-full px-3 py-2 text-xs sm:text-sm bg-muted/50 border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-medium"
            >
              <option value="All">All Due Statuses</option>
              <option value="PAID">Paid Only</option>
              <option value="DUE_TODAY">Due Today Only</option>
              <option value="OVERDUE">Overdue Only</option>
            </select>
          </div>

          {/* Class Filter */}
          <div>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              suppressHydrationWarning
              className="w-full px-3 py-2 text-xs sm:text-sm bg-muted/50 border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-medium"
            >
              {CLASSES.map((c) => (
                <option key={c} value={c}>
                  {c === "All" ? "All Classes" : c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Bulk Action Bar */}
        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs">
            <span className="font-semibold text-indigo-700 dark:text-indigo-300">
              {selectedIds.length} student(s) selected
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setBulkConfirmAction("activate")}
                className="px-3 py-1 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-all"
              >
                Activate
              </button>
              <button
                onClick={() => setBulkConfirmAction("deactivate")}
                className="px-3 py-1 rounded-xl bg-amber-600 text-white font-bold hover:bg-amber-700 transition-all"
              >
                Deactivate
              </button>
              <button
                onClick={() => setBulkConfirmAction("delete")}
                className="px-3 py-1 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Student List View */}
      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-card border border-border rounded-2xl" />
          ))}
        </div>
      ) : students.length === 0 ? (
        <div className="text-center py-12 bg-card border border-dashed border-border rounded-3xl">
          <p className="text-base font-bold text-foreground">No students found</p>
          <p className="text-xs text-muted-foreground mt-1">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div>
          {/* Desktop Table View */}
          <div className="hidden md:block bg-card border border-border rounded-3xl overflow-hidden shadow-soft">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <th className="p-4 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === students.length && students.length > 0}
                      onChange={toggleSelectAll}
                      suppressHydrationWarning
                      className="rounded border-border"
                    />
                  </th>
                  <th className="p-4">Student</th>
                  <th className="p-4">Class</th>
                  <th className="p-4">Fee / Mo</th>
                  <th className="p-4">Parent Details</th>
                  <th className="p-4">Fee Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-xs">
                {students.map((student) => (
                  <tr key={student._id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(student.studentId)}
                        onChange={() => toggleSelect(student.studentId)}
                        suppressHydrationWarning
                        className="rounded border-border"
                      />
                    </td>
                    <td className="p-4">
                      <Link
                        href={`/students/${student._id}`}
                        className="font-bold text-sm text-foreground hover:text-indigo-600 transition-colors"
                      >
                        {student.name}
                      </Link>
                      <p className="text-[11px] text-muted-foreground">{student.studentId}</p>
                    </td>
                    <td className="p-4 font-semibold text-foreground">{student.class}</td>
                    <td className="p-4 font-bold text-foreground">₹{student.monthlyFee}</td>
                    <td className="p-4">
                      <p className="font-semibold text-foreground">{student.parentName}</p>
                      <p className="text-[10px] text-muted-foreground">{student.parentMobile}</p>
                    </td>
                    <td className="p-4">
                      <StatusBadge status={student.dueInfo?.status} size="sm" />
                      {student.dueInfo?.totalPendingAmount > 0 && (
                        <p className="text-[10px] text-rose-500 font-semibold mt-0.5">
                          Pending: ₹{student.dueInfo.totalPendingAmount}
                        </p>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setStudentForCollectFee(student);
                          }}
                          className="px-2.5 py-1 rounded-xl bg-emerald-600 text-white font-semibold text-[11px] hover:bg-emerald-700 transition-all active:scale-95"
                          title="Collect Fee"
                        >
                          Collect
                        </button>

                        <WhatsAppButton
                          parentMobile={student.parentMobile}
                          studentDues={getFamilyDues(student)}
                          size="sm"
                          label="WA"
                        />

                        <button
                          onClick={() => {
                            setStudentToEdit(student);
                            setIsAddStudentOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-indigo-600 hover:bg-muted transition-colors"
                          title="Edit Student"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setStudentToDelete(student)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-muted transition-colors"
                          title="Delete Student"
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

          {/* Mobile Responsive Card Grid */}
          <div className="md:hidden space-y-3">
            {students.map((student) => (
              <div
                key={student._id}
                className="bg-card border border-border p-4 rounded-3xl shadow-soft space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <Link
                      href={`/students/${student._id}`}
                      className="font-extrabold text-base text-foreground hover:text-indigo-600"
                    >
                      {student.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {student.studentId} • {student.class}
                    </p>
                  </div>
                  <StatusBadge status={student.dueInfo?.status} size="sm" />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs p-3 rounded-2xl bg-muted/40 border border-border/40">
                  <div>
                    <span className="text-muted-foreground text-[10px] block">Monthly Fee:</span>
                    <span className="font-bold text-foreground">₹{student.monthlyFee}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-[10px] block">Parent:</span>
                    <span className="font-bold text-foreground">{student.parentName}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-[10px] block">Mobile:</span>
                    <span className="font-bold text-foreground">{student.parentMobile}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-[10px] block">Pending Due:</span>
                    <span className="font-bold text-rose-600 dark:text-rose-400">
                      ₹{student.dueInfo?.totalPendingAmount || 0}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setStudentForCollectFee(student)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-xs"
                    >
                      Collect
                    </button>
                    <WhatsAppButton
                      parentMobile={student.parentMobile}
                      studentDues={getFamilyDues(student)}
                      size="sm"
                      label="WhatsApp"
                    />
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setStudentToEdit(student);
                        setIsAddStudentOpen(true);
                      }}
                      className="p-2 rounded-xl text-muted-foreground hover:bg-muted"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setStudentToDelete(student)}
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

      {/* Modals */}
      <StudentModal
        isOpen={isAddStudentOpen}
        onClose={() => {
          setIsAddStudentOpen(false);
          setStudentToEdit(null);
        }}
        onSuccess={fetchStudents}
        studentToEdit={studentToEdit}
      />

      <CollectFeeModal
        isOpen={!!studentForCollectFee}
        onClose={() => setStudentForCollectFee(null)}
        onSuccess={(payment) => {
          fetchStudents();
          setReceiptPayment(payment);
        }}
        student={studentForCollectFee}
      />

      <ReceiptModal
        isOpen={!!receiptPayment}
        onClose={() => setReceiptPayment(null)}
        payment={receiptPayment}
      />

      <ConfirmDialog
        isOpen={!!studentToDelete}
        title="Delete Student?"
        description={`Are you sure you want to delete ${studentToDelete?.name}? All associated fee payment history will be permanently deleted.`}
        onConfirm={handleDeleteSingle}
        onClose={() => setStudentToDelete(null)}
      />

      <ConfirmDialog
        isOpen={!!bulkConfirmAction}
        title={`Bulk ${bulkConfirmAction?.toUpperCase()}?`}
        description={`Are you sure you want to ${bulkConfirmAction} ${selectedIds.length} selected student(s)?`}
        onConfirm={() => {
          if (bulkConfirmAction) handleBulkAction(bulkConfirmAction);
        }}
        onClose={() => setBulkConfirmAction(null)}
      />
    </div>
  );
}
