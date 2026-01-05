import { useState, useEffect } from "react";
import { useAuth } from "@/features/auth";
import { ElevesPage } from "@/features/eleves";
import { NiveauxPage, EnseignantsPage, ClassesPage } from "@/features/scolarite";
import { PaiementsPage } from "@/features/paiements";
import { DepensesPage } from "@/features/depenses";
import { DonneursPage } from "@/features/dons";
import { MessagesPage } from "@/features/messages";
import { UsersPage } from "@/features/users";
import { ReportsPage } from "@/features/reports";
import { BackupPage } from "@/features/backup";
import { Button } from "@/components/ui/button";
import { NotificationBadge } from "@/components/NotificationBadge";
import { invoke } from "@tauri-apps/api/core";
import logoImage from "@/assets/logo.jpeg";

type Page = "dashboard" | "eleves" | "paiements" | "depenses" | "donneurs" | "messages" | "rapports" | "users" | "classes" | "niveaux" | "enseignants" | "settings";

export function Dashboard() {
    const { user, logout, isAdmin } = useAuth();
    const [currentPage, setCurrentPage] = useState<Page>("dashboard");

    const navItems = [
        { id: "dashboard" as Page, label: "Tableau de bord", icon: "📊" },
        { id: "eleves" as Page, label: "Élèves", icon: "🎓" },
        { id: "paiements" as Page, label: "Paiements", icon: "💳" },
        { id: "depenses" as Page, label: "Dépenses", icon: "💸" },
        { id: "donneurs" as Page, label: "Donneurs", icon: "🎁" },
        { id: "messages" as Page, label: "Messages", icon: "💬" },

        // Section Scolarité
        { id: "classes" as Page, label: "Classes", icon: "🏫" },
        { id: "enseignants" as Page, label: "Enseignants", icon: "👨‍🏫" },
        { id: "niveaux" as Page, label: "Niveaux", icon: "📚" },

        { id: "rapports" as Page, label: "Rapports", icon: "📈" },
        ...(isAdmin ? [{ id: "users" as Page, label: "Utilisateurs", icon: "👥" }] : []),
        ...(isAdmin ? [{ id: "settings" as Page, label: "Paramètres", icon: "⚙️" }] : []),
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r flex flex-col">
                {/* Logo */}
                <div className="p-4 border-b">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden shadow">
                            <img
                                src={logoImage}
                                alt="Logo"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div>
                            <h1 className="font-bold text-gray-900">Association Aicha</h1>
                            <p className="text-xs text-gray-500">جمعية عائشة القرآنية</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setCurrentPage(item.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${currentPage === item.id
                                ? "bg-emerald-50 text-emerald-700"
                                : "text-gray-600 hover:bg-gray-50"
                                }`}
                        >
                            <span className="text-lg">{item.icon}</span>
                            <span className="font-medium">{item.label}</span>
                        </button>
                    ))}
                </nav>

                {/* User Info */}
                <div className="p-4 border-t">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-emerald-700">
                                {user?.prenom?.[0]}{user?.nom?.[0]}
                            </span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                                {user?.prenom} {user?.nom}
                            </p>
                            <p className="text-xs text-gray-500">
                                {isAdmin ? "Administrateur" : "Secrétaire"}
                            </p>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" className="w-full" onClick={logout}>
                        Déconnexion
                    </Button>
                </div>
                {/* Notification Badge */}
                <div className="px-4 pb-2">
                    <NotificationBadge onClick={() => setCurrentPage("messages")} />
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto bg-gray-50 p-6">
                {currentPage === "dashboard" && <DashboardHome onNavigate={setCurrentPage} />}
                {currentPage === "eleves" && <ElevesPage />}
                {currentPage === "classes" && <ClassesPage />}
                {currentPage === "niveaux" && <NiveauxPage />}
                {currentPage === "enseignants" && <EnseignantsPage />}
                {currentPage === "paiements" && <PaiementsPage />}
                {currentPage === "depenses" && <DepensesPage />}
                {currentPage === "donneurs" && <DonneursPage />}
                {currentPage === "messages" && <MessagesPage />}
                {currentPage === "users" && <UsersPage />}
                {currentPage === "rapports" && <ReportsPage />}
                {currentPage === "settings" && <BackupPage />}
            </main>
        </div>
    );
}

function DashboardHome({ onNavigate }: { onNavigate: (page: Page) => void }) {
    const [stats, setStats] = useState<any>(null);
    const [lateStudents, setLateStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            setLoading(true);
            const [statsData, lateData] = await Promise.all([
                invoke("get_dashboard_stats"),
                invoke("get_late_payment_students"),
            ]);
            setStats(statsData);
            setLateStudents(lateData as any[]);
        } catch (error) {
            console.error("Dashboard error:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-full">
                <p className="text-gray-500">Chargement du tableau de bord...</p>
            </div>
        );
    }

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Tableau de bord</h2>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                {/* Recettes */}
                <div className="bg-white rounded-xl shadow-sm p-6 border">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Recettes</p>
                            <p className="text-2xl font-bold text-emerald-600">
                                {stats?.total_recettes?.toFixed(2) || 0} DH
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                            <span className="text-xl">💰</span>
                        </div>
                    </div>
                </div>

                {/* Dépenses */}
                <div className="bg-white rounded-xl shadow-sm p-6 border">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Dépenses</p>
                            <p className="text-2xl font-bold text-red-600">
                                {stats?.total_depenses?.toFixed(2) || 0} DH
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                            <span className="text-xl">💸</span>
                        </div>
                    </div>
                </div>

                {/* Solde */}
                <div className="bg-white rounded-xl shadow-sm p-6 border">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Solde</p>
                            <p className={`text-2xl font-bold ${stats?.solde >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                {stats?.solde?.toFixed(2) || 0} DH
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-xl">💵</span>
                        </div>
                    </div>
                </div>

                {/* Élèves */}
                <div className="bg-white rounded-xl shadow-sm p-6 border">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Élèves</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {stats?.total_eleves || 0}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                            <span className="text-xl">🎓</span>
                        </div>
                    </div>
                </div>

                {/* Retards */}
                <div className="bg-white rounded-xl shadow-sm p-6 border">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Retards</p>
                            <p className="text-2xl font-bold text-orange-600">
                                {stats?.eleves_en_retard_count || 0}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                            <span className="text-xl">⚠️</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <Button
                    className="h-20 bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => onNavigate("paiements")}
                >
                    <span className="text-lg mr-2">💳</span>
                    Paiements
                </Button>
                <Button
                    variant="outline"
                    className="h-20"
                    onClick={() => onNavigate("depenses")}
                >
                    <span className="text-lg mr-2">💸</span>
                    Dépenses
                </Button>
                <Button
                    variant="outline"
                    className="h-20"
                    onClick={() => onNavigate("eleves")}
                >
                    <span className="text-lg mr-2">👤</span>
                    Élèves
                </Button>
                <Button
                    variant="outline"
                    className="h-20"
                    onClick={() => onNavigate("messages")}
                >
                    <span className="text-lg mr-2">✉️</span>
                    Messages
                </Button>
            </div>

            {/* Late Payments Table */}
            {lateStudents.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm p-6 border">
                    <h3 className="font-semibold text-gray-900 mb-4">
                        Élèves en retard de paiement ({lateStudents.length})
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left pb-2 text-sm font-medium text-gray-500">Nom</th>
                                    <th className="text-left pb-2 text-sm font-medium text-gray-500">Prénom</th>
                                    <th className="text-left pb-2 text-sm font-medium text-gray-500">Classe</th>
                                    <th className="text-right pb-2 text-sm font-medium text-gray-500">Mois impayés</th>
                                    <th className="text-right pb-2 text-sm font-medium text-gray-500">Montant dû</th>
                                </tr>
                            </thead>
                            <tbody>
                                {lateStudents.map((student: any) => (
                                    <tr key={student.id} className="border-b last:border-0 hover:bg-gray-50">
                                        <td className="py-3">{student.nom}</td>
                                        <td className="py-3">{student.prenom}</td>
                                        <td className="py-3 text-gray-600">{student.classe}</td>
                                        <td className="py-3 text-right font-medium text-orange-600">
                                            {student.mois_impayes}
                                        </td>
                                        <td className="py-3 text-right font-medium">
                                            {student.montant_du.toFixed(2)} DH
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
