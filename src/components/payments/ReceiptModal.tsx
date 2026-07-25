"use client";

import React, { useRef, useState, useEffect } from "react";
import {
  X,
  Share2,
  Download,
  CheckCircle2,
  Calendar,
  FileText,
  User,
  CreditCard,
  Award,
  Lightbulb,
  Target,
} from "lucide-react";
import { Payment } from "@/types";
import { getMonthName } from "@/lib/due-calculator";
import { cleanClassDisplay } from "@/lib/whatsapp";
import jsPDF from "jspdf";
import { toast } from "sonner";

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: Payment | null;
  instituteName?: string;
  receiptFooter?: string;
  logoUrl?: string;
  upiQrUrl?: string;
}

const DEFAULT_LOGO =
  "https://res.cloudinary.com/dfmcngduw/image/upload/v1784896530/86a65215-ce9c-427d-9cc5-f67d0a08040c_gyndgk.png";
const DEFAULT_QR =
  "https://res.cloudinary.com/dfmcngduw/image/upload/v1784896626/WhatsApp_Image_2026-07-24_at_6.06.26_PM_l0ulqc.jpg";

export function numberToWordsRupees(amount: number): string {
  const a = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  const numToWords = (num: number): string => {
    if (num < 20) return a[num];
    if (num < 100) return b[Math.floor(num / 10)] + (num % 10 !== 0 ? " " + a[num % 10] : "");
    if (num < 1000)
      return a[Math.floor(num / 100)] + " Hundred" + (num % 100 !== 0 ? " " + numToWords(num % 100) : "");
    if (num < 100000)
      return (
        numToWords(Math.floor(num / 1000)) +
        " Thousand" +
        (num % 1000 !== 0 ? " " + numToWords(num % 1000) : "")
      );
    if (num < 10000000)
      return (
        numToWords(Math.floor(num / 100000)) +
        " Lakh" +
        (num % 100000 !== 0 ? " " + numToWords(num % 100000) : "")
      );
    return (
      numToWords(Math.floor(num / 10000000)) +
      " Crore" +
      (num % 10000000 !== 0 ? " " + numToWords(num % 10000000) : "")
    );
  };

  if (!amount || amount === 0) return "Rupees Zero Only";
  const words = numToWords(Math.floor(amount));
  return `Rupees ${words} Only`;
}

// Convert image URL to base64 for jsPDF embedding
const loadImageBase64 = (url: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL("image/png"));
        } else {
          resolve("");
        }
      } catch (err) {
        resolve("");
      }
    };
    img.onerror = () => resolve("");
    img.src = url;
  });
};

