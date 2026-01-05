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

interface PaiementsPageProps {
    initialData?: { eleveId: string, months: number[] } | null;
    onClearInitialData?: () => void;
}

export function PaiementsPage({ initialData, onClearInitialData }: PaiementsPageProps) {
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
            toast.error("Erreur lors du chargement des reçus");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecus();
    }, []);

    const handleAnnuler = async (id: string, numero: string) => {
        if (!confirm(`Êtes-vous sûr d'annuler le reçu ${numero} ?`)) return;

        try {
            await paiementsApi.annulerPaiement(id);
            toast.success("Reçu annulé");
            fetchRecus();
        } catch (error) {
            toast.error("Erreur lors de l'annulation");
            console.error(error);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("fr-FR");
    };

    const getEtatBadge = (etat: string) => {
        if (etat === "VALIDE") {
            return <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">Validé</span>;
        }
        if (etat === "ANNULE") {
            return <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-700">Annulé</span>;
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
        { header: "N° Reçu", dataKey: "numero" },
        { header: "Carnet / R.Phys", dataKey: "carnet_full" },
        { header: "Date", dataKey: "date_display" },
        { header: "Élève / Donneur", dataKey: "eleve_nom_complet" },
        { header: "Type", dataKey: "type_paiement" },
        { header: "Montant (DH)", dataKey: "montant_display" },
        { header: "Statut", dataKey: "etat" },
    ];

    const handleExportCSV = () => {
        exportToCSV({
            filename: `paiements_aicha_${new Date().toISOString().split('T')[0]}`,
            data: getExportData(),
            columns: exportColumns
        });
    };

    const handleExportPDF = async () => {
        const logo = await getLogoBase64();
        const totalAmount = recus.reduce((sum, r) => sum + r.montant_total, 0);

        exportToPDF({
            filename: `paiements_aicha_${new Date().toISOString().split('T')[0]}.pdf`,
            title: "Historique des Paiements",
            subtitle: `Export du ${new Date().toLocaleDateString("fr-FR")} - ${recus.length} reçus`,
            data: getExportData(),
            columns: exportColumns,
            logo: logo || undefined,
            total: {
                label: "TOTAL GENERAL",
                dataKey: "montant_display",
                value: `${totalAmount.toFixed(2)} DH`
            }
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Paiements & Reçus</h2>
                    <p className="text-muted-foreground">
                        Gérez les paiements des élèves
                    </p>
                </div>
                <div className="flex gap-2">
                    <ExportButton
                        onExportCSV={handleExportCSV}
                        onExportPDF={handleExportPDF}
                        disabled={recus.length === 0}
                    />
                    <Button onClick={() => setModalOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" /> Nouveau Paiement
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Receipt className="h-5 w-5" /> Historique des reçus
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>N° Reçu</TableHead>
                                <TableHead>Carnet</TableHead>
                                <TableHead>R. Phys</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Élève</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead className="text-right">Montant</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {recus.length === 0 && !loading && (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                                        Aucun reçu enregistré.
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
