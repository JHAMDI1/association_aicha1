import { useState } from "react";
import { useTranslation } from "react-i18next";
import { reportsApi, RecettesReport, DepensesReport, BilanReport, InscriptionItem, LatePaymentStudent } from "./api";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { toast } from "sonner";
import { Download, FileText } from "lucide-react";
import { exportToPDF } from "../../lib/pdfExport";
import { exportToExcel } from "../../lib/excelExport";
import { getLogoBase64 } from "../../lib/logoLoader";

type ReportType = "recettes" | "depenses" | "bilan" | "retards" | "inscriptions";

export function ReportsPage() {
    const { t } = useTranslation();
    const [reportType, setReportType] = useState<ReportType>("recettes");
    const [dateDebut, setDateDebut] = useState("");
    const [dateFin, setDateFin] = useState("");
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState<any>(null);

    const handleGenerate = async () => {
        if ((reportType === "recettes" || reportType === "depenses" || reportType === "bilan") && (!dateDebut || !dateFin)) {
            toast.error(t("reports.selectDateRange"));
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
            toast.success(t("reports.reportGenerated"));
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            toast.error(message || t("reports.generationError"));
            console.error("Report error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadExcel = async () => {
        if (!reportData) return;

        switch (reportType) {
            case "recettes":
                {
                    const rData = reportData as RecettesReport;
                    await exportToExcel({
                        title: t("reports.reportTitleIncome"),
                        subtitle: `${t("reports.period")} ${dateDebut} - ${dateFin}`,
                        data: rData.details.map(r => ({
                            date: r.date.split("T")[0],
                            eleve: `${r.eleve_prenom} ${r.eleve_nom}`,
                            mois: r.mois.toString(),
                            montant: `${r.montant.toFixed(2)} DH`,
                            mode: r.mode_paiement,
                        })),
                        columns: [
                            { header: t("common.date"), key: "date", width: 15 },
                            { header: t("students.firstName"), key: "eleve", width: 25 },
                            { header: t("payments.month"), key: "mois", width: 10 },
                            { header: t("payments.amount"), key: "montant", width: 15 },
                            { header: t("payments.paymentType"), key: "mode", width: 15 },
                        ],
                        filename: `recettes_${dateDebut}_${dateFin}.xlsx`,
                        total: {
                            label: t("reports.totalPeriod"),
                            key: "montant",
                            value: `${rData.total.toFixed(2)} DH`
                        }
                    });
                }
                break;

            case "depenses":
                {
                    const dData = reportData as DepensesReport;
                    await exportToExcel({
                        title: t("reports.reportTitleExpenses"),
                        subtitle: `${t("reports.period")} ${dateDebut} - ${dateFin}`,
                        data: dData.details.map(d => ({
                            date: d.date,
                            motif: d.motif,
                            montant: `${d.montant.toFixed(2)} DH`,
                            beneficiaire: d.beneficiaire,
                        })),
                        columns: [
                            { header: t("common.date"), key: "date", width: 15 },
                            { header: t("expenses.reason"), key: "motif", width: 30 },
                            { header: t("expenses.amount"), key: "montant", width: 15 },
                            { header: t("expenses.beneficiary"), key: "beneficiaire", width: 25 },
                        ],
                        filename: `depenses_${dateDebut}_${dateFin}.xlsx`,
                        total: {
                            label: t("reports.totalPeriod"),
                            key: "montant",
                            value: `${dData.total.toFixed(2)} DH`
                        }
                    });
                }
                break;

            case "bilan":
                {
                    const bData = reportData as BilanReport;
                    await exportToExcel({
                        title: t("reports.reportTitleBalance"),
                        subtitle: `${t("reports.period")} ${bData.periode}`,
                        data: [
                            { type: t("reports.income"), montant: `${bData.recettes.toFixed(2)} DH` },
                            { type: t("reports.expenses"), montant: `${bData.depenses.toFixed(2)} DH` },
                            { type: t("reports.balance"), montant: `${bData.solde.toFixed(2)} DH` },
                        ],
                        columns: [
                            { header: "Type", key: "type", width: 25 },
                            { header: t("payments.amount"), key: "montant", width: 20 },
                        ],
                        filename: `bilan_${dateDebut}_${dateFin}.xlsx`,
                    });
                }
                break;

            case "retards":
                {
                    const lData = reportData as LatePaymentStudent[];
                    await exportToExcel({
                        title: t("reports.reportTitleLate"),
                        subtitle: new Date().toLocaleDateString("fr-FR"),
                        data: lData.map(s => ({
                            nom: s.nom,
                            prenom: s.prenom,
                            classe: s.classe,
                            mois: s.mois_impayes.toString(),
                            montant: `${s.montant_du.toFixed(2)} DH`,
                        })),
                        columns: [
                            { header: t("students.lastName"), key: "nom", width: 20 },
                            { header: t("students.firstName"), key: "prenom", width: 20 },
                            { header: t("students.class"), key: "classe", width: 15 },
                            { header: t("dashboard.unpaidMonths"), key: "mois", width: 18 },
                            { header: t("dashboard.dueAmount"), key: "montant", width: 18 },
                        ],
                        filename: "retards_paiement.xlsx",
                    });
                }
                break;

            case "inscriptions":
                {
                    const iData = reportData as InscriptionItem[];
                    await exportToExcel({
                        title: t("reports.reportTitleClasses"),
                        subtitle: new Date().toLocaleDateString("fr-FR"),
                        data: iData.map(c => ({
                            classe: c.classe,
                            nombre: c.nb_eleves.toString(),
                            eleves: c.eleves.join(", "),
                        })),
                        columns: [
                            { header: t("classes.className"), key: "classe", width: 20 },
                            { header: t("classes.title"), key: "nombre", width: 15 },
                            { header: t("reports.classes"), key: "eleves", width: 50 },
                        ],
                        filename: "inscriptions.xlsx",
                    });
                }
                break;
        }

        toast.success(t("reports.csvDownloaded"));
    };

    const handleDownloadPDF = async () => {
        if (!reportData) return;
        const logo = await getLogoBase64();

        const commonOptions = { logo: logo || undefined };

        switch (reportType) {
            case "recettes":
                exportToPDF({
                    ...commonOptions,
                    title: t("reports.reportTitleIncome"),
                    subtitle: `${t("reports.period")} ${dateDebut} - ${dateFin}`,
                    data: (reportData as RecettesReport).details.map(r => ({
                        date: r.date.split("T")[0],
                        eleve: `${r.eleve_prenom} ${r.eleve_nom}`,
                        mois: r.mois.toString(),
                        montant: `${r.montant.toFixed(2)} DH`,
                        mode: r.mode_paiement,
                    })),
                    columns: [
                        { header: t("common.date"), dataKey: "date" },
                        { header: t("students.firstName"), dataKey: "eleve" },
                        { header: t("payments.month"), dataKey: "mois" },
                        { header: t("payments.amount"), dataKey: "montant" },
                        { header: t("payments.paymentType"), dataKey: "mode" },
                    ],
                    filename: `recettes_${dateDebut}_${dateFin}.pdf`,
                    total: {
                        label: t("reports.totalPeriod"),
                        dataKey: "montant",
                        value: `${(reportData as RecettesReport).total.toFixed(2)} DH`
                    }
                });
                break;

            case "depenses":
                exportToPDF({
                    title: t("reports.reportTitleExpenses"),
                    subtitle: `${t("reports.period")} ${dateDebut} - ${dateFin}`,
                    data: (reportData as DepensesReport).details.map(d => ({
                        date: d.date,
                        motif: d.motif,
                        montant: `${d.montant.toFixed(2)} DH`,
                        beneficiaire: d.beneficiaire,
                    })),
                    columns: [
                        { header: t("common.date"), dataKey: "date" },
                        { header: t("expenses.reason"), dataKey: "motif" },
                        { header: t("expenses.amount"), dataKey: "montant" },
                        { header: t("expenses.beneficiary"), dataKey: "beneficiaire" },
                    ],
                    filename: `depenses_${dateDebut}_${dateFin}.pdf`,
                    total: {
                        label: t("reports.totalPeriod"),
                        dataKey: "montant",
                        value: `${(reportData as DepensesReport).total.toFixed(2)} DH`
                    }
                });
                break;

            case "bilan":
                const bilan = reportData as BilanReport;
                exportToPDF({
                    title: t("reports.reportTitleBalance"),
                    subtitle: `${t("reports.period")} ${bilan.periode}`,
                    data: [
                        { type: t("reports.income"), montant: `${bilan.recettes.toFixed(2)} DH` },
                        { type: t("reports.expenses"), montant: `${bilan.depenses.toFixed(2)} DH` },
                        { type: t("reports.balance"), montant: `${bilan.solde.toFixed(2)} DH` },
                    ],
                    columns: [
                        { header: "Type", dataKey: "type" },
                        { header: t("payments.amount"), dataKey: "montant" },
                    ],
                    filename: `bilan_${dateDebut}_${dateFin}.pdf`,
                });
                break;

            case "retards":
                exportToPDF({
                    title: t("reports.reportTitleLate"),
                    subtitle: new Date().toLocaleDateString("fr-FR"),
                    data: (reportData as LatePaymentStudent[]).map(s => ({
                        nom: s.nom,
                        prenom: s.prenom,
                        classe: s.classe,
                        mois: s.mois_impayes.toString(),
                        montant: `${s.montant_du.toFixed(2)} DH`,
                    })),
                    columns: [
                        { header: t("students.lastName"), dataKey: "nom" },
                        { header: t("students.firstName"), dataKey: "prenom" },
                        { header: t("students.class"), dataKey: "classe" },
                        { header: t("dashboard.unpaidMonths"), dataKey: "mois" },
                        { header: t("dashboard.dueAmount"), dataKey: "montant" },
                    ],
                    filename: "retards_paiement.pdf",
                });
                break;

            case "inscriptions":
                exportToPDF({
                    title: t("reports.reportTitleClasses"),
                    subtitle: new Date().toLocaleDateString("fr-FR"),
                    data: (reportData as InscriptionItem[]).map(c => ({
                        classe: c.classe,
                        nombre: c.nb_eleves.toString(),
                        eleves: c.eleves.join(", "),
                    })),
                    columns: [
                        { header: t("classes.className"), dataKey: "classe" },
                        { header: t("classes.title"), dataKey: "nombre" },
                        { header: t("reports.classes"), dataKey: "eleves" },
                    ],
                    filename: "inscriptions.pdf",
                });
                break;
        }

        toast.success(t("reports.pdfDownloaded"));
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
            <h1 className="text-3xl font-bold">{t("nav.reports")}</h1>

            {/* Configuration */}
            <Card className="p-6 space-y-4">
                <h2 className="text-xl font-semibold">{t("reports.config")}</h2>

                {/* Type selector */}
                <div className="space-y-2">
                    <Label>{t("reports.reportType")}</Label>
                    <Select value={reportType} onValueChange={(v) => setReportType(v as ReportType)}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="recettes">💰 {t("reports.income")}</SelectItem>
                            <SelectItem value="depenses">💸 {t("reports.expenses")}</SelectItem>
                            <SelectItem value="bilan">📊 {t("reports.balance")}</SelectItem>
                            <SelectItem value="retards">⚠️ {t("reports.latePayments")}</SelectItem>
                            <SelectItem value="inscriptions">📚 {t("reports.classes")}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Date range (conditional) */}
                {needsDates && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>{t("reports.startDate")}</Label>
                                <Input
                                    type="date"
                                    value={dateDebut}
                                    onChange={(e) => setDateDebut(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>{t("reports.endDate")}</Label>
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
                                {t("reports.thisMonth")}
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setPreset("mois_dernier")}>
                                {t("reports.lastMonth")}
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setPreset("annee_scolaire")}>
                                {t("reports.schoolYear")}
                            </Button>
                        </div>
                    </>
                )}

                <Button onClick={handleGenerate} disabled={loading} className="w-full">
                    {loading ? t("common.loading") : t("reports.generate")}
                </Button>
            </Card>

            {/* Report preview */}
            {reportData && (
                <Card className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold">{t("reports.results")}</h2>
                        <div className="flex gap-2">
                            <Button onClick={handleDownloadPDF} variant="outline">
                                <FileText className="w-4 h-4 mr-2" />
                                {t("reports.exportPdf")}
                            </Button>
                            <Button onClick={handleDownloadExcel} variant="outline">
                                <Download className="w-4 h-4 mr-2" />
                                {t("reports.exportCsv")}
                            </Button>
                        </div>
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
                                            <th className="text-left pb-2">{t("students.registrationDate")}</th>
                                            <th className="text-left pb-2">{t("students.title")}</th>
                                            <th className="text-left pb-2">{t("payments.month")}</th>
                                            <th className="text-right pb-2">{t("payments.amount")}</th>
                                            <th className="text-left pb-2">{t("payments.paymentType")}</th>
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
                                            <th className="text-left pb-2">{t("common.date")}</th>
                                            <th className="text-left pb-2">{t("expenses.reason")}</th>
                                            <th className="text-right pb-2">{t("expenses.amount")}</th>
                                            <th className="text-left pb-2">{t("expenses.beneficiary")}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(reportData as DepensesReport).details.map((d, i) => (
                                            <tr key={i} className="border-b">
                                                <td className="py-2">{d.date}</td>
                                                <td className="py-2">{d.motif}</td>
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
                                    <p className="text-sm text-gray-600">{t("reports.income")}</p>
                                    <p className="text-2xl font-bold text-emerald-600">{(reportData as BilanReport).recettes.toFixed(2)} DH</p>
                                </Card>
                                <Card className="p-4 bg-red-50">
                                    <p className="text-sm text-gray-600">{t("reports.expenses")}</p>
                                    <p className="text-2xl font-bold text-red-600">{(reportData as BilanReport).depenses.toFixed(2)} DH</p>
                                </Card>
                                <Card className={`p-4 ${(reportData as BilanReport).solde >= 0 ? 'bg-blue-50' : 'bg-red-50'}`}>
                                    <p className="text-sm text-gray-600">{t("reports.balance")}</p>
                                    <p className={`text-2xl font-bold ${(reportData as BilanReport).solde >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                        {(reportData as BilanReport).solde.toFixed(2)} DH
                                    </p>
                                </Card>
                            </div>
                            <p className="text-sm text-gray-500">{(reportData as BilanReport).periode}</p>
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
                                            <th className="text-left pb-2">{t("students.lastName")}</th>
                                            <th className="text-left pb-2">{t("students.firstName")}</th>
                                            <th className="text-left pb-2">{t("students.class")}</th>
                                            <th className="text-right pb-2">{t("dashboard.unpaidMonths")}</th>
                                            <th className="text-right pb-2">{t("dashboard.dueAmount")}</th>
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
                                            <th className="text-left pb-2">{t("classes.className")}</th>
                                            <th className="text-right pb-2">{t("classes.title")} </th>
                                            <th className="text-left pb-2">{t("reports.classes")}</th>
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
