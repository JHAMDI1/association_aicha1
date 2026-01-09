import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";
import { toast } from "sonner";

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

export async function exportToPDF(options: PDFExportOptions) {
    const { title, subtitle, data, columns, filename } = options;

    // Create new PDF document
    const doc = new jsPDF();

    // Load Arabic Font (Amiri)
    try {
        const response = await fetch('/fonts/Amiri-Regular.ttf');
        if (response.ok) {
            const fontBuffer = await response.arrayBuffer();
            const fontBase64 = arrayBufferToBase64(fontBuffer);

            doc.addFileToVFS('Amiri-Regular.ttf', fontBase64);
            doc.addFont('Amiri-Regular.ttf', 'Amiri', 'normal');
            doc.setFont('Amiri');
            // toast.success("Police Arabe chargée"); // Debug
        } else {
            console.warn("Could not load Arabic font");
            toast.error("Impossible de charger la police Arabe");
        }
    } catch (e) {
        console.warn("Error loading font:", e);
        toast.error("Erreur chargement police: " + String(e));
    }

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
    // Use Amiri if available, fallback to helvetica handled by jsPDF if not found? 
    // Actually setFont('Amiri') was called above.
    // doc.setFont("helvetica", "bold"); // REMOVED to keep Amiri

    // Indent title if logo is present
    doc.text(title, options.logo ? 45 : 14, titleY);

    // Add subtitle if provided
    if (subtitle) {
        doc.setFontSize(11);
        // doc.setFont("helvetica", "normal"); // REMOVED
        doc.setTextColor(100);
        doc.text(subtitle, options.logo ? 45 : 14, titleY + 8);
    }

    // Add table
    autoTable(doc, {
        startY: subtitle ? (options.logo ? 45 : 35) : (options.logo ? 40 : 28),
        head: [columns.map((col) => col.header)],
        body: data.map((row) => columns.map((col) => row[col.dataKey] || "-")),
        styles: {
            font: 'Amiri', // USE AMIRI
            fontSize: 9,
            cellPadding: 3,
        },
        headStyles: {
            fillColor: [16, 185, 129], // Emerald-500
            textColor: 255,
            fontStyle: "normal", // 'bold' might not exist for Amiri-Regular
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
            fontStyle: "normal"
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
    // Generate ArrayBuffer
    const pdfData = doc.output('arraybuffer');

    try {
        // Try native save dialog first
        const suggestedName = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
        const filePath = await save({
            defaultPath: suggestedName,
            filters: [{
                name: 'PDF File',
                extensions: ['pdf']
            }]
        });

        if (filePath) {
            await writeFile(filePath, new Uint8Array(pdfData));
            return;
        }
    } catch (e) {
        console.error("Native save failed:", e);
        toast.error("ERREUR ECRITURE FICHIER : " + String(e));
        console.error(e);
        toast.info("Téléchargement via le navigateur...");
    }

    // Fallback: Save using jsPDF's built-in save (Web behavior)
    doc.save(filename);
}

// Helper to convert ArrayBuffer to Base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}
