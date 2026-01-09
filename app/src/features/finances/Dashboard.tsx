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
import { AuditLogsPage } from "@/features/settings/AuditLogsPage";
import { Button } from "@/components/ui/button";
import { NotificationBadge } from "@/components/NotificationBadge";
import { invoke } from "@tauri-apps/api/core";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { AnimatePresence, PageTransition } from "@/components/Animations";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useTranslation } from "react-i18next";
import logoImage from "@/assets/logo.jpeg";

interface UserPermission {
    module: string;
    can_read: boolean;
    can_write: boolean;
    can_validate: boolean;
}

type Page = "dashboard" | "eleves" | "paiements" | "depenses" | "donneurs" | "messages" | "rapports" | "users" | "classes" | "niveaux" | "enseignants" | "settings" | "history";

export function Dashboard() {
    const { user, logout, isAdmin } = useAuth();
    const { t } = useTranslation();
    const [currentPage, setCurrentPage] = useState<Page>("dashboard");
    const [userPermissions, setUserPermissions] = useState<Record<string, UserPermission>>({});
    const [pendingPayment, setPendingPayment] = useState<{ eleveId: string, months: number[] } | null>(null);

    // Keyboard shortcuts
    useKeyboardShortcuts([
        { key: "p", ctrlKey: true, action: () => setCurrentPage("paiements"), description: "Paiements" },
        { key: "e", ctrlKey: true, action: () => setCurrentPage("eleves"), description: "Élèves" },
        { key: "d", ctrlKey: true, action: () => setCurrentPage("depenses"), description: "Dépenses" },
        { key: "h", ctrlKey: true, action: () => setCurrentPage("dashboard"), description: "Dashboard" },
        { key: "m", ctrlKey: true, action: () => setCurrentPage("messages"), description: "Messages" },
    ]);

    // Load user permissions
    useEffect(() => {
        if (user && !isAdmin) {
            invoke<UserPermission[]>("get_user_permissions", { userId: user.id })
                .then((perms) => {
                    const permsMap = perms.reduce((acc, p) => {
                        acc[p.module] = p;
                        return acc;
                    }, {} as Record<string, UserPermission>);
                    setUserPermissions(permsMap);
                })
                .catch((err) => console.error("Error loading permissions:", err));
        }
    }, [user, isAdmin]);

    // Helper function to check if user has access to a page
    const hasAccess = (pageId: Page): boolean => {
        // Admin has access to everything
        if (isAdmin) return true;

        // Dashboard is valid for everyone logged in
        if (pageId === "dashboard") return true;

        // If permissions not loaded yet for secretary
        if (Object.keys(userPermissions).length === 0) return false;

        // Map pages to permission modules
        const pageModuleMap: Partial<Record<Page, string>> = {
            eleves: "eleves",
            paiements: "paiements",
            depenses: "depenses",
            donneurs: "donneurs",
            messages: "messages",
            classes: "classes",
            enseignants: "enseignants",
            niveaux: "niveaux",
            // reports, users, settings are restricted to admin or handled otherwise
        };

        const details = pageModuleMap[pageId];
        if (!details) return false; // Default deny for unmapped pages (reports, users, etc.)

        return userPermissions[details]?.can_read === true;
    };

    const handleNavigateToPayment = (eleveId: string, months: number[]) => {
        setPendingPayment({ eleveId, months });
        setCurrentPage("paiements");
    };

    const navItems = [
        { id: "dashboard" as Page, label: t("nav.dashboard"), icon: "📊" },
        { id: "eleves" as Page, label: t("nav.students"), icon: "🎓" },
        { id: "paiements" as Page, label: t("nav.payments"), icon: "💳" },
        { id: "depenses" as Page, label: t("nav.expenses"), icon: "💸" },
        { id: "donneurs" as Page, label: t("nav.donors"), icon: "🎁" },
        { id: "messages" as Page, label: t("nav.messages"), icon: "💬" },

        // Section Scolarité
        { id: "classes" as Page, label: t("nav.classes"), icon: "🏫" },
        { id: "enseignants" as Page, label: t("nav.teachers"), icon: "👨‍🏫" },
        { id: "niveaux" as Page, label: t("nav.levels"), icon: "📚" },

        { id: "rapports" as Page, label: t("nav.reports"), icon: "📈" },
        ...(isAdmin ? [{ id: "users" as Page, label: t("nav.users"), icon: "👥" }] : []),
        ...(isAdmin ? [{ id: "settings" as Page, label: t("nav.settings"), icon: "⚙️" }] : []),
        ...(isAdmin ? [{ id: "history" as Page, label: t("nav.history"), icon: "📜" }] : []),
    ].filter(item => hasAccess(item.id));

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
                {/* Language Switcher */}
                <div className="px-4 pb-4">
                    <LanguageSwitcher />
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto bg-gray-50">
                <AnimatePresence mode="wait">
                    <PageTransition key={currentPage} className="p-6">
                        {currentPage === "dashboard" && <DashboardHome onNavigate={setCurrentPage} />}
                        {currentPage === "eleves" && <ElevesPage onNavigateToPayment={handleNavigateToPayment} />}
                        {currentPage === "classes" && <ClassesPage />}
                        {currentPage === "niveaux" && <NiveauxPage />}
                        {currentPage === "enseignants" && <EnseignantsPage />}
                        {currentPage === "paiements" && (
                            <PaiementsPage
                                initialData={pendingPayment}
                                onClearInitialData={() => setPendingPayment(null)}
                            />
                        )}
                        {currentPage === "depenses" && <DepensesPage />}
                        {currentPage === "donneurs" && <DonneursPage />}
                        {currentPage === "messages" && <MessagesPage />}
                        {currentPage === "users" && <UsersPage />}
                        {currentPage === "rapports" && <ReportsPage />}
                        {currentPage === "settings" && <BackupPage />}
                        {currentPage === "history" && <AuditLogsPage />}
                    </PageTransition>
                </AnimatePresence>
            </main>
        </div>
    );
}

