import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { elevesApi, EleveListItem } from "../eleves/api";
import { inscriptionsApi, ClasseForSelect } from "./api";

interface InscriptionModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    preSelectedClassId?: string;
    preSelectedEleve?: EleveListItem;
}

export function InscriptionModal({ open, onClose, onSuccess, preSelectedClassId, preSelectedEleve }: InscriptionModalProps) {
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState<EleveListItem[]>([]);
    const [selectedEleve, setSelectedEleve] = useState<EleveListItem | null>(null);
    const [selectedClassId, setSelectedClassId] = useState<string>(preSelectedClassId || "");
    const [classes, setClasses] = useState<ClasseForSelect[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        if (open) {
            loadClasses();
            // Reset state
            setSearchTerm("");
            setSearchResults([]);

            if (preSelectedEleve) {
                setSelectedEleve(preSelectedEleve);
            } else {
                setSelectedEleve(null);
            }

            if (preSelectedClassId) setSelectedClassId(preSelectedClassId);
            else setSelectedClassId("");
        }
    }, [open, preSelectedClassId, preSelectedEleve]);

    const loadClasses = async () => {
        try {
            const rawClasses = await inscriptionsApi.getClassesForSelect();
            // Map the tuple [id, nom, niveau_nom] to object
            setClasses(rawClasses.map(c => ({
                id: c[0],
                nom: c[1],
                niveau_nom: c[2]
            })));
        } catch (error) {
            console.error("Failed to load classes", error);
        }
    };

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchTerm.length >= 2 && !selectedEleve) {
                performSearch();
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm, selectedEleve]);

    const performSearch = async () => {
        setIsSearching(true);
        try {
            const results = await elevesApi.search(searchTerm);
            setSearchResults(results);
        } catch (error) {
            console.error("Search error:", error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSelectEleve = (eleve: EleveListItem) => {
        setSelectedEleve(eleve);
        setSearchTerm(`${eleve.nom.toUpperCase()} ${eleve.prenom}`);
        setSearchResults([]);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedEleve) {
            toast.error("Veuillez sélectionner un élève");
            return;
        }

        if (!selectedClassId) {
            toast.error("Veuillez sélectionner une classe");
            return;
        }

        setLoading(true);
        try {
            await inscriptionsApi.create(selectedEleve.id, selectedClassId);
            toast.success("Élève inscrit avec succès");
            onSuccess();
            onClose();
        } catch (error) {
            const msg = String(error);
            if (msg.includes("UNIQUE constraint failed")) {
                toast.error("Cet élève est déjà inscrit dans une classe");
            } else {
                toast.error("Erreur lors de l'inscription");
            }
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Inscrire un élève</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Student Search */}
                    <div className="space-y-2 relative">
                        <Label>Rechercher un élève (Nom ou Matricule)</Label>
                        <div className="relative">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Tapez pour rechercher..."
                                className="pl-9"
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    if (selectedEleve) setSelectedEleve(null);
                                }}
                                autoFocus
                            />
                            {isSearching && (
                                <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-blue-500" />
                            )}
                        </div>

                        {/* Search Results Dropdown */}
                        {searchResults.length > 0 && !selectedEleve && (
                            <div className="absolute z-10 w-full bg-white border rounded-md shadow-lg max-h-[200px] overflow-auto mt-1">
                                {searchResults.map((eleve) => (
                                    <div
                                        key={eleve.id}
                                        className="p-2 hover:bg-blue-50 cursor-pointer border-b last:border-0 flex items-center justify-between"
                                        onClick={() => handleSelectEleve(eleve)}
                                    >
                                        <div className="flex items-center gap-2">
                                            {eleve.photo_path ? (
                                                <img
                                                    src={`http://localhost:1420/assets/${eleve.photo_path}`}
                                                    className="w-8 h-8 rounded-full object-cover"
                                                    alt=""
                                                />
                                            ) : (
                                                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs text-gray-500">
                                                    ?
                                                </div>
                                            )}
                                            <div>
                                                <div className="font-medium text-sm">
                                                    {eleve.nom.toUpperCase()} {eleve.prenom}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {eleve.code_matricule}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {selectedEleve && (
                            <div className="text-xs text-green-600 font-medium flex items-center gap-1">
                                ✓ Élève sélectionné: {selectedEleve.nom.toUpperCase()} {selectedEleve.prenom}
                            </div>
                        )}
                    </div>

                    {/* Class Selection */}
                    <div className="space-y-2">
                        <Label>Classe</Label>
                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={selectedClassId}
                            onChange={(e) => setSelectedClassId(e.target.value)}
                            required
                        >
                            <option value="">Sélectionner une classe</option>
                            {classes.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.niveau_nom} - {c.nom}
                                </option>
                            ))}
                        </select>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Annuler
                        </Button>
                        <Button type="submit" disabled={loading || !selectedEleve || !selectedClassId}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirmer l'inscription
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
