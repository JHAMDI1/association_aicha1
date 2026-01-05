import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface PDFExportOptions {
    title: string;
    subtitle?: string;
    data: any[];
    columns: { header: string; dataKey: string }[];
    filename: string;
}

export function exportToPDF(options: PDFExportOptions) {
    const { title, subtitle, data, columns, filename } = options;

    // Create new PDF document
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(title, 14, 20);

    // Add subtitle if provided
    if (subtitle) {
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100);
        doc.text(subtitle, 14, 28);
    }

    // Add table
    autoTable(doc, {
        startY: subtitle ? 35 : 28,
        head: [columns.map((col) => col.header)],
        body: data.map((row) => columns.map((col) => row[col.dataKey] || "-")),
        styles: {
            fontSize: 9,
            cellPadding: 3,
        },
        headStyles: {
            fillColor: [16, 185, 129], // Emerald-500
            textColor: 255,
            fontStyle: "bold",
        },
        alternateRowStyles: {
            fillColor: [243, 244, 246], // Gray-100
        },
    });

    // Add footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
            `Page ${i} sur ${pageCount} - Association Aicha - ${new Date().toLocaleDateString("fr-FR")}`,
            14,
            doc.internal.pageSize.height - 10
        );
    }

    // Save PDF
    doc.save(filename);
}
