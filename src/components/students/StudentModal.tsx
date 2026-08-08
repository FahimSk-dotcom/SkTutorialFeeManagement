"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, UserPlus, Save } from "lucide-react";
import { toast } from "sonner";
import { studentSchema, StudentInput } from "@/schemas";
import { Student } from "@/types";

interface StudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  studentToEdit?: Student | null;
}

const CLASSES = ["Jr.Kg","Sr.Kg","Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8", "Class 9", "Class 10"];

export function StudentModal({
  isOpen,
  onClose,
  onSuccess,
  studentToEdit,
}: StudentModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StudentInput>({
    // @ts-ignore
    resolver: zodResolver(studentSchema),
    defaultValues: {
      name: "",
      class: "Class 10",
      monthlyFee: 1500,
      parentName: "",
      parentMobile: "",
      alternateMobile: "",
      admissionDate: new Date().toISOString().split("T")[0],
      status: "Active",
      address: "",
      remarks: "",
    },
  });

  useEffect(() => {
    if (studentToEdit) {
      reset({
        name: studentToEdit.name,
        class: studentToEdit.class,
        monthlyFee: Number(studentToEdit.monthlyFee),
        parentName: studentToEdit.parentName,
        parentMobile: studentToEdit.parentMobile,
        alternateMobile: studentToEdit.alternateMobile || "",
        admissionDate: studentToEdit.admissionDate ? studentToEdit.admissionDate.split("T")[0] : new Date().toISOString().split("T")[0],
        status: studentToEdit.status,
        address: studentToEdit.address || "",
        remarks: studentToEdit.remarks || "",
      });
    } else {
      reset({
        name: "",
        class: "Class 10",
        monthlyFee: 1500,
        parentName: "",
        parentMobile: "",
        alternateMobile: "",
        admissionDate: new Date().toISOString().split("T")[0],
        status: "Active",
        address: "",
        remarks: "",
      });
    }
  }, [studentToEdit, reset]);

  if (!isOpen) return null;

  const onSubmit = async (data: StudentInput) => {
    try {
      const url = studentToEdit
        ? `/api/students/${studentToEdit._id}`
        : "/api/students";
      const method = studentToEdit ? "PUT" : "POST";

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

      toast.success(
        studentToEdit
          ? "Student details updated successfully"
          : "Student registered successfully!"
      );
      onSuccess();
      onClose();
    } catch (err) {
      toast.error("Failed to save student details");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-card text-card-foreground border border-border rounded-3xl p-6 shadow-elevated relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-muted-foreground hover:bg-muted transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 flex items-center justify-center font-bold">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-lg">
              {studentToEdit ? `Edit Student (${studentToEdit.studentId})` : "Add New Student"}
            </h2>
            <p className="text-xs text-muted-foreground">
              {studentToEdit
                ? "Update student information and tuition fee settings"
                : "Register a new tuition student into SK Tutorials"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Student Name */}
            <div>
              <label className="block text-xs font-semibold mb-1 text-foreground">
                Student Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Ahmed Shaikh"
                {...register("name")}
                className="w-full px-3.5 py-2 text-sm bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
              {errors.name && (
                <p className="text-xs text-rose-500 mt-1">{errors.name.message}</p>
              )}
            </div>

            {/* Class */}
            <div>
              <label className="block text-xs font-semibold mb-1 text-foreground">Class *</label>
              <select
                {...register("class")}
                className="w-full px-3.5 py-2 text-sm bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              >
                {CLASSES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Monthly Fee */}
            <div>
              <label className="block text-xs font-semibold mb-1 text-foreground">
                Monthly Fee (₹) *
              </label>
              <input
                type="number"
                placeholder="1500"
                {...register("monthlyFee", { valueAsNumber: true })}
                className="w-full px-3.5 py-2 text-sm bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
              {errors.monthlyFee && (
                <p className="text-xs text-rose-500 mt-1">{errors.monthlyFee.message}</p>
              )}
            </div>

            {/* Parent Name */}
            <div>
              <label className="block text-xs font-semibold mb-1 text-foreground">
                Parent Name *
              </label>
              <input
                type="text"
                placeholder="Parent / Guardian Name"
                {...register("parentName")}
                className="w-full px-3.5 py-2 text-sm bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
              {errors.parentName && (
                <p className="text-xs text-rose-500 mt-1">{errors.parentName.message}</p>
              )}
            </div>

            {/* Parent Mobile */}
            <div>
              <label className="block text-xs font-semibold mb-1 text-foreground">
                Parent Mobile (10 digits) *
              </label>
              <input
                type="text"
                maxLength={10}
                placeholder="9876543210"
                {...register("parentMobile")}
                className="w-full px-3.5 py-2 text-sm bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
              {errors.parentMobile && (
                <p className="text-xs text-rose-500 mt-1">{errors.parentMobile.message}</p>
              )}
            </div>

            {/* Alternate Mobile */}
            <div>
              <label className="block text-xs font-semibold mb-1 text-foreground">
                Alternate Mobile (Optional)
              </label>
              <input
                type="text"
                maxLength={10}
                placeholder="Optional 10 digits"
                {...register("alternateMobile")}
                className="w-full px-3.5 py-2 text-sm bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>

            {/* Admission Date */}
            <div>
              <label className="block text-xs font-semibold mb-1 text-foreground">
                Admission Date *
              </label>
              <input
                type="date"
                {...register("admissionDate")}
                className="w-full px-3.5 py-2 text-sm bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
              {errors.admissionDate && (
                <p className="text-xs text-rose-500 mt-1">{errors.admissionDate.message}</p>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-semibold mb-1 text-foreground">Status</label>
              <select
                {...register("status")}
                className="w-full px-3.5 py-2 text-sm bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-semibold mb-1 text-foreground">
              Address (Optional)
            </label>
            <input
              type="text"
              placeholder="Residential address"
              {...register("address")}
              className="w-full px-3.5 py-2 text-sm bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-xs font-semibold mb-1 text-foreground">
              Remarks (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Additional notes..."
              {...register("remarks")}
              className="w-full px-3.5 py-2 text-sm bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
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
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-all active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? "Saving..." : studentToEdit ? "Update Student" : "Register Student"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
