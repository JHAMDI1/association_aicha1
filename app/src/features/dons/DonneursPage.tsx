import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Plus, Search, Edit, Trash2, Phone, Mail, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { donneursApi, type DonneurListItem } from "./api";
import { DonneurModal } from "./DonneurModal";
import { DonModal } from "./DonModal";

export function DonneursPage() {
    const [donneurs, setDonneurs] = useState<DonneurListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [donModalOpen, setDonModalOpen] = useState(false);
    const [donneurIdForDon, setDonneurIdForDon] = useState<string | undefined>(undefined);

    const fetchDonneurs = async () => {
        try {
            setLoading(true);
            const data = await donneursApi.getAll();
            setDonneurs(data);
        } catch (error) {
            toast.error("Erreur lors du chargement des donneurs");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDonneurs();
    }, []);

    const handleSearch = async (query: string) => {
        setSearchQuery(query);
        if (query.trim() === "") {
            fetchDonneurs();
            return;
        }
        try {
            const results = await donneursApi.search(query);
            setDonneurs(results);
        } catch (error) {
            console.error("Search error:", error);
        }
    };

    const handleEdit = (id: string) => {
        setEditingId(id);
        setModalOpen(true);
    };

    const handleDelete = async (id: string, nom: string, prenom: string) => {
        if (!confirm(`Supprimer le donneur "${prenom} ${nom}" ?`)) return;

        try {
            await donneursApi.delete(id);
            toast.success("Donneur supprimé");
            fetchDonneurs();
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            if (message.includes("dons enregistrés")) {
                toast.error("Impossible de supprimer : ce donneur a des dons enregistrés");
            } else {
                toast.error("Erreur lors de la suppression");
            }
            console.error(error);
        }
    };

    const handleModalClose = () => {
        setModalOpen(false);
        setEditingId(null);
    };

    const handleOpenDon = (id?: string) => {
        setDonneurIdForDon(id);
        setDonModalOpen(true);
    };

    const totalDons = donneurs.reduce((sum, d) => sum + d.total_dons, 0);
    const totalDonateurs = donneurs.length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Donneurs</h1>
                    <p className="text-gray-500">Gestion des donateurs externes</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => handleOpenDon()} variant="secondary" className="gap-2 text-green-700 bg-green-100 hover:bg-green-200 border border-green-200">
                        <Gift className="h-4 w-4" />
                        Faire un don
                    </Button>
                    <Button onClick={() => setModalOpen(true)} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Nouveau Donneur
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-purple-100 rounded-full">
                                <Gift className="h-6 w-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Total des dons</p>
                                <p className="text-2xl font-bold text-purple-600">{totalDons.toFixed(2)} DH</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-100 rounded-full">
                                <Gift className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Nombre de donateurs</p>
                                <p className="text-2xl font-bold text-blue-600">{totalDonateurs}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-100 rounded-full">
                                <Gift className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Moyenne par donateur</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {totalDonateurs > 0 ? (totalDons / totalDonateurs).toFixed(2) : "0.00"} DH
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search & Table */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle>Liste des Donneurs</CardTitle>
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                type="text"
                                placeholder="Rechercher..."
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nom</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead className="text-right">Dons</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8">
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                                            Chargement...
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : donneurs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                                        Aucun donneur enregistré
                                    </TableCell>
                                </TableRow>
                            ) : (
                                donneurs.map((donneur) => (
                                    <TableRow key={donneur.id}>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium">{donneur.prenom} {donneur.nom}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                {donneur.telephone && (
                                                    <div className="flex items-center gap-1 text-sm text-gray-600">
                                                        <Phone className="h-3 w-3" />
                                                        {donneur.telephone}
                                                    </div>
                                                )}
                                                {donneur.email && (
                                                    <div className="flex items-center gap-1 text-sm text-gray-600">
                                                        <Mail className="h-3 w-3" />
                                                        {donneur.email}
                                                    </div>
                                                )}
                                                {!donneur.telephone && !donneur.email && (
                                                    <span className="text-gray-400 text-sm">-</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-sm font-medium">
                                                {donneur.nombre_dons}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right font-semibold text-green-600">
                                            {donneur.total_dons.toFixed(2)} DH
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEdit(donneur.id)}
                                                    title="Modifier"
                                                >
                                                    <Edit className="h-4 w-4 text-blue-500" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(donneur.id, donneur.nom, donneur.prenom)}
                                                    title="Supprimer"
                                                >
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleOpenDon(donneur.id)}
                                                    title="Ajouter un don"
                                                >
                                                    <Gift className="h-4 w-4 text-green-600" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Modal */}
            <DonneurModal
                open={modalOpen}
                donneurId={editingId}
                onClose={handleModalClose}
                onSuccess={fetchDonneurs}
            />

            {/* Donation Modal */}
            <DonModal
                open={donModalOpen}
                preselectedDonneurId={donneurIdForDon}
                onClose={() => setDonModalOpen(false)}
                onSuccess={fetchDonneurs} // Refresh stats
            />
        </div >
    );
}
