import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { save, open } from "@tauri-apps/plugin-dialog";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { toast } from "sonner";
import { Download, Upload, Database, AlertCircle, FolderOpen } from "lucide-react";

import { useTranslation } from "react-i18next";

export function BackupPage() {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [backupPath, setBackupPath] = useState("");
    const [restorePath, setRestorePath] = useState("");

    const handleSelectBackupFile = async () => {
        try {
            const path = await save({
                filters: [{
                    name: 'Base de données SQLite',
                    extensions: ['db', 'sqlite']
                }],
                defaultPath: `association_backup_${new Date().toISOString().split('T')[0]}.db`
            });

            if (path) {
                setBackupPath(path);
            }
        } catch (error) {
            console.error("Erreur sélection fichier:", error);
        }
    };

    const handleSelectRestoreFile = async () => {
        try {
            const path = await open({
                multiple: false,
                filters: [{
                    name: 'Base de données SQLite',
                    extensions: ['db', 'sqlite']
                }]
            });

            if (path) {
                setRestorePath(path as string);
            }
        } catch (error) {
            console.error("Erreur sélection fichier:", error);
        }
    };

    const handleBackup = async () => {
        if (!backupPath) {
            toast.error(t("backup.enterPath"));
            return;
        }

        try {
            setLoading(true);
            await invoke("backup_database_to_file", { backupPath });
            toast.success(t("backup.backupSuccess"));
            setBackupPath("");
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            toast.error(`Erreur: ${message}`);
            console.error("Backup error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async () => {
        if (!restorePath) {
            toast.error(t("backup.enterRestorePath"));
            return;
        }

        const confirmed = window.confirm(
            t("backup.restoreConfirm")
        );

        if (!confirmed) return;

        try {
            setLoading(true);
            await invoke("restore_database_from_file", { backupPath: restorePath });
            toast.success(t("backup.restoreSuccess"));
            toast.info(t("backup.restartApp"));
            setRestorePath("");
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            toast.error(`Erreur: ${message}`);
            console.error("Restore error:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-3xl font-bold">{t("nav.backup")}</h1>

            {/* Warning Banner */}
            <Card className="p-4 bg-amber-50 border-amber-200">
                <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <h3 className="font-semibold text-amber-900">{t("common.important")}</h3>
                        <p className="text-sm text-amber-800 mt-1">
                            {t("backup.warning")}
                        </p>
                    </div>
                </div>
            </Card>

            {/* Backup Section */}
            <Card className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                    <Database className="w-6 h-6 text-blue-600" />
                    <div>
                        <h2 className="text-xl font-semibold">{t("backup.backupDb")}</h2>
                        <p className="text-sm text-gray-600">{t("backup.backupDesc")}</p>
                    </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-medium text-blue-900 mb-2">{t("backup.contentsTitle")}</h3>
                    <ul className="text-sm text-blue-800 space-y-1">
                        <li>• {t("backup.contentStudents")}</li>
                        <li>• {t("backup.contentPayments")}</li>
                        <li>• {t("backup.contentExpenses")}</li>
                        <li>• {t("backup.contentDonors")}</li>
                        <li>• {t("backup.contentUsers")}</li>
                        <li>• {t("backup.contentMessages")}</li>
                    </ul>
                </div>

                <div className="space-y-3">
                    <Label>{t("backup.path")}</Label>
                    <div className="flex gap-2">
                        <Input
                            type="text"
                            value={backupPath}
                            onChange={(e) => setBackupPath(e.target.value)}
                            placeholder="C:\\Backups\\association_backup_2026-01-05.db"
                            className="flex-1"
                        />
                        <Button
                            variant="outline"
                            onClick={handleSelectBackupFile}
                            title="Parcourir"
                        >
                            <FolderOpen className="w-4 h-4 mr-2" />
                            Parcourir
                        </Button>
                    </div>
                </div>

                <Button
                    onClick={handleBackup}
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                >
                    <Download className="w-4 h-4 mr-2" />
                    {loading ? "Sauvegarde en cours..." : "Créer une sauvegarde"}
                </Button>
            </Card>

            {/* Restore Section */}
            <Card className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                    <Upload className="w-6 h-6 text-orange-600" />
                    <div>
                        <h2 className="text-xl font-semibold">Restaurer la base de données</h2>
                        <p className="text-sm text-gray-600">Remplacer les données actuelles par une sauvegarde</p>
                    </div>
                </div>

                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <h3 className="font-medium text-red-900 mb-2">⚠️ Attention</h3>
                    <ul className="text-sm text-red-800 space-y-1">
                        <li>• Toutes les données actuelles seront remplacées</li>
                        <li>• Une sauvegarde de sécurité sera créée automatiquement</li>
                        <li>• L'application doit être redémarrée après la restauration</li>
                    </ul>
                </div>

                <div className="space-y-3">
                    <Label>Chemin de sauvegarde à restaurer</Label>
                    <div className="flex gap-2">
                        <Input
                            type="text"
                            value={restorePath}
                            onChange={(e) => setRestorePath(e.target.value)}
                            placeholder="C:\\Backups\\association_backup.db"
                            className="flex-1"
                        />
                        <Button
                            variant="outline"
                            onClick={handleSelectRestoreFile}
                            title="Parcourir"
                        >
                            <FolderOpen className="w-4 h-4 mr-2" />
                            Parcourir
                        </Button>
                    </div>
                </div>

                <Button
                    onClick={handleRestore}
                    disabled={loading}
                    variant="destructive"
                    className="w-full"
                >
                    <Upload className="w-4 h-4 mr-2" />
                    {loading ? "Restauration en cours..." : "Restaurer depuis une sauvegarde"}
                </Button>
            </Card>

            {/* Test Data Section - TEMPORARY */}
            <Card className="p-6 space-y-4 bg-purple-50 border-purple-200">
                <div className="flex items-center gap-3">
                    <Database className="w-6 h-6 text-purple-600" />
                    <div>
                        <h2 className="text-xl font-semibold text-purple-900">Données de Test (Temporaire)</h2>
                        <p className="text-sm text-purple-700">Charger des données de démonstration</p>
                    </div>
                </div>

                <div className="bg-purple-100 p-4 rounded-lg">
                    <h3 className="font-medium text-purple-900 mb-2">Inclut :</h3>
                    <ul className="text-sm text-purple-800 space-y-1">
                        <li>• 30 élèves répartis dans 6 classes</li>
                        <li>• 2 secrétaires (Fatima & Khadija)</li>
                        <li>• 6 enseignants, 6 niveaux, 6 classes</li>
                        <li>• Paiements avec retards</li>
                        <li>• Dépenses, dons, messages</li>
                    </ul>
                </div>

                <Button
                    onClick={async () => {
                        try {
                            setLoading(true);
                            await invoke("populate_test_data_command");
                            toast.success("Données de test chargées avec succès !");
                            toast.info("Actualisez la page pour voir les données");
                        } catch (error) {
                            const message = error instanceof Error ? error.message : String(error);
                            toast.error(`Erreur: ${message}`);
                        } finally {
                            setLoading(false);
                        }
                    }}
                    disabled={loading}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                >
                    <Download className="w-4 h-4 mr-2" />
                    {loading ? "Chargement..." : "Charger les données de test"}
                </Button>
            </Card>

            {/* Recommendations */}
            <Card className="p-6 bg-gray-50">
                <h3 className="font-semibold mb-3">💡 Recommandations</h3>
                <ul className="text-sm text-gray-700 space-y-2">
                    <li>📅 Effectuez une sauvegarde <strong>hebdomadaire</strong></li>
                    <li>💾 Conservez plusieurs sauvegardes (au moins 3)</li>
                    <li>☁️ Stockez les sauvegardes en dehors de l'ordinateur (clé USB, cloud)</li>
                    <li>✅ Testez la restauration une fois par mois</li>
                </ul>
            </Card>
        </div>
    );
}
