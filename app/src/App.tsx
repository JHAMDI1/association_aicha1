import { AuthProvider, useAuth, LoginPage } from "@/features/auth";
import { Dashboard } from "@/features/finances";
import { Toaster } from "@/components/ui/sonner";
import "./index.css";

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <Dashboard />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
      <Toaster position="bottom-right" />
    </AuthProvider>
  );
}

export default App;
