import { useState } from "react";
import { useAuth } from "@/features/auth";
import { ElevesPage } from "@/features/eleves";
import { Button } from "@/components/ui/button";
import logoImage from "@/assets/logo.jpeg";

type Page = "dashboard" | "eleves" | "paiements" | "rapports" | "users";

export function Dashboard() {
    const { user, logout, isAdmin } = useAuth();
    const [currentPage, setCurrentPage] = useState<Page>("dashboard");

    const navItems = [
        { id: "dashboard" as Page, label: "Tableau de bord", icon: "📊" },
        { id: "eleves" as Page, label: "Élèves", icon: "🎓" },
        { id: "paiements" as Page, label: "Paiements", icon: "💳" },
        { id: "rapports" as Page, label: "Rapports", icon: "📈" },
        ...(isAdmin ? [{ id: "users" as Page, label: "Utilisateurs", icon: "👥" }] : []),
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
                <nav className="flex-1 p-4 space-y-1">
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
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                {currentPage === "dashboard" && <DashboardHome onNavigate={setCurrentPage} />}
                {currentPage === "eleves" && <ElevesPage />}
                {currentPage === "paiements" && <PlaceholderPage title="Paiements" icon="💳" />}
                {currentPage === "rapports" && <PlaceholderPage title="Rapports" icon="📈" />}
                {currentPage === "users" && <PlaceholderPage title="Utilisateurs" icon="👥" />}
            </main>
        </div>
    );
}

function DashboardHome({ onNavigate }: { onNavigate: (page: Page) => void }) {
    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Tableau de bord</h2>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-sm p-6 border">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Élèves inscrits</p>
                            <p className="text-2xl font-bold text-gray-900">--</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-xl">🎓</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Recettes du mois</p>
                            <p className="text-2xl font-bold text-emerald-600">-- DH</p>
                        </div>
                        <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                            <span className="text-xl">💰</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Retards de paiement</p>
                            <p className="text-2xl font-bold text-orange-600">--</p>
                        </div>
                        <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                            <span className="text-xl">⚠️</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Messages non lus</p>
                            <p className="text-2xl font-bold text-purple-600">--</p>
                        </div>
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                            <span className="text-xl">✉️</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <Button
                    className="h-20 bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => onNavigate("paiements")}
                >
                    <span className="text-lg mr-2">💳</span>
                    Nouveau Paiement
                </Button>
                <Button
                    variant="outline"
                    className="h-20"
                    onClick={() => onNavigate("eleves")}
                >
                    <span className="text-lg mr-2">👤</span>
                    Ajouter un Élève
                </Button>
                <Button
                    variant="outline"
                    className="h-20"
                    onClick={() => onNavigate("rapports")}
                >
                    <span className="text-lg mr-2">📊</span>
                    Générer un Rapport
                </Button>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm p-6 border">
                    <h3 className="font-semibold text-gray-900 mb-4">Activité récente</h3>
                    <p className="text-gray-500 text-sm">Aucune activité pour le moment.</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-6 border">
                    <h3 className="font-semibold text-gray-900 mb-4">Élèves en retard</h3>
                    <p className="text-gray-500 text-sm">Aucun retard de paiement.</p>
                </div>
            </div>
        </div>
    );
}

function PlaceholderPage({ title, icon }: { title: string; icon: string }) {
    return (
        <div className="p-6 flex items-center justify-center min-h-full">
            <div className="text-center">
                <div className="text-6xl mb-4">{icon}</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
                <p className="text-gray-500">Cette section sera bientôt disponible.</p>
            </div>
        </div>
    );
}
