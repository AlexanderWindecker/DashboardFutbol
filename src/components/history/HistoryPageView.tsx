'use client';

import { useState, useMemo } from 'react';
import { Player, Match, PlayerStats, Season } from '@/types';
import { Trophy, Medal, Star, Target, Crown, ChevronDown, ChevronUp, Swords, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HistoryPageViewProps {
    players: Player[];
    matches: Match[];
    participations: PlayerStats[];
    seasons: Season[];
    activeSeasonId?: string;
}

interface CategoryWinner {
    player: Player;
    value: number | string;
    subtitle?: string;
}

export function HistoryPageView({ players, matches, participations, seasons, activeSeasonId }: HistoryPageViewProps) {
    const [selectedSeason, setSelectedSeason] = useState<string>('all');
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);

    const toggleDropdown = (category: string) => {
        if (openDropdown === category) {
            setOpenDropdown(null);
        } else {
            setOpenDropdown(category);
        }
    };

    const stats = useMemo(() => {
        // Filter matches by season
        const filteredMatches = selectedSeason === 'all' 
            ? matches 
            : matches.filter(m => m.seasonId === selectedSeason);
            
        const matchIds = new Set(filteredMatches.map(m => m.id));
        
        // Filter participations
        const filteredParticipations = participations.filter(p => matchIds.has(p.matchId));

        // Active players only
        const activePlayers = players.filter(p => p.isActive !== false);

        return activePlayers.map(player => {
            const playerParts = filteredParticipations.filter(p => p.playerId === player.id);
            const attendedParts = playerParts.filter(p => p.status === 'Attended');
            
            const matchesAttended = attendedParts.length;
            const goals = attendedParts.reduce((sum, p) => sum + (p.goals || 0), 0);
            const assists = attendedParts.reduce((sum, p) => sum + (p.assists || 0), 0);
            const mvpCount = attendedParts.filter(p => p.isMvp).length;
            
            const wins = attendedParts.filter(p => {
                const match = filteredMatches.find(m => m.id === p.matchId);
                return match && match.result === p.team;
            }).length;

            return {
                player,
                matchesAttended,
                goals,
                assists,
                mvpCount,
                wins
            };
        });
    }, [players, matches, participations, selectedSeason]);

    const getTop3 = (key: keyof typeof stats[0], sortDesc = true) => {
        const sorted = [...stats]
            .filter(s => (s[key] as number) > 0) // Only include if they have at least 1
            .sort((a, b) => {
                const valA = a[key] as number;
                const valB = b[key] as number;
                return sortDesc ? valB - valA : valA - valB;
            });
            
        return sorted.slice(0, 3).map(s => ({
            player: s.player,
            value: s[key],
            subtitle: key === 'matchesAttended' ? 'Partidos' : 
                      key === 'goals' ? 'Goles' : 
                      key === 'assists' ? 'Asistencias' : 
                      key === 'wins' ? 'Victorias' : 'Veces MVP'
        }));
    };

    const categories = [
        {
            id: 'goals',
            title: 'Máximo Goleador',
            icon: Target,
            color: 'from-orange-400 to-rose-600',
            textColor: 'text-orange-400',
            bgGlow: 'bg-orange-500/10',
            data: getTop3('goals')
        },
        {
            id: 'mvp',
            title: 'Jugador Franquicia',
            icon: Star,
            color: 'from-amber-300 to-yellow-600',
            textColor: 'text-amber-400',
            bgGlow: 'bg-amber-500/10',
            data: getTop3('mvpCount')
        },
        {
            id: 'wins',
            title: 'Más Ganador',
            icon: Trophy,
            color: 'from-emerald-400 to-teal-600',
            textColor: 'text-emerald-400',
            bgGlow: 'bg-emerald-500/10',
            data: getTop3('wins')
        },
        {
            id: 'attendance',
            title: 'Asistencia Perfecta',
            icon: Shield,
            color: 'from-purple-400 to-fuchsia-600',
            textColor: 'text-purple-400',
            bgGlow: 'bg-purple-500/10',
            data: getTop3('matchesAttended')
        }
    ];

    return (
        <div className="space-y-8 max-w-5xl mx-auto pb-10">
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-5px); }
                }
                .animate-float {
                    animation: float 4s ease-in-out infinite;
                }
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                `
            }} />

            {/* Header & Filter */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-slate-900/50 p-6 rounded-3xl border border-slate-800 backdrop-blur-xl">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-3 bg-gradient-to-br from-amber-400/20 to-orange-500/20 rounded-xl border border-amber-500/30">
                            <Crown className="text-amber-400 animate-float" size={28} />
                        </div>
                        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-orange-500 tracking-tight uppercase">
                            Salón de la Fama
                        </h1>
                    </div>
                    <p className="text-slate-400 ml-16 font-medium">Récords históricos y leyendas de cada temporada.</p>
                </div>

                <div className="flex items-center bg-slate-950 p-1.5 rounded-2xl border border-slate-800 shadow-inner overflow-x-auto no-scrollbar">
                    <button
                        onClick={() => setSelectedSeason('all')}
                        className={cn(
                            "px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap",
                            selectedSeason === 'all'
                                ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.3)] scale-100"
                                : "text-slate-500 hover:text-slate-300 hover:bg-slate-900"
                        )}
                    >
                        🏆 Historia Completa
                    </button>
                    {seasons.map(s => (
                        <button
                            key={s.id}
                            onClick={() => setSelectedSeason(s.id)}
                            className={cn(
                                "px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap",
                                selectedSeason === s.id
                                    ? "bg-gradient-to-r from-slate-700 to-slate-600 text-white shadow-lg"
                                    : "text-slate-500 hover:text-slate-300 hover:bg-slate-900"
                            )}
                        >
                            {s.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Hall of Fame Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {categories.map(category => {
                    const top1 = category.data[0];
                    const top2 = category.data[1];
                    const top3 = category.data[2];
                    
                    const isOpen = openDropdown === category.id;

                    return (
                        <div key={category.id} className="relative group">
                            {/* Glow effect behind card */}
                            <div className={cn("absolute -inset-0.5 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-1000", category.bgGlow)}></div>
                            
                            <div className="relative flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden h-full transition-all">
                                
                                {/* Top 1 Card */}
                                <div className="p-6 relative overflow-hidden flex-1 flex flex-col justify-center">
                                    {/* Background Icon */}
                                    <div className="absolute -right-6 -top-6 opacity-5 pointer-events-none transform -rotate-12 group-hover:scale-110 transition-transform duration-700">
                                        <category.icon size={160} />
                                    </div>
                                    
                                    <div className="flex items-start justify-between relative z-10 mb-4">
                                        <h2 className={cn("text-lg font-black uppercase tracking-widest flex items-center gap-2", category.textColor)}>
                                            <category.icon size={20} />
                                            {category.title}
                                        </h2>
                                        <div className="flex flex-col items-end">
                                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Puesto #1</span>
                                            <Medal size={24} className="text-amber-400 mt-1 drop-shadow-[0_0_5px_rgba(251,191,36,0.8)]" />
                                        </div>
                                    </div>

                                    {top1 ? (
                                        <div className="flex items-center gap-5 mt-2">
                                            <div className={cn("w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-black text-white shadow-xl bg-gradient-to-br border border-white/10 shrink-0", category.color)}>
                                                {top1.player.name.charAt(0)}
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-3xl font-black text-white tracking-tight">{top1.player.name}</h3>
                                                <div className="flex items-baseline gap-2 mt-1">
                                                    <span className={cn("text-2xl font-black", category.textColor)}>{top1.value}</span>
                                                    <span className="text-sm font-bold text-slate-500 uppercase">{top1.subtitle}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-6 text-slate-500">
                                            Sin registros aún en esta categoría.
                                        </div>
                                    )}
                                </div>

                                {/* Dropdown for #2 and #3 */}
                                {(top2 || top3) && (
                                    <div className="border-t border-slate-800 bg-slate-950/50">
                                        <button 
                                            onClick={() => toggleDropdown(category.id)}
                                            className="w-full px-6 py-3 flex items-center justify-between text-xs font-bold text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors uppercase tracking-widest"
                                        >
                                            <span>Ver Podio Completo</span>
                                            {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                        </button>
                                        
                                        <div className={cn(
                                            "overflow-hidden transition-all duration-300 ease-in-out",
                                            isOpen ? "max-h-48 opacity-100" : "max-h-0 opacity-0"
                                        )}>
                                            <div className="p-4 space-y-2">
                                                {top2 && (
                                                    <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-3 px-4 shadow-sm hover:border-slate-700 transition-colors">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-6 h-6 rounded-full bg-slate-300 text-slate-800 flex items-center justify-center text-xs font-black shrink-0 shadow-[0_0_8px_rgba(203,213,225,0.4)]">2</div>
                                                            <span className="font-bold text-slate-200">{top2.player.name}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-lg font-black text-white">{top2.value}</span>
                                                            <span className="text-[10px] text-slate-500 uppercase">{top2.subtitle}</span>
                                                        </div>
                                                    </div>
                                                )}
                                                {top3 && (
                                                    <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-3 px-4 shadow-sm hover:border-slate-700 transition-colors">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-6 h-6 rounded-full bg-amber-700 text-amber-100 flex items-center justify-center text-xs font-black shrink-0 shadow-[0_0_8px_rgba(180,83,9,0.4)]">3</div>
                                                            <span className="font-bold text-slate-300">{top3.player.name}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-lg font-black text-slate-300">{top3.value}</span>
                                                            <span className="text-[10px] text-slate-500 uppercase">{top3.subtitle}</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
