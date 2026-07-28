'use client';

import { useState } from 'react';
import { Menu, X, Share2, Check } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { useAdmin } from '@/hooks/useAdmin';

export function AppShell({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [shareCopied, setShareCopied] = useState(false);
    const { isAdmin } = useAdmin();

    const handleShare = async () => {
        const shareData = {
            title: 'Futbol Amateur - Dashboard',
            text: '¡Mirá el dashboard de nuestro equipo de fútbol amateur!',
            url: window.location.origin,
        };
        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(window.location.origin);
                setShareCopied(true);
                setTimeout(() => setShareCopied(false), 2500);
            }
        } catch {
            // user cancelled or error
        }
    };

    return (
        <div className="flex min-h-screen bg-slate-950">
            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                isAdmin={isAdmin}
            />

            <div className="flex-1 flex flex-col min-h-screen w-full lg:ml-64 transition-all duration-300">
                {/* Mobile Navbar */}
                <header className="lg:hidden h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-30">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2 -ml-2 text-slate-400 hover:text-white transition-colors"
                    >
                        <Menu size={24} />
                    </button>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">
                            {isAdmin ? '🛡️ Admin' : 'Futbol Amateur'}
                        </span>
                        <button
                            onClick={handleShare}
                            title="Compartir App"
                            className="p-2 rounded-lg text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 transition-all duration-200"
                        >
                            {shareCopied ? <Check size={18} /> : <Share2 size={18} />}
                        </button>
                    </div>
                </header>

                <main className="flex-1 p-4 md:p-8 text-slate-50">
                    {children}
                </main>
            </div>
        </div>
    );
}
