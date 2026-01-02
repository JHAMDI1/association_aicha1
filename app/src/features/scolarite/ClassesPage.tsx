import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Users, School } from "lucide-react";
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
import {
    api,
    ClasseListItem,
    CreateClasseRequest,
    Niveau,
    Enseignant
} from "./api";

// Removed CONFIG import
const DEFAULT_ANNEE = "2025-2026";

export function ClassesPage() {
    const [classes, setClasses] = useState<ClasseListItem[]>([]);
    const [niveaux, setNiveaux] = useState<Niveau[]>([]);
    const [enseignants, setEnseignants] = useState<Enseignant[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState<CreateClasseRequest>({
        nom: "",
        niveau_id: "",
        enseignant_id: "", // Optional
        annee_scolaire: DEFAULT_ANNEE,
    });

    const fetchData = async () => {
        try {
            setLoading(true);
            const [classesData, niveauxData, enseignantsData] = await Promise.all([
                api.getClasses(),
                api.getNiveaux(),
                api.getEnseignants(),
            ]);
            setClasses(classesData);
            setNiveaux(niveauxData);
            setEnseignants(enseignantsData);
        } catch (error) {
            toast.error("Erreur lors du chargement des données");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.niveau_id) {
            toast.error("Veuillez sélectionner un niveau");
            return;
        }

        try {
            const payload = {
                ...formData,
                enseignant_id: formData.enseignant_id || undefined, // Convert empty string to undefined
            };

            if (editingId) {
                await api.updateClasse(editingId, payload);
                toast.success("Classe mise à jour");
            } else {
                await api.createClasse(payload);
                toast.success("Classe créée");
            }
            setIsModalOpen(false);
            fetchData(); // Reload all to update list and counts/relations
            resetForm();
        } catch (error) {
            toast.error("Erreur lors de l'enregistrement");
            console.error(error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Êtes-vous sûr de vouloir supprimer cette classe ?")) return;
        try {
            await api.deleteClasse(id);
            toast.success("Classe supprimée");
            fetchData();
        } catch (error) {
            // Cast error as string to check message
            const msg = String(error);
            if (msg.includes("contient des élèves")) {
                toast.error("Impossible: La classe contient des élèves");
            } else {
                toast.error("Impossible de supprimer cette classe");
            }
            console.error(error);
        }
    };

    const openAddModal = () => {
        setEditingId(null);
        resetForm();
        setIsModalOpen(true);
    };

    const openEditModal = (cls: ClasseListItem, _fullDetails: any) => {
        // Ideally we would fetch full details or find them. 
        // Here cls has IDs but simplified. Wait, ClasseListItem doesn't have raw IDs for relations usually?
        // Let's check api.ts definition. 
        // ClasseListItem has: niveau_nom, enseignant_nom. Does NOT have niveau_id?
        // Ah, I defined ClasseListItem without niveau_id in Rust.
        // So I need to fetch the specific classe to edit it properly, or I need to add IDs to the list item.
        // I should fetch details.

        fetchClasseDetails(cls.id);
    };

    const fetchClasseDetails = async (id: string) => {
        try {
            const details = await api.getClasse(id);
            setEditingId(id);
            setFormData({
                nom: details.nom,
                niveau_id: details.niveau_id,
                enseignant_id: details.enseignant_id || "",
                annee_scolaire: details.annee_scolaire,
            });
            setIsModalOpen(true);
        } catch (error) {
            toast.error("Erreur lors du chargement de la classe");
        }
    };

    const resetForm = () => {
        setFormData({
            nom: "",
            niveau_id: "",
            enseignant_id: "",
            annee_scolaire: DEFAULT_ANNEE, // Should use current configured year
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Classes</h2>
                    <p className="text-muted-foreground">
                        Groupes d'élèves pour l'année {DEFAULT_ANNEE}
                    </p>
                </div>
                <Button onClick={openAddModal}>
                    <Plus className="mr-2 h-4 w-4" /> Nouvelle Classe
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* KPI Cards maybe? No, let's just list classes */}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <School className="h-5 w-5" /> Liste des classes
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Classe</TableHead>
                                <TableHead>Niveau</TableHead>
                                <TableHead>Enseignant</TableHead>
                                <TableHead>Effectif</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {classes.length === 0 && !loading && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        Aucune classe définie.
                                    </TableCell>
                                </TableRow>
                            )}
                            {classes.map((cls) => (
                                <TableRow key={cls.id}>
                                    <TableCell className="font-medium">{cls.nom}</TableCell>
                                    <TableCell>{cls.niveau_nom}</TableCell>
                                    <TableCell>{cls.enseignant_nom || "-"}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1">
                                            <Users className="h-4 w-4 text-muted-foreground" />
                                            <span>{cls.count_eleves}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button variant="ghost" size="icon" onClick={() => openEditModal(cls, null)}>
                                            <Pencil className="h-4 w-4 text-blue-500" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(cls.id)}>
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
                        <DialogTitle>{editingId ? "Modifier la classe" : "Nouvelle Classe"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Nom de la classe</label>
                            <Input
                                placeholder="Ex: Groupe A, A1..."
                                value={formData.nom}
                                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Niveau</label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={formData.niveau_id}
                                onChange={(e) => setFormData({ ...formData, niveau_id: e.target.value })}
                                required
                            >
                                <option value="">Sélectionner un niveau</option>
                                {niveaux.map((n) => (
                                    <option key={n.id} value={n.id}>
                                        {n.nom}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Enseignant Principal</label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={formData.enseignant_id}
                                onChange={(e) => setFormData({ ...formData, enseignant_id: e.target.value })}
                            >
                                <option value="">Aucun</option>
                                {enseignants.map((e) => (
                                    <option key={e.id} value={e.id}>
                                        {e.nom} {e.prenom} {e.specialite ? `(${e.specialite})` : ""}
                                    </option>
                                ))}
                            </select>
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
