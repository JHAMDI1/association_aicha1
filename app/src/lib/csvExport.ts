import ExcelJS from 'exceljs';
import { toast } from 'sonner';
import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";

export interface CSVExportOptions {
    filename: string;
    data: any[];
    columns: { header: string; dataKey: string }[];
    title?: string;
    subtitle?: string;
}

export async function exportToCSV(options: CSVExportOptions) {
    const { filename, data, columns, title, subtitle } = options;

    if (!data.length) {
        toast.error("Aucune donnée à exporter");
        return;
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Association Aicha';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Données');

    // Define column widths
    worksheet.columns = columns.map((col) => ({
        key: col.dataKey,
        width: 18,
    }));

    let startRow = 1;

    // Optional Title Row
    if (title) {
        worksheet.mergeCells(1, 1, 1, columns.length);
        const titleCell = worksheet.getCell('A1');
        titleCell.value = title;
        titleCell.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
        titleCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF10B981' } // Emerald-500
        };
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.getRow(1).height = 30;
        startRow = 2;
    }

    // Optional Subtitle Row
    if (subtitle) {
        worksheet.mergeCells(startRow, 1, startRow, columns.length);
        const subtitleCell = worksheet.getCell(`A${startRow}`);
        subtitleCell.value = subtitle;
        subtitleCell.font = { size: 11, italic: true, color: { argb: 'FF666666' } };
        subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.getRow(startRow).height = 22;
        startRow += 1;
    }

    // Spacing row if we have title/subtitle
    if (title || subtitle) {
        worksheet.getRow(startRow).height = 10;
        startRow += 1;
    }

    // Column Headers Row
    const headerRow = worksheet.getRow(startRow);
    columns.forEach((col, index) => {
        const cell = headerRow.getCell(index + 1);
        cell.value = col.header;
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF059669' } // Emerald-600
        };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
            top: { style: 'thin', color: { argb: 'FF047857' } },
            bottom: { style: 'thin', color: { argb: 'FF047857' } },
            left: { style: 'thin', color: { argb: 'FF047857' } },
            right: { style: 'thin', color: { argb: 'FF047857' } }
        };
    });
    headerRow.height = 25;
    startRow += 1;

    // Data rows
    data.forEach((record, rowIndex) => {
        const row = worksheet.getRow(startRow + rowIndex);
        columns.forEach((col, colIndex) => {
            const cell = row.getCell(colIndex + 1);
            cell.value = record[col.dataKey];
            cell.alignment = { horizontal: 'left', vertical: 'middle' };
            cell.border = {
                bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } }
            };
        });
        row.height = 22;
        // Alternate row colors
        if (rowIndex % 2 === 1) {
            row.eachCell({ includeEmpty: true }, (cell) => {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFF9FAFB' } // Gray-50
                };
            });
        }
    });

    // Generate buffer and save
    try {
        const buffer = await workbook.xlsx.writeBuffer();
        const xlsxFilename = filename.replace(/\.csv$/i, '') + '.xlsx';

        // Try native save dialog first
        try {
            const filePath = await save({
                defaultPath: xlsxFilename,
                filters: [{
                    name: 'Excel File',
                    extensions: ['xlsx']
                }]
            });

            if (filePath) {
                await writeFile(filePath, new Uint8Array(buffer as ArrayBuffer));
                toast.success("Fichier Excel exporté avec succès");
                return;
            }
        } catch (e) {
            console.error("Native save failed:", e);
            toast.info("Téléchargement via le navigateur...");
        }

        // Fallback: browser download
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = xlsxFilename;
        link.click();
        URL.revokeObjectURL(url);
        toast.success("Fichier Excel téléchargé");
    } catch (error) {
        console.error('Excel export error:', error);
        toast.error('Erreur lors de l\'export Excel: ' + String(error));
    }
}
