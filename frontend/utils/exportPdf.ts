import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export type PdfColumn = {
  header: string;
  key: string;
  formatter?: (value: unknown) => string | number;
};

export function exportPdf(options: {
  title: string;
  subtitle?: string;
  filename: string;
  columns: PdfColumn[];
  rows: Record<string, unknown>[];
}) {
  const { title, subtitle, filename, columns, rows } = options;

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  // Header
  doc.setFillColor(17, 17, 17);
  doc.rect(0, 0, 210, 22, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(title, 14, 12);
  if (subtitle) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(subtitle, 14, 17);
  }

  doc.setTextColor(20, 20, 20);

  autoTable(doc, {
    startY: 28,
    head: [columns.map((c) => c.header)],
    body: rows.map((row) =>
      columns.map((c) => (c.formatter ? c.formatter(row[c.key]) : row[c.key] ?? ""))
    ),
    headStyles: { fillColor: [17, 17, 17], textColor: [255, 255, 255], fontSize: 9, fontStyle: "bold" },
    bodyStyles: { fontSize: 8.5, textColor: [40, 40, 40] },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    margin: { left: 14, right: 14 },
    styles: { cellPadding: 2.5 },
  });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.text(
      `ShopWise • ${new Date().toLocaleString("vi-VN")} • Trang ${i}/${pageCount}`,
      14,
      290
    );
  }

  doc.save(filename);
}
