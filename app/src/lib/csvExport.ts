export interface CSVExportOptions {
    filename: string;
    data: any[];
    columns: { header: string; dataKey: string }[];
}

export function exportToCSV(options: CSVExportOptions) {
    const { filename, data, columns } = options;

    if (!data.length) return;

    // Header row
    const headers = columns.map(c => c.header).join(",");

    // Data rows
    const rows = data.map(item => {
        return columns.map(col => {
            const val = item[col.dataKey];
            // Escape quotes and wrap in quotes if necessary
            const str = String(val === null || val === undefined ? "" : val);
            if (str.includes(",") || str.includes("\"") || str.includes("\n")) {
                return `"${str.replace(/"/g, "\"\"")}"`;
            }
            return str;
        }).join(",");
    });

    // Combine with BOM for Excel utf-8 compatibility
    const csvContent = "\uFEFF" + [headers, ...rows].join("\n");

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", filename.endsWith(".csv") ? filename : `${filename}.csv`);
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
