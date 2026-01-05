import logoUrl from "@/assets/logo.jpeg";

let logoBase64: string | null = null;

export const getLogoBase64 = async (): Promise<string | undefined> => {
    if (logoBase64) return logoBase64;

    try {
        const response = await fetch(logoUrl);
        const blob = await response.blob();
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                logoBase64 = reader.result as string;
                resolve(logoBase64);
            };
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.warn("Failed to load logo", error);
        return undefined;
    }
};
