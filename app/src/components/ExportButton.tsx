import { Button } from "@/components/ui/button";
import { FileSpreadsheet, FileText } from "lucide-react";

interface ExportButtonProps {
    onExportCSV: () => void;
    onExportPDF: () => void;
    label?: string; // Kept for compatibility but not displayed
    disabled?: boolean;
}

export function ExportButton({ onExportCSV, onExportPDF, disabled = false }: ExportButtonProps) {
    return (
        <div className="flex gap-2">
            <Button
                variant="outline"
                size="sm"
                onClick={onExportCSV}
                disabled={disabled}
                title="Exporter en Excel (CSV)"
                className="text-green-700 border-green-200 hover:bg-green-50 hover:text-green-800"
            >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Excel
            </Button>
            <Button
                variant="outline"
                size="sm"
                onClick={onExportPDF}
                disabled={disabled}
                title="Exporter en PDF"
                className="text-red-700 border-red-200 hover:bg-red-50 hover:text-red-800"
            >
                <FileText className="mr-2 h-4 w-4" />
                PDF
            </Button>
        </div>
    );
}
