import { useState, useEffect } from "react";
import { usersApi, User } from "./api";
import { UserModal } from "./UserModal";
import { PermissionsModal } from "./PermissionsModal";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { Plus, Pencil, Trash2, Shield } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export function UsersPage() {
    const { t } = useTranslation();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [userModalOpen, setUserModalOpen] = useState(false);
    const [permsModalOpen, setPermsModalOpen] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [selectedUserName, setSelectedUserName] = useState("");

    const loadUsers = async () => {
        try {
            setLoading(true);
            const data = await usersApi.getAll();
            setUsers(data);
        } catch (error) {
            toast.error("Erreur lors du chargement des utilisateurs");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const handleEdit = (userId: string) => {
        setSelectedUserId(userId);
        setUserModalOpen(true);
    };

    const handleManagePermissions = (user: User) => {
        setSelectedUserId(user.id);
        setSelectedUserName(`${user.prenom} ${user.nom}`);
        setPermsModalOpen(true);
    };

    const handleDelete = async (userId: string, userName: string) => {
        if (!confirm(`Supprimer l'utilisateur ${userName} ?\n\nCette action est irréversible.`)) {
            return;
        }

        try {
            await usersApi.delete(userId);
            toast.success("Utilisateur supprimé");
            loadUsers();
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            toast.error(message || "Erreur lors de la suppression");
            console.error("Delete error:", error);
        }
    };

    const handleCloseUserModal = () => {
        setUserModalOpen(false);
        setSelectedUserId(null);
    };

    const handleClosePermsModal = () => {
        setPermsModalOpen(false);
        setSelectedUserId(null);
        setSelectedUserName("");
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">{t("nav.users")}</h1>
                    <p className="text-muted-foreground">
                        {users.length} {t("users.activeUsers")}
                    </p>
                </div>
                <Button onClick={() => setUserModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    {t("common.add")}
                </Button>
            </div>

            {/* Users Table */}
            {loading ? (
                <div className="text-center py-12 text-muted-foreground">
                    {t("common.loading")}
                </div>
            ) : users.length === 0 ? (
                <Card className="p-12 text-center">
                    <h3 className="text-lg font-medium mb-2">{t("students.noStudents")}</h3>
                    <p className="text-muted-foreground mb-4">
                        {t("users.activeUsers")}
                    </p>
                    <Button onClick={() => setUserModalOpen(true)} variant="outline">
                        <Plus className="w-4 h-4 mr-2" />
                        {t("common.add")}
                    </Button>
                </Card>
            ) : (
                <Card>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t("students.lastName")}</TableHead>
                                <TableHead>{t("auth.email")}</TableHead>
                                <TableHead>{t("users.role")}</TableHead>
                                <TableHead>{t("expenses.status")}</TableHead>
                                <TableHead className="text-right">{t("common.actions")}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">
                                        {user.prenom} {user.nom}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {user.email}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
                                            {user.role === "ADMIN" ? t("users.admin") : t("users.secretary")}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={user.actif ? "default" : "outline"}>
                                            {user.actif ? t("users.active") : t("users.inactive")}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            {/* Manage Permissions */}
                                            {user.role === "SECRETAIRE" && (
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={() => handleManagePermissions(user)}
                                                    title="Gérer les permissions"
                                                >
                                                    <Shield className="w-4 h-4" />
                                                </Button>
                                            )}

                                            {/* Edit */}
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => handleEdit(user.id)}
                                                title="Modifier"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </Button>

                                            {/* Delete */}
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => handleDelete(user.id, `${user.prenom} ${user.nom}`)}
                                                title="Supprimer"
                                                className="text-destructive hover:text-destructive"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Card>
            )}

            {/* Modals */}
            <UserModal
                open={userModalOpen}
                onClose={handleCloseUserModal}
                onSuccess={() => {
                    handleCloseUserModal();
                    loadUsers();
                }}
                userId={selectedUserId}
            />

            <PermissionsModal
                open={permsModalOpen}
                onClose={handleClosePermsModal}
                userId={selectedUserId}
                userName={selectedUserName}
            />
        </div>
    );
}
