"use client";

import React from "react";
import { CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { DueStatus } from "@/types";

interface StatusBadgeProps {
  status: DueStatus | "Active" | "Inactive";
  size?: "sm" | "md" | "lg";
}

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs gap-1",
    md: "px-2.5 py-1 text-xs font-semibold gap-1.5",
    lg: "px-3 py-1.5 text-sm font-bold gap-2",
  }[size];

  if (status === "PAID" || status === "Active") {
    return (
      <span
        className={`inline-flex items-center rounded-full bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/20 ${sizeClasses}`}
      >
        <CheckCircle2 className="w-3.5 h-3.5" />
        {status === "PAID" ? "Paid" : "Active"}
      </span>
    );
  }

  if (status === "DUE_TODAY") {
    return (
      <span
        className={`inline-flex items-center rounded-full bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-500/20 ${sizeClasses}`}
      >
        <Clock className="w-3.5 h-3.5 animate-pulse" />
        Due Today
      </span>
    );
  }

  if (status === "OVERDUE" || status === "Inactive") {
    return (
      <span
        className={`inline-flex items-center rounded-full bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 border border-rose-500/20 ${sizeClasses}`}
      >
        <AlertTriangle className="w-3.5 h-3.5" />
        {status === "OVERDUE" ? "Overdue" : "Inactive"}
      </span>
    );
  }

  return null;
}
