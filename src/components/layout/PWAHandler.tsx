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
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const handleBeforeInstallPrompt = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
            console.log('✅ PWA Install Prompt detected');
        };
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) {
            alert('📱 Instalación Manual:\n\n1. Pulsá en los 3 puntitos (Menú) de tu navegador.\n2. Buscá "Instalar aplicación" o "Añadir a pantalla de inicio".\n\n(La instalación automática no está disponible en este navegador/IP)');
            return;
        }
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') setDeferredPrompt(null);
    };

    if (!mounted) return <div style={{ color: '#4f46e5', padding: '10px' }}>Cargando instalador...</div>;

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            padding: '20px',
            backgroundColor: 'rgba(79, 70, 229, 0.1)',
            borderRadius: '16px',
            border: '1px solid rgba(79, 70, 229, 0.2)',
            marginBottom: '24px'
        }}>
            <button
                onClick={handleInstall}
                style={{
                    backgroundColor: '#4f46e5',
                    color: 'white',
                    padding: '16px 24px',
                    borderRadius: '12px',
                    border: 'none',
                    fontWeight: 'bold',
                    fontSize: '18px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    boxShadow: '0 10px 15px -3px rgba(79, 70, 229, 0.3)'
                }}
            >
                <span style={{ fontSize: '24px' }}>📲</span>
                <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '10px', opacity: 0.8, textTransform: 'uppercase' }}>App Móvil</div>
                    <div>INSTALAR DASHBOARD</div>
                </div>
            </button>
            <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0, padding: '0 8px' }}>
                Si no funciona el botón, buscá "Instalar aplicación" en el menú de tu navegador.
            </p>
        </div>
    );
}
