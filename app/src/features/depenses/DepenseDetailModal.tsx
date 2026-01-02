import { useState, useEffect } from "react";
import { X, Calendar, User, FileText, Wallet, Tag, Clock, CheckCircle, AlertCircle, XCircle } from "lucide-react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog";
import { depensesApi, type Depense } from "./api";

interface DepenseDetailModalProps {
    depenseId: string | null;
    open: boolean;
    onClose: () => void;
}

export function DepenseDetailModal({ depenseId, open, onClose }: DepenseDetailModalProps) {
    const [depense, setDepense] = useState<Depense | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && depenseId) {
            loadDepense();
        }
    }, [open, depenseId]);

    const loadDepense = async () => {
        if (!depenseId) return;
        try {
            setLoading(true);
            const data = await depensesApi.getById(depenseId);
            setDepense(data);
        } catch (error) {
            console.error("Failed to load depense:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setDepense(null);
        onClose();
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric"
        });
    };

    const formatTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    const getEtatConfig = (etat: string) => {
        const configs: Record<string, { bg: string; text: string; label: string; icon: React.ElementType }> = {
            EN_ATTENTE: { bg: "bg-yellow-100", text: "text-yellow-700", label: "En attente", icon: Clock },
            VALIDE: { bg: "bg-green-100", text: "text-green-700", label: "Validée", icon: CheckCircle },
            REJETE: { bg: "bg-red-100", text: "text-red-700", label: "Rejetée", icon: XCircle },
            BROUILLON: { bg: "bg-gray-100", text: "text-gray-700", label: "Brouillon", icon: AlertCircle },
        };
        return configs[etat] || configs.BROUILLON;
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
            <DialogContent className="max-w-lg p-0 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <p className="mt-2 text-gray-500">Chargement...</p>
                    </div>
                ) : depense ? (
                    <div className="max-h-[85vh] overflow-y-auto">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-4 sticky top-0 z-10">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold">{depense.numero}</h2>
                                    <p className="text-red-100 text-sm flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {formatDate(depense.date_operation)} à {formatTime(depense.date_operation)}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {(() => {
                                        const config = getEtatConfig(depense.etat);
                                        const Icon = config.icon;
                                        return (
                                            <span className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5 ${config.bg} ${config.text}`}>
                                                <Icon className="h-4 w-4" />
                                                {config.label}
                                            </span>
                                        );
                                    })()}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-white hover:bg-red-400 h-8 w-8"
                                        onClick={handleClose}
                                    >
                                        <X className="h-5 w-5" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Montant Card */}
                        <div className="px-6 -mt-2 relative z-20">
                            <div className="bg-white rounded-xl shadow-lg border p-4 flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-medium">Montant</p>
                                    <p className="text-3xl font-bold text-red-600">-{depense.montant.toFixed(2)} DH</p>
                                </div>
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${depense.type_depense === 'FACTURE' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                                    <Wallet className={`h-6 w-6 ${depense.type_depense === 'FACTURE' ? 'text-blue-600' : 'text-gray-600'}`} />
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="px-6 py-4 space-y-4">
                            {/* Info Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <div className="flex items-center gap-2 mb-1">
                                        <User className="h-4 w-4 text-gray-400" />
                                        <span className="text-xs text-gray-500 uppercase">Bénéficiaire</span>
                                    </div>
                                    <p className="font-semibold text-gray-900 truncate">{depense.beneficiaire}</p>
                                </div>

                                <div className="bg-gray-50 rounded-lg p-3">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Tag className="h-4 w-4 text-gray-400" />
                                        <span className="text-xs text-gray-500 uppercase">Type</span>
                                    </div>
                                    <p className="font-semibold text-gray-900">{depense.type_depense}</p>
                                </div>
                            </div>

                            {/* Motif */}
                            {depense.motif && (
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <div className="flex items-center gap-2 mb-1">
                                        <FileText className="h-4 w-4 text-gray-400" />
                                        <span className="text-xs text-gray-500 uppercase">Motif</span>
                                    </div>
                                    <p className="text-gray-900">{depense.motif}</p>
                                </div>
                            )}

                            {/* Validation Info */}
                            {depense.date_validation && (
                                <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                                    <div className="flex items-center gap-2 mb-1">
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                        <span className="text-xs text-green-600 uppercase font-medium">Validée le</span>
                                    </div>
                                    <p className="text-green-700 font-medium">
                                        {formatDate(depense.date_validation)} à {formatTime(depense.date_validation)}
                                    </p>
                                </div>
                            )}

                            {/* Commentaire */}
                            {depense.commentaire && (
                                <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-100">
                                    <p className="text-xs text-yellow-600 uppercase font-medium mb-1">Commentaire</p>
                                    <p className="text-yellow-800">{depense.commentaire}</p>
                                </div>
                            )}

                            {/* Preuve / Photo */}
                            {depense.piece_jointe_path && (
                                <div className="rounded-lg overflow-hidden border">
                                    <div className="bg-blue-50 px-3 py-2 border-b border-blue-100">
                                        <p className="text-sm font-medium text-blue-700 flex items-center gap-2">
                                            <FileText className="h-4 w-4" />
                                            Pièce justificative
                                        </p>
                                    </div>
                                    <div className="bg-gray-900 p-2">
                                        <img
                                            src={convertFileSrc(depense.piece_jointe_path)}
                                            alt="Preuve"
                                            className="w-full max-h-80 object-contain rounded"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).alt = "Erreur de chargement";
                                            }}
                                        />
                                    </div>
                                </div>
                            )}

                            {!depense.piece_jointe_path && depense.type_depense === "FACTURE" && (
                                <div className="border border-dashed border-gray-300 rounded-lg p-6 text-center text-gray-500">
                                    <FileText className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                                    <p>Aucune pièce justificative</p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="p-8 text-center text-gray-500">
                        Aucune donnée
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

