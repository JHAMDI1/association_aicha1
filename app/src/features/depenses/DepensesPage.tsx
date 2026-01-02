import { useState, useEffect } from "react";
import { Wallet, Eye, Check, X as XIcon, Plus, FileText, X } from "lucide-react";
import { toast } from "sonner";
import { convertFileSrc } from "@tauri-apps/api/core";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog";
import { depensesApi, type DepenseListItem, type DepenseStats } from "./api";
import { DepenseModal } from "./DepenseModal";
import { DepenseDetailModal } from "./DepenseDetailModal";
import { useAuth } from "@/features/auth/AuthContext";

export function DepensesPage() {
    const { user } = useAuth();
    const isAdmin = user?.role === "ADMIN";

    const [depenses, setDepenses] = useState<DepenseListItem[]>([]);
    const [stats, setStats] = useState<DepenseStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>("all");
    const [modalOpen, setModalOpen] = useState(false);

    // Image preview modal
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [previewTitle, setPreviewTitle] = useState("");

    // Detail modal
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [selectedDepenseId, setSelectedDepenseId] = useState<string | null>(null);

    const openDetailModal = (depenseId: string) => {
        setSelectedDepenseId(depenseId);
        setDetailModalOpen(true);
    };

    const fetchDepenses = async () => {
        try {
            setLoading(true);
            const filterValue = filter === "all" ? undefined : filter;
            const [data, statsData] = await Promise.all([
                depensesApi.getAll(filterValue),
                depensesApi.getStats()
            ]);
            setDepenses(data);
            setStats(statsData);
        } catch (error) {
            toast.error("Erreur lors du chargement des dépenses");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDepenses();
    }, [filter]);

    const handleValider = async (id: string, numero: string) => {
        if (!confirm(`Valider la dépense ${numero} ?`)) return;
        try {
            await depensesApi.valider(id);
            toast.success("Dépense validée");
            fetchDepenses();
        } catch (error) {
            toast.error("Erreur lors de la validation");
            console.error(error);
        }
    };

    const handleRejeter = async (id: string, numero: string) => {
        const motif = prompt(`Motif du rejet pour ${numero} ?`);
        if (motif === null) return;
        try {
            await depensesApi.rejeter(id, motif || undefined);
            toast.success("Dépense rejetée");
            fetchDepenses();
        } catch (error) {
            toast.error("Erreur lors du rejet");
            console.error(error);
        }
    };

    const handleViewPreuve = async (depenseId: string, numero: string) => {
        try {
            const depense = await depensesApi.getById(depenseId);
            if (depense.piece_jointe_path) {
                // Convert relative path to absolute file URL for Tauri
                const imageUrl = convertFileSrc(depense.piece_jointe_path);
                setPreviewImage(imageUrl);
                setPreviewTitle(`Facture ${numero}`);
                setPreviewOpen(true);
            } else {
                toast.error("Aucune preuve disponible");
            }
        } catch (error) {
            toast.error("Erreur lors du chargement de la preuve");
            console.error(error);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("fr-FR");
    };

    const getEtatBadge = (etat: string) => {
        const badges: Record<string, { bg: string; text: string; label: string }> = {
            EN_ATTENTE: { bg: "bg-yellow-100", text: "text-yellow-700", label: "En attente" },
            VALIDE: { bg: "bg-green-100", text: "text-green-700", label: "Validée" },
            REJETE: { bg: "bg-red-100", text: "text-red-700", label: "Rejetée" },
            BROUILLON: { bg: "bg-gray-100", text: "text-gray-700", label: "Brouillon" },
        };
        const badge = badges[etat] || badges.BROUILLON;
        return (
            <span className={`px-2 py-1 rounded-full text-xs ${badge.bg} ${badge.text}`}>
                {badge.label}
            </span>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Dépenses</h2>
                    <p className="text-muted-foreground">
                        Gérez les ordres de paiement et factures
                    </p>
                </div>
                <Button onClick={() => setModalOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Nouvelle Dépense
                </Button>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-2 gap-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Total ce mois
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">
                                {stats.total_mois.toFixed(2)} DH
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                En attente
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-yellow-600">
                                {stats.en_attente}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Wallet className="h-5 w-5" /> Liste des dépenses
                    </CardTitle>
                    <Select value={filter} onValueChange={setFilter}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filtrer par état" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Toutes</SelectItem>
                            <SelectItem value="EN_ATTENTE">En attente</SelectItem>
                            <SelectItem value="VALIDE">Validées</SelectItem>
                            <SelectItem value="REJETE">Rejetées</SelectItem>
                        </SelectContent>
                    </Select>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>N°</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Bénéficiaire</TableHead>
                                <TableHead>Motif</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead className="text-right">Montant</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead>Preuve</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {depenses.length === 0 && !loading && (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                                        Aucune dépense enregistrée.
                                    </TableCell>
                                </TableRow>
                            )}
                            {depenses.map((dep) => (
                                <TableRow key={dep.id}>
                                    <TableCell className="font-medium">{dep.numero}</TableCell>
                                    <TableCell>{formatDate(dep.date_operation)}</TableCell>
                                    <TableCell>{dep.beneficiaire}</TableCell>
                                    <TableCell className="max-w-[200px] truncate">{dep.motif || "-"}</TableCell>
                                    <TableCell>{dep.type_depense}</TableCell>
                                    <TableCell className="text-right font-semibold text-red-600">
                                        -{dep.montant.toFixed(2)} DH
                                    </TableCell>
                                    <TableCell>{getEtatBadge(dep.etat)}</TableCell>
                                    <TableCell>
                                        {dep.has_piece_jointe ? (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                title="Voir la preuve"
                                                onClick={() => handleViewPreuve(dep.id, dep.numero)}
                                            >
                                                <FileText className="h-4 w-4 text-blue-500" />
                                            </Button>
                                        ) : (
                                            <span className="text-muted-foreground text-xs">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right space-x-1">
                                        {isAdmin && dep.etat === "EN_ATTENTE" && (
                                            <>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleValider(dep.id, dep.numero)}
                                                    title="Valider"
                                                >
                                                    <Check className="h-4 w-4 text-green-500" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleRejeter(dep.id, dep.numero)}
                                                    title="Rejeter"
                                                >
                                                    <XIcon className="h-4 w-4 text-red-500" />
                                                </Button>
                                            </>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            title="Voir le détail"
                                            onClick={() => openDetailModal(dep.id)}
                                        >
                                            <Eye className="h-4 w-4 text-blue-500" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <DepenseModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                onSuccess={fetchDepenses}
            />

            {/* Image Preview Modal */}
            <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                <DialogContent className="max-w-3xl p-0">
                    <div className="relative">
                        <div className="bg-gray-900 text-white px-4 py-2 flex items-center justify-between">
                            <span className="font-medium">{previewTitle}</span>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-white hover:bg-gray-700"
                                onClick={() => setPreviewOpen(false)}
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                        {previewImage && (
                            <img
                                src={previewImage}
                                alt={previewTitle}
                                className="w-full max-h-[70vh] object-contain bg-black"
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Expense Detail Modal */}
            <DepenseDetailModal
                depenseId={selectedDepenseId}
                open={detailModalOpen}
                onClose={() => setDetailModalOpen(false)}
            />
        </div>
    );
}
