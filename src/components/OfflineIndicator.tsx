"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { WifiOff, Wifi } from "lucide-react";

export default function OfflineIndicator() {
    const [isOnline, setIsOnline] = useState(true);

    useEffect(() => {
        // Initial state
        setIsOnline(navigator.onLine);

        const handleOnline = () => {
            setIsOnline(true);
            toast.success("Connexion rétablie", {
                icon: <Wifi size={20} className="text-white" />,
                style: {
                    background: '#10b981',
                    color: '#fff',
                },
            });
        };

        const handleOffline = () => {
            setIsOnline(false);
            toast.error("Mode hors-ligne activé. Veuillez vérifier votre connexion pour commander.", {
                icon: <WifiOff size={20} className="text-white" />,
                duration: 6000,
                style: {
                    background: '#ef4444',
                    color: '#fff',
                },
            });
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (isOnline) return null;

    return (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[120] animate-bounce">
            <div className="bg-red-500 text-white px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 border border-white/20">
                <WifiOff size={14} />
                HORS-LIGNE
            </div>
        </div>
    );
}
