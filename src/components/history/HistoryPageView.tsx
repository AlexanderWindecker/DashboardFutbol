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
    const [selectedBalonDeOroId, setSelectedBalonDeOroId] = useState<string | null>(null);

    const selectedSeasonName = selectedSeason === 'all'
        ? 'Acumulado Final'
        : seasons.find(s => s.id === selectedSeason)?.name || 'Temporada';

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
            const gkBestAwards = attendedParts.filter(p => p.isBestGoalkeeper).length;
            const absences = playerParts.filter(p => p.status === 'Absent' || p.status === 'LateCancel').length;
            
            const wins = attendedParts.filter(p => {
                const match = filteredMatches.find(m => m.id === p.matchId);
                return match && match.result === p.team;
            }).length;

            // Rating global from skills
            const s = player.skills as any || {};
            const positions = player.positions || [];
            const isPureGk = positions.length === 1 && positions[0] === 'Arquero';
            let skillsAverage = 0;
            if (isPureGk) {
                skillsAverage = Math.round(((s.reflejos || 50) + (s.posicionamiento || 50) + (s.estirada || 50) + (s.saque || 50) + (s.seguridad || 50)) / 5);
            } else {
                skillsAverage = Math.round(((s.ritmo || 50) + (s.tiros || 50) + (s.pases || 50) + (s.regates || 50) + (s.velocidad || 50)) / 5);
            }

            return {
                player,
                matchesAttended,
                goals,
                assists,
                mvpCount,
                gkBestAwards,
                absences,
                wins,
                skillsAverage,
                isPureGk
            };
        });
    }, [players, matches, participations, selectedSeason]);

    const getTop3 = (key: keyof typeof stats[0], sortDesc = true, filterFn?: (s: typeof stats[0]) => boolean) => {
        const sorted = [...stats]
            .filter(s => (s[key] as number) > 0)
            .filter(filterFn || (() => true))
            .sort((a, b) => {
                const valA = a[key] as number;
                const valB = b[key] as number;
                return sortDesc ? valB - valA : valA - valB;
            });
            
        return sorted.slice(0, 3).map(s => ({
            player: s.player,
            value: s[key] as number,
            subtitle: key === 'matchesAttended' ? 'Partidos' : 
                      key === 'goals' ? 'Goles' : 
                      key === 'assists' ? 'Asistencias' : 
                      key === 'wins' ? 'Victorias' : 
                      key === 'mvpCount' ? 'Veces MVP' :
                      key === 'gkBestAwards' ? 'Premios' :
                      key === 'skillsAverage' ? 'Rating' : ''
        }));
    };

    // ── BALÓN DE ORO: Fórmula ponderada ──────────────────────────
    const balónDeOroTerna = useMemo(() => {
        if (stats.length === 0) return [];

        // Obtain max values for normalization (avoid division by zero)
        const maxSkill   = Math.max(...stats.map(s => s.skillsAverage), 1);
        const maxWins    = Math.max(...stats.map(s => s.wins), 1);
        const maxAttend  = Math.max(...stats.map(s => s.matchesAttended), 1);
        const maxGoals   = Math.max(...stats.map(s => s.goals), 1);
        const maxGkAward = Math.max(...stats.map(s => s.gkBestAwards), 1);
        const maxAbs     = Math.max(...stats.map(s => s.absences), 1);

        // Weights (must sum to 100)
        // Skills 35 | Wins 25 | Attendance 15 | Goals 15 | GK Awards 10 | Absences penalty -10
        const scored = stats
            .filter(s => s.matchesAttended > 0)
            .map(s => {
                const skillScore   = (s.skillsAverage   / maxSkill)   * 35;
                const winScore     = (s.wins            / maxWins)    * 25;
                const attendScore  = (s.matchesAttended / maxAttend)  * 15;
                const goalScore    = (s.goals           / maxGoals)   * 15;
                const gkScore      = (s.gkBestAwards    / maxGkAward) * 10;
                const absencePenalty = (s.absences      / maxAbs)     * 10;

                const total = Math.round(
                    skillScore + winScore + attendScore + goalScore + gkScore - absencePenalty
                );

                return {
                    player: s.player,
                    total,
                    breakdown: {
                        skill:    Math.round(skillScore),
                        wins:     Math.round(winScore),
                        attend:   Math.round(attendScore),
                        goals:    Math.round(goalScore),
                        gk:       Math.round(gkScore),
                        penalty:  Math.round(absencePenalty),
                    },
                    raw: {
                        skillsAverage: s.skillsAverage,
                        wins: s.wins,
                        matchesAttended: s.matchesAttended,
                        goals: s.goals,
                        gkBestAwards: s.gkBestAwards,
                        absences: s.absences,
                    }
                };
            })
            .sort((a, b) => b.total - a.total)
            .slice(0, 3);

        return scored;
    }, [stats]);

    const activeBalonDeOro = selectedBalonDeOroId
        ? balónDeOroTerna.find(item => item.player.id === selectedBalonDeOroId) ?? balónDeOroTerna[0]
        : balónDeOroTerna[0];

    const balonDeOroLabel = activeBalonDeOro?.player.id === balónDeOroTerna[0]?.player.id
        ? 'Ganador'
        : 'Seleccionado';

    const categories = [
        // ── PREMIOS DORADOS ──────────────────────────────────────────
        // Balón de Oro is rendered separately as a special card
        {
            id: 'botin_oro',
            title: 'Botín de Oro',
            emoji: '👟',
            icon: Target,
            color: 'from-orange-400 to-rose-600',
            textColor: 'text-orange-400',
            bgGlow: 'bg-orange-500/10',
            borderColor: 'border-orange-500/30',
            data: getTop3('goals'),
            isPremio: true
        },
        {
            id: 'guantes_oro',
            title: 'Guantes de Oro',
            emoji: '🧤',
            icon: Shield,
            color: 'from-cyan-400 to-sky-600',
            textColor: 'text-cyan-400',
            bgGlow: 'bg-cyan-500/10',
            borderColor: 'border-cyan-500/30',
            data: getTop3('gkBestAwards'),
            isPremio: true
        },
        // ── SALÓN DE LA FAMA ─────────────────────────────────────────
        {
            id: 'mvp',
            title: 'MVP',
            emoji: '⭐',
            icon: Star,
            color: 'from-amber-300 to-yellow-600',
            textColor: 'text-amber-400',
            bgGlow: 'bg-amber-500/10',
            borderColor: 'border-slate-800',
            data: getTop3('mvpCount'),
            isPremio: false
        },
        {
            id: 'wins',
            title: 'Más Ganador',
            emoji: '🏆',
            icon: Trophy,
            color: 'from-emerald-400 to-teal-600',
            textColor: 'text-emerald-400',
            bgGlow: 'bg-emerald-500/10',
            borderColor: 'border-slate-800',
            data: getTop3('wins'),
            isPremio: false
        },
        {
            id: 'attendance',
            title: 'Asistencia Perfecta',
            emoji: '💪',
            icon: Shield,
            color: 'from-purple-400 to-fuchsia-600',
            textColor: 'text-purple-400',
            bgGlow: 'bg-purple-500/10',
            borderColor: 'border-slate-800',
            data: getTop3('matchesAttended'),
            isPremio: false
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
                            🏆 Acumulado Final
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
            </div>

            {/* ── BALÓN DE ORO ─────────────────────────────────── */}
            {balónDeOroTerna.length > 0 && (
                <div className="relative group">
                    <div className="absolute -inset-0.5 rounded-3xl blur-lg opacity-40 bg-gradient-to-r from-yellow-500/40 via-amber-400/30 to-orange-500/40 group-hover:opacity-70 transition duration-1000" />
                    <div className="relative bg-slate-900 border border-yellow-500/40 rounded-3xl p-6 overflow-hidden">
                        {/* Decorative background */}
                        <div className="absolute -right-8 -top-8 opacity-5 pointer-events-none">
                            <Crown size={200} className="text-yellow-400" />
                        </div>

                        {/* Header */}
                        <div className="flex items-center justify-between mb-6 relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-gradient-to-br from-yellow-400/20 to-amber-600/20 rounded-xl border border-yellow-500/30">
                                    <Crown className="text-yellow-400" size={24} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-500">Balón de Oro</h2>
                                    <p className="text-xs text-slate-500 font-medium">Mejor jugador de la temporada · Fórmula ponderada</p>
                                </div>
                            </div>
                            <div className="hidden md:flex gap-4 text-[10px] text-slate-600 font-bold uppercase tracking-wider">
                                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-violet-400 inline-block"/>Skill 35%</span>
                                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"/>Vic. 25%</span>
                                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block"/>Asist. 15%</span>
                                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400 inline-block"/>Goles 15%</span>
                                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyan-400 inline-block"/>ARQ 10%</span>
                                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block"/>-Bajas 10%</span>
                            </div>
                        </div>

                        {/* GANADOR */}
                        {activeBalonDeOro && (() => { const w = activeBalonDeOro; return (
                            <div className="flex flex-col md:flex-row md:items-center gap-6 mb-6 pb-6 border-b border-yellow-500/20">
                                <div className="flex items-center gap-5 flex-1">
                                    <div className="relative shrink-0">
                                        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-yellow-300 to-amber-600 flex items-center justify-center text-4xl font-black text-white shadow-[0_0_30px_rgba(245,158,11,0.5)] border border-yellow-400/30">
                                            {w.player.name.charAt(0)}
                                        </div>
                                        <span className="absolute -top-3 -right-3 text-2xl">🏅</span>
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-black text-yellow-500 uppercase tracking-[0.3em] mb-1">{balonDeOroLabel}</div>
                                        <h3 className="text-4xl font-black text-white tracking-tight">{w.player.name}</h3>
                                        <div className="flex items-baseline gap-2 mt-1">
                                            <span className="text-3xl font-black text-yellow-400">{w.total}</span>
                                            <span className="text-sm text-slate-500 font-bold">pts</span>
                                        </div>
                                    </div>
                                </div>
                                {/* Breakdown bars */}
                                <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                                    <div className="bg-slate-800/60 rounded-xl p-3">
                                        <div className="text-slate-500 font-bold mb-1">⚡ Skill</div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                                <div className="h-full bg-violet-400 rounded-full" style={{width: `${(w.breakdown.skill/35)*100}%`}} />
                                            </div>
                                            <span className="text-violet-400 font-black w-6 text-right">{w.breakdown.skill}</span>
                                        </div>
                                        <div className="text-slate-600 mt-1">{w.raw.skillsAverage} rating</div>
                                    </div>
                                    <div className="bg-slate-800/60 rounded-xl p-3">
                                        <div className="text-slate-500 font-bold mb-1">🏆 Victorias</div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                                <div className="h-full bg-emerald-400 rounded-full" style={{width: `${(w.breakdown.wins/25)*100}%`}} />
                                            </div>
                                            <span className="text-emerald-400 font-black w-6 text-right">{w.breakdown.wins}</span>
                                        </div>
                                        <div className="text-slate-600 mt-1">{w.raw.wins} ganados</div>
                                    </div>
                                    <div className="bg-slate-800/60 rounded-xl p-3">
                                        <div className="text-slate-500 font-bold mb-1">📅 Asistencia</div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                                <div className="h-full bg-blue-400 rounded-full" style={{width: `${(w.breakdown.attend/15)*100}%`}} />
                                            </div>
                                            <span className="text-blue-400 font-black w-6 text-right">{w.breakdown.attend}</span>
                                        </div>
                                        <div className="text-slate-600 mt-1">{w.raw.matchesAttended} partidos</div>
                                    </div>
                                    <div className="bg-slate-800/60 rounded-xl p-3">
                                        <div className="text-slate-500 font-bold mb-1">⚽ Goles</div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                                <div className="h-full bg-orange-400 rounded-full" style={{width: `${(w.breakdown.goals/15)*100}%`}} />
                                            </div>
                                            <span className="text-orange-400 font-black w-6 text-right">{w.breakdown.goals}</span>
                                        </div>
                                        <div className="text-slate-600 mt-1">{w.raw.goals} goles</div>
                                    </div>
                                    <div className="bg-slate-800/60 rounded-xl p-3">
                                        <div className="text-slate-500 font-bold mb-1">🧤 ARQ</div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                                <div className="h-full bg-cyan-400 rounded-full" style={{width: `${(w.breakdown.gk/10)*100}%`}} />
                                            </div>
                                            <span className="text-cyan-400 font-black w-6 text-right">{w.breakdown.gk}</span>
                                        </div>
                                        <div className="text-slate-600 mt-1">{w.raw.gkBestAwards} premios</div>
                                    </div>
                                    <div className="bg-slate-800/60 rounded-xl p-3">
                                        <div className="text-slate-500 font-bold mb-1">⚠️ Bajas</div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                                <div className="h-full bg-red-500 rounded-full" style={{width: `${(w.breakdown.penalty/10)*100}%`}} />
                                            </div>
                                            <span className="text-red-400 font-black w-6 text-right">-{w.breakdown.penalty}</span>
                                        </div>
                                        <div className="text-slate-600 mt-1">{w.raw.absences} ausencias</div>
                                    </div>
                                </div>
                            </div>
                        ); })()}

                        {/* TERNA: Nominados #2 y #3 */}
                        {balónDeOroTerna.length > 1 && (
                            <div>
                                <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mb-3">🎖️ Terna de Finalistas</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {balónDeOroTerna.slice(1).map((nominee, idx) => (
                                        <div
                                            key={nominee.player.id}
                                            onClick={() => setSelectedBalonDeOroId(prev => prev === nominee.player.id ? null : nominee.player.id)}
                                            className={cn(
                                                "flex items-center gap-4 rounded-xl p-4 transition-colors cursor-pointer",
                                                selectedBalonDeOroId === nominee.player.id
                                                    ? "bg-slate-700 border border-yellow-400 shadow-lg"
                                                    : "bg-slate-800/40 border border-slate-700/50 hover:border-slate-600"
                                            )}
                                        >
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-lg font-black text-white shrink-0">
                                                {nominee.player.name.charAt(0)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] text-slate-500 font-bold">#{idx + 2}</span>
                                                    <span className="font-black text-white truncate">{nominee.player.name}</span>
                                                </div>
                                                <div className="flex items-center gap-3 mt-1.5">
                                                    <div className="flex-1 h-1 bg-slate-700 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full"
                                                            style={{width: `${balónDeOroTerna[0] ? (nominee.total / balónDeOroTerna[0].total) * 100 : 0}%`}}
                                                        />
                                                    </div>
                                                    <span className="text-amber-400 font-black text-sm shrink-0">{nominee.total} pts</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── PREMIOS DORADOS ─────────────────────────────── */}
            <div>
                <div className="flex items-center gap-3 mb-4">
                    <div className="h-px flex-1 bg-gradient-to-r from-yellow-500/50 to-transparent" />
                    <h2 className="text-xs font-black uppercase tracking-[0.3em] text-yellow-500/80 px-3">
                        🏅 Premios de la Temporada
                    </h2>
                    <div className="h-px flex-1 bg-gradient-to-l from-yellow-500/50 to-transparent" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {categories.filter(c => c.isPremio).map(category => {
                        const top1 = category.data[0];
                        const top2 = category.data[1];
                        const top3 = category.data[2];
                        const isOpen = openDropdown === category.id;

                        return (
                            <div key={category.id} className="relative group">
                                <div className={cn("absolute -inset-0.5 rounded-3xl blur opacity-30 group-hover:opacity-60 transition duration-1000", category.bgGlow)} />
                                <div className={cn("relative flex flex-col bg-slate-900 border rounded-2xl overflow-hidden h-full transition-all", category.borderColor)}>
                                    {/* Top 1 Card */}
                                    <div className="p-6 relative overflow-hidden flex-1 flex flex-col justify-center">
                                        <div className="absolute -right-6 -top-6 opacity-5 pointer-events-none transform -rotate-12 group-hover:scale-110 transition-transform duration-700">
                                            <category.icon size={160} />
                                        </div>
                                        <div className="flex items-start justify-between relative z-10 mb-4">
                                            <h2 className={cn("text-lg font-black uppercase tracking-widest flex items-center gap-2", category.textColor)}>
                                                <span className="text-xl">{category.emoji}</span>
                                                {category.title}
                                            </h2>
                                            <Medal size={24} className="text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.9)]" />
                                        </div>

                                        {top1 ? (
                                            <div className="flex items-center gap-4 mt-2">
                                                <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black text-white shadow-xl bg-gradient-to-br border border-white/10 shrink-0", category.color)}>
                                                    {top1.player.name.charAt(0)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-2xl font-black text-white tracking-tight truncate">{top1.player.name}</h3>
                                                    <div className="flex items-baseline gap-2 mt-0.5">
                                                        <span className={cn("text-xl font-black", category.textColor)}>{top1.value}</span>
                                                        <span className="text-xs font-bold text-slate-500 uppercase">{top1.subtitle}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center py-6 text-slate-600 text-sm">
                                                Sin datos aún.
                                            </div>
                                        )}
                                    </div>

                                    {/* Podio #2 y #3 */}
                                    {(top2 || top3) && (
                                        <div className="border-t border-slate-800 bg-slate-950/50">
                                            <button
                                                onClick={() => toggleDropdown(category.id)}
                                                className="w-full px-6 py-3 flex items-center justify-between text-xs font-bold text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors uppercase tracking-widest"
                                            >
                                                <span>Ver Podio Completo</span>
                                                {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                            </button>
                                            <div className={cn("overflow-hidden transition-all duration-300 ease-in-out", isOpen ? "max-h-48 opacity-100" : "max-h-0 opacity-0")}>
                                                <div className="p-4 space-y-2">
                                                    {top2 && (
                                                        <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-3 px-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-6 h-6 rounded-full bg-slate-300 text-slate-800 flex items-center justify-center text-xs font-black shrink-0">2</div>
                                                                <span className="font-bold text-slate-200">{top2.player.name}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="text-lg font-black text-white">{top2.value}</span>
                                                                <span className="text-[10px] text-slate-500 uppercase">{top2.subtitle}</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {top3 && (
                                                        <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-3 px-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-6 h-6 rounded-full bg-amber-700 text-amber-100 flex items-center justify-center text-xs font-black shrink-0">3</div>
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

            {/* ── SALÓN DE LA FAMA ────────────────────────────── */}
            <div>
                <div className="flex items-center gap-3 mb-4">
                    <div className="h-px flex-1 bg-gradient-to-r from-amber-500/30 to-transparent" />
                    <h2 className="text-xs font-black uppercase tracking-[0.3em] text-amber-500/60 px-3">
                        🏛️ Salón de la Fama
                    </h2>
                    <div className="h-px flex-1 bg-gradient-to-l from-amber-500/30 to-transparent" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {categories.filter(c => !c.isPremio).map(category => {
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
            </div>{/* end Salón de la Fama */}
        </div>
    );
}
