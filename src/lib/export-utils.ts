import * as XLSX from "xlsx";
import jsPDF from "jspdf";

export function exportToCSV(filename: string, rows: Record<string, any>[]) {
  if (!rows || rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const val = row[h] ?? "";
          const escaped = String(val).replace(/"/g, '""');
          return `"${escaped}"`;
        })
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToExcel(filename: string, rows: Record<string, any>[]) {
  if (!rows || rows.length === 0) return;
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

export function exportTableToPDF(title: string, headers: string[], rows: (string | number)[][], filename: string) {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.setTextColor(79, 70, 229); // Primary Indigo
  doc.text(title, 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated on: ${new Date().toLocaleDateString()} | SK Tutorials`, 14, 28);

  let y = 38;
  const colWidth = 180 / headers.length;

  // Header row
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y - 5, 180, 8, "F");
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);

  headers.forEach((h, idx) => {
    doc.text(h, 14 + idx * colWidth, y);
  });

  y += 10;
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);

  rows.forEach((row) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    row.forEach((cell, idx) => {
      doc.text(String(cell), 14 + idx * colWidth, y);
    });
    y += 8;
  });

  doc.save(`${filename}.pdf`);
}
