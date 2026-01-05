import { useState } from "react";
import { reportsApi, RecettesReport, DepensesReport, BilanReport, InscriptionItem, LatePaymentStudent } from "./api";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { toast } from "sonner";
import { Download } from "lucide-react";

type ReportType = "recettes" | "depenses" | "bilan" | "retards" | "inscriptions";

export function ReportsPage() {
    const [reportType, setReportType] = useState<ReportType>("recettes");
    const [dateDebut, setDateDebut] = useState("");
    const [dateFin, setDateFin] = useState("");
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState<any>(null);

    const handleGenerate = async () => {
        if ((reportType === "recettes" || reportType === "depenses" || reportType === "bilan") && (!dateDebut || !dateFin)) {
            toast.error("Veuillez sélectionner une plage de dates");
            return;
        }

        try {
            setLoading(true);
            let data;

            switch (reportType) {
                case "recettes":
                    data = await reportsApi.generateRecettes(dateDebut, dateFin);
                    break;
                case "depenses":
                    data = await reportsApi.generateDepenses(dateDebut, dateFin);
                    break;
                case "bilan":
                    data = await reportsApi.generateBilan(dateDebut, dateFin);
                    break;
                case "retards":
                    data = await reportsApi.generateRetards();
                    break;
                case "inscriptions":
                    data = await reportsApi.generateInscriptions();
                    break;
            }

            setReportData(data);
            toast.success("Rapport généré avec succès");
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            toast.error(message || "Erreur lors de la génération");
            console.error("Report error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadCSV = () => {
        if (!reportData) return;

        let csv = "";
        let filename = "";

        switch (reportType) {
            case "recettes":
                csv = "Date,Nom,Prénom,Mois,Montant,Mode\n";
                (reportData as RecettesReport).details.forEach((r) => {
                    csv += `${r.date},${r.eleve_nom},${r.eleve_prenom},${r.mois},${r.montant},${r.mode_paiement}\n`;
                });
                csv += `\nTotal,,,,,${(reportData as RecettesReport).total}`;
                filename = `recettes_${dateDebut}_${dateFin}.csv`;
                break;

            case "depenses":
                csv = "Date,Titre,Catégorie,Montant,Bénéficiaire\n";
                (reportData as DepensesReport).details.forEach((d) => {
                    csv += `${d.date},${d.titre},${d.categorie},${d.montant},${d.beneficiaire}\n`;
                });
                csv += `\nTotal,,,,${(reportData as DepensesReport).total}`;
                filename = `depenses_${dateDebut}_${dateFin}.csv`;
                break;

            case "bilan":
                const bilan = reportData as BilanReport;
                csv = "Type,Montant\n";
                csv += `Recettes,${bilan.recettes}\n`;
                csv += `Dépenses,${bilan.depenses}\n`;
                csv += `Solde,${bilan.solde}\n`;
                filename = `bilan_${dateDebut}_${dateFin}.csv`;
                break;

            case "retards":
                csv = "Nom,Prénom,Classe,Mois impayés,Montant dû\n";
                (reportData as LatePaymentStudent[]).forEach((s) => {
                    csv += `${s.nom},${s.prenom},${s.classe},${s.mois_impayes},${s.montant_du}\n`;
                });
                filename = "retards_paiement.csv";
                break;

            case "inscriptions":
                csv = "Classe,Nb Élèves,Élèves\n";
                (reportData as InscriptionItem[]).forEach((c) => {
                    csv += `${c.classe},${c.nb_eleves},"${c.eleves.join(", ")}"\n`;
                });
                filename = "inscriptions.csv";
                break;
        }

        // Download CSV
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
        toast.success("Fichier CSV téléchargé");
    };

    const setPreset = (preset: string) => {
        const now = new Date();
        let debut, fin;

        switch (preset) {
            case "ce_mois":
                debut = new Date(now.getFullYear(), now.getMonth(), 1);
                fin = now;
                break;
            case "mois_dernier":
                debut = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                fin = new Date(now.getFullYear(), now.getMonth(), 0);
                break;
            case "annee_scolaire":
                const startYear = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
                debut = new Date(startYear, 8, 1); // Septembre
                fin = now;
                break;
        }

        if (debut && fin) {
            setDateDebut(debut.toISOString().split("T")[0]);
            setDateFin(fin.toISOString().split("T")[0]);
        }
    };

    const needsDates = reportType === "recettes" || reportType === "depenses" || reportType === "bilan";

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-3xl font-bold">Rapports & Statistiques</h1>

            {/* Configuration */}
            <Card className="p-6 space-y-4">
                <h2 className="text-xl font-semibold">Configuration du rapport</h2>

                {/* Type selector */}
                <div className="space-y-2">
                    <Label>Type de rapport</Label>
                    <Select value={reportType} onValueChange={(v) => setReportType(v as ReportType)}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="recettes">💰 Recettes</SelectItem>
                            <SelectItem value="depenses">💸 Dépenses</SelectItem>
                            <SelectItem value="bilan">📊 Bilan (Recettes vs Dépenses)</SelectItem>
                            <SelectItem value="retards">⚠️ Retards de paiement</SelectItem>
                            <SelectItem value="inscriptions">📚 Inscriptions par classe</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Date range (conditional) */}
                {needsDates && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Date début</Label>
                                <Input
                                    type="date"
                                    value={dateDebut}
                                    onChange={(e) => setDateDebut(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Date fin</Label>
                                <Input
                                    type="date"
                                    value={dateFin}
                                    onChange={(e) => setDateFin(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Presets */}
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => setPreset("ce_mois")}>
                                Ce mois
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setPreset("mois_dernier")}>
                                Mois dernier
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setPreset("annee_scolaire")}>
                                Année scolaire
                            </Button>
                        </div>
                    </>
                )}

                <Button onClick={handleGenerate} disabled={loading} className="w-full">
                    {loading ? "Génération..." : "Générer le rapport"}
                </Button>
            </Card>

            {/* Report preview */}
            {reportData && (
                <Card className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold">Résultats</h2>
                        <Button onClick={handleDownloadCSV} variant="outline">
                            <Download className="w-4 h-4 mr-2" />
                            Télécharger CSV
                        </Button>
                    </div>

                    {reportType === "recettes" && (
                        <div>
                            <p className="text-sm text-gray-600 mb-4">
                                {(reportData as RecettesReport).count} paiements - Total: {(reportData as RecettesReport).total.toFixed(2)} DH
                            </p>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left pb-2">Date</th>
                                            <th className="text-left pb-2">Élève</th>
                                            <th className="text-left pb-2">Mois</th>
                                            <th className="text-right pb-2">Montant</th>
                                            <th className="text-left pb-2">Mode</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(reportData as RecettesReport).details.map((r, i) => (
                                            <tr key={i} className="border-b">
                                                <td className="py-2">{r.date.split("T")[0]}</td>
                                                <td className="py-2">{r.eleve_prenom} {r.eleve_nom}</td>
                                                <td className="py-2">{r.mois}</td>
                                                <td className="py-2 text-right">{r.montant.toFixed(2)} DH</td>
                                                <td className="py-2">{r.mode_paiement}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {reportType === "depenses" && (
                        <div>
                            <p className="text-sm text-gray-600 mb-4">
                                {(reportData as DepensesReport).count} dépenses - Total: {(reportData as DepensesReport).total.toFixed(2)} DH
                            </p>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left pb-2">Date</th>
                                            <th className="text-left pb-2">Titre</th>
                                            <th className="text-left pb-2">Catégorie</th>
                                            <th className="text-right pb-2">Montant</th>
                                            <th className="text-left pb-2">Bénéficiaire</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(reportData as DepensesReport).details.map((d, i) => (
                                            <tr key={i} className="border-b">
                                                <td className="py-2">{d.date}</td>
                                                <td className="py-2">{d.titre}</td>
                                                <td className="py-2">{d.categorie}</td>
                                                <td className="py-2 text-right">{d.montant.toFixed(2)} DH</td>
                                                <td className="py-2">{d.beneficiaire}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {reportType === "bilan" && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                                <Card className="p-4 bg-emerald-50">
                                    <p className="text-sm text-gray-600">Recettes</p>
                                    <p className="text-2xl font-bold text-emerald-600">{(reportData as BilanReport).recettes.toFixed(2)} DH</p>
                                </Card>
                                <Card className="p-4 bg-red-50">
                                    <p className="text-sm text-gray-600">Dépenses</p>
                                    <p className="text-2xl font-bold text-red-600">{(reportData as BilanReport).depenses.toFixed(2)} DH</p>
                                </Card>
                                <Card className={`p-4 ${(reportData as BilanReport).solde >= 0 ? 'bg-blue-50' : 'bg-red-50'}`}>
                                    <p className="text-sm text-gray-600">Solde</p>
                                    <p className={`text-2xl font-bold ${(reportData as BilanReport).solde >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                        {(reportData as BilanReport).solde.toFixed(2)} DH
                                    </p>
                                </Card>
                            </div>
                            <p className="text-sm text-gray-500">Période : {(reportData as BilanReport).periode}</p>
                        </div>
                    )}

                    {reportType === "retards" && (
                        <div>
                            <p className="text-sm text-gray-600 mb-4">
                                {(reportData as LatePaymentStudent[]).length} élèves en retard
                            </p>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left pb-2">Nom</th>
                                            <th className="text-left pb-2">Prénom</th>
                                            <th className="text-left pb-2">Classe</th>
                                            <th className="text-right pb-2">Mois impayés</th>
                                            <th className="text-right pb-2">Montant dû</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(reportData as LatePaymentStudent[]).map((s) => (
                                            <tr key={s.id} className="border-b">
                                                <td className="py-2">{s.nom}</td>
                                                <td className="py-2">{s.prenom}</td>
                                                <td className="py-2">{s.classe}</td>
                                                <td className="py-2 text-right text-orange-600">{s.mois_impayes}</td>
                                                <td className="py-2 text-right">{s.montant_du.toFixed(2)} DH</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {reportType === "inscriptions" && (
                        <div>
                            <p className="text-sm text-gray-600 mb-4">
                                {(reportData as InscriptionItem[]).length} classes
                            </p>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left pb-2">Classe</th>
                                            <th className="text-right pb-2">Nb Élèves</th>
                                            <th className="text-left pb-2">Élèves</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(reportData as InscriptionItem[]).map((c, i) => (
                                            <tr key={i} className="border-b">
                                                <td className="py-2 font-medium">{c.classe}</td>
                                                <td className="py-2 text-right">{c.nb_eleves}</td>
                                                <td className="py-2 text-gray-600">{c.eleves.join(", ")}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </Card>
            )}
        </div>
    );
}
