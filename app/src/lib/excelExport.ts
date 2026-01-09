import ExcelJS from 'exceljs';
import { toast } from 'sonner';

interface ExcelColumn {
    header: string;
    key: string;
    width?: number;
}

interface ExcelExportOptions {
    title: string;
    subtitle: string;
    data: Record<string, any>[];
    columns: ExcelColumn[];
    filename: string;
    total?: {
        label: string;
        key: string;
        value: string;
    };
}

export async function exportToExcel(options: ExcelExportOptions): Promise<void> {
    const { title, subtitle, data, columns, filename, total } = options;

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Association Aicha';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Rapport');

    // Define column widths
    worksheet.columns = columns.map((col) => ({
        key: col.key,
        width: col.width || 18,
    }));

    // Row 1: Title (merged)
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

    // Row 2: Subtitle (merged)
    worksheet.mergeCells(2, 1, 2, columns.length);
    const subtitleCell = worksheet.getCell('A2');
    subtitleCell.value = subtitle;
    subtitleCell.font = { size: 11, italic: true, color: { argb: 'FF666666' } };
    subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(2).height = 22;

    // Row 3: Empty row for spacing
    worksheet.getRow(3).height = 10;

    // Row 4: Column Headers
    const headerRow = worksheet.getRow(4);
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

    // Data rows starting at row 5
    data.forEach((record, rowIndex) => {
        const row = worksheet.getRow(5 + rowIndex);
        columns.forEach((col, colIndex) => {
            const cell = row.getCell(colIndex + 1);
            cell.value = record[col.key];
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

    // Total row (if provided)
    if (total) {
        const totalRowIndex = 5 + data.length + 1;
        const totalRow = worksheet.getRow(totalRowIndex);

        // Find the column index for the total
        const colIndex = columns.findIndex(c => c.key === total.key);

        // Merge cells for label
        if (colIndex > 0) {
            worksheet.mergeCells(totalRowIndex, 1, totalRowIndex, colIndex);
        }

        const labelCell = totalRow.getCell(1);
        labelCell.value = total.label;
        labelCell.font = { bold: true };
        labelCell.alignment = { horizontal: 'right', vertical: 'middle' };

        const valueCell = totalRow.getCell(colIndex + 1);
        valueCell.value = total.value;
        valueCell.font = { bold: true, color: { argb: 'FF10B981' } };
        valueCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD1FAE5' } // Emerald-100
        };
        valueCell.alignment = { horizontal: 'right', vertical: 'middle' };

        totalRow.height = 25;
    }

    // Generate the file and trigger download
    try {
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename.replace('.csv', '.xlsx');
        link.click();
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Excel export error:', error);
        toast.error('Erreur lors de l\'export Excel');
    }
}
