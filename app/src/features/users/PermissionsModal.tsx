import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { usersApi, MODULES, ModulePermission } from "./api";
import { toast } from "sonner";
import { Check } from "lucide-react";

interface PermissionsModalProps {
    open: boolean;
    onClose: () => void;
    userId: string | null;
    userName: string;
}

export function PermissionsModal({ open, onClose, userId, userName }: PermissionsModalProps) {
    const [permissions, setPermissions] = useState<Map<string, ModulePermission>>(new Map());
    const [loading, setLoading] = useState(false);
    const [loadingPerms, setLoadingPerms] = useState(false);

    useEffect(() => {
        if (open && userId) {
            loadPermissions();
        }
    }, [open, userId]);

    const loadPermissions = async () => {
        if (!userId) return;

        try {
            setLoadingPerms(true);
            const perms = await usersApi.getPermissions(userId);

            const permsMap = new Map<string, ModulePermission>();
            perms.forEach((p) => {
                permsMap.set(p.module, {
                    module: p.module,
                    can_read: p.can_read,
                    can_write: p.can_write,
                    can_validate: p.can_validate,
                });
            });

            setPermissions(permsMap);
        } catch (error) {
            toast.error("Erreur lors du chargement des permissions");
            console.error(error);
        } finally {
            setLoadingPerms(false);
        }
    };

    const togglePermission = (module: string, type: "read" | "write" | "validate") => {
        setPermissions((prev) => {
            const newPerms = new Map(prev);
            const current = newPerms.get(module) || {
                module,
                can_read: false,
                can_write: false,
                can_validate: false,
            };

            const updated = { ...current };
            if (type === "read") {
                updated.can_read = !current.can_read;
                // If unchecking read, also uncheck write and validate
                if (!updated.can_read) {
                    updated.can_write = false;
                    updated.can_validate = false;
                }
            } else if (type === "write") {
                updated.can_write = !current.can_write;
                // If checking write, also check read
                if (updated.can_write) {
                    updated.can_read = true;
                }
            } else if (type === "validate") {
                updated.can_validate = !current.can_validate;
                // If checking validate, also check read
                if (updated.can_validate) {
                    updated.can_read = true;
                }
            }

            newPerms.set(module, updated);
            return newPerms;
        });
    };

    const handleSave = async () => {
        if (!userId) return;

        try {
            setLoading(true);
            const permsArray = Array.from(permissions.values());
            await usersApi.updatePermissions(userId, permsArray);
            toast.success("Permissions mises à jour avec succès");
            onClose();
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            toast.error(message || "Erreur lors de la mise à jour");
            console.error("Permissions error:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[700px]">
                <DialogHeader>
                    <DialogTitle>Gérer les permissions - {userName}</DialogTitle>
                    <p className="text-sm text-muted-foreground">
                        Définissez les accès pour chaque module
                    </p>
                </DialogHeader>

                {loadingPerms ? (
                    <div className="py-12 text-center text-muted-foreground">
                        Chargement des permissions...
                    </div>
                ) : (
                    <div className="py-4">
                        {/* Header */}
                        <div className="grid grid-cols-[2fr,1fr,1fr,1fr] gap-4 mb-2 px-4 py-2 bg-muted/50 rounded-lg font-medium text-sm">
                            <div>Module</div>
                            <div className="text-center">Lecture</div>
                            <div className="text-center">Écriture</div>
                            <div className="text-center">Validation</div>
                        </div>

                        {/* Permissions Grid */}
                        <div className="space-y-1 max-h-[400px] overflow-y-auto">
                            {MODULES.map((mod) => {
                                const perm = permissions.get(mod.id) || {
                                    module: mod.id,
                                    can_read: false,
                                    can_write: false,
                                    can_validate: false,
                                };

                                return (
                                    <div
                                        key={mod.id}
                                        className="grid grid-cols-[2fr,1fr,1fr,1fr] gap-4 px-4 py-3 hover:bg-muted/30 rounded-lg items-center"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span>{mod.icon}</span>
                                            <span className="font-medium">{mod.label}</span>
                                        </div>

                                        {/* Read */}
                                        <div className="flex justify-center">
                                            <button
                                                className={`w-8 h-8 rounded border-2 flex items-center justify-center transition-all ${perm.can_read
                                                    ? "bg-primary border-primary text-primary-foreground"
                                                    : "border-input hover:border-primary"
                                                    }`}
                                                onClick={() => togglePermission(mod.id, "read")}
                                            >
                                                {perm.can_read && <Check className="w-5 h-5" />}
                                            </button>
                                        </div>

                                        {/* Write */}
                                        <div className="flex justify-center">
                                            <button
                                                className={`w-8 h-8 rounded border-2 flex items-center justify-center transition-all ${perm.can_write
                                                    ? "bg-primary border-primary text-primary-foreground"
                                                    : "border-input hover:border-primary"
                                                    }`}
                                                onClick={() => togglePermission(mod.id, "write")}
                                            >
                                                {perm.can_write && <Check className="w-5 h-5" />}
                                            </button>
                                        </div>

                                        {/* Validate (only for depenses) */}
                                        <div className="flex justify-center">
                                            {mod.id === "depenses" ? (
                                                <button
                                                    className={`w-8 h-8 rounded border-2 flex items-center justify-center transition-all ${perm.can_validate
                                                        ? "bg-primary border-primary text-primary-foreground"
                                                        : "border-input hover:border-primary"
                                                        }`}
                                                    onClick={() => togglePermission(mod.id, "validate")}
                                                >
                                                    {perm.can_validate && <Check className="w-5 h-5" />}
                                                </button>
                                            ) : (
                                                <span className="text-muted-foreground text-xs">—</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={onClose} disabled={loading || loadingPerms}>
                        Annuler
                    </Button>
                    <Button onClick={handleSave} disabled={loading || loadingPerms}>
                        {loading ? "Enregistrement..." : "Enregistrer"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
