import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, ArrowUpAZ } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { api, Niveau, CreateNiveauRequest } from "./api";

export function NiveauxPage() {
    const [niveaux, setNiveaux] = useState<Niveau[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingNiveau, setEditingNiveau] = useState<Niveau | null>(null);

    // Form State
    const [formData, setFormData] = useState<CreateNiveauRequest>({
        nom: "",
        ordre: 0,
    });

    const fetchNiveaux = async () => {
        try {
            setLoading(true);
            const data = await api.getNiveaux();
            setNiveaux(data);
        } catch (error) {
            toast.error("Erreur lors du chargement des niveaux");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNiveaux();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingNiveau) {
                await api.updateNiveau(editingNiveau.id, formData);
                toast.success("Niveau mis à jour");
            } else {
                await api.createNiveau(formData);
                toast.success("Niveau créé");
            }
            setIsModalOpen(false);
            fetchNiveaux();
            resetForm();
        } catch (error) {
            // Cast error as string or any to check message
            const msg = String(error);
            if (msg.includes("UNIQUE constraint")) {
                toast.error("Ce nom de niveau existe déjà");
            } else {
                toast.error("Erreur lors de l'enregistrement");
            }
            console.error(error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Êtes-vous sûr de vouloir supprimer ce niveau ?")) return;
        try {
            await api.deleteNiveau(id);
            toast.success("Niveau supprimé");
            fetchNiveaux();
        } catch (error) {
            toast.error("Impossible de supprimer (peut-être utilisé par des classes)");
            console.error(error);
        }
    };

    const openAddModal = () => {
        setEditingNiveau(null);
        resetForm();
        setIsModalOpen(true);
    };

    const openEditModal = (niveau: Niveau) => {
        setEditingNiveau(niveau);
        setFormData({
            nom: niveau.nom,
            ordre: niveau.ordre,
        });
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setFormData({ nom: "", ordre: (niveaux.length + 1) * 10 });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Niveaux Scolaires</h2>
                    <p className="text-muted-foreground">
                        Gérez les années et niveaux (ex: Année 1, Crèche...)
                    </p>
                </div>
                <Button onClick={openAddModal}>
                    <Plus className="mr-2 h-4 w-4" /> Ajouter un niveau
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <ArrowUpAZ className="h-5 w-5" /> Liste des niveaux
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[100px]">Ordre</TableHead>
                                <TableHead>Nom</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {niveaux.length === 0 && !loading && (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                                        Aucun niveau défini. Commencez par en ajouter un.
                                    </TableCell>
                                </TableRow>
                            )}
                            {niveaux.map((niveau) => (
                                <TableRow key={niveau.id}>
                                    <TableCell className="font-medium">{niveau.ordre}</TableCell>
                                    <TableCell>{niveau.nom}</TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button variant="ghost" size="icon" onClick={() => openEditModal(niveau)}>
                                            <Pencil className="h-4 w-4 text-blue-500" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(niveau.id)}>
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingNiveau ? "Modifier le niveau" : "Ajouter un niveau"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Nom du niveau</label>
                            <Input
                                placeholder="Ex: Année 1"
                                value={formData.nom}
                                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Ordre d'affichage</label>
                            <Input
                                type="number"
                                value={formData.ordre}
                                onChange={(e) => setFormData({ ...formData, ordre: parseInt(e.target.value) || 0 })}
                                required
                            />
                            <p className="text-xs text-muted-foreground">Utilisé pour trier les niveaux (ex: 10, 20, 30...)</p>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                                Annuler
                            </Button>
                            <Button type="submit">Enregistrer</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
