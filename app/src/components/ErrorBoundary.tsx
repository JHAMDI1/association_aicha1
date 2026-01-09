import { Component, ErrorInfo, ReactNode } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { withTranslation, WithTranslation } from "react-i18next";

interface Props extends WithTranslation {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundaryBase extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        const { t } = this.props;

        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6" dir="auto">
                    <Card className="max-w-md w-full p-8 text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle className="w-8 h-8 text-red-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">
                            {t("common.errorTitle")}
                        </h2>
                        <p className="text-gray-600 mb-4">
                            {t("common.unexpectedError")}
                        </p>
                        {this.state.error && (
                            <pre className="text-xs text-left bg-gray-100 p-3 rounded mb-4 overflow-auto max-h-32 text-red-800 dir-ltr">
                                {this.state.error.message}
                            </pre>
                        )}
                        <div className="flex gap-2 justify-center">
                            <Button onClick={this.handleReset} variant="outline">
                                <RefreshCw className="w-4 h-4 mr-2" />
                                {t("common.retry")}
                            </Button>
                            <Button onClick={() => window.location.reload()}>
                                {t("common.reloadApp")}
                            </Button>
                        </div>
                    </Card>
                </div>
            );
        }

        return this.props.children;
    }
}

export const ErrorBoundary = withTranslation()(ErrorBoundaryBase);
