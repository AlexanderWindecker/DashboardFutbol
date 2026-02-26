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
    const isGoalType = type === 'goals';

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


            {/* Rankings List - Table for Skills, Cards for others */}
            {isSkillsRanking ? (
                <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-x-auto shadow-2xl">
                    <table className="w-full text-left text-sm min-w-[900px]">
                        <thead className="bg-slate-950/80 text-slate-500 border-b border-slate-800 uppercase text-[10px] font-black tracking-widest">
                            <tr>
                                <th className="p-4 w-12 text-center">#</th>
                                <th className="p-4">Jugador</th>
                                <th className="p-4 text-center border-l border-slate-800/50 bg-sky-500/5 min-w-[100px]">
                                    {isArqueroView ? 'REF' : 'RIT'}
                                </th>
                                <th className="p-4 text-center bg-orange-500/5 min-w-[100px]">
                                    {isArqueroView ? 'UBI' : 'TIR'}
                                </th>
                                <th className="p-4 text-center bg-emerald-500/5 min-w-[100px]">
                                    {isArqueroView ? 'DEF' : 'PAS'}
                                </th>
                                <th className="p-4 text-center bg-purple-500/5 min-w-[100px]">
                                    {isArqueroView ? 'SAQ' : 'REG'}
                                </th>
                                <th className="p-4 text-center bg-rose-500/5 min-w-[100px]">
                                    {isArqueroView ? 'SEG' : 'VEL'}
                                </th>
                                <th className="p-4 text-right font-black text-slate-400 border-l border-slate-800/50">Media</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {data.map((p, i) => {
                                return (
                                    <tr key={p.id} className="hover:bg-slate-800/30 transition-all group">
                                        <td className="p-4 text-center text-slate-600 font-mono font-bold">{i + 1}</td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 font-bold border border-slate-700">
                                                    {p.name.charAt(0)}
                                                </div>
                                                <span className="font-bold text-white whitespace-nowrap">{p.name}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 border-l border-slate-800/30 bg-sky-500/[0.02]">
                                            <SkillBar label={p.isUsingGoalkeeperStats ? "REF" : "RIT"} value={p.skillDetails.pac} colorClass="bg-sky-400 shadow-sky-500/50" />
                                        </td>
                                        <td className="p-4 bg-orange-500/[0.02]">
                                            <SkillBar label={p.isUsingGoalkeeperStats ? "UBI" : "TIR"} value={p.skillDetails.sho} colorClass="bg-orange-400 shadow-orange-500/50" />
                                        </td>
                                        <td className="p-4 bg-emerald-500/[0.02]">
                                            <SkillBar label={p.isUsingGoalkeeperStats ? "DEF" : "PAS"} value={p.skillDetails.pas} colorClass="bg-emerald-400 shadow-emerald-500/50" />
                                        </td>
                                        <td className="p-4 bg-purple-500/[0.02]">
                                            <SkillBar label={p.isUsingGoalkeeperStats ? "SAQ" : "REG"} value={p.skillDetails.dri} colorClass="bg-purple-400 shadow-purple-500/50" />
                                        </td>
                                        <td className="p-4 bg-rose-500/[0.02]">
                                            <SkillBar label={p.isUsingGoalkeeperStats ? "SEG" : "VEL"} value={p.skillDetails.def} colorClass="bg-rose-400 shadow-rose-500/50" />
                                        </td>
                                        <td className="p-4 text-right border-l border-slate-800/30">
                                            <RatingBadge score={p.skillsAverage} />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="space-y-3">
                    {data.map((p, i) => {

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

                                <div className="flex items-center gap-4 shrink-0">
                                    {(isMvpType || isGoalType) && (
                                        <div className="flex flex-col items-end">
                                            <span className="text-[10px] text-slate-500 font-bold uppercase">Partidos</span>
                                            <span className="text-sm font-bold text-slate-300">{p.matchesAttended}</span>
                                        </div>
                                    )}
                                    {isGoalType && (
                                        <div className="flex flex-col items-end mr-2">
                                            <span className="text-[10px] text-slate-500 font-bold uppercase">Promedio</span>
                                            <span className="text-sm font-bold text-slate-300">
                                                {p.matchesAttended > 0 ? (p.goals / p.matchesAttended).toFixed(2) : '0.00'}
                                            </span>
                                        </div>
                                    )}
                                    <RatingBadge score={p[valueKey as keyof typeof p] as number} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

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
