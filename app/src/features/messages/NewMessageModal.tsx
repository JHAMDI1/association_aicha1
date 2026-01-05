import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { messagesApi, CreateMessageRequest } from "./api";
import { usersApi } from "../auth/api";
import { toast } from "sonner";

interface NewMessageModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

interface User {
    id: string;
    nom: string;
    prenom: string;
    email: string;
    role: string;
}

export function NewMessageModal({ open, onClose, onSuccess }: NewMessageModalProps) {
    const [users, setUsers] = useState<User[]>([]);
    const [destinataireId, setDestinataireId] = useState("");
    const [contenu, setContenu] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open) {
            loadUsers();
        }
    }, [open]);

    const loadUsers = async () => {
        try {
            const data = await usersApi.getAll();
            setUsers(data);
        } catch (error) {
            console.error("Error loading users:", error);
        }
    };

    const handleSubmit = async () => {
        if (!destinataireId || !contenu.trim()) {
            toast.error("Veuillez remplir tous les champs");
            return;
        }

        try {
            setLoading(true);
            const request: CreateMessageRequest = {
                destinataire_id: destinataireId,
                contenu: contenu.trim(),
            };
            await messagesApi.send(request);
            toast.success("Message envoyé avec succès !");
            resetForm();
            onSuccess?.();
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            toast.error(message || "Erreur lors de l'envoi");
            console.error("Send error:", error);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setDestinataireId("");
        setContenu("");
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Nouveau Message</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Recipient */}
                    <div className="space-y-2">
                        <Label htmlFor="destinataire">Destinataire</Label>
                        <Select value={destinataireId} onValueChange={setDestinataireId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Sélectionner un destinataire" />
                            </SelectTrigger>
                            <SelectContent>
                                {users.map((user) => (
                                    <SelectItem key={user.id} value={user.id}>
                                        {user.prenom} {user.nom} ({user.role})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Content */}
                    <div className="space-y-2">
                        <Label htmlFor="contenu">Message</Label>
                        <Textarea
                            id="contenu"
                            placeholder="Écrivez votre message ici..."
                            value={contenu}
                            onChange={(e) => setContenu(e.target.value)}
                            rows={6}
                            className="resize-none"
                        />
                        <p className="text-xs text-muted-foreground">
                            {contenu.length} / 1000 caractères
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={handleClose} disabled={loading}>
                        Annuler
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading ? "Envoi..." : "Envoyer"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
