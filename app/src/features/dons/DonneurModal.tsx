import { useState, useEffect } from "react";
import { toast } from "sonner";
import { User, Phone, Mail, MapPin, MessageSquare } from "lucide-react";
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
import { donneursApi, type CreateDonneurRequest, type UpdateDonneurRequest } from "./api";

interface DonneurModalProps {
    open: boolean;
    donneurId: string | null;
    onClose: () => void;
    onSuccess?: () => void;
}

export function DonneurModal({ open, donneurId, onClose, onSuccess }: DonneurModalProps) {
    const [loading, setLoading] = useState(false);
    const [nom, setNom] = useState("");
    const [prenom, setPrenom] = useState("");
    const [telephone, setTelephone] = useState("");
    const [email, setEmail] = useState("");
    const [adresse, setAdresse] = useState("");
    const [commentaire, setCommentaire] = useState("");

    const isEditing = donneurId !== null;

    useEffect(() => {
        if (open && donneurId) {
            loadDonneur(donneurId);
        } else if (open) {
            resetForm();
        }
    }, [open, donneurId]);

    const loadDonneur = async (id: string) => {
        try {
            setLoading(true);
            const donneur = await donneursApi.getById(id);
            setNom(donneur.nom);
            setPrenom(donneur.prenom);
            setTelephone(donneur.telephone || "");
            setEmail(donneur.email || "");
            setAdresse(donneur.adresse || "");
            setCommentaire(donneur.commentaire || "");
        } catch (error) {
            toast.error("Erreur lors du chargement du donneur");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setNom("");
        setPrenom("");
        setTelephone("");
        setEmail("");
        setAdresse("");
        setCommentaire("");
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleSubmit = async () => {
        if (!nom.trim() || !prenom.trim()) {
            toast.error("Le nom et prénom sont obligatoires");
            return;
        }

        try {
            setLoading(true);

            if (isEditing && donneurId) {
                const request: UpdateDonneurRequest = {
                    nom: nom.trim(),
                    prenom: prenom.trim(),
                    telephone: telephone.trim() || undefined,
                    email: email.trim() || undefined,
                    adresse: adresse.trim() || undefined,
                    commentaire: commentaire.trim() || undefined,
                };
                await donneursApi.update(donneurId, request);
                toast.success("Donneur modifié avec succès");
            } else {
                const request: CreateDonneurRequest = {
                    nom: nom.trim(),
                    prenom: prenom.trim(),
                    telephone: telephone.trim() || undefined,
                    email: email.trim() || undefined,
                    adresse: adresse.trim() || undefined,
                    commentaire: commentaire.trim() || undefined,
                };
                await donneursApi.create(request);
                toast.success("Donneur créé avec succès");
            }

            onSuccess?.();
            handleClose();
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            toast.error(message || (isEditing ? "Erreur lors de la modification" : "Erreur lors de la création"));
            console.error("Donneur error:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <User className="h-5 w-5 text-purple-600" />
                        {isEditing ? "Modifier le donneur" : "Nouveau donneur"}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Nom & Prénom */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="prenom">Prénom *</Label>
                            <Input
                                id="prenom"
                                value={prenom}
                                onChange={(e) => setPrenom(e.target.value)}
                                placeholder="Prénom"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="nom">Nom *</Label>
                            <Input
                                id="nom"
                                value={nom}
                                onChange={(e) => setNom(e.target.value)}
                                placeholder="Nom"
                            />
                        </div>
                    </div>

                    {/* Téléphone */}
                    <div className="space-y-2">
                        <Label htmlFor="telephone" className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            Téléphone
                        </Label>
                        <Input
                            id="telephone"
                            type="tel"
                            value={telephone}
                            onChange={(e) => setTelephone(e.target.value)}
                            placeholder="06 00 00 00 00"
                        />
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                        <Label htmlFor="email" className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            Email
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="email@exemple.com"
                        />
                    </div>

                    {/* Adresse */}
                    <div className="space-y-2">
                        <Label htmlFor="adresse" className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            Adresse
                        </Label>
                        <Input
                            id="adresse"
                            value={adresse}
                            onChange={(e) => setAdresse(e.target.value)}
                            placeholder="Adresse complète"
                        />
                    </div>

                    {/* Commentaire */}
                    <div className="space-y-2">
                        <Label htmlFor="commentaire" className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            Commentaire
                        </Label>
                        <Textarea
                            id="commentaire"
                            value={commentaire}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCommentaire(e.target.value)}
                            placeholder="Notes ou commentaires..."
                            rows={3}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose} disabled={loading}>
                        Annuler
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading ? "Enregistrement..." : isEditing ? "Enregistrer" : "Créer"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
