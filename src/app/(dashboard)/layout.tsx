"use client";

import React, { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { StudentModal } from "@/components/students/StudentModal";
import { CollectFeeModal } from "@/components/students/CollectFeeModal";
import { ReceiptModal } from "@/components/payments/ReceiptModal";
import { Student, Payment } from "@/types";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [isCollectFeeOpen, setIsCollectFeeOpen] = useState(false);
  const [selectedStudentForFee, setSelectedStudentForFee] = useState<Student | null>(null);
  const [receiptPayment, setReceiptPayment] = useState<Payment | null>(null);

  const handleOpenQuickCollect = () => {
    // If no specific student, open collect fee modal or student list
    setIsCollectFeeOpen(true);
  };

  const handlePaymentSuccess = (payment: Payment) => {
    setReceiptPayment(payment);
  };

  return (
    <div className="min-h-screen flex bg-background text-foreground transition-colors duration-200">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        <Header
          onOpenQuickCollect={handleOpenQuickCollect}
          onOpenAddStudent={() => setIsAddStudentOpen(true)}
        />
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">{children}</main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />

      {/* Global Modals */}
      <StudentModal
        isOpen={isAddStudentOpen}
        onClose={() => setIsAddStudentOpen(false)}
        onSuccess={() => {
          if (typeof window !== "undefined") window.location.reload();
        }}
      />

      <CollectFeeModal
        isOpen={isCollectFeeOpen}
        onClose={() => setIsCollectFeeOpen(false)}
        onSuccess={handlePaymentSuccess}
        student={selectedStudentForFee}
      />

      <ReceiptModal
        isOpen={!!receiptPayment}
        onClose={() => setReceiptPayment(null)}
        payment={receiptPayment}
      />
    </div>
  );
}
