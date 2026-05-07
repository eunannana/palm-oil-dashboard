"use client";

import { Download, FileText } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { DetectionResponse } from "@/types/detection";

type ReportPanelProps = {
  result: DetectionResponse | null;
  capturedImage: string | null;
  batchNumber: string;
  inspectionDate: string;
  remarks: string;
  onBatchNumberChange: (value: string) => void;
  onInspectionDateChange: (value: string) => void;
  onRemarksChange: (value: string) => void;
};

export default function ReportPanel({
  result,
  capturedImage,
  batchNumber,
  inspectionDate,
  remarks,
  onBatchNumberChange,
  onInspectionDateChange,
  onRemarksChange,
}: ReportPanelProps) {
  const downloadPdfReport = () => {
    if (!result) {
      alert("Please capture and analyze an FFB image first.");
      return;
    }

    const reportDate = inspectionDate || new Date().toISOString().split("T")[0];
    const batch = batchNumber || "Not specified";

    const doc = new jsPDF("p", "mm", "a4");

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;

    // Header
    doc.setFillColor(4, 120, 87);
    doc.rect(0, 0, pageWidth, 28, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("PalmGrade AI", margin, 12);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Automated Fresh Fruit Bunch (FFB) Grading Report", margin, 19);

    // Report title
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Inspection Report", margin, 40);

    // Inspection info
    autoTable(doc, {
      startY: 46,
      head: [["Inspection Information", "Details"]],
      body: [
        ["Batch Number", batch],
        ["Inspection Date", reportDate],
        ["Final Grade", result.predictedClass],
        ["Detection Confidence", `${result.confidence.toFixed(1)}%`],
        ["Detected Objects", `${result.detections.length}`],
      ],
      theme: "grid",
      headStyles: {
        fillColor: [4, 120, 87],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      styles: {
        fontSize: 10,
        cellPadding: 3,
      },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 60 },
        1: { cellWidth: 110 },
      },
      margin: { left: margin, right: margin },
    });

    let currentY = (doc as any).lastAutoTable.finalY + 10;

    // Captured image
    if (capturedImage) {
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text("Captured FFB Image", margin, currentY);

      currentY += 5;

      try {
        doc.addImage(capturedImage, "JPEG", margin, currentY, 180, 90);
        currentY += 100;
      } catch (error) {
        console.error("Failed to add image to PDF:", error);
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text("Captured image could not be embedded.", margin, currentY);
        currentY += 10;
      }
    }

    // Check if next section needs new page
    if (currentY > 220) {
      doc.addPage();
      currentY = 20;
    }

    // Ripeness distribution
    autoTable(doc, {
      startY: currentY,
      head: [["Ripeness Category", "Total Detected"]],
      body: [
        ["Under Ripe", result.summary.underRipe],
        ["Ripe", result.summary.ripe],
        ["Over Ripe", result.summary.overRipe],
      ],
      theme: "grid",
      headStyles: {
        fillColor: [22, 163, 74],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      styles: {
        fontSize: 10,
        cellPadding: 3,
      },
      margin: { left: margin, right: margin },
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;

    // Detection details
    autoTable(doc, {
      startY: currentY,
      head: [["No.", "Detected Class", "Confidence"]],
      body: result.detections.map((item, index) => [
        index + 1,
        item.label,
        `${(item.confidence * 100).toFixed(1)}%`,
      ]),
      theme: "grid",
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      styles: {
        fontSize: 10,
        cellPadding: 3,
      },
      margin: { left: margin, right: margin },
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;

    // Remarks
    if (currentY > 240) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("Remarks / Keterangan", margin, currentY);

    currentY += 7;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);

    const remarksText =
      remarks || "No remarks provided for this inspection batch.";

    const splitRemarks = doc.splitTextToSize(remarksText, 180);
    doc.text(splitRemarks, margin, currentY);

    currentY += splitRemarks.length * 5 + 8;

    // Disclaimer
    if (currentY > 245) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFillColor(255, 251, 235);
    doc.roundedRect(margin, currentY, 180, 28, 3, 3, "F");

    doc.setTextColor(120, 53, 15);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Disclaimer", margin + 4, currentY + 7);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);

    const disclaimer =
      "This system is intended for research and decision support purposes only. AI grading results should be verified by qualified personnel or standard FFB grading procedures before being used for operational, commercial, or regulatory decisions.";

    const splitDisclaimer = doc.splitTextToSize(disclaimer, 170);
    doc.text(splitDisclaimer, margin + 4, currentY + 13);

    // Footer
    const pageCount = doc.getNumberOfPages();

    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);

      doc.setDrawColor(226, 232, 240);
      doc.line(margin, 285, 195, 285);

      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text("© 2026 UMPSA. All rights reserved.", margin, 291);
      doc.text("Contact: kamarul@umpsa.edu.my", margin, 296);
      doc.text(`Page ${i} of ${pageCount}`, 175, 291);
    }

    doc.save(`FFB-Grading-Report-${batch}-${reportDate}.pdf`);
  };

  return (
    <section className="rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
          <FileText className="h-6 w-6" />
        </div>

        <div>
          <h2 className="text-xl font-black text-slate-900">
            Inspection Report
          </h2>
          <p className="text-sm text-slate-500">
            Add batch information and download the PDF report.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-bold text-slate-700">
            Batch Number
          </label>
          <input
            type="text"
            value={batchNumber}
            onChange={(event) => onBatchNumberChange(event.target.value)}
            placeholder="Example: BATCH-FFB-001"
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:bg-white"
          />
        </div>

        <div>
          <label className="text-sm font-bold text-slate-700">
            Inspection Date
          </label>
          <input
            type="date"
            value={inspectionDate}
            onChange={(event) => onInspectionDateChange(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:bg-white"
          />
        </div>
      </div>

      <div className="mt-4">
        <label className="text-sm font-bold text-slate-700">
          Remarks / Keterangan
        </label>
        <textarea
          value={remarks}
          onChange={(event) => onRemarksChange(event.target.value)}
          placeholder="Example: Batch inspected from field block A. Fruit bunches show mostly ripe condition."
          rows={4}
          className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:bg-white"
        />
      </div>

      <button
        onClick={downloadPdfReport}
        disabled={!result}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        <Download className="h-5 w-5" />
        Download PDF Report
      </button>
    </section>
  );
}