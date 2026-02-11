import { getData } from '@/lib/data';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export const dynamic = 'force-dynamic';

import { Player, PlayerStats, Match } from '@/types';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';
import { ArrowLeft, Filter, Activity, Trophy, UserMinus, Star, Palmtree, Plus, Target, Zap, Waves, Move, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

function calculateStats(players: Player[], matches: Match[], participations: PlayerStats[], posFilter: string) {
    const playerStats = players.map(player => {
        const playerParticipations = participations.filter(p => p.playerId === player.id);
        const attendedStats = playerParticipations.filter(p => p.status === 'Attended');
        const matchesAttended = attendedStats.length;
        const absences = playerParticipations.filter(p => p.status === 'Absent' || p.status === 'LateCancel').length;
        const mvpCount = attendedStats.filter(p => p.isMvp).length;

        const wins = attendedStats.filter(p => {
            const match = matches.find(m => m.id === p.matchId);
            if (!match || !match.result || match.result === 'Empate') return false;
            return match.result === p.team;
        }).length;

        const celesteApps = attendedStats.filter(p => p.team === 'Celeste').length;
        const azulApps = attendedStats.filter(p => p.team === 'Azul').length;

        const goals = playerParticipations.reduce((sum, p) => sum + (p.goals || 0), 0);

        // Find last MVP date
        const mvpMatches = attendedStats.filter(p => p.isMvp).map(p => matches.find(m => m.id === p.matchId)).filter(Boolean) as Match[];
        const lastMvpDate = mvpMatches.length > 0
            ? mvpMatches.reduce((latest, m) => new Date(m.date) > new Date(latest.date) ? m : latest).date
            : null;

        // Skills Logic
        const s = player.skills || { ritmo: 50, tiros: 50, pases: 50, regates: 50, velocidad: 50 };
        const positions = player.positions || [];
        const isArquero = positions.includes('Arquero');
        const isPureGoalkeeper = positions.length === 1 && isArquero;

        // Determine if we should show Goalkeeper stats
        const showGoalkeeperStats = posFilter === 'Arquero' ? isArquero : isPureGoalkeeper;

        let skillsAverage = 0;
        const skillDetails = showGoalkeeperStats ? {
            pac: s.reflejos || 50,
            sho: s.posicionamiento || 50,
            pas: s.estirada || 50,
            dri: s.saque || 50,
            def: s.seguridad || 50,
            label1: 'REF', label2: 'UBI', label3: 'DEF', label4: 'SAQ', label5: 'SEG'
        } : {
            pac: s.ritmo || 50,
            sho: s.tiros || 50,
            pas: s.pases || 50,
            dri: s.regates || 50,
            def: s.velocidad || 50,
            label1: 'RIT', label2: 'TIR', label3: 'PAS', label4: 'REG', label5: 'VEL'
        };

        const skillValues = [skillDetails.pac, skillDetails.sho, skillDetails.pas, skillDetails.dri, skillDetails.def];
        skillsAverage = Math.round(skillValues.reduce((a, b) => a + b, 0) / skillValues.length);

        return {
            ...player,
            matchesAttended,
            absences,
            mvpCount,
            wins,
            winRate: matchesAttended > 0 ? Math.round((wins / matchesAttended) * 100) : 0,
            celesteApps,
            azulApps,
            totalApps: celesteApps + azulApps,
            goals,
            skillsAverage,
            skillDetails,
            isUsingGoalkeeperStats: showGoalkeeperStats,
            lastMvpDate
        };
    });
    return playerStats;
}

const SkillBar = ({ label, value, colorClass }: { label: string, value: number, colorClass: string }) => (
    <div className="flex flex-col gap-1 min-w-[70px]">
        <div className="flex justify-between items-end px-1">
            <span className="text-[10px] text-slate-400 font-black leading-none uppercase">{label}</span>
            <span className="text-sm font-mono font-bold leading-none text-white">{value}</span>
        </div>
        <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800/50 shadow-inner">
            <div
                className={cn("h-full transition-all duration-1000 ease-out shadow-[0_0_8px] relative", colorClass)}
                style={{ width: `${value}%` }}
            >
                <div className="absolute inset-0 bg-white/20 animate-pulse" />
            </div>
        </div>
    </div>
);

const RatingBadge = ({ score }: { score: number }) => {
    let containerClass = "bg-slate-800 border-slate-700 text-slate-300";
    let icon = null;

    if (score >= 90) {
        containerClass = "bg-gradient-to-br from-amber-400 via-amber-200 to-amber-500 border-amber-300 text-amber-950 shadow-[0_0_20px_rgba(251,191,36,0.4)] animate-shimmer";
        icon = <Crown size={14} className="animate-bounce" />;
    } else if (score >= 85) {
        containerClass = "bg-gradient-to-br from-slate-100 to-slate-400 border-white text-slate-900 shadow-[0_0_15px_rgba(255,255,255,0.2)]";
        icon = <Star size={14} fill="currentColor" />;
    } else if (score >= 80) {
        containerClass = "bg-gradient-to-br from-orange-400 to-orange-700 border-orange-300 text-orange-50 shadow-lg";
    }

    return (
        <div className={cn(
            "relative inline-flex items-center justify-center px-4 py-1.5 rounded-xl font-mono text-xl font-black border-2 transition-all duration-500 hover:scale-110",
            containerClass
        )}>
            {icon && <div className="absolute -top-3 -right-2 rotate-12">{icon}</div>}
            {score}
        </div>
    );
};

export default async function RankingsPage({ searchParams }: { searchParams: { type: string, pos?: string, filter?: string, seasonId?: string } }) {
    const { players, matches: allMatches, participations: allParticipations, seasons = [] } = await getData() as any;
    const { getActiveSeasonId, getSettings } = await import('@/lib/data');
    const activeSeasonId = await getActiveSeasonId();

    const params = await Promise.resolve(searchParams);
    const type = params.type || 'attendance';
    const posFilter = params.pos || 'Todos';
    const statusFilter = params.filter || 'Activos';
    const seasonId = params.seasonId || activeSeasonId;

    // Filter matches by season if not 'all'
    const matches = seasonId && seasonId !== 'all'
        ? allMatches.filter((m: Match) => m.seasonId === seasonId)
        : allMatches;

    // Filter participations for those matches
    const matchIds = new Set(matches.map((m: Match) => m.id));
    const participations = allParticipations.filter((p: PlayerStats) => matchIds.has(p.matchId));

    const stats = calculateStats(players, matches, participations, posFilter);

    let title = 'Ranking';
    let data = [...stats];
    let valueKey = 'matchesAttended';
    let label = 'Partidos';

    if (statusFilter === 'Activos') {
        data = data.filter(p => !p.isVacation && !p.isInjured);
    } else if (statusFilter === 'Vacaciones') {
        data = data.filter(p => p.isVacation);
    } else if (statusFilter === 'Lesionados') {
        data = data.filter(p => p.isInjured);
    }

    if (posFilter !== 'Todos') {
        data = data.filter(p => p.positions?.includes(posFilter as any));
    }

    const isMvpType = type === 'mvp';

    switch (type) {
        case 'attendance':
            title = 'Más Comprometido';
            data.sort((a, b) => b.matchesAttended - a.matchesAttended);
            valueKey = 'matchesAttended';
            label = 'Partidos';
            break;
        case 'mvp':
            title = 'Más MVP';
            data.sort((a, b) => b.mvpCount - a.mvpCount);
            valueKey = 'mvpCount';
            label = 'MVPs';
            break;
        case 'winners':
            title = 'Porcentaje de Victorias';
            data = data.filter(p => p.matchesAttended >= 3);
            data.sort((a, b) => b.winRate - a.winRate);
            valueKey = 'winRate';
            label = '% Vic.';
            break;
        case 'absences':
            title = 'Más Faltador';
            data.sort((a, b) => b.absences - a.absences);
            valueKey = 'absences';
            label = 'Faltas';
            break;
        case 'goals':
            title = 'Goleadores';
            data.sort((a, b) => (b.goals || 0) - (a.goals || 0));
            valueKey = 'goals';
            label = 'Goles';
            break;
        case 'skills_average':
            title = 'Mejor Media (Ficha)';
            data.sort((a, b) => b.skillsAverage - a.skillsAverage);
            valueKey = 'skillsAverage';
            label = 'Media';
            break;
    }

    const isSkillsRanking = type === 'skills_average';
    const isArqueroView = posFilter === 'Arquero';

    return (
        <div className="space-y-6">
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes shimmer {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }
                .animate-shimmer {
                    background-size: 200% auto;
                    animation: shimmer 2s linear infinite;
                }
                `
            }} />

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/stats" className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-all">
                        <ArrowLeft size={24} />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tight uppercase">{title}</h1>
                        <p className="text-slate-500 font-medium tracking-wide">Desglose técnico y rendimiento global</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Season Selector */}
                    <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 shadow-xl overflow-x-auto max-w-[300px] md:max-w-none no-scrollbar">
                        <Link
                            href={`/stats/rankings?type=${type}&pos=${posFilter}&filter=${statusFilter}&seasonId=all`}
                            className={cn(
                                "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap",
                                (!seasonId || seasonId === 'all')
                                    ? "bg-indigo-600 text-white shadow-lg"
                                    : "text-slate-500 hover:text-slate-300"
                            )}
                        >
                            Todo
                        </Link>
                        {seasons.map((s: any) => (
                            <Link
                                key={s.id}
                                href={`/stats/rankings?type=${type}&pos=${posFilter}&filter=${statusFilter}&seasonId=${s.id}`}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap",
                                    seasonId === s.id
                                        ? "bg-indigo-600 text-white shadow-lg"
                                        : "text-slate-500 hover:text-slate-300"
                                )}
                            >
                                {s.name}
                            </Link>
                        ))}
                    </div>

                    <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 shadow-xl">
                        {['Todos', 'Activos', 'Vacaciones', 'Lesionados'].map(f => (
                            <Link
                                key={f}
                                href={`/stats/rankings?type=${type}&pos=${posFilter}&filter=${f}&seasonId=${seasonId}`}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                                    statusFilter === f
                                        ? "bg-slate-800 text-white shadow-sm border border-slate-700"
                                        : "text-slate-500 hover:text-slate-300"
                                )}
                            >
                                {f}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap gap-2 pb-2">
                {['Todos', 'Delantero', 'Mediocampista', 'Defensor', 'Arquero'].map(pos => (
                    <Link
                        key={pos}
                        href={`/stats/rankings?type=${type}&filter=${statusFilter}&pos=${pos}&seasonId=${seasonId}`}
                        className={cn(
                            "px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest border-2 transition-all flex items-center gap-2",
                            posFilter === pos
                                ? "bg-indigo-600 border-indigo-400 text-white shadow-[0_0_20px_rgba(79,70,229,0.3)] scale-105"
                                : "bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-300"
                        )}
                    >
                        {pos}
                    </Link>
                ))}
            </div>

            {/* Podium for Top 3 */}
            {data.length >= 3 && (
                <div className="grid grid-cols-3 items-end gap-2 md:gap-6 px-2 py-8 md:py-12">
                    {/* 2nd Place */}
                    <div className="order-1 flex flex-col items-center gap-3 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                        <div className="relative group">
                            <div className="absolute inset-0 bg-slate-400/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="w-16 h-16 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br from-slate-300 to-slate-500 flex items-center justify-center border-4 border-slate-100 shadow-xl relative z-10 rotate-[-4deg] group-hover:rotate-0 transition-transform">
                                <span className="text-2xl md:text-4xl font-black text-slate-800">{data[1].name.charAt(0)}</span>
                                <div className="absolute -top-3 -right-3 bg-slate-100 text-slate-800 w-8 h-8 rounded-full flex items-center justify-center font-black border-2 border-slate-300 shadow-md text-sm">2</div>
                            </div>
                        </div>
                        <div className="text-center">
                            <p className="text-white font-bold text-xs md:text-lg truncate max-w-[80px] md:max-w-none">{data[1].name}</p>
                            <Badge variant="outline" className="text-[10px] md:text-xs text-slate-300 border-slate-700 bg-slate-800/50">{data[1][valueKey as keyof typeof data[0]] as number} {label}</Badge>
                        </div>
                    </div>

                    {/* 1st Place */}
                    <div className="order-2 flex flex-col items-center gap-4 animate-fade-in-up">
                        <div className="relative group">
                            <div className="absolute -inset-4 bg-amber-500/30 blur-3xl rounded-full animate-pulse" />
                            <div className="w-20 h-20 md:w-32 md:h-32 rounded-3xl bg-gradient-to-br from-amber-300 via-amber-500 to-amber-600 flex items-center justify-center border-4 border-amber-200 shadow-[0_0_40px_rgba(251,191,36,0.5)] relative z-10 group-hover:scale-110 transition-transform cursor-pointer">
                                <Crown className="absolute -top-10 text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,1)]" size={48} />
                                <span className="text-3xl md:text-5xl font-black text-amber-950">{data[0].name.charAt(0)}</span>
                                <div className="absolute -bottom-4 bg-amber-200 text-amber-950 px-4 py-1 rounded-full font-black border-2 border-amber-400 shadow-xl text-sm italic tracking-tighter">EL CAPO</div>
                            </div>
                        </div>
                        <div className="text-center mt-4">
                            <p className="text-white font-black text-sm md:text-2xl uppercase tracking-tighter drop-shadow-lg">{data[0].name}</p>
                            <div className="mt-1 flex items-center justify-center gap-2">
                                <RatingBadge score={data[0][valueKey as keyof typeof data[0]] as number} />
                            </div>
                        </div>
                    </div>

                    {/* 3rd Place */}
                    <div className="order-3 flex flex-col items-center gap-3 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
                        <div className="relative group">
                            <div className="absolute inset-0 bg-amber-800/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="w-14 h-14 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center border-4 border-amber-700 shadow-xl relative z-10 rotate-[4deg] group-hover:rotate-0 transition-transform">
                                <span className="text-xl md:text-3xl font-black text-amber-100">{data[2].name.charAt(0)}</span>
                                <div className="absolute -top-3 -right-3 bg-amber-700 text-amber-100 w-8 h-8 rounded-full flex items-center justify-center font-black border-2 border-amber-900 shadow-md text-sm">3</div>
                            </div>
                        </div>
                        <div className="text-center">
                            <p className="text-white font-bold text-xs md:text-lg truncate max-w-[80px] md:max-w-none">{data[2].name}</p>
                            <Badge variant="outline" className="text-[10px] md:text-xs text-amber-200/50 border-amber-900/50 bg-amber-900/20">{data[2][valueKey as keyof typeof data[0]] as number} {label}</Badge>
                        </div>
                    </div>
                </div>
            )}

            {/* Rankings List */}
            <div className="space-y-3">
                {data.map((p, i) => {
                    if (data.length >= 3 && i < 3) return null; // Already in podium

                    return (
                        <div key={p.id} className="group relative bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl p-4 transition-all hover:bg-slate-800/50 hover:border-slate-700 hover:translate-x-1 flex items-center justify-between gap-4 overflow-hidden">
                            {/* Accent line for top 10 */}
                            {i < 10 && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />}

                            <div className="flex items-center gap-4 min-w-0">
                                <span className="text-slate-600 font-bold font-mono w-6 text-center">{i + 1}</span>

                                <div className="relative">
                                    <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 font-black border border-slate-700 group-hover:border-indigo-500/50 transition-colors">
                                        {p.name.charAt(0)}
                                    </div>
                                    {p.isVacation && (
                                        <div className="absolute -top-1.5 -right-1.5 bg-amber-500 rounded-lg p-1 border-2 border-slate-900 shadow-lg">
                                            <Palmtree size={10} className="text-white" />
                                        </div>
                                    )}
                                    {p.isInjured && (
                                        <div className="absolute -top-1.5 -right-1.5 bg-red-600 rounded-lg p-1 border-2 border-slate-900 shadow-lg animate-pulse">
                                            <Plus size={10} className="text-white rotate-45 stroke-[4px]" />
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col min-w-0">
                                    <span className="font-bold text-white text-base md:text-lg truncate group-hover:text-indigo-400 transition-colors">{p.name}</span>
                                    {isMvpType && p.lastMvpDate && (
                                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                                            <Trophy size={10} className="text-amber-500" />
                                            <span>Último: {format(parseISO(p.lastMvpDate), 'd MMM yyyy', { locale: es })}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {isSkillsRanking && (
                                <div className="hidden md:flex items-center gap-6 px-6">
                                    <div className="flex flex-col items-center">
                                        <span className="text-[10px] text-slate-500 font-bold uppercase">{p.isUsingGoalkeeperStats ? 'REF' : 'RIT'}</span>
                                        <span className="text-sm font-bold text-white">{p.skillDetails.pac}</span>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <span className="text-[10px] text-slate-500 font-bold uppercase">{p.isUsingGoalkeeperStats ? 'UBI' : 'TIR'}</span>
                                        <span className="text-sm font-bold text-white">{p.skillDetails.sho}</span>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <span className="text-[10px] text-slate-500 font-bold uppercase">{p.isUsingGoalkeeperStats ? 'DEF' : 'PAS'}</span>
                                        <span className="text-sm font-bold text-white">{p.skillDetails.pas}</span>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center gap-4 shrink-0">
                                {isMvpType && (
                                    <div className="hidden sm:flex flex-col items-end">
                                        <span className="text-[10px] text-slate-500 font-bold uppercase">Partidos</span>
                                        <span className="text-sm font-bold text-slate-300">{p.matchesAttended}</span>
                                    </div>
                                )}
                                <RatingBadge score={p[valueKey as keyof typeof p] as number} />
                            </div>
                        </div>
                    );
                })}
            </div>

            {data.length === 0 && (
                <div className="text-center py-20 bg-slate-900/30 rounded-2xl border-2 border-dashed border-slate-800">
                    <div className="bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-700 shadow-2xl">
                        <Filter className="text-slate-500" size={24} />
                    </div>
                    <p className="text-slate-200 font-black text-lg uppercase tracking-widest">Sin resultados</p>
                    <p className="text-slate-500 text-sm mt-1 mb-6">Prueba ajustando los filtros de posición o estado.</p>
                    <Link
                        href={`/stats/rankings?type=${type}`}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-xl active:scale-95"
                    >
                        Resetear Filtros
                    </Link>
                </div>
            )}
        </div>
    );
}
