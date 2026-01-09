import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../../components/ui/select";
import { toast } from "sonner";
import { History, RefreshCw, X } from "lucide-react";
import { useTranslation } from "react-i18next";

interface AuditLog {
    id: string;
    user_id: string;
    user_name: string | null;
    action: string;
    entite: string;
    entite_id: string | null;
    details: string | null;
    timestamp: string;
}

interface AuditLogResponse {
    logs: AuditLog[];
    total: number;
}

interface User {
    id: string;
    nom: string;
    prenom: string;
}

export function AuditLogsPage() {
    const { t } = useTranslation();
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState<User[]>([]);

    // Filters
    const [userId, setUserId] = useState<string>("all");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [selectedActions, setSelectedActions] = useState<string[]>([]);

    const actionsList = ["CREATION", "MODIFICATION", "SUPPRESSION", "VALIDATION", "REJET", "ANNULATION"];

    // Fetch users for filter
    useEffect(() => {
        invoke<User[]>("get_users").then(setUsers).catch(console.error);
    }, []);

    const loadLogs = async () => {
        try {
            setLoading(true);

            const filters = {
                limit: 100, // Reasonable limit
                offset: 0,
                user_id: userId === "all" ? null : userId,
                start_date: startDate || null,
                end_date: endDate || null,
                actions: selectedActions.length > 0 ? selectedActions : null
            };

            const response = await invoke<AuditLogResponse>("get_audit_logs", { filters });
            setLogs(response.logs);
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            console.error(error);
            toast.error(`Erreur: ${message}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadLogs();
    }, [userId, startDate, endDate, selectedActions]);

    const toggleAction = (action: string) => {
        setSelectedActions(prev =>
            prev.includes(action)
                ? prev.filter(a => a !== action)
                : [...prev, action]
        );
    };

    const clearFilters = () => {
        setUserId("all");
        setStartDate("");
        setEndDate("");
        setSelectedActions([]);
    };

    const getActionColor = (action: string) => {
        if (action.includes("CREATE") || action.includes("CREATION")) return "bg-green-100 text-green-800";
        if (action.includes("UPDATE") || action.includes("MODIF")) return "bg-blue-100 text-blue-800";
        if (action.includes("DELETE") || action.includes("SUPPRESSION")) return "bg-red-100 text-red-800";
        if (action.includes("VALIDATION")) return "bg-purple-100 text-purple-800";
        if (action.includes("REJET") || action.includes("ANNULATION")) return "bg-orange-100 text-orange-800";
        return "bg-gray-100 text-gray-800";
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <History className="w-8 h-8 text-indigo-600" />
                    <div>
                        <h1 className="text-3xl font-bold">{t("nav.history")}</h1>
                        <p className="text-gray-600">{t("audit.subtitle")}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button onClick={clearFilters} variant="ghost" size="sm">
                        <X className="w-4 h-4 mr-2" />
                        Effacer filtres
                    </Button>
                    <Button onClick={loadLogs} disabled={loading} variant="outline">
                        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        {t("audit.refresh")}
                    </Button>
                </div>
            </div>

            <Card className="p-4 bg-gray-50/50">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    {/* User Filter */}
                    <div className="space-y-2">
                        <Label>{t("audit.user")}</Label>
                        <Select value={userId} onValueChange={setUserId}>
                            <SelectTrigger className="bg-white">
                                <SelectValue placeholder="Tous les utilisateurs" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tous les utilisateurs</SelectItem>
                                {users.map(u => (
                                    <SelectItem key={u.id} value={u.id}>{u.nom} {u.prenom}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Date Filters */}
                    <div className="space-y-2">
                        <Label>Date de début</Label>
                        <Input
                            type="date"
                            value={startDate}
                            onChange={e => setStartDate(e.target.value)}
                            className="bg-white"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Date de fin</Label>
                        <Input
                            type="date"
                            value={endDate}
                            onChange={e => setEndDate(e.target.value)}
                            className="bg-white"
                        />
                    </div>

                    {/* Action Filters (Simple Multi-select simulation) */}
                    <div className="space-y-2">
                        <Label>Actions</Label>
                        <div className="flex flex-wrap gap-2">
                            {actionsList.map(action => (
                                <button
                                    key={action}
                                    onClick={() => toggleAction(action)}
                                    className={`text-xs px-2 py-1 rounded border transition-colors ${selectedActions.includes(action)
                                        ? "bg-indigo-100 border-indigo-300 text-indigo-800 font-medium"
                                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-100"
                                        }`}
                                >
                                    {action}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </Card>

            <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium text-gray-600">{t("audit.date")}</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-600">{t("audit.user")}</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-600">{t("common.actions")}</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-600">{t("audit.entity")}</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-600">Détails</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {logs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                                        {loading ? t("common.loading") : t("audit.noLogs")}
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                                            {new Date(log.timestamp).toLocaleString("fr-FR")}
                                        </td>
                                        <td className="px-4 py-3 font-medium">
                                            {log.user_name || log.user_id.slice(0, 8)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${getActionColor(log.action)}`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-700">
                                            {log.entite}
                                            {log.entite_id && <span className="text-xs text-gray-400 ml-1">#{log.entite_id.slice(0, 4)}</span>}
                                        </td>
                                        <td className="px-4 py-3 text-gray-500 text-xs max-w-xs truncate" title={log.details || ""}>
                                            {log.details || "-"}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="p-2 text-xs text-gray-400 text-center border-t">
                    Affichage des 100 derniers résultats (filtrés)
                </div>
            </Card>
        </div>
    );
}
