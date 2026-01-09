import { useState, useEffect } from "react";
import { Receipt, Eye, XCircle, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { paiementsApi, type RecuListItem } from "./api";
import { PaiementModal } from "./PaiementModal";
import { ExportButton } from "@/components/ExportButton";
import { exportToCSV } from "@/lib/csvExport";
import { exportToPDF } from "@/lib/pdfExport";
import { getLogoBase64 } from "@/lib/logoLoader";
import { useTranslation } from "react-i18next";
import { EmptyState } from "@/components/EmptyState";

interface PaiementsPageProps {
    initialData?: { eleveId: string, months: number[] } | null;
    onClearInitialData?: () => void;
}

export function PaiementsPage({ initialData, onClearInitialData }: PaiementsPageProps) {
    const { t } = useTranslation();
    const [recus, setRecus] = useState<RecuListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);

    // Initial data handling from Calendar
    useEffect(() => {
        if (initialData) {
            setModalOpen(true);
        }
    }, [initialData]);

    const fetchRecus = async () => {
        try {
            setLoading(true);
            const data = await paiementsApi.getAllRecus();
            setRecus(data);
        } catch (error) {
            toast.error(t("common.error"));
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecus();
    }, []);

    const handleAnnuler = async (id: string, numero: string) => {
        if (!confirm(`${t("common.confirm")} - ${numero} ?`)) return;

        try {
            await paiementsApi.annulerPaiement(id);
            toast.success(t("common.success"));
            fetchRecus();
        } catch (error) {
            toast.error(t("common.error"));
            console.error(error);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("fr-FR");
    };

    const getEtatBadge = (etat: string) => {
        if (etat === "VALIDE") {
            return <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">{t("expenses.approved")}</span>;
        }
        if (etat === "ANNULE") {
            return <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-700">{t("common.cancel")}</span>;
        }
        return <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">{etat}</span>;
    };

    // Exports
    const getExportData = () => {
        return recus.map(r => ({
            ...r,
            montant_display: r.montant_total.toFixed(2),
            date_display: formatDate(r.date_operation),
            eleve_nom_complet: r.eleve_nom || "Externe",
            carnet_full: r.numero_carnet ? `${r.numero_carnet}/${r.numero_recu_physique}` : "-"
        }));
    };

    const exportColumns = [
        { header: t("payments.receiptNumber"), dataKey: "numero" },
        { header: "Carnet / R.Phys", dataKey: "carnet_full" },
        { header: "Date", dataKey: "date_display" },
        { header: t("nav.students"), dataKey: "eleve_nom_complet" },
        { header: t("payments.paymentType"), dataKey: "type_paiement" },
        { header: t("payments.amount") + " (DH)", dataKey: "montant_display" },
        { header: t("expenses.status"), dataKey: "etat" },
    ];

    const handleExportCSV = () => {
        exportToCSV({
            filename: `paiements_aicha_${new Date().toISOString().split('T')[0]}`,
            title: t("payments.title"),
            subtitle: `${new Date().toLocaleDateString("fr-FR")} - ${recus.length} ${t("payments.receiptNumber")}`,
            data: getExportData(),
            columns: exportColumns
        });
    };

    const handleExportPDF = async () => {
        const logo = await getLogoBase64();
        const totalAmount = recus.reduce((sum, r) => sum + r.montant_total, 0);

        exportToPDF({
            filename: `paiements_aicha_${new Date().toISOString().split('T')[0]}.pdf`,
            title: t("payments.title"),
            subtitle: `${new Date().toLocaleDateString("fr-FR")} - ${recus.length} ${t("payments.receiptNumber")}`,
            data: getExportData(),
            columns: exportColumns,
            logo: logo || undefined,
            total: {
                label: "TOTAL",
                dataKey: "montant_display",
                value: `${totalAmount.toFixed(2)} DH`
            }
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">{t("payments.title")}</h2>
                    <p className="text-muted-foreground">
                        {t("payments.selectStudent")}
                    </p>
                </div>
                <div className="flex gap-2">
                    <ExportButton
                        onExportCSV={handleExportCSV}
                        onExportPDF={handleExportPDF}
                        disabled={recus.length === 0}
                    />
                    <Button onClick={() => setModalOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" /> {t("payments.newPayment")}
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Receipt className="h-5 w-5" /> {t("payments.title")}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t("payments.receiptNumber")}</TableHead>
                                <TableHead>Carnet</TableHead>
                                <TableHead>R. Phys</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>{t("nav.students")}</TableHead>
                                <TableHead>{t("payments.paymentType")}</TableHead>
                                <TableHead className="text-right">{t("payments.amount")}</TableHead>
                                <TableHead>{t("expenses.status")}</TableHead>
                                <TableHead className="text-right">{t("common.actions")}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {recus.length === 0 && !loading && (
                                <TableRow>
                                    <TableCell colSpan={9} className="py-12">
                                        <EmptyState
                                            title={t("payments.noPayments")}
                                            icon={<Receipt className="w-10 h-10 text-gray-300" />}
                                            action={
                                                <Button onClick={() => setModalOpen(true)}>
                                                    <Plus className="mr-2 h-4 w-4" /> {t("payments.newPayment")}
                                                </Button>
                                            }
                                        />
                                    </TableCell>
                                </TableRow>
                            )}
                            {recus.map((recu) => (
                                <TableRow key={recu.id}>
                                    <TableCell className="font-medium">{recu.numero}</TableCell>
                                    <TableCell>{recu.numero_carnet || "-"}</TableCell>
                                    <TableCell>{recu.numero_recu_physique || "-"}</TableCell>
                                    <TableCell>{formatDate(recu.date_operation)}</TableCell>
                                    <TableCell>{recu.eleve_nom || "-"}</TableCell>
                                    <TableCell>{recu.type_paiement}</TableCell>
                                    <TableCell className="text-right font-semibold">
                                        {recu.montant_total.toFixed(2)} DH
                                    </TableCell>
                                    <TableCell>{getEtatBadge(recu.etat)}</TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button variant="ghost" size="icon" title="Voir le reçu">
                                            <Eye className="h-4 w-4 text-blue-500" />
                                        </Button>
                                        {recu.etat === "VALIDE" && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleAnnuler(recu.id, recu.numero)}
                                                title="Annuler"
                                            >
                                                <XCircle className="h-4 w-4 text-red-500" />
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <PaiementModal
                open={modalOpen}
                onClose={() => {
                    setModalOpen(false);
                    if (onClearInitialData) onClearInitialData();
                }}
                onSuccess={() => {
                    fetchRecus();
                    setModalOpen(false);
                    if (onClearInitialData) onClearInitialData();
                }}
                initialData={initialData}
            />
        </div>
    );
}
