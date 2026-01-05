import { useState } from "react";
import { ElevesList } from "./ElevesList";
import { EleveForm } from "./EleveForm";
import { EleveDetail } from "./EleveDetail";

type View = "list" | "add" | "detail";

interface ElevesPageProps {
    onNavigateToPayment?: (eleveId: string, months: number[]) => void;
}

export function ElevesPage({ onNavigateToPayment }: ElevesPageProps) {
    const [view, setView] = useState<View>("list");
    const [selectedEleveId, setSelectedEleveId] = useState<string | null>(null);

    const handleSelectEleve = (id: string) => {
        setSelectedEleveId(id);
        setView("detail");
    };

    const handleAddEleve = () => {
        setView("add");
    };

    const handleBack = () => {
        setView("list");
        setSelectedEleveId(null);
    };

    const handleSuccess = () => {
        setView("list");
    };

    const handleNavigateToPayment = (eleveId: string, months: number[]) => {
        if (onNavigateToPayment) {
            onNavigateToPayment(eleveId, months);
        } else {
            alert("Navigation non disponible");
        }
    };

    return (
        <div className="p-6">
            {view === "list" && (
                <ElevesList
                    onSelectEleve={handleSelectEleve}
                    onAddEleve={handleAddEleve}
                />
            )}

            {view === "add" && (
                <EleveForm
                    onSuccess={handleSuccess}
                    onCancel={handleBack}
                />
            )}

            {view === "detail" && selectedEleveId && (
                <EleveDetail
                    eleveId={selectedEleveId}
                    onBack={handleBack}
                    onNavigateToPayment={handleNavigateToPayment}
                />
            )}
        </div>
    );
}
