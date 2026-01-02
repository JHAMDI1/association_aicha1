import React, { useState, useEffect } from "react";
import { elevesApi, EleveListItem } from "./api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

interface ElevesListProps {
    onSelectEleve: (id: string) => void;
    onAddEleve: () => void;
}

export function ElevesList({ onSelectEleve, onAddEleve }: ElevesListProps) {
    const [eleves, setEleves] = useState<EleveListItem[]>([]);
    const [search, setSearch] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadEleves = async (searchTerm?: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await elevesApi.getAll(searchTerm || undefined);
            setEleves(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadEleves();
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        loadEleves(search);
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Liste des Élèves</h2>
                <Button onClick={onAddEleve} className="bg-emerald-600 hover:bg-emerald-700">
                    <span className="mr-2">+</span>
                    Ajouter un Élève
                </Button>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex gap-2">
                <Input
                    type="text"
                    placeholder="Rechercher par nom, prénom ou matricule..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1"
                />
                <Button type="submit" variant="outline">
                    Rechercher
                </Button>
                {search && (
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => { setSearch(""); loadEleves(); }}
                    >
                        Effacer
                    </Button>
                )}
            </form>

            {/* Error State */}
            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-red-600">{error}</p>
                </div>
            )}

            {/* Loading State */}
            {isLoading && (
                <div className="text-center py-8">
                    <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-gray-500">Chargement...</p>
                </div>
            )}

            {/* Empty State */}
            {!isLoading && eleves.length === 0 && (
                <Card>
                    <CardContent className="py-12 text-center">
                        <div className="text-5xl mb-4">🎓</div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun élève trouvé</h3>
                        <p className="text-gray-500 mb-4">
                            {search ? "Essayez avec d'autres termes de recherche." : "Commencez par ajouter votre premier élève."}
                        </p>
                        {!search && (
                            <Button onClick={onAddEleve} className="bg-emerald-600 hover:bg-emerald-700">
                                Ajouter un Élève
                            </Button>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Eleves List */}
            {!isLoading && eleves.length > 0 && (
                <div className="grid gap-3">
                    {eleves.map((eleve) => (
                        <Card
                            key={eleve.id}
                            className="cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => onSelectEleve(eleve.id)}
                        >
                            <CardContent className="p-4 flex items-center gap-4">
                                {/* Avatar */}
                                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    {eleve.photo_path ? (
                                        <img
                                            src={eleve.photo_path}
                                            alt={`${eleve.prenom} ${eleve.nom}`}
                                            className="w-full h-full rounded-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-emerald-600 font-semibold text-lg">
                                            {eleve.prenom[0]}{eleve.nom[0]}
                                        </span>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-gray-900 truncate">
                                        {eleve.prenom} {eleve.nom}
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        {eleve.code_matricule}
                                        {eleve.classe_nom && ` • ${eleve.classe_nom}`}
                                        {eleve.niveau_nom && ` (${eleve.niveau_nom})`}
                                    </p>
                                </div>

                                {/* Arrow */}
                                <div className="text-gray-400">→</div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Stats */}
            {!isLoading && eleves.length > 0 && (
                <p className="text-sm text-gray-500 text-center">
                    {eleves.length} élève{eleves.length > 1 ? "s" : ""} trouvé{eleves.length > 1 ? "s" : ""}
                </p>
            )}
        </div>
    );
}
