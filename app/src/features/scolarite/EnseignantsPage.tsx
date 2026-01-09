import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Search, GraduationCap, Phone, Mail } from "lucide-react";
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
import { api, Enseignant, CreateEnseignantRequest } from "./api"; // Removed unused imports
import { useTranslation } from "react-i18next";

export function EnseignantsPage() {
    const { t } = useTranslation();
    const [enseignants, setEnseignants] = useState<Enseignant[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEnseignant, setEditingEnseignant] = useState<Enseignant | null>(null);

    // Form State
    const [formData, setFormData] = useState<CreateEnseignantRequest>({
        nom: "",
        prenom: "",
        tel: "",
        email: "",
        specialite: "",
    });

    const fetchEnseignants = async (query = "") => {
        try {
            setLoading(true);
            const data = await api.getEnseignants(query || undefined);
            setEnseignants(data);
        } catch (error) {
            toast.error("Erreur lors du chargement des enseignants");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Simple debounce logic if useDebounce is unavailable, but let's assume direct effect for now
        const timer = setTimeout(() => {
            fetchEnseignants(search);
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingEnseignant) {
                await api.updateEnseignant(editingEnseignant.id, formData);
                toast.success("Enseignant mis à jour");
            } else {
                await api.createEnseignant(formData);
                toast.success("Enseignant créé");
            }
            setIsModalOpen(false);
            fetchEnseignants(search);
            resetForm();
        } catch (error) {
            toast.error("Erreur lors de l'enregistrement");
            console.error(error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Êtes-vous sûr de vouloir supprimer cet enseignant ?")) return;
        try {
            await api.deleteEnseignant(id);
            toast.success("Enseignant supprimé");
            fetchEnseignants(search);
        } catch (error) {
            toast.error("Impossible de supprimer");
            console.error(error);
        }
    };

    const openAddModal = () => {
        setEditingEnseignant(null);
        resetForm();
        setIsModalOpen(true);
    };

    const openEditModal = (ens: Enseignant) => {
        setEditingEnseignant(ens);
        setFormData({
            nom: ens.nom,
            prenom: ens.prenom,
            tel: ens.tel || "",
            email: ens.email || "",
            specialite: ens.specialite || "",
        });
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setFormData({
            nom: "",
            prenom: "",
            tel: "",
            email: "",
            specialite: "",
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">{t("classes.teachers")}</h2>
                    <p className="text-muted-foreground">
                        {t("classes.teachers")}
                    </p>
                </div>
                <Button onClick={openAddModal}>
                    <Plus className="mr-2 h-4 w-4" /> {t("common.add")}
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <GraduationCap className="h-5 w-5" /> {t("classes.teachers")}
                        </CardTitle>
                        <div className="relative w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder={t("common.search") + "..."}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-8"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t("students.lastName")}</TableHead>
                                <TableHead>{t("classes.specialty")}</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead>{t("expenses.status")}</TableHead>
                                <TableHead className="text-right">{t("common.actions")}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {enseignants.length === 0 && !loading && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        {t("classes.noTeachers")}
                                    </TableCell>
                                </TableRow>
                            )}
                            {enseignants.map((ens) => (
                                <TableRow key={ens.id}>
                                    <TableCell className="font-medium">
                                        {ens.nom} {ens.prenom}
                                    </TableCell>
                                    <TableCell>{ens.specialite || "-"}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col text-sm text-muted-foreground">
                                            {ens.tel && (
                                                <span className="flex items-center gap-1">
                                                    <Phone className="h-3 w-3" /> {ens.tel}
                                                </span>
                                            )}
                                            {ens.email && (
                                                <span className="flex items-center gap-1">
                                                    <Mail className="h-3 w-3" /> {ens.email}
                                                </span>
                                            )}
                                            {!ens.tel && !ens.email && "-"}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className={`px-2 py-1 rounded-full text-xs ${ens.actif ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                            {ens.actif ? t("users.active") : t("users.inactive")}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button variant="ghost" size="icon" onClick={() => openEditModal(ens)}>
                                            <Pencil className="h-4 w-4 text-blue-500" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(ens.id)}>
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
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{editingEnseignant ? t("common.edit") : t("common.add")}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">{t("students.lastName")}</label>
                                <Input
                                    value={formData.nom}
                                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">{t("students.firstName")}</label>
                                <Input
                                    value={formData.prenom}
                                    onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t("classes.specialty")}</label>
                            <Input
                                placeholder="Ex: Arabe, Français, Toutes..."
                                value={formData.specialite || ""}
                                onChange={(e) => setFormData({ ...formData, specialite: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Téléphone</label>
                                <Input
                                    placeholder="06..."
                                    value={formData.tel || ""}
                                    onChange={(e) => setFormData({ ...formData, tel: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Email</label>
                                <Input
                                    type="email"
                                    placeholder="prof@exemple.com"
                                    value={formData.email || ""}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                                {t("common.cancel")}
                            </Button>
                            <Button type="submit">{t("common.save")}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
