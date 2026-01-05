import { useEffect, useState } from "react";
import { messagesApi } from "../features/messages/api";
import { Bell } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

interface NotificationBadgeProps {
    onClick?: () => void;
}

export function NotificationBadge({ onClick }: NotificationBadgeProps) {
    const [count, setCount] = useState(0);

    const loadCount = async () => {
        try {
            const unreadCount = await messagesApi.getUnreadCount();
            setCount(unreadCount);
        } catch (error) {
            console.error("Error loading unread count:", error);
        }
    };

    useEffect(() => {
        loadCount();

        // Refresh count every 30 seconds
        const interval = setInterval(loadCount, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={onClick}
            title={`${count} message${count > 1 ? "s" : ""} non lu${count > 1 ? "s" : ""}`}
        >
            <Bell className="w-5 h-5" />
            {count > 0 && (
                <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
                >
                    {count > 9 ? "9+" : count}
                </Badge>
            )}
        </Button>
    );
}
