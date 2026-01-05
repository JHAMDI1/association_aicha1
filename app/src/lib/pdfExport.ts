import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface PDFExportOptions {
    title: string;
    subtitle?: string;
    data: any[];
    columns: { header: string; dataKey: string }[];
    filename: string;
    logo?: string; // Base64 string
    total?: {
        label: string;
        dataKey: string; // Column key to place the total value
        value: string | number;
    };
}

export function exportToPDF(options: PDFExportOptions) {
    const { title, subtitle, data, columns, filename } = options;

    // Create new PDF document
    const doc = new jsPDF();

    // Add logo if provided
    if (options.logo) {
        // Logo dimensions
        const logoWidth = 25;
        const logoHeight = 25;
        try {
            doc.addImage(options.logo, "PNG", 14, 15, logoWidth, logoHeight);
        } catch (e) {
            console.warn("Could not add logo to PDF", e);
        }
    }

    // Add title (adjusted Y position if logo exists)
    const titleY = options.logo ? 25 : 20;
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    // Indent title if logo is present
    doc.text(title, options.logo ? 45 : 14, titleY);

    // Add subtitle if provided
    if (subtitle) {
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100);
        doc.text(subtitle, options.logo ? 45 : 14, titleY + 8);
    }

    // Add table
    autoTable(doc, {
        startY: subtitle ? (options.logo ? 45 : 35) : (options.logo ? 40 : 28),
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
        // Calculate Total if requested

        foot: options.total ? [
            columns.map((col, index) => {
                if (index === 0) return options.total?.label || "Total";
                if (col.dataKey === options.total?.dataKey) return options.total?.value || "";
                return "";
            })
        ] : undefined,
        footStyles: {
            fillColor: [243, 244, 246],
            textColor: 0,
            fontStyle: "bold"
        }
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
