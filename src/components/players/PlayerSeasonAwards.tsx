'use client';

import { ReactNode, useState } from 'react';

interface AwardItem {
    key: 'balon' | 'botin' | 'guante';
    label: string;
    seasons: string[];
    icon: ReactNode;
}

interface PlayerSeasonAwardsProps {
    awards: AwardItem[];
    iconOnly?: boolean;
}

export function PlayerSeasonAwards({ awards, iconOnly = false }: PlayerSeasonAwardsProps) {
    const [selectedAward, setSelectedAward] = useState<string | null>(null);

    const handleSelect = (key: string) => {
        setSelectedAward(prev => (prev === key ? null : key));
    };

    if (iconOnly) {
        return (
            <div className="flex items-center gap-2">
                {awards.map(item => {
                    const unlocked = item.seasons.length > 0;
                    const isSelected = selectedAward === item.key;
                    const tooltipContent = item.seasons.length > 0
                        ? item.seasons.map(season => `${item.label} - ${season.replace(/^Año\s+/i, '')}`).join(', ')
                        : 'Aún no ganó este premio';

                    return (
                        <div key={item.key} className="relative">
                            <button
                                type="button"
                                onClick={() => handleSelect(item.key)}
                                className={`w-11 h-11 rounded-2xl flex items-center justify-center border transition-colors duration-200 ${unlocked ? 'border-amber-400 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20' : 'border-slate-700 bg-slate-950 text-slate-500 hover:border-slate-500'}`}
                                aria-label={item.label}
                            >
                                {item.icon}
                            </button>

                            {isSelected && (
                                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-max min-w-[180px] rounded-2xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 shadow-xl z-50 text-center">
                                    {tooltipContent}
                                    <div className="absolute left-1/2 bottom-full -translate-x-1/2 h-3 w-3 bg-slate-950 border-l border-t border-slate-800 rotate-45 translate-y-1.5" />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    }

    const activeAward = awards.find(item => item.key === selectedAward);

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
                {awards.map(item => {
                    const unlocked = item.seasons.length > 0;
                    return (
                        <button
                            key={item.key}
                            type="button"
                            onClick={() => handleSelect(item.key)}
                            className="group rounded-3xl border p-4 flex flex-col items-center gap-2 transition-all duration-200 focus:outline-none"
                            aria-label={`Ver temporadas de ${item.label}`}
                        >
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 ${unlocked ? 'border-yellow-400 bg-amber-500/10 text-amber-300 shadow-[0_0_10px_rgba(250,204,21,0.25)]' : 'border-white/30 bg-slate-950 text-slate-400'}`}>
                                {item.icon}
                            </div>
                            <div className={`text-[11px] uppercase tracking-[0.25em] font-bold ${unlocked ? 'text-amber-300' : 'text-slate-500'}`}>
                                {item.label}
                            </div>
                            <div className={`text-sm font-black ${unlocked ? 'text-amber-300' : 'text-slate-500'}`}>
                                {item.seasons.length}
                            </div>
                            <div className="text-[10px] text-slate-500 opacity-70">
                                {unlocked ? 'Ganado' : 'Bloqueado'}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
