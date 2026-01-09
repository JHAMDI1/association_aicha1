import React, { useState, useEffect } from "react";
import { elevesApi, EleveListItem } from "./api";
import { convertFileSrc } from "@tauri-apps/api/core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ExportButton } from "@/components/ExportButton";
import { exportToCSV } from "@/lib/csvExport";
import { exportToPDF } from "@/lib/pdfExport";
import { getLogoBase64 } from "@/lib/logoLoader";
import { useTranslation } from "react-i18next";
import { EmptyState } from "@/components/EmptyState";
import { Users, UserPlus } from "lucide-react";

interface ElevesListProps {
    onSelectEleve: (id: string) => void;
    onAddEleve: () => void;
}

export function ElevesList({ onSelectEleve, onAddEleve }: ElevesListProps) {
    const { t } = useTranslation();
    const [eleves, setEleves] = useState<EleveListItem[]>([]);
    const [search, setSearch] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadEleves = async (searchTerm?: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await elevesApi.getAll(searchTerm || undefined);
            setEleves(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadEleves();
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        loadEleves(search);
    };

    const getExportData = () => {
        return eleves.map(e => ({
            ...e,
            nom_complet: `${e.nom} ${e.prenom}`,
            paiement_status: e.has_late_payments ? t("dashboard.latePayments") : t("payments.paid")
        }));
    }

    const exportColumns = [
        { header: "Matricule", dataKey: "code_matricule" },
        { header: t("students.lastName"), dataKey: "nom" },
        { header: t("students.firstName"), dataKey: "prenom" },
        { header: t("students.class"), dataKey: "classe_nom" },
        { header: t("nav.levels"), dataKey: "niveau_nom" },
        { header: t("students.paymentStatus"), dataKey: "paiement_status" },
    ];

    const handleExportCSV = () => {
        exportToCSV({
            filename: `eleves_aicha_${new Date().toISOString().split('T')[0]}`,
            title: t("students.title"),
            subtitle: `${new Date().toLocaleDateString("fr-FR")} - ${eleves.length} ${t("nav.students")}`,
            data: getExportData(),
            columns: exportColumns
        });
    };

    const handleExportPDF = async () => {
        const logo = await getLogoBase64();
        exportToPDF({
            filename: `eleves_aicha_${new Date().toISOString().split('T')[0]}.pdf`,
            title: t("students.title"),
            subtitle: `${new Date().toLocaleDateString("fr-FR")} - ${eleves.length} ${t("nav.students")}`,
            data: getExportData(),
            columns: exportColumns,
            logo: logo || undefined
        });
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">{t("students.title")}</h2>
                    <p className="text-sm text-muted-foreground">{eleves.length} {t("nav.students")}</p>
                </div>

                <div className="flex gap-2">
                    <ExportButton
                        onExportCSV={handleExportCSV}
                        onExportPDF={handleExportPDF}
                        disabled={eleves.length === 0}
                    />
                    <Button onClick={onAddEleve} className="bg-emerald-600 hover:bg-emerald-700">
                        <span className="mr-2">+</span>
                        {t("students.addStudent")}
                    </Button>
                </div>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex gap-2">
                <Input
                    type="text"
                    placeholder={t("common.search") + "..."}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1"
                />
                <Button type="submit" variant="outline">
                    {t("common.search")}
                </Button>
                {search && (
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => { setSearch(""); loadEleves(); }}
                    >
                        {t("common.close")}
                    </Button>
                )}
            </form>

            {/* Error State */}
            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-red-600">{error}</p>
                </div>
            )}

            {/* Loading State */}
            {isLoading && (
                <div className="text-center py-8">
                    <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-gray-500">{t("common.loading")}</p>
                </div>
            )}

            {/* Empty State */}
            {!isLoading && eleves.length === 0 && !error && (
                <Card>
                    <CardContent className="p-6">
                        <EmptyState
                            icon={<Users className="w-12 h-12 text-gray-300" />}
                            title={t("students.noStudents")}
                            description={search ? t("common.search") : t("students.addStudent")}
                            action={
                                !search ? (
                                    <Button onClick={onAddEleve} className="bg-emerald-600 hover:bg-emerald-700">
                                        <UserPlus className="w-4 h-4 mr-2" />
                                        {t("students.addStudent")}
                                    </Button>
                                ) : undefined
                            }
                        />
                    </CardContent>
                </Card>
            )}

            {/* Eleves List */}
            {!isLoading && eleves.length > 0 && (
                <div className="grid gap-3">
                    {eleves.map((eleve) => (
                        <Card
                            key={eleve.id}
                            className={`cursor-pointer hover:shadow-md transition-all border-l-4 ${eleve.has_late_payments
                                ? 'bg-red-50 border-l-red-500 hover:bg-red-100'
                                : 'bg-green-50 border-l-green-500 hover:bg-green-100'
                                }`}
                            onClick={() => onSelectEleve(eleve.id)}
                        >
                            <CardContent className="p-4 flex items-center gap-4">
                                {/* Avatar */}
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${eleve.has_late_payments ? 'bg-red-200' : 'bg-emerald-100'
                                    }`}>
                                    {eleve.photo_path ? (
                                        <img
                                            src={convertFileSrc(eleve.photo_path)}
                                            alt={`${eleve.prenom} ${eleve.nom}`}
                                            className="w-full h-full rounded-full object-cover"
                                        />
                                    ) : (
                                        <span className={`font-semibold text-lg ${eleve.has_late_payments ? 'text-red-700' : 'text-emerald-600'
                                            }`}>
                                            {eleve.prenom[0]}{eleve.nom[0]}
                                        </span>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-gray-900 truncate">
                                        {eleve.prenom} {eleve.nom}
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        {eleve.code_matricule}
                                        {eleve.classe_nom && ` • ${eleve.classe_nom}`}
                                        {eleve.niveau_nom && ` (${eleve.niveau_nom})`}
                                    </p>
                                    {eleve.has_late_payments && (
                                        <p className="text-xs text-red-600 font-medium mt-1">
                                            ⚠️ {t("dashboard.latePayments")}
                                        </p>
                                    )}
                                </div>

                                {/* Arrow */}
                                <div className="text-gray-400">→</div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
