import React, { useState } from "react";
import { elevesApi, CreateEleveRequest } from "./api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface EleveFormProps {
    onSuccess: () => void;
    onCancel: () => void;
}

export function EleveForm({ onSuccess, onCancel }: EleveFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState<CreateEleveRequest>({
        nom: "",
        prenom: "",
        date_naissance: "",
        sexe: "",
        tuteur_nom: "",
        tuteur_tel: "",
        tuteur_cin: "",
        adresse: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!formData.nom || !formData.prenom) {
            setError("Le nom et le prénom sont obligatoires");
            return;
        }

        setIsLoading(true);
        try {
            await elevesApi.create(formData);
            onSuccess();
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>Ajouter un Élève</CardTitle>
                    <Button variant="ghost" onClick={onCancel}>✕</Button>
                </div>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Error Message */}
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}

                    {/* Identité */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Prénom *</label>
                            <Input
                                name="prenom"
                                value={formData.prenom}
                                onChange={handleChange}
                                placeholder="Prénom de l'élève"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Nom *</label>
                            <Input
                                name="nom"
                                value={formData.nom}
                                onChange={handleChange}
                                placeholder="Nom de l'élève"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Date de naissance</label>
                            <Input
                                name="date_naissance"
                                type="date"
                                value={formData.date_naissance}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Sexe</label>
                            <select
                                name="sexe"
                                value={formData.sexe}
                                onChange={handleChange}
                                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                                <option value="">-- Sélectionner --</option>
                                <option value="M">Masculin</option>
                                <option value="F">Féminin</option>
                            </select>
                        </div>
                    </div>

                    {/* Tuteur */}
                    <div className="border-t pt-4 mt-4">
                        <h3 className="font-semibold mb-3">Informations du Tuteur</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Nom du tuteur</label>
                                <Input
                                    name="tuteur_nom"
                                    value={formData.tuteur_nom}
                                    onChange={handleChange}
                                    placeholder="Nom complet"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Téléphone</label>
                                <Input
                                    name="tuteur_tel"
                                    value={formData.tuteur_tel}
                                    onChange={handleChange}
                                    placeholder="06 xx xx xx xx"
                                />
                            </div>
                        </div>
                        <div className="space-y-2 mt-4">
                            <label className="text-sm font-medium">CIN du tuteur</label>
                            <Input
                                name="tuteur_cin"
                                value={formData.tuteur_cin}
                                onChange={handleChange}
                                placeholder="XX123456"
                            />
                        </div>
                    </div>

                    {/* Adresse */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Adresse</label>
                        <textarea
                            name="adresse"
                            value={formData.adresse}
                            onChange={handleChange}
                            placeholder="Adresse complète"
                            className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onCancel}
                            className="flex-1"
                        >
                            Annuler
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                            disabled={isLoading}
                        >
                            {isLoading ? "Enregistrement..." : "Enregistrer"}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
