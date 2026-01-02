import { useState, useEffect } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { elevesApi, Eleve, UpdateEleveRequest } from "./api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface EleveDetailProps {
    eleveId: string;
    onBack: () => void;
    onEdit?: () => void;
}

export function EleveDetail({ eleveId, onBack }: EleveDetailProps) {
    const [eleve, setEleve] = useState<Eleve | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<UpdateEleveRequest>({});

    const loadEleve = async () => {
        setIsLoading(true);
        try {
            const data = await elevesApi.getById(eleveId);
            setEleve(data);
            // Initialize form data
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
        } catch (err) {
            toast.error("Erreur lors du chargement de l'élève");
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

        // Convert to base64
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

    if (isLoading) return <div className="text-center py-8">Chargement...</div>;
    if (!eleve) return <div className="text-center py-8 text-red-500">Élève introuvable</div>;

    // Helper to display photo
    const photoUrl = eleve.photo_path
        ? convertFileSrc(eleve.photo_path)
        : null;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <Button variant="ghost" onClick={onBack}>
                    ← Retour
                </Button>
                <div className="flex gap-2">
                    {!isEditing ? (
                        <>
                            <Button onClick={() => setIsEditing(true)} variant="outline">
                                Modifier
                            </Button>
                            <Button onClick={handleDelete} variant="destructive">
                                Supprimer
                            </Button>
                        </>
                    ) : (
                        <Button onClick={() => setIsEditing(false)} variant="ghost">
                            Annuler
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Column: Photo & Basic Info */}
                <Card className="md:col-span-1">
                    <CardContent className="pt-6 text-center">
                        <div className="w-32 h-32 mx-auto bg-emerald-100 rounded-full flex items-center justify-center mb-4 overflow-hidden border-4 border-emerald-50 relative">
                            {photoUrl ? (
                                <img src={photoUrl} alt="Photo" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-4xl text-emerald-600">
                                    {eleve.prenom[0]}{eleve.nom[0]}
                                </span>
                            )}
                        </div>

                        {!isEditing ? (
                            <>
                                <h2 className="text-xl font-bold text-gray-900">{eleve.prenom} {eleve.nom}</h2>
                                <p className="text-sm text-gray-500 mb-2">{eleve.code_matricule}</p>
                                <div className="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                                    Inscrit
                                </div>
                            </>
                        ) : (
                            <div className="space-y-4">
                                <div className="relative">
                                    <Button variant="outline" className="w-full relative pointer-events-none">
                                        Changer la photo
                                    </Button>
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                        onChange={handlePhotoUpload}
                                    />
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Right Column: Details Form */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Informations Personnelles</CardTitle>
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
        </div>
    );
}
