import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";
import { Input } from "../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { usersApi, CreateUserRequest, UpdateUserRequest } from "./api";
import { toast } from "sonner";

interface UserModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    userId?: string | null;
}

export function UserModal({ open, onClose, onSuccess, userId }: UserModalProps) {
    const [nom, setNom] = useState("");
    const [prenom, setPrenom] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState<"ADMIN" | "SECRETAIRE">("SECRETAIRE");
    const [loading, setLoading] = useState(false);
    const [loadingUser, setLoadingUser] = useState(false);

    const isEditing = !!userId;

    useEffect(() => {
        if (open && userId) {
            loadUser();
        } else if (open) {
            resetForm();
        }
    }, [open, userId]);

    const loadUser = async () => {
        if (!userId) return;

        try {
            setLoadingUser(true);
            const user = await usersApi.getOne(userId);
            setNom(user.nom);
            setPrenom(user.prenom);
            setEmail(user.email);
            setRole(user.role);
            setPassword(""); // Don't load password
        } catch (error) {
            toast.error("Erreur lors du chargement de l'utilisateur");
            console.error(error);
        } finally {
            setLoadingUser(false);
        }
    };

    const handleSubmit = async () => {
        if (!nom.trim() || !prenom.trim() || !email.trim()) {
            toast.error("Veuillez remplir tous les champs obligatoires");
            return;
        }

        if (!isEditing && !password) {
            toast.error("Le mot de passe est obligatoire");
            return;
        }

        try {
            setLoading(true);

            if (isEditing && userId) {
                const request: UpdateUserRequest = {
                    nom: nom.trim(),
                    prenom: prenom.trim(),
                    email: email.trim(),
                    role,
                    ...(password ? { password } : {}),
                };
                await usersApi.update(userId, request);
                toast.success("Utilisateur modifié avec succès");
            } else {
                const request: CreateUserRequest = {
                    nom: nom.trim(),
                    prenom: prenom.trim(),
                    email: email.trim(),
                    password,
                    role,
                };
                await usersApi.create(request);
                toast.success("Utilisateur créé avec succès");
            }

            resetForm();
            onSuccess?.();
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            toast.error(message || (isEditing ? "Erreur lors de la modification" : "Erreur lors de la création"));
            console.error("User error:", error);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setNom("");
        setPrenom("");
        setEmail("");
        setPassword("");
        setRole("SECRETAIRE");
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? "Modifier l'utilisateur" : "Nouvel utilisateur"}
                    </DialogTitle>
                </DialogHeader>

                {loadingUser ? (
                    <div className="py-8 text-center text-muted-foreground">
                        Chargement...
                    </div>
                ) : (
                    <div className="space-y-4 py-4">
                        {/* Nom */}
                        <div className="space-y-2">
                            <Label htmlFor="nom">Nom *</Label>
                            <Input
                                id="nom"
                                placeholder="Nom de famille"
                                value={nom}
                                onChange={(e) => setNom(e.target.value)}
                            />
                        </div>

                        {/* Prénom */}
                        <div className="space-y-2">
                            <Label htmlFor="prenom">Prénom *</Label>
                            <Input
                                id="prenom"
                                placeholder="Prénom"
                                value={prenom}
                                onChange={(e) => setPrenom(e.target.value)}
                            />
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <Label htmlFor="email">Email *</ Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="email@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <Label htmlFor="password">
                                Mot de passe {isEditing && "(laisser vide pour ne pas changer)"}
                            </Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        {/* Role */}
                        <div className="space-y-2">
                            <Label htmlFor="role">Rôle *</Label>
                            <Select value={role} onValueChange={(v) => setRole(v as "ADMIN" | "SECRETAIRE")}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ADMIN">Administrateur</SelectItem>
                                    <SelectItem value="SECRETAIRE">Secrétaire</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={handleClose} disabled={loading || loadingUser}>
                        Annuler
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading || loadingUser}>
                        {loading ? "Enregistrement..." : isEditing ? "Modifier" : "Créer"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
