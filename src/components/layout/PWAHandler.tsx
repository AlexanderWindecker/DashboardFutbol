'use client';

import { useEffect, useState } from 'react';
import { Download, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function PWAHandler() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        // Register Service Worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').then(
                (registration) => console.log('SW registered:', registration.scope),
                (err) => console.log('SW failed:', err)
            );
        }

        // Handle Installation Prompt
        const handleBeforeInstallPrompt = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone) {
            setIsInstalled(true);
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setDeferredPrompt(null);
        }
    };

    if (isInstalled || !deferredPrompt) return null;

    return null; // Hidden by default, manually placed elsewhere
}

export function InstallButton() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstalled, setIsInstalled] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const handleBeforeInstallPrompt = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        if (window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone) {
            setIsInstalled(true);
        }

        return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') setDeferredPrompt(null);
    };

    if (!mounted || isInstalled || !deferredPrompt) return null;

    return (
        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-6 rounded-2xl border border-indigo-400/30 shadow-2xl shadow-indigo-500/20 mb-8 relative overflow-hidden group">
            {/* Decoration */}
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-colors" />

            <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 shrink-0">
                        <Smartphone size={28} className="text-white" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white leading-tight">Llevá el Dashboard en tu bolsillo</h3>
                        <p className="text-indigo-100 text-sm opacity-90">Instalá la App para acceder rápido y recibir actualizaciones del equipo.</p>
                    </div>
                </div>

                <Button
                    onClick={handleInstall}
                    className="bg-white text-indigo-600 hover:bg-slate-100 px-8 py-6 rounded-xl font-bold text-base shadow-lg hover:scale-105 transition-all whitespace-nowrap"
                >
                    Instalar Ahora
                </Button>
            </div>
        </div>
    );
}
