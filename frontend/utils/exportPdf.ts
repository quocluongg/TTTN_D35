import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { ROBOTO_REGULAR_BASE64, ROBOTO_BOLD_BASE64 } from "./exportPdfFonts";

export type PdfColumn = {
  header: string;
  key: string;
  formatter?: (value: unknown) => string | number;
};

const BRAND = "ShopWise";
const ACCENT: [number, number, number] = [16, 130, 83]; // emerald-600
const DARK: [number, number, number] = [17, 17, 17];
const GREY: [number, number, number] = [120, 120, 120];

// Use a custom font name to avoid clashing with jsPDF's built-in "arial"
// (Helvetica) alias. The embedded Arial TTF contains the full Vietnamese
// glyph set so diacritics (ế ơ ă đ ữ …) render correctly.
const FONT_NAME = "ArialVn";

function registerFonts(doc: jsPDF) {
  doc.addFileToVFS("ArialVn-Regular.ttf", ROBOTO_REGULAR_BASE64);
  doc.addFont("ArialVn-Regular.ttf", FONT_NAME, "normal");
  doc.addFileToVFS("ArialVn-Bold.ttf", ROBOTO_BOLD_BASE64);
  doc.addFont("ArialVn-Bold.ttf", FONT_NAME, "bold");
}

function footer(doc: jsPDF, note?: string) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...GREY);
    doc.text(
      `${BRAND} • Xuất bản: ${new Date().toLocaleString("vi-VN")} • Trang ${i}/${pageCount}`,
      14,
      290
    );
    if (note) {
      doc.text(note, 210 - 14, 290, { align: "right" });
    }
  }
}

