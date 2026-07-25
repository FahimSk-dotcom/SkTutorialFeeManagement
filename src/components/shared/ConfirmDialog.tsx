"use client";

import React from "react";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDanger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isDanger = true,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-card text-card-foreground border border-border rounded-3xl p-6 shadow-elevated relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-muted-foreground hover:bg-muted transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
              isDanger
                ? "bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400"
                : "bg-indigo-500/10 text-indigo-600"
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base">{title}</h3>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted rounded-xl transition-all"
          >
            {cancelLabel}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 text-xs font-semibold text-white rounded-xl shadow-sm transition-all active:scale-95 ${
              isDanger
                ? "bg-rose-600 hover:bg-rose-700 shadow-rose-500/20"
                : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
