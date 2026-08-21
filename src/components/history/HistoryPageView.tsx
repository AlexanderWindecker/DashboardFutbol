'use client';

import { useState, useMemo, useEffect } from 'react';
import { Player, Match, PlayerStats, Season, SeasonAwards } from '@/types';
import { Trophy, Medal, Star, Target, Crown, ChevronDown, ChevronUp, Shield, Sparkles, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdmin } from '@/hooks/useAdmin';
import { Modal } from '@/components/ui/Modal';
import { revealSeasonAwardsAction } from '@/actions/awards';
import { useRouter } from 'next/navigation';

interface HistoryPageViewProps {
    players: Player[];
    matches: Match[];
    participations: PlayerStats[];
    seasons: Season[];
    seasonAwards: SeasonAwards[];
    activeSeasonId?: string;
}

export function HistoryPageView({ players, matches, participations, seasons, seasonAwards, activeSeasonId }: HistoryPageViewProps) {
    const { isAdmin } = useAdmin();
    const router = useRouter();
    const [selectedSeason, setSelectedSeason] = useState<string>(() => {
        return activeSeasonId || seasons[0]?.id || 'all';
    });
    const [selectedYear, setSelectedYear] = useState<string>('');
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const [view, setView] = useState<'historia' | 'salon'>('historia');
    const [ganadorRevelado, setGanadorRevelado] = useState(false);
    const [isCriteriaOpen, setIsCriteriaOpen] = useState(false);
    const [isPreviewReveal, setIsPreviewReveal] = useState(false);

    const hasOpenSeason = seasons.some(s => {
        const endTime = s.endDate ? new Date(s.endDate).getTime() : NaN;
        return Number.isNaN(endTime) ? true : endTime > Date.now();
    });
    const showAccumulatedFinal = !hasOpenSeason && seasons.length > 0;

    const yearsList = useMemo(() => {
        const years = seasons.map(s => {
            const match = s.name.match(/\b(20\d{2})\b/);
            if (match) return match[1];
            const date = new Date(s.startDate);
            return !isNaN(date.getTime()) ? String(date.getFullYear()) : String(new Date().getFullYear());
        });
        return Array.from(new Set(years)).sort((a, b) => b.localeCompare(a));
    }, [seasons]);

    useEffect(() => {
        if (yearsList.length > 0 && !selectedYear) {
            const activeSeason = seasons.find(s => s.id === selectedSeason);
            if (activeSeason) {
                const match = activeSeason.name.match(/\b(20\d{2})\b/);
                if (match) {
                    setSelectedYear(match[1]);
                    return;
                }
            }
            setSelectedYear(yearsList[0]);
        }
    }, [yearsList, selectedSeason, seasons, selectedYear]);

    useEffect(() => {
        setGanadorRevelado(false);
        setOpenDropdown(null);
    }, [selectedSeason, selectedYear, view]);

    const toggleDropdown = (category: string) => {
        setOpenDropdown(prev => prev === category ? null : category);
    };

    const stats = useMemo(() => {
        const seasonIdToYear = new Map(seasons.map(s => {
            const match = s.name.match(/\b(20\d{2})\b/);
            const yr = match ? match[1] : String(new Date(s.startDate).getFullYear());
            return [s.id, yr];
        }));

        const filteredMatches = view === 'salon'
            ? matches.filter(m => m.seasonId && seasonIdToYear.get(m.seasonId) === selectedYear)
            : (selectedSeason === 'all' ? matches : matches.filter(m => m.seasonId === selectedSeason));

        const matchIds = new Set(filteredMatches.map(m => m.id));
        const filteredParticipations = participations.filter(p => matchIds.has(p.matchId));
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
            const s = player.skills as any || {};
            const positions = player.positions || [];
            const isPureGk = positions.length === 1 && positions[0] === 'Arquero';
            let skillsAverage = 0;
            if (isPureGk) {
                skillsAverage = Math.round(((s.reflejos || 50) + (s.posicionamiento || 50) + (s.estirada || 50) + (s.saque || 50) + (s.seguridad || 50)) / 5);
            } else {
                skillsAverage = Math.round(((s.ritmo || 50) + (s.tiros || 50) + (s.pases || 50) + (s.regates || 50) + (s.velocidad || 50)) / 5);
            }
            return { player, matchesAttended, goals, assists, mvpCount, gkBestAwards, absences, wins, skillsAverage, isPureGk };
        });
    }, [players, matches, participations, selectedSeason, selectedYear, view, seasons]);

    const getTop3 = (key: keyof typeof stats[0], label: string) =>
        [...stats]
            .filter(s => (s[key] as number) > 0)
            .sort((a, b) => (b[key] as number) - (a[key] as number))
            .slice(0, 3)
            .map(s => ({ player: s.player, value: s[key] as number, subtitle: label }));

    const balonDeOroTerna = useMemo(() => {
        if (stats.length === 0) return [];
        const maxSkill   = Math.max(...stats.map(s => s.skillsAverage), 1);
        const maxWins    = Math.max(...stats.map(s => s.wins), 1);
        const maxAttend  = Math.max(...stats.map(s => s.matchesAttended), 1);
        const maxGoals   = Math.max(...stats.map(s => s.goals), 1);
        const maxGkAward = Math.max(...stats.map(s => s.gkBestAwards), 1);
        const maxMvp     = Math.max(...stats.map(s => s.mvpCount), 1);
        const maxAbs     = Math.max(...stats.map(s => s.absences), 1);

        return stats
            .filter(s => s.matchesAttended > 0)
            .map(s => {
                const skillScore     = (s.skillsAverage   / maxSkill)   * 25;
                const winScore       = (s.wins            / maxWins)    * 20;
                const attendScore    = (s.matchesAttended / maxAttend)  * 30;
                const goalScore      = (s.goals           / maxGoals)   * 10;
                const gkScore        = (s.gkBestAwards    / maxGkAward) * 5;
                const mvpScore       = (s.mvpCount        / maxMvp)     * 10;
                const absencePenalty = (s.absences        / maxAbs)     * 10;
                const total = Math.round(skillScore + winScore + attendScore + goalScore + gkScore + mvpScore - absencePenalty);
                return {
                    player: s.player, total,
                    breakdown: {
                        skill: Math.round(skillScore),
                        wins: Math.round(winScore),
                        attend: Math.round(attendScore),
                        goals: Math.round(goalScore),
                        gk: Math.round(gkScore),
                        mvp: Math.round(mvpScore),
                        penalty: Math.round(absencePenalty)
                    },
                    raw: { skillsAverage: s.skillsAverage, wins: s.wins, matchesAttended: s.matchesAttended, goals: s.goals, gkBestAwards: s.gkBestAwards, mvpCount: s.mvpCount, absences: s.absences }
                };
            })
            .sort((a, b) => b.total - a.total)
            .slice(0, 5);
    }, [stats]);

    const historiaCategories = [
        { id: 'goals',      title: 'Pichichi',           emoji: '⚽', icon: Target,  color: 'from-orange-400 to-rose-600',    textColor: 'text-orange-400',  bgGlow: 'bg-orange-500/10',  data: getTop3('goals', 'Goles') },
        { id: 'gk',         title: 'Mejor Arquero',      emoji: '🧤', icon: Shield,  color: 'from-cyan-400 to-sky-600',       textColor: 'text-cyan-400',    bgGlow: 'bg-cyan-500/10',    data: getTop3('gkBestAwards', 'Premios') },
        { id: 'mvp',        title: 'El Referente',       emoji: '⭐', icon: Star,    color: 'from-amber-300 to-yellow-600',   textColor: 'text-amber-400',   bgGlow: 'bg-amber-500/10',   data: getTop3('mvpCount', 'Veces MVP') },
        { id: 'wins',       title: 'Más Ganador',        emoji: '🏆', icon: Trophy,  color: 'from-emerald-400 to-teal-600',   textColor: 'text-emerald-400', bgGlow: 'bg-emerald-500/10', data: getTop3('wins', 'Victorias') },
        { id: 'attendance', title: 'Asistencia Perfecta',emoji: '💪', icon: Shield,  color: 'from-purple-400 to-fuchsia-600', textColor: 'text-purple-400',  bgGlow: 'bg-purple-500/10',  data: getTop3('matchesAttended', 'Partidos') },
    ];

    const salonCategories = [
        { id: 'botin_oro',   title: 'Botín de Oro',   emoji: '👟', icon: Target, color: 'from-orange-400 to-rose-600',  textColor: 'text-orange-400', bgGlow: 'bg-orange-500/10', borderColor: 'border-orange-500/30', data: getTop3('goals', 'Goles') },
        { id: 'guantes_oro', title: 'Guantes de Oro', emoji: '🧤', icon: Shield, color: 'from-cyan-400 to-sky-600',     textColor: 'text-cyan-400',   bgGlow: 'bg-cyan-500/10',   borderColor: 'border-cyan-500/30',   data: getTop3('gkBestAwards', 'Premios') },
    ];

    const renderPodioCard = (category: typeof historiaCategories[0], borderHighlight = false) => {
        const top1 = category.data[0];
        const top2 = category.data[1];
        const top3 = category.data[2];
        const isOpen = openDropdown === category.id;
        return (
            <div key={category.id} className="relative group">
                <div className={cn("absolute -inset-0.5 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-1000", category.bgGlow)} />
                <div className={cn("relative flex flex-col bg-slate-900 border rounded-2xl overflow-hidden h-full", borderHighlight ? 'border-yellow-500/30' : 'border-slate-800')}>
                    <div className="p-6 relative overflow-hidden flex-1 flex flex-col justify-center">
                        <div className="absolute -right-6 -top-6 opacity-5 pointer-events-none transform -rotate-12 group-hover:scale-110 transition-transform duration-700">
                            <category.icon size={160} />
                        </div>
                        <div className="flex items-start justify-between relative z-10 mb-4">
                            <h2 className={cn("text-lg font-black uppercase tracking-widest flex items-center gap-2", category.textColor)}>
                                <span className="text-xl">{category.emoji}</span>
                                {category.title}
                            </h2>
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Puesto #1</span>
                                <Medal size={22} className="text-amber-400 mt-1 drop-shadow-[0_0_5px_rgba(251,191,36,0.8)]" />
                            </div>
                        </div>
                        {top1 ? (
                            <div className="flex items-center gap-5 mt-2">
                                <div className={cn("w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-black text-white shadow-xl bg-gradient-to-br border border-white/10 shrink-0", category.color)}>
                                    {top1.player.name.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-3xl font-black text-white tracking-tight truncate">{top1.player.name}</h3>
                                    <div className="flex items-baseline gap-2 mt-1">
                                        <span className={cn("text-2xl font-black", category.textColor)}>{top1.value}</span>
                                        <span className="text-sm font-bold text-slate-500 uppercase">{top1.subtitle}</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-6 text-slate-600 text-sm">Sin registros aún.</div>
                        )}
                    </div>
                    {(top2 || top3) && (
                        <div className="border-t border-slate-800 bg-slate-950/50">
                            <button onClick={() => toggleDropdown(category.id)} className="w-full px-6 py-3 flex items-center justify-between text-xs font-bold text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors uppercase tracking-widest">
                                <span>Ver Podio Completo</span>
                                {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                            <div className={cn("overflow-hidden transition-all duration-300 ease-in-out", isOpen ? "max-h-48 opacity-100" : "max-h-0 opacity-0")}>
                                <div className="p-4 space-y-2">
                                    {[top2, top3].map((entry, i) => entry && (
                                        <div key={i} className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-3 px-4 hover:border-slate-700 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0", i === 0 ? "bg-slate-300 text-slate-800" : "bg-amber-700 text-amber-100")}>{i + 2}</div>
                                                <span className="font-bold text-slate-200">{entry.player.name}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-lg font-black text-white">{entry.value}</span>
                                                <span className="text-[10px] text-slate-500 uppercase">{entry.subtitle}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const ganador = balonDeOroTerna[0];
    const premiosRevelados = seasonAwards.some(award => award.seasonKey === selectedYear && award.rulesVersion === 2);

    const revelarPremios = async () => {
        if (!ganador || !selectedYear) return;

        const botinDeOro = [...stats].sort((a, b) => b.goals - a.goals)[0];
        const guanteDeOro = [...stats]
            .filter(s => s.gkBestAwards > 0)
            .sort((a, b) => b.gkBestAwards - a.gkBestAwards || b.matchesAttended - a.matchesAttended)[0];

        const result = await revealSeasonAwardsAction({
            seasonKey: selectedYear,
            seasonLabel: `Año ${selectedYear}`,
            rulesVersion: 2,
            balonDeOroPlayerId: ganador.player.id,
            botinDeOroPlayerId: botinDeOro?.goals ? botinDeOro.player.id : null,
            guanteDeOroPlayerId: guanteDeOro?.gkBestAwards ? guanteDeOro.player.id : null,
            revealedAt: new Date().toISOString(),
        });
        setIsPreviewReveal(result.preview);
        setGanadorRevelado(true);
        if (!result.preview) router.refresh();
    };

    return (
        <>
            <Modal
                isOpen={isCriteriaOpen}
                onClose={() => setIsCriteriaOpen(false)}
                title="¿Cómo se define la terna del Balón de Oro?"
            >
                <div className="space-y-5 text-sm text-slate-300">
                    <p>
                        La terna no se arma solo por goles ni solo por popularidad. Se calcula un puntaje ponderado con rendimiento real en la temporada.
                    </p>

                    <div className="grid gap-3">
                        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-400 mb-2">Puntaje final</p>
                            <p className="text-slate-200 font-semibold">Asistencia 30% + Skill 25% + Victorias 20% + MVP 10% + Goles 10% + ARQ 5% - Bajas 10%</p>
                        </div>

                        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-400 mb-2">Qué se tiene en cuenta</p>
                            <ul className="list-disc pl-5 space-y-1 text-slate-300">
                                <li>Promedio de skill del jugador.</li>
                                <li>Victorias en partidos jugados.</li>
                                <li>Partidos asistidos y continuidad, con el mayor peso.</li>
                                <li>Goles convertidos.</li>
                                <li>Premios de arquero si corresponde.</li>
                                <li>MVPs del torneo o temporada.</li>
                                <li>Penalización por ausencias o bajas.</li>
                            </ul>
                        </div>
                    </div>

                    <p>
                        Luego se ordena desde el mayor puntaje al menor y se toman los 5 mejores para formar la terna final del Balón de Oro.
                    </p>

                    <p className="text-xs text-slate-500 italic">
                        En otras palabras: cuanto mejor rindes, más partidos jugás, menos faltás y más aportás al equipo, más chances tenés de entrar a la terna.
                    </p>
                </div>
            </Modal>

            <div className="space-y-8 max-w-5xl mx-auto pb-10">
                <style dangerouslySetInnerHTML={{ __html: `
                    @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
                    @keyframes reveal { 0%{opacity:0;transform:scale(0.85) translateY(12px)} 100%{opacity:1;transform:scale(1) translateY(0)} }
                    .animate-float { animation: float 4s ease-in-out infinite; }
                    .animate-reveal { animation: reveal 0.55s cubic-bezier(0.34,1.56,0.64,1) forwards; }
                    .no-scrollbar::-webkit-scrollbar{display:none;} .no-scrollbar{-ms-overflow-style:none;scrollbar-width:none;}
                `}} />

                {/* HEADER */}
                <div className="flex flex-col gap-4 bg-slate-900/50 p-6 rounded-3xl border border-slate-800 backdrop-blur-xl">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-gradient-to-br from-amber-400/20 to-orange-500/20 rounded-xl border border-amber-500/30">
                                <Crown className="text-amber-400 animate-float" size={28} />
                            </div>
                            <div>
                                <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-orange-500 tracking-tight uppercase">Historial</h1>
                                <p className="text-xs text-slate-500 font-medium">Récords y leyendas del grupo</p>
                            </div>
                        </div>
                        <div className="flex items-center bg-slate-950 p-1 rounded-2xl border border-slate-800 shadow-inner self-start md:self-auto">
                            <button onClick={() => setView('historia')} className={cn("px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all", view === 'historia' ? "bg-slate-700 text-white shadow" : "text-slate-500 hover:text-slate-300")}>
                                📊 Historia
                            </button>
                            <button onClick={() => setView('salon')} className={cn("px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all", view === 'salon' ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-[0_0_12px_rgba(245,158,11,0.4)]" : "text-slate-500 hover:text-slate-300")}>
                                🏆 Salón de la Fama
                            </button>
                        </div>
                    </div>
                    {view === 'historia' ? (
                        <div className="flex items-center bg-slate-950 p-1.5 rounded-2xl border border-slate-800 shadow-inner overflow-x-auto no-scrollbar self-start">
                            {showAccumulatedFinal && (
                                <button onClick={() => setSelectedSeason('all')} className={cn("px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap", selectedSeason === 'all' ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg" : "text-slate-500 hover:text-slate-300 hover:bg-slate-900")}>
                                    🏆 Acumulado
                                </button>
                            )}
                            {seasons.map(s => (
                                <button key={s.id} onClick={() => setSelectedSeason(s.id)} className={cn("px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap", selectedSeason === s.id ? "bg-gradient-to-r from-slate-700 to-slate-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300 hover:bg-slate-900")}>
                                    {s.name}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="flex items-center bg-slate-950 p-1.5 rounded-2xl border border-slate-800 shadow-inner overflow-x-auto no-scrollbar self-start animate-reveal">
                            {yearsList.map(yr => (
                                <button key={yr} onClick={() => setSelectedYear(yr)} className={cn("px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap", selectedYear === yr ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg" : "text-slate-500 hover:text-slate-300 hover:bg-slate-900")}>
                                    📅 Año {yr}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {view === 'historia' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {historiaCategories.map(cat => renderPodioCard(cat))}
                    </div>
                )}

                {view === 'salon' && (
                    <div className="space-y-8 animate-reveal">
                        {balonDeOroTerna.length > 0 && (
                            <div className="relative group">
                                <div className="absolute -inset-0.5 rounded-3xl blur-lg opacity-40 bg-gradient-to-r from-yellow-500/40 via-amber-400/30 to-orange-500/40 group-hover:opacity-60 transition duration-1000" />
                                <div className="relative bg-slate-900 border border-yellow-500/40 rounded-3xl p-6 overflow-hidden">
                                    <div className="absolute -right-8 -top-8 opacity-5 pointer-events-none"><Crown size={200} className="text-yellow-400" /></div>

                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 bg-gradient-to-br from-yellow-400/20 to-amber-600/20 rounded-xl border border-yellow-500/30">
                                                <Crown className="text-yellow-400" size={24} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h2 className="text-2xl font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-500">Balón de Oro</h2>
                                                    <button
                                                        type="button"
                                                        onClick={() => setIsCriteriaOpen(true)}
                                                        className="inline-flex items-center justify-center rounded-full border border-slate-700 bg-slate-900/70 p-1.5 text-slate-300 transition hover:border-yellow-500/60 hover:text-yellow-300"
                                                        aria-label="Cómo se define la terna"
                                                        title="Cómo se define la terna"
                                                    >
                                                        <HelpCircle size={14} />
                                                    </button>
                                                </div>
                                                <p className="text-xs text-slate-500 font-medium mt-1">Mejor de {selectedYear} · Resultados combinados (Apertura + Clausura)</p>
                                            </div>
                                        </div>
                                        <div className="hidden md:flex flex-col items-end gap-1 text-[10px] text-slate-600 font-bold uppercase tracking-wider min-w-[180px]">
                                            <span className="flex items-center gap-1 self-end"><span className="w-2 h-2 rounded-full bg-violet-400 inline-block"/>Skill 25%</span>
                                            <span className="flex items-center gap-1 self-end"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"/>Vic. 20%</span>
                                            <span className="flex items-center gap-1 self-end"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block"/>Asist. 30%</span>
                                            <span className="flex items-center gap-1 self-end"><span className="w-2 h-2 rounded-full bg-orange-400 inline-block"/>Goles 10%</span>
                                            <span className="flex items-center gap-1 self-end"><span className="w-2 h-2 rounded-full bg-cyan-400 inline-block"/>ARQ 5%</span>
                                            <span className="flex items-center gap-1 self-end"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block"/>MVP 10%</span>
                                            <span className="flex items-center gap-1 self-end"><span className="w-2 h-2 rounded-full bg-red-400 inline-block"/>-Bajas 10%</span>
                                        </div>
                                    </div>

                                    <div className="mb-6">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4">🎖️ Terna de Finalistas</p>
                                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                            {balonDeOroTerna.map((nominee, idx) => (
                                                <div
                                                    key={nominee.player.id}
                                                    className={cn(
                                                        "relative rounded-2xl border transition-all",
                                                        idx === 0 ? "bg-gradient-to-br from-yellow-500/10 to-amber-600/5 border-yellow-500/30 p-5" :
                                                        idx === 1 ? "bg-slate-800/40 border-slate-600/50 p-5" :
                                                        idx >= 2 ? "bg-slate-800/30 border-slate-700/50 p-4 scale-[0.97] opacity-95" : "",
                                                    )}
                                                >
                                                    {idx === 0 && <span className="absolute top-3 right-3 text-xl">🏅</span>}
                                                    <div className="flex items-center gap-3 mb-4">
                                                        <div className={cn(
                                                            "rounded-xl flex items-center justify-center font-black text-white shrink-0",
                                                            idx === 0 ? "w-12 h-12 text-xl bg-gradient-to-br from-yellow-300 to-amber-600 shadow-[0_0_20px_rgba(245,158,11,0.4)]" :
                                                            idx === 1 ? "w-12 h-12 text-xl bg-gradient-to-br from-slate-400 to-slate-600" :
                                                            idx === 2 ? "w-11 h-11 text-lg bg-gradient-to-br from-amber-700 to-amber-900" :
                                                            "w-10 h-10 text-base bg-gradient-to-br from-slate-600 to-slate-800"
                                                        )}>
                                                            {nominee.player.name.charAt(0)}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className={cn("font-bold text-slate-500", idx >= 3 ? "text-[9px]" : "text-[10px]")}>#{idx + 1}</div>
                                                            <div className={cn("font-black text-white truncate", idx >= 3 ? "text-sm" : "text-base")}>{nominee.player.name}</div>
                                                            <div className={cn("font-black", idx === 0 ? "text-yellow-400 text-lg" : idx >= 3 ? "text-slate-300 text-sm" : "text-slate-300 text-lg")}>
                                                                {nominee.total} <span className={cn("font-bold text-slate-500", idx >= 3 ? "text-[10px]" : "text-xs")}>pts</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className={cn("space-y-1.5", idx >= 3 ? "text-[9px]" : "text-[10px]")}>
                                                        {[
                                                            { label: '⚡ Skill',  val: nominee.breakdown.skill,    max: 25, color: 'bg-violet-400' },
                                                            { label: '🏆 Vic.',   val: nominee.breakdown.wins,     max: 20, color: 'bg-emerald-400' },
                                                            { label: '📅 Asist.', val: nominee.breakdown.attend,   max: 30, color: 'bg-blue-400' },
                                                            { label: '⚽ Goles',  val: nominee.breakdown.goals,    max: 10, color: 'bg-orange-400' },
                                                            { label: '🧤 ARQ',    val: nominee.breakdown.gk,       max: 5, color: 'bg-cyan-400' },
                                                            { label: '⭐ MVP',    val: nominee.breakdown.mvp,      max: 10, color: 'bg-amber-400' },
                                                            { label: '⚠️ Bajas',  val: nominee.breakdown.penalty,  max: 10, color: 'bg-red-400', negative: true },
                                                        ].map(({ label, val, max, color, negative }) => (
                                                            <div key={label} className="flex items-center gap-2">
                                                                <span className="text-slate-600 w-12 shrink-0">{label}</span>
                                                                <div className="flex-1 h-1 bg-slate-700 rounded-full overflow-hidden">
                                                                    <div className={cn("h-full rounded-full", color)} style={{ width: `${(val / max) * 100}%` }} />
                                                                </div>
                                                                <span className={cn("font-black w-4 text-right shrink-0", negative ? 'text-red-400' : 'text-slate-400')}>
                                                                    {negative ? `-${val}` : val}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {isAdmin ? (
                                        !ganadorRevelado && !premiosRevelados ? (
                                            <button
                                                onClick={revelarPremios}
                                                className="w-full py-4 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-slate-900 font-black text-sm uppercase tracking-widest rounded-2xl transition-all shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:shadow-[0_0_30px_rgba(245,158,11,0.6)] flex items-center justify-center gap-3"
                                            >
                                                <Sparkles size={18} />
                                                Revelar Ganador (Solo Admin)
                                                <Sparkles size={18} />
                                            </button>
                                        ) : ganador && (
                                            <div className="animate-reveal bg-gradient-to-br from-yellow-500/10 via-amber-500/5 to-transparent border border-yellow-500/40 rounded-2xl p-6">
                                                <p className="text-center text-[10px] font-black text-yellow-500 uppercase tracking-[0.4em] mb-5">🏅 Ganador del Balón de Oro {selectedYear}</p>
                                                {isPreviewReveal && (
                                                    <p className="text-center text-[10px] font-bold text-sky-400 uppercase tracking-wider mb-4">Vista previa local: no se guardó en producción</p>
                                                )}
                                                <div className="flex flex-col md:flex-row items-center gap-6">
                                                    <div className="relative shrink-0">
                                                        <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-yellow-300 to-amber-600 flex items-center justify-center text-5xl font-black text-white shadow-[0_0_40px_rgba(245,158,11,0.6)] border-2 border-yellow-400/50">
                                                            {ganador.player.name.charAt(0)}
                                                        </div>
                                                        <span className="absolute -top-4 -right-4 text-3xl">🏅</span>
                                                    </div>
                                                    <div className="text-center md:text-left">
                                                        <h3 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-400 tracking-tight">
                                                            {ganador.player.name}
                                                        </h3>
                                                        <div className="flex items-baseline gap-2 mt-2 justify-center md:justify-start">
                                                            <span className="text-4xl font-black text-yellow-400">{ganador.total}</span>
                                                            <span className="text-slate-400 font-bold">puntos totales</span>
                                                        </div>
                                                        <div className="flex flex-wrap gap-2 mt-3 justify-center md:justify-start text-xs">
                                                            <span className="bg-violet-500/20 text-violet-300 px-2 py-1 rounded-lg font-bold">⚡ {ganador.raw.skillsAverage} ranking</span>
                                                            <span className="bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded-lg font-bold">🏆 {ganador.raw.wins} victorias</span>
                                                            <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded-lg font-bold">📅 {ganador.raw.matchesAttended} partidos</span>
                                                            <span className="bg-orange-500/20 text-orange-300 px-2 py-1 rounded-lg font-bold">⚽ {ganador.raw.goals} goles</span>
                                                            <span className="bg-amber-500/20 text-amber-300 px-2 py-1 rounded-lg font-bold">⭐ {ganador.raw.mvpCount} MVP</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    ) : (
                                        <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-4 text-center">
                                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">🔒 El ganador será revelado por el administrador durante la gala final.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="h-px flex-1 bg-gradient-to-r from-yellow-500/40 to-transparent" />
                                <h2 className="text-xs font-black uppercase tracking-[0.3em] text-yellow-500/70 px-3">🥇 Premios del Año {selectedYear}</h2>
                                <div className="h-px flex-1 bg-gradient-to-l from-yellow-500/40 to-transparent" />
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {salonCategories.map(cat => renderPodioCard(cat, true))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