export function exportPdf(options: {
  title: string;
  subtitle?: string;
  filename: string;
  columns: PdfColumn[];
  rows: Record<string, unknown>[];
}) {
  const { title, subtitle, filename, columns, rows } = options;

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  registerFonts(doc);

  // Header
  doc.setFillColor(...DARK);
  doc.rect(0, 0, 210, 22, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont(FONT_NAME, "bold");
  doc.text(title, 14, 12);
  if (subtitle) {
    doc.setFontSize(9);
    doc.setFont(FONT_NAME, "normal");
    doc.text(subtitle, 14, 17);
  }

  doc.setTextColor(20, 20, 20);

  autoTable(doc, {
    startY: 28,
    head: [columns.map((c) => c.header)],
    body: rows.map((row) =>
      columns.map((c) => (c.formatter ? c.formatter(row[c.key]) : row[c.key] ?? ""))
    ),
      headStyles: { fillColor: DARK, textColor: [255, 255, 255], fontSize: 9, fontStyle: "bold", font: FONT_NAME },
      bodyStyles: { fontSize: 8.5, textColor: [40, 40, 40], font: FONT_NAME },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    margin: { left: 14, right: 14 },
    styles: { cellPadding: 2.5 },
  });

  footer(doc);
  doc.save(filename);
}

export type ReportKpi = { label: string; value: string; note?: string };

export type ReportTable = {
  title: string;
  columns: PdfColumn[];
  rows: Record<string, unknown>[];
};

export type ReportSection = {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
};

export type ReportOptions = {
  title: string;
  subtitle?: string;
  period?: string;
  generatedAt?: string;
  kpis?: ReportKpi[];
  tables?: ReportTable[];
  sections?: ReportSection[];
  filename: string;
};

function sectionHeading(doc: jsPDF, y: number, text: string): number {
  doc.setFillColor(...ACCENT);
  doc.rect(14, y, 1.4, 5, "F");
  doc.setFont(FONT_NAME, "bold");
  doc.setFontSize(12);
  doc.setTextColor(...DARK);
  doc.text(text, 17.5, y + 4);
  return y + 10;
}

function paragraph(doc: jsPDF, y: number, text: string, maxWidth: number): number {
  doc.setFont(FONT_NAME, "normal");
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  const lines = doc.splitTextToSize(text, maxWidth);
  for (const line of lines) {
    if (y > 278) {
      doc.addPage();
      y = 20;
    }
    doc.text(line, 17.5, y);
    y += 5;
  }
  return y + 3;
}

export function exportReport(options: ReportOptions) {
  const { title, subtitle, period, generatedAt, kpis = [], tables = [], sections = [], filename } = options;

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  registerFonts(doc);
  const pageW = 210;
  const marginX = 14;
  const maxWidth = pageW - marginX * 2;
  let y: number;

  // Cover header
  doc.setFillColor(...DARK);
  doc.rect(0, 0, pageW, 34, "F");
  doc.setFillColor(...ACCENT);
  doc.rect(0, 34, pageW, 2, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont(FONT_NAME, "bold");
  doc.setFontSize(18);
  doc.text(title, marginX, 16);

  doc.setFont(FONT_NAME, "normal");
  doc.setFontSize(10);
  doc.setTextColor(220, 220, 220);
  if (subtitle) doc.text(subtitle, marginX, 23);

  doc.setFontSize(9);
  if (period) doc.text(`Kỳ báo cáo: ${period}`, marginX, 29);
  if (generatedAt) {
    const right = `${BRAND} • Xuất bản: ${generatedAt}`;
    doc.text(right, pageW - marginX, 29, { align: "right" });
  }

  y = 46;

  // Executive summary / KPI cards (2x2 grid)
  if (kpis.length > 0) {
    y = sectionHeading(doc, y, "Tóm tắt chỉ số chính (Executive Summary)");

    const cols = 2;
    const gap = 4;
    const cellW = (maxWidth - gap) / 2;
    const cellH = 18;
    const rowsCount = Math.ceil(kpis.length / cols);

    for (let i = 0; i < kpis.length; i++) {
      const kpi = kpis[i];
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = marginX + col * (cellW + gap);
      const cy = y + row * (cellH + gap);

      if (cy + cellH > 278) {
        doc.addPage();
        y = 20;
      }

      doc.setFillColor(250, 250, 250);
      doc.setDrawColor(230, 230, 230);
      doc.roundedRect(x, cy, cellW, cellH, 1.5, 1.5, "FD");

      doc.setFillColor(...ACCENT);
      doc.rect(x, cy, 1.2, cellH, "F");

      doc.setFont(FONT_NAME, "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(...GREY);
      doc.text(kpi.label, x + 5, cy + 7, { maxWidth: cellW - 10 });

      doc.setFont(FONT_NAME, "bold");
      doc.setFontSize(12);
      doc.setTextColor(...DARK);
      doc.text(kpi.value, x + 5, cy + 14);

      if (kpi.note) {
        doc.setFont(FONT_NAME, "normal");
        doc.setFontSize(7);
        doc.setTextColor(...GREY);
        doc.text(kpi.note, x + 5, cy + 16.5, { maxWidth: cellW - 10 });
      }
    }

    y = y + rowsCount * (cellH + gap) + 4;
  }

  // Sections (free text)
  for (const section of sections) {
    y = sectionHeading(doc, y, section.heading);

    for (const p of section.paragraphs ?? []) {
      y = paragraph(doc, y, p, maxWidth - 4);
    }

    for (const b of section.bullets ?? []) {
      doc.setFillColor(...ACCENT);
      doc.circle(18.5, y - 1.2, 0.7, "F");
      y = paragraph(doc, y, b, maxWidth - 8);
    }

    y += 2;
  }

  // Tables
  for (const table of tables) {
    if (y > 265) {
      doc.addPage();
      y = 20;
    }
    y = sectionHeading(doc, y, table.title);

    autoTable(doc, {
      startY: y,
      head: [table.columns.map((c) => c.header)],
      body: table.rows.map((row) =>
        table.columns.map((c) => (c.formatter ? c.formatter(row[c.key]) : row[c.key] ?? ""))
      ),
      headStyles: { fillColor: DARK, textColor: [255, 255, 255], fontSize: 8.5, fontStyle: "bold", font: FONT_NAME },
      bodyStyles: { fontSize: 8, textColor: [40, 40, 40], font: FONT_NAME },
      alternateRowStyles: { fillColor: [248, 248, 248] },
      margin: { left: marginX, right: marginX },
      styles: { cellPadding: 2.5 },
      theme: "grid",
    });

    // @ts-expect-error finalY is set by autoTable
    y = doc.lastAutoTable.finalY + 8;
  }

  footer(doc);
  doc.save(filename);
}