export function ReceiptModal({
  isOpen,
  onClose,
  payment,
  instituteName = "SK TUTORIALS",
  logoUrl = DEFAULT_LOGO,
  upiQrUrl = DEFAULT_QR,
}: ReceiptModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [fetchedStudent, setFetchedStudent] = useState<{ name: string; class: string } | null>(null);
  const [pdfGenerating, setPdfGenerating] = useState(false);

  useEffect(() => {
    if (payment && payment.studentId) {
      if (
        !payment.studentName ||
        payment.studentName === payment.studentId ||
        !payment.class ||
        payment.class === "-"
      ) {
        fetch(`/api/students/${payment.studentId}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.student) {
              setFetchedStudent({
                name: data.student.name,
                class: data.student.class,
              });
            }
          })
          .catch((err) => console.error("Student detail fetch error in ReceiptModal:", err));
      } else {
        setFetchedStudent(null);
      }
    }
  }, [payment]);

  if (!isOpen || !payment) return null;

  // Determine accurate Student Name and Class
  const accurateStudentName =
    fetchedStudent?.name ||
    (payment.studentName && payment.studentName !== payment.studentId ? payment.studentName : "Student");
  const accurateClassRaw = fetchedStudent?.class || payment.class || "";
  const cleanClass = cleanClassDisplay(accurateClassRaw);
  const displayClass = cleanClass && cleanClass !== "-" ? `Class ${cleanClass}` : "Class 10";

  // Extract academic year (e.g. 2026-27)
  const py = payment.year || 2026;
  const academicYear = `${py}-${String(py + 1).slice(-2)}`;

  // Enhanced Vector PDF Builder
  const buildPDFDoc = async (): Promise<jsPDF> => {
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const logoBase64 = await loadImageBase64(logoUrl || DEFAULT_LOGO);
    const qrBase64 = await loadImageBase64(upiQrUrl || DEFAULT_QR);

    const primaryBlue = [13, 59, 102];
    const goldAccent = [199, 133, 0];
    const emeraldGreen = [4, 120, 87];
    const bgLightBlue = [240, 249, 255];
    const bgLightGray = [248, 250, 252];
    const textDark = [15, 23, 42];
    const textMuted = [100, 116, 139];

    // Outer Frame
    pdf.setDrawColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
    pdf.setLineWidth(1.2);
    pdf.roundedRect(8, 8, 194, 280, 5, 5, "S");

    // Header Logo
    if (logoBase64) {
      try {
        pdf.addImage(logoBase64, "PNG", 14, 14, 22, 22);
      } catch (e) {}
    }

    // Institute Name & Subtitle
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(22);
    pdf.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
    pdf.text(instituteName, 105, 22, { align: "center" });

    pdf.setFontSize(10);
    pdf.setTextColor(goldAccent[0], goldAccent[1], goldAccent[2]);
    pdf.text("--- Excellence in Education ---", 105, 28, { align: "center" });

    pdf.setFontSize(8);
    pdf.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    pdf.setFont("helvetica", "normal");
    pdf.text("Goregaon (E), Mumbai  |  +91 89769 46230", 105, 33, { align: "center" });
    pdf.text("https://sk-tutorials.vercel.app/  |  s.k.tutorials126@gmail.com", 105, 37, { align: "center" });

    // Top-Right PAID Badge Stamp
    pdf.setDrawColor(emeraldGreen[0], emeraldGreen[1], emeraldGreen[2]);
    pdf.setFillColor(236, 253, 245);
    pdf.circle(180, 24, 10, "FD");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(emeraldGreen[0], emeraldGreen[1], emeraldGreen[2]);
    pdf.text("PAID", 180, 24.5, { align: "center" });
    pdf.setFontSize(7);
    pdf.text("* * *", 180, 28, { align: "center" });

    // Separator Line
    pdf.setDrawColor(226, 232, 240);
    pdf.line(14, 42, 196, 42);

    // Official Title Ribbon
    pdf.setFillColor(241, 245, 249);
    pdf.setDrawColor(203, 213, 225);
    pdf.roundedRect(60, 46, 90, 7, 3.5, 3.5, "FD");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
    pdf.text("--- OFFICIAL TUITION FEE RECEIPT ---", 105, 51, { align: "center" });

    // Meta Bar
    pdf.setFillColor(bgLightBlue[0], bgLightBlue[1], bgLightBlue[2]);
    pdf.setDrawColor(186, 230, 253);
    pdf.roundedRect(14, 57, 182, 12, 3, 3, "FD");

    pdf.setFontSize(8);
    pdf.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    pdf.text("Receipt No.", 20, 61);
    pdf.setFontSize(10);
    pdf.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
    pdf.text(payment.receiptNo, 20, 66);

    pdf.setFontSize(8);
    pdf.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    pdf.text("Date", 190, 61, { align: "right" });
    pdf.setFontSize(10);
    pdf.setTextColor(textDark[0], textDark[1], textDark[2]);
    pdf.text(payment.paymentDate, 190, 66, { align: "right" });

    // Student Info Card (Left)
    pdf.setDrawColor(226, 232, 240);
    pdf.setFillColor(bgLightGray[0], bgLightGray[1], bgLightGray[2]);
    pdf.roundedRect(14, 73, 88, 42, 3, 3, "FD");

    pdf.setFillColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
    pdf.roundedRect(14, 73, 88, 7, 3, 3, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(255, 255, 255);
    pdf.text("STUDENT INFORMATION", 18, 78);

    pdf.setFontSize(8);
    pdf.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    pdf.setFont("helvetica", "normal");
    pdf.text("Student Name :", 18, 86);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(textDark[0], textDark[1], textDark[2]);
    pdf.text(accurateStudentName, 98, 86, { align: "right" });

    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    pdf.text("Class :", 18, 93);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(textDark[0], textDark[1], textDark[2]);
    pdf.text(displayClass, 98, 93, { align: "right" });

    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    pdf.text("Student ID :", 18, 100);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(textDark[0], textDark[1], textDark[2]);
    pdf.text(payment.studentId, 98, 100, { align: "right" });

    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    pdf.text("Academic Year :", 18, 107);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(textDark[0], textDark[1], textDark[2]);
    pdf.text(academicYear, 98, 107, { align: "right" });

    // Payment Info Card (Right)
    pdf.setDrawColor(226, 232, 240);
    pdf.setFillColor(bgLightGray[0], bgLightGray[1], bgLightGray[2]);
    pdf.roundedRect(108, 73, 88, 42, 3, 3, "FD");

    pdf.setFillColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
    pdf.roundedRect(108, 73, 88, 7, 3, 3, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(255, 255, 255);
    pdf.text("PAYMENT INFORMATION", 112, 78);

    pdf.setFontSize(8);
    pdf.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    pdf.setFont("helvetica", "normal");
    pdf.text("Fee Month :", 112, 86);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(textDark[0], textDark[1], textDark[2]);
    pdf.text(`${getMonthName(payment.month)} ${payment.year}`, 192, 86, { align: "right" });

    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    pdf.text("Amount Paid :", 112, 93);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(emeraldGreen[0], emeraldGreen[1], emeraldGreen[2]);
    pdf.text(`Rs. ${payment.amount}`, 192, 93, { align: "right" });

    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    pdf.text("Payment Mode :", 112, 100);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(textDark[0], textDark[1], textDark[2]);
    pdf.text(payment.mode, 192, 100, { align: "right" });

    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    pdf.text("Payment Status :", 112, 107);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(emeraldGreen[0], emeraldGreen[1], emeraldGreen[2]);
    pdf.text("Paid", 192, 107, { align: "right" });

    // Amount Received Box
    pdf.setFillColor(236, 253, 245);
    pdf.setDrawColor(110, 231, 183);
    pdf.roundedRect(14, 120, 182, 24, 4, 4, "FD");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(6, 95, 70);
    pdf.text("AMOUNT RECEIVED", 105, 126, { align: "center" });

    pdf.setFontSize(22);
    pdf.setTextColor(emeraldGreen[0], emeraldGreen[1], emeraldGreen[2]);
    pdf.text(`Rs. ${payment.amount}`, 105, 136, { align: "center" });

    pdf.setFontSize(8);
    pdf.setTextColor(51, 65, 85);
    pdf.setFont("helvetica", "normal");
    pdf.text(`(${numberToWordsRupees(payment.amount)})`, 105, 141, { align: "center" });

    // Collection Signature & QR Section
    pdf.setFillColor(bgLightGray[0], bgLightGray[1], bgLightGray[2]);
    pdf.setDrawColor(226, 232, 240);
    pdf.roundedRect(14, 148, 88, 24, 3, 3, "FD");

    pdf.setFontSize(7);
    pdf.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    pdf.text("Collected By", 18, 154);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.setTextColor(textDark[0], textDark[1], textDark[2]);
    pdf.text("Prof. Fahim Sir", 18, 160);

    pdf.setFontSize(7);
    pdf.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    pdf.setFont("helvetica", "normal");
    pdf.text("SK Tutorials", 18, 165);

    pdf.setFont("times", "bolditalic");
    pdf.setFontSize(12);
    pdf.setTextColor(49, 46, 129);
    pdf.text("Fahim Sir", 95, 162, { align: "right" });

    // Scan to Pay QR
    pdf.setFillColor(bgLightBlue[0], bgLightBlue[1], bgLightBlue[2]);
    pdf.setDrawColor(186, 230, 253);
    pdf.roundedRect(108, 148, 88, 24, 3, 3, "FD");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
    pdf.text("Thank you for choosing SK Tutorials.", 112, 155);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(6.5);
    pdf.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    pdf.text("Your trust and support motivate us to", 112, 160);
    pdf.text("deliver the best education.", 112, 163);

    if (qrBase64) {
      try {
        pdf.addImage(qrBase64, "JPEG", 175, 150, 16, 16);
      } catch (e) {}
    }
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(6);
    pdf.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
    pdf.text("Scan to Pay", 183, 169, { align: "center" });

    // Bottom Banner
    pdf.setFillColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
    pdf.roundedRect(14, 176, 182, 10, 3, 3, "F");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(255, 255, 255);
    pdf.text("Quality Education   |   Better Learning   |   Bright Future", 105, 181.5, { align: "center" });

    // Footer Text (Updated: removed [CEO & Founder])
    pdf.setFont("helvetica", "italic");
    pdf.setFontSize(7.5);
    pdf.setTextColor(100, 116, 139);
    pdf.text("Created by Prof. Fahim Sir  |  SK Tutorials", 105, 192, { align: "center" });

    return pdf;
  };

  const handleDownloadPDF = async () => {
    if (pdfGenerating) return;
    setPdfGenerating(true);
    try {
      const pdf = await buildPDFDoc();
      const filename = `Receipt_${payment.receiptNo}.pdf`;
      pdf.save(filename);
    } catch (err) {
      console.error("PDF download error:", err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setPdfGenerating(false);
    }
  };

  // Direct Web Share API matching exact reference pattern
  const handleSharePDF = async () => {
    if (pdfGenerating) return;

    try {
      setPdfGenerating(true);
      const pdf = await buildPDFDoc();
      const pdfBlob = pdf.output("blob");

      const fileCheck = new File([pdfBlob], `Receipt_${payment.receiptNo}.pdf`, {
        type: "application/pdf",
      });

      if (
        typeof navigator !== "undefined" &&
        navigator.share &&
        navigator.canShare &&
        navigator.canShare({ files: [fileCheck] })
      ) {
        const file = new File([pdfBlob], `Receipt_${payment.receiptNo}.pdf`, {
          type: "application/pdf",
        });
        await navigator.share({
          title: `Tuition Fee Receipt - ${payment.receiptNo}`,
          text: `Please find the official tuition fee receipt for ${accurateStudentName} (${payment.receiptNo}) attached.`,
          files: [file],
        });
      } else {
        // Fallback to download
        const filename = `Receipt_${payment.receiptNo}.pdf`;
        pdf.save(filename);
      }
    } catch (error) {
      console.error("Error sharing PDF:", error);
      alert("Failed to share PDF. Please try again.");
    } finally {
      setPdfGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-card text-card-foreground border border-border rounded-3xl p-4 sm:p-6 shadow-elevated relative max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-muted-foreground hover:bg-muted transition-colors no-print z-20"
          title="Close Modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Action Bar (Top) */}
        <div className="flex items-center justify-between pb-4 border-b border-border mb-4 no-print">
          <div>
            <h2 className="font-extrabold text-base text-foreground">Tuition Fee Receipt</h2>
            <p className="text-xs text-muted-foreground">Receipt No: {payment.receiptNo}</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              disabled={pdfGenerating}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 bg-muted hover:bg-muted/80 rounded-xl transition-all shadow-xs disabled:opacity-50"
              title="Download PDF File"
            >
              <Download className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="hidden sm:inline">Download</span>
            </button>

            <button
              onClick={handleSharePDF}
              disabled={pdfGenerating}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-all active:scale-95 disabled:opacity-50"
              title="Share PDF directly via WhatsApp or System Share"
            >
              {pdfGenerating ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <Share2 className="w-4 h-4" />
              )}
              <span>Share PDF</span>
            </button>
          </div>
        </div>

        {/* Printable Premium Receipt Area */}
        <div
          ref={receiptRef}
          id="receipt-modal-content"
          style={{ backgroundColor: "#ffffff", color: "#0f172a", borderColor: "#0D3B66" }}
          className="border-4 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden font-sans space-y-4"
        >
          {/* Header Banner */}
          <div
            style={{ borderColor: "#E2E8F0" }}
            className="flex items-start justify-between gap-3 border-b-2 pb-4"
          >
            {/* Logo */}
            <div
              style={{ backgroundColor: "#ffffff", borderColor: "#F59E0B" }}
              className="relative w-20 h-20 sm:w-22 sm:h-22 rounded-full border-2 p-0.5 shadow-md flex-shrink-0"
            >
              <img
                src={logoUrl || DEFAULT_LOGO}
                alt="SK Tutorials Logo"
                className="w-full h-full object-cover rounded-full"
                crossOrigin="anonymous"
              />
            </div>

            {/* Institute Info */}
            <div className="text-center flex-1">
              <h1 style={{ color: "#0D3B66" }} className="text-2xl sm:text-3xl font-black tracking-tight">
                {instituteName}
              </h1>
              <p style={{ color: "#C78500" }} className="text-xs sm:text-sm font-bold tracking-wide my-0.5">
                — Excellence in Education —
              </p>

              <div style={{ color: "#475569" }} className="text-[11px] space-y-0.5 font-medium mt-1">
                <div className="flex items-center justify-center gap-3 flex-wrap">
                  <span>📍 Goregaon (E), Mumbai</span>
                  <span>|</span>
                  <span>📞 +91 89769 46230</span>
                </div>
                <div className="flex items-center justify-center gap-3 flex-wrap">
                  <span>🌐 https://sk-tutorials.vercel.app/</span>
                  <span>|</span>
                  <span>✉️ s.k.tutorials126@gmail.com</span>
                </div>
              </div>
            </div>

            {/* Circular PAID Stamp Badge */}
            <div className="flex-shrink-0 text-center">
              <div
                style={{ backgroundColor: "#ECFDF5", borderColor: "#059669", color: "#047857" }}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 flex flex-col items-center justify-center font-black shadow-inner transform rotate-[-6deg]"
              >
                <CheckCircle2 className="w-4 h-4 text-[#059669]" />
                <span className="text-sm sm:text-base leading-none tracking-wider">PAID</span>
                <span className="text-[8px] text-[#059669]">★★★</span>
              </div>
            </div>
          </div>

          {/* Official Title Line */}
          <div className="text-center">
            <span
              style={{ backgroundColor: "#F1F5F9", borderColor: "#CBD5E1", color: "#0D3B66" }}
              className="text-xs sm:text-sm font-black tracking-widest uppercase px-4 py-1 rounded-full border"
            >
              ◆ OFFICIAL TUITION FEE RECEIPT ◆
            </span>
          </div>

          {/* Receipt Meta Bar */}
          <div
            style={{ backgroundColor: "#F0F9FF", borderColor: "#BAE6FD" }}
            className="border rounded-2xl p-3 flex items-center justify-between text-xs sm:text-sm"
          >
            <div className="flex items-center gap-2">
              <div
                style={{ backgroundColor: "#0D3B66", color: "#ffffff" }}
                className="w-8 h-8 rounded-xl flex items-center justify-center font-bold"
              >
                <FileText className="w-4 h-4 text-white" />
              </div>
              <div>
                <span style={{ color: "#64748B" }} className="text-[10px] block font-semibold">
                  Receipt No.
                </span>
                <span style={{ color: "#0D3B66" }} className="font-extrabold">
                  {payment.receiptNo}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-right">
              <div
                style={{ backgroundColor: "#0D3B66", color: "#ffffff" }}
                className="w-8 h-8 rounded-xl flex items-center justify-center font-bold"
              >
                <Calendar className="w-4 h-4 text-white" />
              </div>
              <div>
                <span style={{ color: "#64748B" }} className="text-[10px] block font-semibold">
                  Date
                </span>
                <span style={{ color: "#1E293B" }} className="font-extrabold">
                  {payment.paymentDate}
                </span>
              </div>
            </div>
          </div>

          {/* Two-Column Information Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Student Information Card */}
            <div style={{ borderColor: "#E2E8F0" }} className="border rounded-2xl overflow-hidden shadow-xs">
              <div
                style={{ backgroundColor: "#0D3B66", color: "#ffffff" }}
                className="px-3 py-1.5 text-xs font-bold flex items-center gap-1.5"
              >
                <User className="w-3.5 h-3.5 text-white" />
                <span>STUDENT INFORMATION</span>
              </div>
              <div style={{ backgroundColor: "#F8FAFC" }} className="p-3 space-y-2 text-xs">
                <div style={{ borderColor: "#E2E8F0" }} className="flex items-center justify-between border-b pb-1">
                  <span style={{ color: "#64748B" }} className="font-medium">
                    Student Name :
                  </span>
                  <span style={{ color: "#0F172A" }} className="font-extrabold">
                    {accurateStudentName}
                  </span>
                </div>
                <div style={{ borderColor: "#E2E8F0" }} className="flex items-center justify-between border-b pb-1">
                  <span style={{ color: "#64748B" }} className="font-medium">
                    Class :
                  </span>
                  <span style={{ color: "#0F172A" }} className="font-extrabold">
                    {displayClass}
                  </span>
                </div>
                <div style={{ borderColor: "#E2E8F0" }} className="flex items-center justify-between border-b pb-1">
                  <span style={{ color: "#64748B" }} className="font-medium">
                    Student ID :
                  </span>
                  <span style={{ color: "#1E293B" }} className="font-bold">
                    {payment.studentId}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ color: "#64748B" }} className="font-medium">
                    Academic Year :
                  </span>
                  <span style={{ color: "#1E293B" }} className="font-bold">
                    {academicYear}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Information Card */}
            <div style={{ borderColor: "#E2E8F0" }} className="border rounded-2xl overflow-hidden shadow-xs">
              <div
                style={{ backgroundColor: "#0D3B66", color: "#ffffff" }}
                className="px-3 py-1.5 text-xs font-bold flex items-center gap-1.5"
              >
                <CreditCard className="w-3.5 h-3.5 text-white" />
                <span>PAYMENT INFORMATION</span>
              </div>
              <div style={{ backgroundColor: "#F8FAFC" }} className="p-3 space-y-2 text-xs">
                <div style={{ borderColor: "#E2E8F0" }} className="flex items-center justify-between border-b pb-1">
                  <span style={{ color: "#64748B" }} className="font-medium">
                    Fee Month :
                  </span>
                  <span style={{ color: "#0F172A" }} className="font-extrabold">
                    {getMonthName(payment.month)} {payment.year}
                  </span>
                </div>
                <div style={{ borderColor: "#E2E8F0" }} className="flex items-center justify-between border-b pb-1">
                  <span style={{ color: "#64748B" }} className="font-medium">
                    Amount Paid :
                  </span>
                  <span style={{ color: "#047857" }} className="font-black">
                    ₹ {payment.amount}
                  </span>
                </div>
                <div style={{ borderColor: "#E2E8F0" }} className="flex items-center justify-between border-b pb-1">
                  <span style={{ color: "#64748B" }} className="font-medium">
                    Payment Mode :
                  </span>
                  <span style={{ color: "#0F172A" }} className="font-extrabold">
                    {payment.mode}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ color: "#64748B" }} className="font-medium">
                    Payment Status :
                  </span>
                  <span style={{ color: "#047857" }} className="font-black flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#047857]" /> Paid
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Amount Received Box */}
          <div
            style={{ backgroundColor: "#ECFDF5", borderColor: "#6EE7B7" }}
            className="border-2 border-dashed rounded-2xl p-4 text-center space-y-1"
          >
            <span style={{ color: "#065F46" }} className="text-xs font-black tracking-wider uppercase block">
              AMOUNT RECEIVED
            </span>
            <div style={{ color: "#047857" }} className="text-3xl sm:text-4xl font-black">
              ₹ {payment.amount}
            </div>
            <p style={{ color: "#334155" }} className="text-xs font-semibold">
              ({numberToWordsRupees(payment.amount)})
            </p>
          </div>

          {/* Collection Signature & QR Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Collected By */}
            <div
              style={{ backgroundColor: "#F8FAFC", borderColor: "#E2E8F0" }}
              className="border rounded-2xl p-3 flex items-center justify-between"
            >
              <div>
                <span style={{ color: "#64748B" }} className="text-[10px] block font-semibold">
                  Collected By
                </span>
                <span style={{ color: "#0F172A" }} className="font-extrabold text-sm block">
                  Prof. Fahim Sir
                </span>
                <span style={{ color: "#64748B" }} className="text-[10px]">
                  SK Tutorials
                </span>
              </div>
              <div className="text-right">
                <span
                  style={{ color: "#312E81", borderColor: "#312E81" }}
                  className="font-serif italic font-black text-base border-b-2 pb-0.5 inline-block"
                >
                  Fahim Sir
                </span>
              </div>
            </div>

            {/* Scan to Pay QR Box */}
            <div
              style={{ backgroundColor: "#F0F9FF", borderColor: "#BAE6FD" }}
              className="border rounded-2xl p-3 flex items-center justify-between"
            >
              <div>
                <span style={{ color: "#0D3B66" }} className="font-bold text-xs block">
                  Thank you for choosing SK Tutorials.
                </span>
                <span style={{ color: "#64748B" }} className="text-[10px] block leading-tight">
                  Your trust and support motivate us to deliver the best education.
                </span>
              </div>
              <div className="flex-shrink-0 text-center pl-2">
                <img
                  src={upiQrUrl || DEFAULT_QR}
                  alt="SK Tutorials Payment QR Code"
                  style={{ borderColor: "#CBD5E1" }}
                  className="w-12 h-12 rounded-lg border object-cover mx-auto bg-white"
                  crossOrigin="anonymous"
                />
                <span style={{ color: "#0D3B66" }} className="text-[8px] font-bold block mt-0.5">
                  Scan to Pay
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Dark Blue Footer Bar */}
          <div
            style={{ backgroundColor: "#0D3B66", color: "#ffffff" }}
            className="rounded-2xl p-2.5 text-center space-y-1"
          >
            <div className="flex items-center justify-center gap-4 text-[11px] font-bold">
              <span className="flex items-center gap-1 text-white">
                <Award className="w-3.5 h-3.5 text-amber-400" /> Quality Education
              </span>
              <span className="text-white">|</span>
              <span className="flex items-center gap-1 text-white">
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" /> Better Learning
              </span>
              <span className="text-white">|</span>
              <span className="flex items-center gap-1 text-white">
                <Target className="w-3.5 h-3.5 text-amber-400" /> Bright Future
              </span>
            </div>
            <p style={{ color: "#CBD5E1" }} className="text-[9px] font-medium italic">
              Created by Prof. Fahim Sir | SK Tutorials
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
