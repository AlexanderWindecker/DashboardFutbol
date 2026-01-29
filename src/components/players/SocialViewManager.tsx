'use client';

import { useState } from 'react';
import { Player } from '@/types';
import { RelationshipPanels } from './RelationshipPanels';
import { SocialBloodweb } from './SocialBloodweb';
import { LayoutGrid, Network, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SocialViewManagerProps {
    players: Player[];
}

export function SocialViewManager({ players }: SocialViewManagerProps) {
    const [viewMode, setViewMode] = useState<'panels' | 'bloodweb'>(() => {
        if (typeof window !== 'undefined') {
            return (localStorage.getItem('social_view_mode') as 'panels' | 'bloodweb') || 'panels';
        }
        return 'panels';
    });
    const [privacyMode, setPrivacyMode] = useState(false);

    return (
        <div className="space-y-6">
            {/* Control Bar */}
            <div className="flex items-center justify-between px-6">
                {/* Privacy Toggle (Consistent with Players/Stats pages) */}
                <button
                    onClick={() => setPrivacyMode(!privacyMode)}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-white transition-all border border-transparent hover:border-slate-700"
                    title={privacyMode ? "Desactivar Modo Privacidad" : "Activar Modo Privacidad"}
                >
                    {privacyMode ? (
                        <>
                            <EyeOff size={20} className="text-indigo-400" />
                            <span className="text-xs font-semibold text-indigo-400">Privacidad ON</span>
                        </>
                    ) : (
                        <>
                            <Eye size={20} />
                            <span className="text-xs font-semibold">Privacidad OFF</span>
                        </>
                    )}
                </button>

                {/* View Toggle */}
                <div className="bg-slate-900 p-1 rounded-lg border border-slate-800 flex gap-1">
                    <button
                        onClick={() => {
                            setViewMode('panels');
                            localStorage.setItem('social_view_mode', 'panels');
                        }}
                        className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                            viewMode === 'panels'
                                ? "bg-indigo-600 text-white shadow"
                                : "text-slate-400 hover:text-white hover:bg-slate-800"
                        )}
                    >
                        <LayoutGrid size={16} />
                        Paneles
                    </button>
                    <button
                        onClick={() => {
                            setViewMode('bloodweb');
                            localStorage.setItem('social_view_mode', 'bloodweb');
                        }}
                        className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                            viewMode === 'bloodweb'
                                ? "bg-rose-600 text-white shadow"
                                : "text-slate-400 hover:text-white hover:bg-slate-800"
                        )}
                    >
                        <Network size={16} />
                        Bloodweb
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="transition-all duration-500 ease-in-out">
                {viewMode === 'panels' ? (
                    <RelationshipPanels players={players} privacyMode={privacyMode} />
                ) : (
                    <div className="animate-in fade-in zoom-in-95 duration-500">
                        <SocialBloodweb players={players} privacyMode={privacyMode} />
                    </div>
                )}
            </div>
        </div>
    );
}
