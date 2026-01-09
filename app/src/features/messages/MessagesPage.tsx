import { useState, useEffect } from "react";
import { messagesApi, Message } from "./api";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Mail, MailOpen, Trash2, Plus } from "lucide-react";
import { NewMessageModal } from "./NewMessageModal";
import { useTranslation } from "react-i18next";

export function MessagesPage() {
    const { t } = useTranslation();
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [modalOpen, setModalOpen] = useState(false);

    const loadMessages = async () => {
        try {
            setLoading(true);
            const data = await messagesApi.getMyMessages();
            setMessages(data);
        } catch (error) {
            toast.error("Erreur lors du chargement des messages");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMessages();
    }, []);

    const handleMarkRead = async (id: string) => {
        try {
            await messagesApi.markRead(id);
            setMessages(messages.map(m => m.id === id ? { ...m, vu: true } : m));
            toast.success("Message marqué comme lu");
        } catch (error) {
            toast.error("Erreur lors de la mise à jour");
            console.error(error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Supprimer ce message ?")) return;

        try {
            await messagesApi.delete(id);
            setMessages(messages.filter(m => m.id !== id));
            if (selectedId === id) setSelectedId(null);
            toast.success("Message supprimé");
        } catch (error) {
            toast.error("Erreur lors de la suppression");
            console.error(error);
        }
    };

    const handleMessageClick = (msg: Message) => {
        setSelectedId(msg.id === selectedId ? null : msg.id);
        if (!msg.vu) {
            handleMarkRead(msg.id);
        }
    };

    const unreadCount = messages.filter(m => !m.vu).length;

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">{t("nav.messages")}</h1>
                    <p className="text-muted-foreground">
                        {messages.length} message{messages.length > 1 ? "s" : ""}
                        {unreadCount > 0 && (
                            <span className="ml-2 text-primary font-medium">
                                ({unreadCount})
                            </span>
                        )}
                    </p>
                </div>
                <Button onClick={() => setModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    {t("common.add")}
                </Button>
            </div>

            {/* Messages List */}
            {loading ? (
                <div className="text-center py-12 text-muted-foreground">
                    {t("common.loading")}
                </div>
            ) : messages.length === 0 ? (
                <Card className="p-12 text-center">
                    <Mail className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">{t("students.noStudents")}</h3>
                    <p className="text-muted-foreground mb-4">
                        {t("nav.messages")}
                    </p>
                    <Button onClick={() => setModalOpen(true)} variant="outline">
                        <Plus className="w-4 h-4 mr-2" />
                        {t("common.add")}
                    </Button>
                </Card>
            ) : (
                <div className="space-y-2">
                    {messages.map((msg) => (
                        <Card
                            key={msg.id}
                            className={`p-4 cursor-pointer transition-all hover:shadow-md ${!msg.vu ? "bg-blue-50 border-blue-200" : ""
                                } ${selectedId === msg.id ? "ring-2 ring-primary" : ""}`}
                            onClick={() => handleMessageClick(msg)}
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-3 flex-1">
                                    {msg.vu ? (
                                        <MailOpen className="w-5 h-5 text-muted-foreground mt-0.5" />
                                    ) : (
                                        <Mail className="w-5 h-5 text-primary mt-0.5" />
                                    )}

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-medium">
                                                {msg.expediteur_prenom} {msg.expediteur_nom}
                                            </span>
                                            {!msg.vu && (
                                                <Badge variant="default" className="text-xs">
                                                    Nouveau
                                                </Badge>
                                            )}
                                        </div>

                                        <p className={`text-sm ${selectedId === msg.id ? "" : "line-clamp-2"
                                            }`}>
                                            {msg.contenu}
                                        </p>

                                        <p className="text-xs text-muted-foreground mt-2">
                                            {new Date(msg.date_envoi).toLocaleString("fr-FR", {
                                                dateStyle: "medium",
                                                timeStyle: "short",
                                            })}
                                        </p>
                                    </div>
                                </div>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(msg.id);
                                    }}
                                    className="text-destructive hover:text-destructive"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* New Message Modal */}
            <NewMessageModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                onSuccess={() => {
                    setModalOpen(false);
                    loadMessages();
                }}
            />
        </div>
    );
}
