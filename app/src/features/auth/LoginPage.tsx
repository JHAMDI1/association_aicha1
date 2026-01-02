import { useState } from "react";
import { useAuth } from "./AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import logoImage from "@/assets/logo.jpeg";

export function LoginPage() {
    const { login, isLoading, error } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [localError, setLocalError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError("");

        if (!email || !password) {
            setLocalError("Veuillez remplir tous les champs");
            return;
        }

        try {
            await login(email, password);
        } catch (err) {
            // Error is handled in AuthContext
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 p-4">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}></div>
            </div>

            <Card className="w-full max-w-md shadow-2xl relative z-10 border-0 bg-white/95 backdrop-blur">
                <CardHeader className="text-center space-y-4 pb-2">
                    {/* Logo */}
                    <div className="mx-auto w-24 h-24 rounded-full overflow-hidden shadow-lg border-4 border-emerald-100">
                        <img
                            src={logoImage}
                            alt="Association Aicha Logo"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div>
                        <CardTitle className="text-2xl font-bold text-emerald-800">
                            Association Aicha
                        </CardTitle>
                        <CardDescription className="text-lg text-emerald-600 font-arabic">
                            جمعية عائشة القرآنية
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="pt-4">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-medium text-gray-700">
                                Email
                            </label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="admin@aicha.local"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={isLoading}
                                className="h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="password" className="text-sm font-medium text-gray-700">
                                Mot de passe
                            </label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={isLoading}
                                className="h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                            />
                        </div>

                        {(error || localError) && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-sm text-red-600 font-medium">{error || localError}</p>
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                    Connexion...
                                </span>
                            ) : (
                                "Se connecter"
                            )}
                        </Button>
                    </form>

                    {/* Footer */}
                    <div className="mt-6 pt-4 border-t text-center">
                        <p className="text-xs text-gray-500">
                            © 2025 Association Aicha - Tous droits réservés
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
