import { useState, useRef } from "react";
import { toast } from "sonner";
import { invoke } from "@tauri-apps/api/core";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { depensesApi, type CreateDepenseRequest } from "./api";

interface DepenseModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export function DepenseModal({ open, onClose, onSuccess }: DepenseModalProps) {
    const [beneficiaire, setBeneficiaire] = useState("");
    const [motif, setMotif] = useState("");
    const [montant, setMontant] = useState("");
    const [typeDepense, setTypeDepense] = useState<"FACTURE" | "AUTRE">("AUTRE");
    const [commentaire, setCommentaire] = useState("");
    const [loading, setLoading] = useState(false);

    // Photo upload
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [photoBase64, setPhotoBase64] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Check size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error("La photo ne doit pas dépasser 5 Mo");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            setPhotoPreview(result);
            setPhotoBase64(result);
        };
        reader.readAsDataURL(file);
    };

    const removePhoto = () => {
        setPhotoPreview(null);
        setPhotoBase64(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleSubmit = async () => {
        if (!beneficiaire.trim()) {
            toast.error("Le bénéficiaire est requis");
            return;
        }

        const montantNum = parseFloat(montant);
        if (isNaN(montantNum) || montantNum <= 0) {
            toast.error("Le montant doit être un nombre positif");
            return;
        }

        // Require photo for FACTURE type
        if (typeDepense === "FACTURE" && !photoBase64) {
            toast.error("Une photo de la facture est requise");
            return;
        }

        const request: CreateDepenseRequest = {
            beneficiaire: beneficiaire.trim(),
            motif: motif.trim() || undefined,
            montant: montantNum,
            type_depense: typeDepense,
            commentaire: commentaire.trim() || undefined,
        };

        try {
            setLoading(true);
            const depense = await depensesApi.create(request);

            // Upload photo if provided
            await invoke("debug_log", { message: `photoBase64 exists: ${!!photoBase64}` });
            await invoke("debug_log", { message: `photoBase64 length: ${photoBase64?.length || 0}` });
            if (photoBase64) {
                await invoke("debug_log", { message: `Starting upload for depense: ${depense.id}` });
                try {
                    const result = await depensesApi.uploadPreuve(depense.id, photoBase64);
                    await invoke("debug_log", { message: `Upload successful: ${result}` });
                } catch (uploadError: unknown) {
                    const errorMsg = uploadError instanceof Error ? uploadError.message : String(uploadError);
                    await invoke("debug_log", { message: `Upload FAILED: ${errorMsg}` });
                    toast.error(`Échec de l'upload: ${errorMsg}`);
                }
            } else {
                await invoke("debug_log", { message: "No photo to upload" });
            }

            toast.success(`Dépense ${depense.numero} créée avec succès`);
            onSuccess?.();
            handleClose();
        } catch (error) {
            toast.error("Erreur lors de la création de la dépense");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setBeneficiaire("");
        setMotif("");
        setMontant("");
        setTypeDepense("AUTRE");
        setCommentaire("");
        setPhotoPreview(null);
        setPhotoBase64(null);
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Nouvelle Dépense</DialogTitle>
                    <DialogDescription>
                        Enregistrez une sortie d'argent (facture, achat, etc.)
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Bénéficiaire *</label>
                        <Input
                            placeholder="Nom du fournisseur ou bénéficiaire"
                            value={beneficiaire}
                            onChange={(e) => setBeneficiaire(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Motif</label>
                        <Input
                            placeholder="Description de la dépense"
                            value={motif}
                            onChange={(e) => setMotif(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Montant (DH) *</label>
                            <Input
                                type="number"
                                placeholder="0.00"
                                value={montant}
                                onChange={(e) => setMontant(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Type</label>
                            <select
                                value={typeDepense}
                                onChange={(e) => setTypeDepense(e.target.value as "FACTURE" | "AUTRE")}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                                <option value="AUTRE">Autre</option>
                                <option value="FACTURE">Facture</option>
                            </select>
                        </div>
                    </div>

                    {/* Photo upload for FACTURE */}
                    {typeDepense === "FACTURE" && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Photo de la facture *</label>
                            {photoPreview ? (
                                <div className="relative">
                                    <img
                                        src={photoPreview}
                                        alt="Aperçu facture"
                                        className="w-full h-40 object-cover rounded-lg border"
                                    />
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        className="absolute top-2 right-2 h-8 w-8"
                                        onClick={removePhoto}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ) : (
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-emerald-500 transition-colors"
                                >
                                    <Upload className="h-8 w-8 text-gray-400 mb-2" />
                                    <span className="text-sm text-gray-500">Cliquez pour ajouter</span>
                                </div>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handlePhotoChange}
                                className="hidden"
                            />
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Commentaire</label>
                        <Textarea
                            placeholder="Notes additionnelles..."
                            value={commentaire}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCommentaire(e.target.value)}
                            rows={3}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose} disabled={loading}>
                        Annuler
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading ? "Enregistrement..." : "Enregistrer"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

