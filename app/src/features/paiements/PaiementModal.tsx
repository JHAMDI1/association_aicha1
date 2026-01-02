import { useState, useEffect } from "react";
import { Search, X, User, School, Calendar, CreditCard, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { paiementsApi, type PaiementStatus, type CreatePaiementRequest } from "./api";
import { elevesApi, type EleveListItem } from "@/features/eleves/api";

interface PaiementModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

// Default months fallback
const DEFAULT_MOIS = [
    { numero: 9, nom: "Septembre", paye: false },
    { numero: 10, nom: "Octobre", paye: false },
    { numero: 11, nom: "Novembre", paye: false },
    { numero: 12, nom: "Décembre", paye: false },
    { numero: 1, nom: "Janvier", paye: false },
    { numero: 2, nom: "Février", paye: false },
    { numero: 3, nom: "Mars", paye: false },
    { numero: 4, nom: "Avril", paye: false },
    { numero: 5, nom: "Mai", paye: false },
    { numero: 6, nom: "Juin", paye: false },
    { numero: 7, nom: "Juillet", paye: false },
    { numero: 8, nom: "Août", paye: false },
];

export function PaiementModal({ open, onClose, onSuccess }: PaiementModalProps) {
    // Student selection
    const [searchQuery, setSearchQuery] = useState("");
    const [students, setStudents] = useState<EleveListItem[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<EleveListItem | null>(null);
    const [showResults, setShowResults] = useState(false);

    // Payment status
    const [paiementStatus, setPaiementStatus] = useState<PaiementStatus | null>(null);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);

    // Selected months
    const [selectedMonths, setSelectedMonths] = useState<number[]>([]);

    // Payment form
    const [anneeScolaire, setAnneeScolaire] = useState<string>("2025-2026");
    const [typePaiement, setTypePaiement] = useState<"MENSUALITE" | "INSCRIPTION" | "ASSURANCE" | "DON">("MENSUALITE");
    const [modePaiement, setModePaiement] = useState<"ESPECES" | "CHEQUE" | "VIREMENT">("ESPECES");
    const [montant, setMontant] = useState<string>("");
    const [commentaire, setCommentaire] = useState("");
    const [numeroCarnet, setNumeroCarnet] = useState("");
    const [numeroRecu, setNumeroRecu] = useState("");

    // Generate school year options (current + next 2 years)
    const currentYear = new Date().getFullYear();
    const anneeOptions = [
        `${currentYear}-${currentYear + 1}`,
        `${currentYear + 1}-${currentYear + 2}`,
        `${currentYear + 2}-${currentYear + 3}`,
    ];

    // Search students
    useEffect(() => {
        const searchStudents = async () => {
            if (searchQuery.length < 2) {
                setStudents([]);
                return;
            }
            try {
                const results = await elevesApi.getAll(searchQuery);
                setStudents(results);
                setShowResults(true);
            } catch (error) {
                console.error("Search error:", error);
            }
        };

        const timer = setTimeout(searchStudents, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Load payment status when student or year changes
    useEffect(() => {
        if (!selectedStudent) return;

        const loadStatus = async () => {
            setLoading(true);
            setLoadError(null);
            console.log("🔍 Loading payment status for:", selectedStudent.id, anneeScolaire);

            // Create a timeout promise
            const timeoutPromise = new Promise<never>((_, reject) => {
                setTimeout(() => reject(new Error("Timeout de 10 secondes dépassé")), 10000);
            });

            try {
                // Race between API call and timeout
                const status = await Promise.race([
                    paiementsApi.getPaiementStatus(selectedStudent.id, anneeScolaire),
                    timeoutPromise
                ]);

                console.log("✅ Payment status loaded:", status);
                setPaiementStatus(status);
            } catch (error) {
                console.error("❌ Error loading payment status:", error);
                const errorMsg = String(error);
                setLoadError(errorMsg);

                if (errorMsg.includes("Timeout")) {
                    toast.error("Erreur: Temps d'attente dépassé. Utilisation de la grille par défaut.");
                } else {
                    toast.error("Impossible de charger l'historique. Grille par défaut affichée.");
                }
            } finally {
                setLoading(false);
            }
        };

        loadStatus();
    }, [selectedStudent, anneeScolaire]);

    const handleSelectStudent = (student: EleveListItem) => {
        setSelectedStudent(student);
        setSearchQuery(student.nom + " " + student.prenom);
        setShowResults(false);
        setSelectedMonths([]);
    };

    const toggleMonth = (mois: number, isPaid: boolean) => {
        if (isPaid) return; // Can't select paid month

        setSelectedMonths((prev) =>
            prev.includes(mois) ? prev.filter((m) => m !== mois) : [...prev, mois]
        );
    };

    const handleSubmit = async () => {
        if (!selectedStudent) {
            toast.error("Veuillez sélectionner un élève");
            return;
        }

        const montantNum = parseFloat(montant);
        if (!montant || isNaN(montantNum) || montantNum <= 0) {
            toast.error("Veuillez saisir un montant valide");
            return;
        }

        if (typePaiement === "MENSUALITE" && selectedMonths.length === 0) {
            toast.error("Veuillez sélectionner au moins un mois");
            return;
        }

        const request: CreatePaiementRequest = {
            eleve_id: selectedStudent.id,
            type_paiement: typePaiement,
            mois_payes: typePaiement === "MENSUALITE" ? selectedMonths : [],
            annee: parseInt(anneeScolaire.split("-")[0]),
            montant_total: montantNum,
            mode_paiement: modePaiement,
            commentaire: commentaire || undefined,
            numero_carnet: numeroCarnet || undefined,
            numero_recu_physique: numeroRecu || undefined,
        };

        try {
            setLoading(true);
            const recu = await paiementsApi.createPaiement(request);
            toast.success(`Paiement enregistré avec succès (Reçu #${recu.recu.numero})`); // Changed from "Reçu créé..."

            console.log("Reçu créé:", recu);

            onSuccess?.();
            handleClose();
        } catch (error) {
            const msg = String(error);
            if (msg.includes("déjà payé")) {
                toast.error("Certains mois sont déjà payés");
            } else {
                toast.error("Erreur lors de la création du reçu");
            }
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setSelectedStudent(null);
        setSearchQuery("");
        setSelectedMonths([]);
        setPaiementStatus(null);
        setMontant("");
        setCommentaire("");
        setNumeroCarnet("");
        setNumeroRecu("");
        setLoadError(null);
        onClose();
    };

    // Determine which months to display
    const displayMois = paiementStatus?.mois || DEFAULT_MOIS;

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl flex items-center gap-2">
                        <CreditCard className="h-6 w-6 text-emerald-600" />
                        Nouveau Paiement
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Student Search */}
                    <div className="relative">
                        <label className="text-sm font-medium mb-2 block">Rechercher un élève</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Nom, prénom ou matricule..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        {/* Search Results Dropdown */}
                        {showResults && students.length > 0 && (
                            <Card className="absolute z-10 w-full mt-1 max-h-60 overflow-y-auto">
                                {students.map((student) => (
                                    <button
                                        key={student.id}
                                        onClick={() => handleSelectStudent(student)}
                                        className="w-full p-3 hover:bg-accent text-left flex items-center gap-3 border-b last:border-0"
                                    >
                                        <User className="h-4 w-4" />
                                        <div>
                                            <p className="font-medium">
                                                {student.nom} {student.prenom}
                                            </p>
                                            <p className="text-xs text-muted-foreground">{student.code_matricule}</p>
                                        </div>
                                    </button>
                                ))}
                            </Card>
                        )}
                    </div>

                    {/* Selected Student Info */}
                    {selectedStudent && (
                        <Card className="p-4 bg-emerald-50 border-emerald-200">
                            <div className="flex items-start justify-between">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <User className="h-5 w-5 text-emerald-700" />
                                        <h3 className="font-semibold text-lg">
                                            {selectedStudent.nom} {selectedStudent.prenom}
                                        </h3>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <School className="h-4 w-4" />
                                            {selectedStudent.classe_nom || "Non inscrit"}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Calendar className="h-4 w-4" />
                                            Année: {anneeScolaire}
                                        </span>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                        setSelectedStudent(null);
                                        setSearchQuery("");
                                        setPaiementStatus(null);
                                    }}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </Card>
                    )}

                    {/* Payment Type & Mode */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Type de paiement</label>
                            <select
                                value={typePaiement}
                                onChange={(e) => setTypePaiement(e.target.value as any)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                                <option value="MENSUALITE">Mensualité</option>
                                <option value="INSCRIPTION">Frais d'inscription</option>
                                <option value="ASSURANCE">Assurance</option>
                                <option value="DON">Don</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Mode de paiement</label>
                            <select
                                value={modePaiement}
                                onChange={(e) => setModePaiement(e.target.value as any)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                                <option value="ESPECES">Espèces</option>
                                <option value="CHEQUE">Chèque</option>
                                <option value="VIREMENT">Virement</option>
                            </select>
                        </div>
                    </div>

                    {/* Manual Receipt Info */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">N° Carnet (Facultatif)</label>
                        <Input
                            placeholder="Ex: 15"
                            value={numeroCarnet}
                            onChange={(e) => setNumeroCarnet(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">N° Reçu (Facultatif)</label>
                        <Input
                            placeholder="Ex: 001"
                            value={numeroRecu}
                            onChange={(e) => setNumeroRecu(e.target.value)}
                        />
                    </div>

                    {/* 12-Month Grid (Only for MENSUALITE & if student selected) */}
                    {typePaiement === "MENSUALITE" && selectedStudent && (
                        <div className="space-y-3">
                            {/* School Year Selector */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Année scolaire</label>
                                <select
                                    value={anneeScolaire}
                                    onChange={(e) => {
                                        setAnneeScolaire(e.target.value);
                                        setSelectedMonths([]); // Reset selected months
                                    }}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                >
                                    {anneeOptions.map((annee) => (
                                        <option key={annee} value={annee}>
                                            {annee}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <label className="text-sm font-medium block">Sélectionner les mois</label>

                            {loading && (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                                    <span className="ml-2 text-sm text-gray-500">Chargement du statut...</span>
                                </div>
                            )}

                            {loadError && !loading && (
                                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-700">
                                    ⚠️ Impossible de charger l'historique. Grille par défaut affichée.
                                </div>
                            )}

                            {!loading && (
                                <>
                                    <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                                        {displayMois.map((mois) => {
                                            const isSelected = selectedMonths.includes(mois.numero);
                                            const isPaid = mois.paye || false;

                                            return (
                                                <button
                                                    key={mois.numero}
                                                    type="button"
                                                    onClick={() => toggleMonth(mois.numero, isPaid)}
                                                    disabled={isPaid}
                                                    className={`
                            p-3 rounded-lg border-2 text-sm font-medium transition-all
                            ${isPaid
                                                            ? "bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed"
                                                            : isSelected
                                                                ? "bg-emerald-100 border-emerald-500 text-emerald-700"
                                                                : "bg-white border-gray-200 hover:border-emerald-300"
                                                        }
                          `}
                                                >
                                                    <div className="flex flex-col items-center gap-1">
                                                        <span>{mois.nom}</span>
                                                        {isPaid && <span className="text-xs">✓ Payé</span>}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {selectedMonths.length} mois sélectionné(s)
                                    </p>
                                </>
                            )}
                        </div>
                    )}

                    {/* Montant Manuel */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Montant (DH)</label>
                        <Input
                            type="number"
                            placeholder="Ex: 300"
                            value={montant}
                            onChange={(e) => setMontant(e.target.value)}
                            min="0"
                            step="0.01"
                        />
                    </div>

                    {/* Commentaire */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Commentaire (optionnel)</label>
                        <Input
                            placeholder="Ex: Paiement partiel..."
                            value={commentaire}
                            onChange={(e) => setCommentaire(e.target.value)}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose} disabled={loading}>
                        Annuler
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading || !selectedStudent}>
                        {loading ? "Enregistrement..." : "Confirmer & Enregistrer"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
