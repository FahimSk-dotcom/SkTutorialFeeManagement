"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Settings as SettingsIcon, Save, QrCode, Building2, MessageSquare, Receipt } from "lucide-react";
import { settingsSchema, SettingsInput } from "@/schemas";
import { toast } from "sonner";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SettingsInput>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      instituteName: "SK Tutorials",
      logoUrl: "https://res.cloudinary.com/dfmcngduw/image/upload/v1784896530/86a65215-ce9c-427d-9cc5-f67d0a08040c_gyndgk.png",
      upiId: "fs308605@okhdfcbank",
      upiQrUrl: "https://res.cloudinary.com/dfmcngduw/image/upload/v1784896626/WhatsApp_Image_2026-07-24_at_6.06.26_PM_l0ulqc.jpg",
      receiptFooter: "Thank you for choosing SK Tutorials. Fee once paid is non-refundable.",
      whatsappTemplate: "Hello, this is a tuition fee reminder from SK Tutorials.",
    },
  });

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      const json = await res.json();
      if (res.ok && json.settings) {
        reset(json.settings);
      }
    } catch (err) {
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [reset]);

  const onSubmit = async (data: SettingsInput) => {
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();
      if (res.ok) {
        toast.success("Institute settings saved successfully!");
      } else {
        toast.error(json.error || "Save failed");
      }
    } catch (err) {
      toast.error("Failed to update settings");
    }
  };

  if (loading) {
    return (
      <div className="h-64 bg-card border border-border rounded-3xl animate-pulse" />
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          <span>Institute Branding & Settings</span>
        </h1>
        <p className="text-xs text-muted-foreground">
          Configure institute profile, UPI payment details, receipt footers, and WhatsApp defaults
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Institute Info */}
        <div className="bg-card border border-border p-6 rounded-3xl shadow-soft space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Building2 className="w-5 h-5 text-indigo-600" />
            <h2 className="font-bold text-sm">Institute Details</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1 text-foreground">
                Institute Name *
              </label>
              <input
                type="text"
                {...register("instituteName")}
                className="w-full px-3.5 py-2 text-sm bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
              {errors.instituteName && (
                <p className="text-xs text-rose-500 mt-1">{errors.instituteName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 text-foreground">
                
              </label>
              <input
                type="text"
                placeholder="https://example.com/logo.png"
                {...register("logoUrl")}
                className="w-full px-3.5 py-2 text-sm bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
          </div>
        </div>

        {/* UPI & Payment Settings */}
        <div className="bg-card border border-border p-6 rounded-3xl shadow-soft space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <QrCode className="w-5 h-5 text-emerald-600" />
            <h2 className="font-bold text-sm">UPI & QR Code Details</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1 text-foreground">
                UPI VPA / ID
              </label>
              <input
                type="text"
                placeholder="sktutorials@upi"
                {...register("upiId")}
                className="w-full px-3.5 py-2 text-sm bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 text-foreground">
                UPI QR Code Image URL (Optional)
              </label>
              <input
                type="text"
                placeholder="https://example.com/qr.png"
                {...register("upiQrUrl")}
                className="w-full px-3.5 py-2 text-sm bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>
          </div>
        </div>

        {/* Receipt & WhatsApp Templates */}
        <div className="bg-card border border-border p-6 rounded-3xl shadow-soft space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Receipt className="w-5 h-5 text-indigo-600" />
            <h2 className="font-bold text-sm">Receipt & WhatsApp Messaging Defaults</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1 text-foreground">
                Receipt Footer Note
              </label>
              <textarea
                rows={2}
                {...register("receiptFooter")}
                className="w-full px-3.5 py-2 text-sm bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 text-foreground">
                Default WhatsApp Reminder Template Header
              </label>
              <textarea
                rows={2}
                {...register("whatsappTemplate")}
                className="w-full px-3.5 py-2 text-sm bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md shadow-indigo-500/20 transition-all active:scale-95 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSubmitting ? "Saving Settings..." : "Save Institute Settings"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
