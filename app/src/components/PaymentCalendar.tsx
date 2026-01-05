import { Check } from "lucide-react";
import { cn } from "../lib/utils";

const ACADEMIC_MONTHS = [
    { num: 9, name: "Septembre", short: "Sep" },
    { num: 10, name: "Octobre", short: "Oct" },
    { num: 11, name: "Novembre", short: "Nov" },
    { num: 12, name: "Décembre", short: "Déc" },
    { num: 1, name: "Janvier", short: "Jan" },
    { num: 2, name: "Février", short: "Fév" },
    { num: 3, name: "Mars", short: "Mar" },
    { num: 4, name: "Avril", short: "Avr" },
    { num: 5, name: "Mai", short: "Mai" },
    { num: 6, name: "Juin", short: "Juin" },
    { num: 7, name: "Juillet", short: "Juil" },
    { num: 8, name: "Août", short: "Aoû" },
];

interface PaymentCalendarProps {
    paidMonths: number[]; // Liste des mois déjà payés
    selectedMonths: number[]; // Mois sélectionnés pour paiement
    onMonthToggle: (month: number) => void;
    disabled?: boolean;
    currentAcademicYear?: number; // Start year (e.g., 2025 for 2025-2026)
}

export function PaymentCalendar({
    paidMonths,
    selectedMonths,
    onMonthToggle,
    disabled = false,
    currentAcademicYear,
}: PaymentCalendarProps) {
    // Determine the relevant academic year start
    // If not provided, calculate based on today's date
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentRealYear = now.getFullYear();
    const calculatedStartYear = currentMonth >= 9 ? currentRealYear : currentRealYear - 1;

    const startYear = currentAcademicYear || calculatedStartYear;
    const endYear = startYear + 1;

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="font-medium">Année Scolaire {startYear}-{endYear}</h3>
                <div className="flex gap-4 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-green-100 border-2 border-green-500 rounded"></div>
                        <span className="text-gray-600">Payé</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-red-50 border-2 border-red-300 rounded"></div>
                        <span className="text-gray-600">Impayé</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {ACADEMIC_MONTHS.map((month) => {
                    const isPaid = paidMonths.includes(month.num);
                    const isSelected = selectedMonths.includes(month.num);

                    // Logic to determine if a month is "past" (should be paid)
                    // We compare the month's absolute date (Month/Year) with today

                    // Determine year for this specific month in the academic cycle
                    // Sep-Dec are in startYear, Jan-Aug are in endYear
                    const monthYear = month.num >= 9 ? startYear : endYear;

                    // A month is "past" if it's strictly before today's month/year
                    // Logic: 
                    // 1. If monthYear < currentRealYear -> PAST (e.g., Sep 2025 vs Jan 2026)
                    // 2. If monthYear > currentRealYear -> FUTURE (e.g., Jan 2027 vs Jan 2026) - False
                    // 3. If monthYear == currentRealYear -> Check month index

                    const isPast = monthYear < currentRealYear || (monthYear === currentRealYear && month.num < currentMonth);

                    const isClickable = !isPaid && !disabled;

                    return (
                        <button
                            key={month.num}
                            type="button"
                            disabled={isPaid || disabled}
                            onClick={() => isClickable && onMonthToggle(month.num)}
                            className={cn(
                                "relative p-4 rounded-lg border-2 transition-all duration-200",
                                "flex flex-col items-center justify-center gap-2",
                                "min-h-[80px]",
                                {
                                    // Mois payé (vert, coche, désactivé)
                                    "bg-green-100 border-green-500 cursor-not-allowed": isPaid,
                                    // Mois impayé PASSÉ (rouge = retard)
                                    "bg-red-50 border-red-300 hover:bg-red-100 hover:border-red-400 cursor-pointer":
                                        !isPaid && !isSelected && !disabled && isPast,
                                    // Mois impayé FUTUR/PRESENT (gris/neutre = pas encore dû)
                                    "bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300 cursor-pointer":
                                        !isPaid && !isSelected && !disabled && !isPast,
                                    // Mois impayé sélectionné (bleu)
                                    "bg-blue-100 border-blue-500 ring-2 ring-blue-300":
                                        !isPaid && isSelected,
                                    // Désactivé
                                    "opacity-50 cursor-not-allowed": disabled && !isPaid,
                                }
                            )}
                        >
                            {/* Coche pour les mois payés */}
                            {isPaid && (
                                <div className="absolute top-1 right-1 w-5 h-5 bg-green-600 rounded-full flex items-center justify-center">
                                    <Check className="w-3 h-3 text-white" />
                                </div>
                            )}

                            {/* Nom du mois */}
                            <span
                                className={cn("text-sm font-semibold", {
                                    "text-green-800": isPaid,
                                    "text-red-700": !isPaid && !isSelected && isPast,
                                    "text-gray-700": !isPaid && !isSelected && !isPast,
                                    "text-blue-700": !isPaid && isSelected,
                                })}
                            >
                                {month.short}
                            </span>

                            {/* Indicateur de sélection */}
                            {!isPaid && isSelected && (
                                <div className="absolute bottom-1 right-1 w-4 h-4 bg-blue-600 rounded-full"></div>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Résumé de la sélection */}
            {selectedMonths.length > 0 && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                        <span className="font-semibold">{selectedMonths.length} mois</span>{" "}
                        sélectionné{selectedMonths.length > 1 ? "s" : ""} pour paiement
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                        Montant total: {selectedMonths.length * 100} DH
                    </p>
                </div>
            )}
        </div>
    );
}
