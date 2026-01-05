import { useState, useEffect } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { elevesApi, Eleve, UpdateEleveRequest } from "./api";
import { inscriptionsApi, InscriptionDetail } from "../scolarite/api";
import { InscriptionModal } from "../scolarite/InscriptionModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { PaymentCalendar } from "@/components/PaymentCalendar";
import { User, School, CreditCard } from "lucide-react";

interface EleveDetailProps {
    eleveId: string;
    onBack: () => void;
    onNavigateToPayment?: (eleveId: string, selectedMonths: number[]) => void;
}

export function EleveDetail({ eleveId, onBack, onNavigateToPayment }: EleveDetailProps) {
    const [eleve, setEleve] = useState<Eleve | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"infos" | "scolarite" | "paiements">("infos");

    // Edit Mode State
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<UpdateEleveRequest>({});

    // Payments State
    const [paidMonths, setPaidMonths] = useState<number[]>([]);
    const [selectedMonths, setSelectedMonths] = useState<number[]>([]);

    // Inscription State
    const [inscription, setInscription] = useState<InscriptionDetail | null>(null);
    const [inscriptionModalOpen, setInscriptionModalOpen] = useState(false);

    const loadEleve = async () => {
        setIsLoading(true);
        try {
            const data = await elevesApi.getById(eleveId);
            setEleve(data);
            setFormData({
                nom: data.nom,
                prenom: data.prenom,
                date_naissance: data.date_naissance,
                sexe: data.sexe,
                tuteur_nom: data.tuteur_nom,
                tuteur_tel: data.tuteur_tel,
                tuteur_cin: data.tuteur_cin,
                adresse: data.adresse,
            });

            // Load paid months
            const months = await elevesApi.getPaidMonths(eleveId);
            setPaidMonths(months);

            // Load inscription
            const insc = await inscriptionsApi.getByEleve(eleveId);
            setInscription(insc);

        } catch (err) {
            toast.error("Erreur lors du chargement de l'élève");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadEleve();
    }, [eleveId]);

    const handleDelete = async () => {
        if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet élève ?")) return;

        try {
            await elevesApi.delete(eleveId);
            toast.success("Élève supprimé avec succès");
            onBack();
        } catch (err) {
            toast.error("Erreur lors de la suppression");
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await elevesApi.update(eleveId, formData);
            toast.success("Modifications enregistrées");
            setIsEditing(false);
            loadEleve();
        } catch (err) {
            toast.error("Erreur lors de la mise à jour");
        }
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async () => {
            const base64 = reader.result as string;
            try {
                await elevesApi.uploadPhoto(eleveId, base64);
                toast.success("Photo mise à jour");
                loadEleve();
            } catch (err) {
                toast.error("Erreur lors de l'upload de la photo");
            }
        };
        reader.readAsDataURL(file);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleInscriptionSuccess = () => {
        loadEleve(); // Reload to get updated inscription
    };

    if (isLoading) return <div className="text-center py-8">Chargement...</div>;
    if (!eleve) return <div className="text-center py-8 text-red-500">Élève introuvable</div>;

    const photoUrl = eleve.photo_path
        ? convertFileSrc(eleve.photo_path)
        : null;

    return (
        <div className="space-y-6">
            {/* Header / Navigation */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <Button variant="ghost" onClick={onBack}>
                        ← Retour
                    </Button>
                    <div className="flex gap-2">
                        {/* Global Actions if needed */}
                        {activeTab === 'infos' && !isEditing && (
                            <>
                                <Button onClick={() => setIsEditing(true)} variant="outline">Modifier</Button>
                                <Button onClick={handleDelete} variant="destructive">Supprimer</Button>
                            </>
                        )}
                        {activeTab === 'infos' && isEditing && (
                            <Button onClick={() => setIsEditing(false)} variant="ghost">Annuler</Button>
                        )}
                    </div>
                </div>

                {/* Profile Summary Card */}
                <div className="flex items-start gap-4 p-4 bg-white rounded-lg border shadow-sm">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center overflow-hidden border-2 border-emerald-50 shrink-0">
                        {photoUrl ? (
                            <img src={photoUrl} alt="Photo" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-xl text-emerald-600 font-bold">
                                {eleve.prenom[0]}{eleve.nom[0]}
                            </span>
                        )}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">{eleve.prenom} {eleve.nom}</h2>
                        <div className="text-sm text-gray-500 flex flex-col gap-1">
                            <span>{eleve.code_matricule}</span>
                            {inscription && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 w-fit">
                                    {inscription.classe_nom} ({inscription.niveau_nom})
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b">
                    <button
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'infos' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        onClick={() => setActiveTab('infos')}
                    >
                        <User className="h-4 w-4" /> Informations
                    </button>
                    <button
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'scolarite' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        onClick={() => setActiveTab('scolarite')}
                    >
                        <School className="h-4 w-4" /> Scolarité
                    </button>
                    <button
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'paiements' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        onClick={() => setActiveTab('paiements')}
                    >
                        <CreditCard className="h-4 w-4" /> Paiements
                    </button>
                </div>
            </div>

            {/* TAB CONTENT: INFORMATIONS */}
            {activeTab === 'infos' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Photo Upload (only in edit mode really relevant here, but keeping structure) */}
                    <Card className="md:col-span-1">
                        <CardContent className="pt-6 text-center">
                            {isEditing ? (
                                <div className="space-y-4">
                                    <div className="relative w-32 h-32 mx-auto">
                                        <div className="w-full h-full bg-emerald-100 rounded-full flex items-center justify-center overflow-hidden border-4 border-emerald-50">
                                            {photoUrl ? <img src={photoUrl} className="w-full h-full object-cover" /> : null}
                                        </div>
                                        <Input
                                            type="file"
                                            accept="image/*"
                                            className="mt-2"
                                            onChange={handlePhotoUpload}
                                        />
                                        <p className="text-xs text-gray-500 mt-1">Changer la photo</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center text-gray-500 py-8">
                                    Mode lecture seule. <br />Cliquez sur "Modifier" pour éditer.
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle>Détails</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {isEditing ? (
                                <form onSubmit={handleUpdate} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Prénom</label>
                                            <Input name="prenom" value={formData.prenom || ""} onChange={handleChange} required />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Nom</label>
                                            <Input name="nom" value={formData.nom || ""} onChange={handleChange} required />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Date de naissance</label>
                                            <Input type="date" name="date_naissance" value={formData.date_naissance || ""} onChange={handleChange} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Sexe</label>
                                            <select
                                                name="sexe"
                                                value={formData.sexe || ""}
                                                onChange={handleChange}
                                                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            >
                                                <option value="M">Masculin</option>
                                                <option value="F">Féminin</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Adresse</label>
                                        <Input name="adresse" value={formData.adresse || ""} onChange={handleChange} />
                                    </div>

                                    <div className="border-t pt-4">
                                        <h3 className="font-semibold mb-2">Tuteur</h3>
                                        <div className="space-y-3">
                                            <div className="grid grid-cols-2 gap-4">
                                                <Input placeholder="Nom du tuteur" name="tuteur_nom" value={formData.tuteur_nom || ""} onChange={handleChange} />
                                                <Input placeholder="CIN" name="tuteur_cin" value={formData.tuteur_cin || ""} onChange={handleChange} />
                                            </div>
                                            <Input placeholder="Téléphone" name="tuteur_tel" value={formData.tuteur_tel || ""} onChange={handleChange} />
                                        </div>
                                    </div>

                                    <div className="pt-4 flex justify-end">
                                        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                                            Enregistrer
                                        </Button>
                                    </div>
                                </form>
                            ) : (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                                        <div>
                                            <label className="text-xs text-gray-500 uppercase tracking-wider">Date de naissance</label>
                                            <p className="text-gray-900">{eleve.date_naissance || "Non renseignée"}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 uppercase tracking-wider">Sexe</label>
                                            <p className="text-gray-900">{eleve.sexe === 'M' ? 'Masculin' : 'Féminin'}</p>
                                        </div>
                                        <div className="col-span-2">
                                            <label className="text-xs text-gray-500 uppercase tracking-wider">Adresse</label>
                                            <p className="text-gray-900">{eleve.adresse || "Non renseignée"}</p>
                                        </div>
                                    </div>

                                    <div className="border-t pt-4">
                                        <h3 className="font-semibold mb-3 text-emerald-800">Contact Tuteur</h3>
                                        <div className="grid grid-cols-2 gap-y-2">
                                            <div>
                                                <span className="text-gray-500 text-sm">Nom :</span>
                                                <span className="ml-2 text-gray-900 font-medium">{eleve.tuteur_nom || "-"}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500 text-sm">Tél :</span>
                                                <span className="ml-2 text-gray-900 font-medium">{eleve.tuteur_tel || "-"}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500 text-sm">CIN :</span>
                                                <span className="ml-2 text-gray-900 font-medium">{eleve.tuteur_cin || "-"}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* TAB CONTENT: SCOLARITE */}
            {activeTab === 'scolarite' && (
                <Card>
                    <CardHeader>
                        <CardTitle>Parcours Scolaire</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {inscription ? (
                            <div className="space-y-6">
                                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                                    <h3 className="font-semibold text-blue-900 mb-2">Inscription Actuelle</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs text-blue-500 uppercase tracking-wider">Classe</label>
                                            <p className="text-lg font-medium">{inscription.classe_nom}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs text-blue-500 uppercase tracking-wider">Niveau</label>
                                            <p className="text-lg font-medium">{inscription.niveau_nom}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs text-blue-500 uppercase tracking-wider">Date Inscription</label>
                                            <p>{inscription.date_inscription.split(' ')[0]}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs text-blue-500 uppercase tracking-wider">Statut</label>
                                            <p className="text-green-600 font-medium">Actif</p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <Button variant="outline" onClick={() => setInscriptionModalOpen(true)}>
                                        Changer de classe / Réinscrire
                                    </Button>
                                    <p className="text-sm text-gray-500 mt-2">
                                        Une nouvelle inscription désactivera automatiquement la précédente.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed text-gray-500">
                                <p className="mb-4">Cet élève n'est inscrit dans aucune classe actuellement.</p>
                                <Button onClick={() => setInscriptionModalOpen(true)}>
                                    Inscrire dans une classe
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* TAB CONTENT: PAIEMENTS */}
            {activeTab === 'paiements' && (
                <Card>
                    <CardHeader>
                        <CardTitle>Suivi des Paiements</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <PaymentCalendar
                            paidMonths={paidMonths}
                            selectedMonths={selectedMonths}
                            onMonthToggle={(month) => {
                                setSelectedMonths(prev =>
                                    prev.includes(month)
                                        ? prev.filter(m => m !== month)
                                        : [...prev, month]
                                );
                            }}
                        />

                        {selectedMonths.length > 0 && (
                            <div className="mt-4 pt-4 border-t">
                                <Button
                                    onClick={() => {
                                        if (onNavigateToPayment) {
                                            onNavigateToPayment(eleveId, selectedMonths);
                                        } else {
                                            toast.info(`Paiement pour ${selectedMonths.length} mois sélectionné(s).`);
                                        }
                                    }}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                                >
                                    💳 Procéder au paiement ({selectedMonths.length} mois)
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            <InscriptionModal
                open={inscriptionModalOpen}
                onClose={() => setInscriptionModalOpen(false)}
                onSuccess={handleInscriptionSuccess}
                preSelectedEleve={{
                    id: eleve.id,
                    nom: eleve.nom,
                    prenom: eleve.prenom,
                    code_matricule: eleve.code_matricule,
                    photo_path: eleve.photo_path,
                    has_late_payments: false
                }}
            />
        </div>
    );
}
