import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Users, School, UserPlus, Eye } from "lucide-react";
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
    inscriptionsApi,
    ClasseListItem,
    CreateClasseRequest,
    Niveau,
    Enseignant,
    EleveInClasse
} from "./api";
import { InscriptionModal } from "./InscriptionModal";
import { useTranslation } from "react-i18next";

const DEFAULT_ANNEE = "2025-2026";

export function ClassesPage() {
    const { t } = useTranslation();
    const [classes, setClasses] = useState<ClasseListItem[]>([]);
    const [niveaux, setNiveaux] = useState<Niveau[]>([]);
    const [enseignants, setEnseignants] = useState<Enseignant[]>([]);
    const [loading, setLoading] = useState(true);

    // Create/Edit Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Students Modal
    const [studentsModalOpen, setStudentsModalOpen] = useState(false);
    const [selectedClasse, setSelectedClasse] = useState<{ id: string; nom: string } | null>(null);
    const [classStudents, setClassStudents] = useState<EleveInClasse[]>([]);
    const [studentsLoading, setStudentsLoading] = useState(false);

    // Inscription Modal
    const [inscriptionModalOpen, setInscriptionModalOpen] = useState(false);
    const [preSelectedClassId, setPreSelectedClassId] = useState<string>("");

    const [formData, setFormData] = useState<CreateClasseRequest>({
        nom: "",
        niveau_id: "",
        enseignant_id: "",
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
                enseignant_id: formData.enseignant_id || undefined,
            };

            if (editingId) {
                await api.updateClasse(editingId, payload);
                toast.success("Classe mise à jour");
            } else {
                await api.createClasse(payload);
                toast.success("Classe créée");
            }
            setIsModalOpen(false);
            fetchData();
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

    const openEditModal = async (id: string) => {
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
            annee_scolaire: DEFAULT_ANNEE,
        });
    };

    // --- Students Modal Functions ---

    const openStudentsModal = async (classeId: string, classeNom: string) => {
        setSelectedClasse({ id: classeId, nom: classeNom });
        setStudentsModalOpen(true);
        setStudentsLoading(true);
        try {
            const students = await inscriptionsApi.getByClasse(classeId);
            setClassStudents(students);
        } catch (error) {
            toast.error("Impossible de charger la liste des élèves");
            console.error(error);
        } finally {
            setStudentsLoading(false);
        }
    };

    // deleted handleRemoveStudent

    const deleteInscription = async (inscriptionId: string) => {
        if (!confirm("Retirer cet élève de la classe ?")) return;
        try {
            await inscriptionsApi.delete(inscriptionId);
            toast.success("Élève retiré de la classe");
            // Refresh list
            if (selectedClasse) {
                openStudentsModal(selectedClasse.id, selectedClasse.nom);
            }
            fetchData(); // Update counts
        } catch (error) {
            toast.error("Erreur lors du retrait");
            console.error(error);
        }
    };

    // --- Inscription Modal Functions ---
    const openInscriptionModal = (classeId?: string) => {
        setPreSelectedClassId(classeId || "");
        setInscriptionModalOpen(true);
    };

    const handleInscriptionSuccess = () => {
        fetchData(); // Refresh counts
        if (selectedClasse && studentsModalOpen) {
            openStudentsModal(selectedClasse.id, selectedClasse.nom);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">{t("nav.classes")}</h2>
                    <p className="text-muted-foreground">
                        {t("classes.title")} {DEFAULT_ANNEE}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => openInscriptionModal()}>
                        <UserPlus className="mr-2 h-4 w-4" /> {t("students.addStudent")}
                    </Button>
                    <Button onClick={openAddModal}>
                        <Plus className="mr-2 h-4 w-4" /> {t("common.add")}
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <School className="h-5 w-5" /> {t("nav.classes")}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t("classes.className")}</TableHead>
                                <TableHead>{t("classes.level")}</TableHead>
                                <TableHead>{t("classes.teacher")}</TableHead>
                                <TableHead>{t("nav.students")}</TableHead>
                                <TableHead className="text-right">{t("common.actions")}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {classes.length === 0 && !loading && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        {t("classes.noClasses")}
                                    </TableCell>
                                </TableRow>
                            )}
                            {classes.map((cls) => (
                                <TableRow key={cls.id}>
                                    <TableCell className="font-medium">{cls.nom}</TableCell>
                                    <TableCell>{cls.niveau_nom}</TableCell>
                                    <TableCell>{cls.enseignant_nom || "-"}</TableCell>
                                    <TableCell>
                                        <div
                                            className="flex items-center gap-1 cursor-pointer hover:underline text-blue-600 w-fit"
                                            onClick={() => openStudentsModal(cls.id, cls.nom)}
                                        >
                                            <Users className="h-4 w-4" />
                                            <span>{cls.count_eleves}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right space-x-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            title="Voir les élèves / Inscrire"
                                            onClick={() => openStudentsModal(cls.id, cls.nom)}
                                        >
                                            <Eye className="h-4 w-4 text-gray-500" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => openEditModal(cls.id)}>
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

            {/* Create/Edit Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingId ? t("common.edit") : t("common.add")}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t("classes.className")}</label>
                            <Input
                                placeholder="Ex: Groupe A, A1..."
                                value={formData.nom}
                                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t("classes.level")}</label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={formData.niveau_id}
                                onChange={(e) => setFormData({ ...formData, niveau_id: e.target.value })}
                                required
                            >
                                <option value="">{t("common.select")}</option>
                                {niveaux.map((n) => (
                                    <option key={n.id} value={n.id}>
                                        {n.nom}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t("classes.teacher")}</label>
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
                                {t("common.cancel")}
                            </Button>
                            <Button type="submit">{t("common.save")}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Students List Modal */}
            <Dialog open={studentsModalOpen} onOpenChange={setStudentsModalOpen}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle className="flex justify-between items-center">
                            <span>{t("nav.students")} - {selectedClasse?.nom}</span>
                            <Button size="sm" onClick={() => openInscriptionModal(selectedClasse?.id)}>
                                <UserPlus className="mr-2 h-4 w-4" /> {t("common.add")}
                            </Button>
                        </DialogTitle>
                    </DialogHeader>

                    <div className="max-h-[60vh] overflow-auto">
                        {studentsLoading ? (
                            <div className="text-center py-8">{t("common.loading")}</div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t("students.photo")}</TableHead>
                                        <TableHead>{t("students.lastName")}</TableHead>
                                        <TableHead>{t("students.registrationDate")}</TableHead>
                                        <TableHead className="text-right">{t("common.actions")}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {classStudents.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                                {t("students.noStudents")}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        classStudents.map((eleve) => (
                                            <TableRow key={eleve.id}>
                                                <TableCell>
                                                    {eleve.eleve_photo ? (
                                                        <img
                                                            src={`http://localhost:1420/assets/${eleve.eleve_photo}`}
                                                            className="w-8 h-8 rounded-full object-cover"
                                                            alt=""
                                                        />
                                                    ) : (
                                                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs text-gray-500">
                                                            ?
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    {eleve.eleve_nom.toUpperCase()} {eleve.eleve_prenom}
                                                </TableCell>
                                                <TableCell>{eleve.date_inscription.split(' ')[0]}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => deleteInscription(eleve.id)}
                                                        title="Retirer de la classe"
                                                    >
                                                        <Trash2 className="h-4 w-4 text-red-500" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Inscription Modal */}
            <InscriptionModal
                open={inscriptionModalOpen}
                onClose={() => setInscriptionModalOpen(false)}
                onSuccess={handleInscriptionSuccess}
                preSelectedClassId={preSelectedClassId}
            />
        </div>
    );
}
