import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Euro, Search, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { donneursApi, type DonneurListItem } from "./api";
import { invoke } from "@tauri-apps/api/core";
import { CreatePaiementRequest } from "../paiements/api";

// Assuming we have a recusApi in the future or we use paiementsApi
// For now, we'll assume we need to add a new function to create a donation receipt
// However, since we don't have that yet in JS, we'll placeholder it.

interface DonModalProps {
    open: boolean;
    onClose: () => void;
    preselectedDonneurId?: string; // If opened from a donor
    onSuccess?: () => void;
}

export function DonModal({ open, onClose, preselectedDonneurId, onSuccess }: DonModalProps) {
    const [loading, setLoading] = useState(false);
    const [sourceType, setSourceType] = useState<"DONNEUR" | "ANONYME">("DONNEUR");
    const [montant, setMontant] = useState("");
    const [commentaire, setCommentaire] = useState("");

    // Donor search state
    const [donneurs, setDonneurs] = useState<DonneurListItem[]>([]);
    const [selectedDonneurId, setSelectedDonneurId] = useState<string>("");
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        if (open) {
            resetForm();
            if (preselectedDonneurId) {
                setSourceType("DONNEUR");
                setSelectedDonneurId(preselectedDonneurId);
            }
            loadDonneurs("");
        }
    }, [open, preselectedDonneurId]);

    const loadDonneurs = async (query: string) => {
        try {
            const results = await donneursApi.search(query);
            setDonneurs(results);
        } catch (error) {
            console.error(error);
        }
    };

    const handleSearch = (query: string) => {
        setSearchTerm(query);
        loadDonneurs(query);
    };

    const resetForm = () => {
        setSourceType("DONNEUR");
        setMontant("");
        setCommentaire("");
        setSelectedDonneurId("");
        setSearchTerm("");
    };

    const handleSubmit = async () => {
        if (!montant || isNaN(Number(montant)) || Number(montant) <= 0) {
            toast.error("Veuillez saisir un montant valide");
            return;
        }

        if (sourceType === "DONNEUR" && !selectedDonneurId) {
            toast.error("Veuillez sélectionner un donneur");
            return;
        }

        try {
            setLoading(true);

            const request: CreatePaiementRequest = {
                eleve_id: undefined,
                type_paiement: "DON",
                mois_payes: [],
                annee: new Date().getFullYear(), // Current year for reference
                montant_total: Number(montant),
                mode_paiement: "ESPECES", // Default to ESPECES for now, could add selector
                commentaire: commentaire.trim() || undefined,
                source_type: sourceType,
                donneur_id: sourceType === "DONNEUR" ? selectedDonneurId : undefined,
            };

            await invoke("create_paiement", { request });

            toast.success("Don enregistré avec succès !");
            onSuccess?.();
            onClose();
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            toast.error(message || "Erreur lors de l'enregistrement du don");
            console.error("Donation creation error:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Euro className="h-5 w-5 text-green-600" />
                        Enregistrer un Don
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Source Selection */}
                    <div className="space-y-2">
                        <Label>Source du don</Label>
                        <Select
                            value={sourceType}
                            onValueChange={(v: "DONNEUR" | "ANONYME") => setSourceType(v)}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="DONNEUR">Donneur enregistré</SelectItem>
                                <SelectItem value="ANONYME">Anonyme / Autre</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Donor Selection (if DONNEUR) */}
                    {sourceType === "DONNEUR" && (
                        <div className="space-y-2">
                            <Label>Rechercher un donneur</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Nom du donneur..."
                                    value={searchTerm}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    className="pl-9"
                                />
                            </div>

                            {/* Simple Dropdown/List for selection - could be improved with Combobox */}
                            <div className="border rounded-md max-h-40 overflow-y-auto mt-2">
                                {donneurs.length === 0 ? (
                                    <div className="p-2 text-sm text-gray-500 text-center">Aucun donneur trouvé</div>
                                ) : (
                                    donneurs.map(d => (
                                        <div
                                            key={d.id}
                                            className={`p-2 text-sm cursor-pointer hover:bg-gray-100 flex items-center justify-between ${selectedDonneurId === d.id ? 'bg-purple-50' : ''}`}
                                            onClick={() => {
                                                setSelectedDonneurId(d.id);
                                                setSearchTerm(`${d.prenom} ${d.nom}`);
                                            }}
                                        >
                                            <span>{d.prenom} {d.nom}</span>
                                            {selectedDonneurId === d.id && <CheckCircle className="h-4 w-4 text-purple-600" />}
                                        </div>
                                    ))
                                )}
                            </div>
                            {selectedDonneurId && <p className="text-xs text-green-600">Donneur sélectionné</p>}
                        </div>
                    )}

                    {/* Amount */}
                    <div className="space-y-2">
                        <Label htmlFor="montant">Montant (DH) *</Label>
                        <div className="relative">
                            <Input
                                id="montant"
                                type="number"
                                min="0"
                                step="any"
                                value={montant}
                                onChange={(e) => setMontant(e.target.value)}
                                className="pl-8 text-lg font-semibold"
                                placeholder="0.00"
                            />
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">DH</span>
                        </div>
                    </div>

                    {/* Commentaire */}
                    <div className="space-y-2">
                        <Label htmlFor="commentaire">Commentaire (Facultatif)</Label>
                        <Textarea
                            id="commentaire"
                            value={commentaire}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCommentaire(e.target.value)}
                            placeholder="Détails sur le don..."
                            rows={2}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={loading}>
                        Annuler
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading} className="bg-green-600 hover:bg-green-700">
                        {loading ? "Enregistrement..." : "Valider le Don"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
