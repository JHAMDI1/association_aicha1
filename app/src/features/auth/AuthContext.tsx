import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { authApi, User } from "./api";

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    isAdmin: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Check for existing session on mount
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const currentUser = await authApi.getCurrentUser();
                setUser(currentUser);
            } catch (err) {
                console.error("Auth check failed:", err);
            } finally {
                setIsLoading(false);
            }
        };
        checkAuth();
    }, []);

    const login = async (email: string, password: string) => {
        setError(null);
        setIsLoading(true);
        try {
            const response = await authApi.login(email, password);
            setUser(response.user);
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setError(message);
            throw new Error(message);
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        try {
            await authApi.logout();
            setUser(null);
        } catch (err) {
            console.error("Logout failed:", err);
        }
    };

    const value: AuthContextType = {
        user,
        isLoading,
        isAuthenticated: !!user,
        isAdmin: user?.role === "ADMIN",
        login,
        logout,
        error,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