function DashboardHome({ onNavigate }: { onNavigate: (page: Page) => void }) {
    const { t } = useTranslation();
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
                <p className="text-gray-500">{t("common.loading")}</p>
            </div>
        );
    }

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{t("dashboard.title")}</h2>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                {/* Recettes */}
                <div className="bg-white rounded-xl shadow-sm p-6 border">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">{t("dashboard.revenue")}</p>
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
                            <p className="text-sm text-gray-500">{t("dashboard.expenses")}</p>
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
                            <p className="text-sm text-gray-500">{t("dashboard.balance")}</p>
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
                            <p className="text-sm text-gray-500">{t("dashboard.students")}</p>
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
                            <p className="text-sm text-gray-500">{t("dashboard.latePayments")}</p>
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
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t("dashboard.quickActions")}</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <Button
                    className="h-20 bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => onNavigate("paiements")}
                >
                    <span className="text-lg mr-2">💳</span>
                    {t("nav.payments")}
                </Button>
                <Button
                    variant="outline"
                    className="h-20"
                    onClick={() => onNavigate("depenses")}
                >
                    <span className="text-lg mr-2">💸</span>
                    {t("nav.expenses")}
                </Button>
                <Button
                    variant="outline"
                    className="h-20"
                    onClick={() => onNavigate("eleves")}
                >
                    <span className="text-lg mr-2">👤</span>
                    {t("nav.students")}
                </Button>
                <Button
                    variant="outline"
                    className="h-20"
                    onClick={() => onNavigate("messages")}
                >
                    <span className="text-lg mr-2">✉️</span>
                    {t("nav.messages")}
                </Button>
            </div>

            {/* Late Payments Table */}
            {lateStudents.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm p-6 border">
                    <h3 className="font-semibold text-gray-900 mb-4">
                        {t("dashboard.latePaymentStudents")} ({lateStudents.length})
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left pb-2 text-sm font-medium text-gray-500">{t("students.lastName")}</th>
                                    <th className="text-left pb-2 text-sm font-medium text-gray-500">{t("students.firstName")}</th>
                                    <th className="text-left pb-2 text-sm font-medium text-gray-500">{t("students.class")}</th>
                                    <th className="text-right pb-2 text-sm font-medium text-gray-500">{t("dashboard.unpaidMonths")}</th>
                                    <th className="text-right pb-2 text-sm font-medium text-gray-500">{t("dashboard.amountDue")}</th>
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

