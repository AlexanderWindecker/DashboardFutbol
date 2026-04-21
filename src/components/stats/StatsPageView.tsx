'use client';

import { useState } from 'react';
import { Player, PlayerStats, Match, AppSettings, Season } from '@/types';
import { Trophy, TrendingUp, Activity, Award, UserMinus, Shield, Eye, EyeOff, Zap } from 'lucide-react';
import { RankingCard, StatCard } from '@/components/stats/StatsComponents';
import { TeamNameEditor } from '@/components/stats/TeamNameEditor';
import { SeasonSelector } from '@/components/stats/SeasonSelector';
import { cn } from '@/lib/utils';

interface StatsPageViewProps {
    data: {
        players: Player[];
        matches: Match[];
        participations: PlayerStats[];
    };
    settings: AppSettings;
    seasons: Season[];
    activeSeasonId?: string;
    calculatedStats: {
        playerStats: any[];
        celesteWins: number;
        azulWins: number;
        captain1Wins: number;
        captain2Wins: number;
        filteredMatches: Match[];
    };
}

export function StatsPageView({ data, settings, seasons, activeSeasonId, calculatedStats }: StatsPageViewProps) {
    const [privacyMode, setPrivacyMode] = useState(false);

    const { playerStats, celesteWins, azulWins, captain1Wins, captain2Wins, filteredMatches } = calculatedStats;

    // Get captain names
    const captain1 = data.players.find(p => p.id === settings.captain1Id);
    const captain2 = data.players.find(p => p.id === settings.captain2Id);
    const captain1Name = captain1?.name || 'Capitán 1';
    const captain2Name = captain2?.name || 'Capitán 2';

    // Mask player names in the stats array
    const displayedStats = privacyMode
        ? playerStats.map((p, index) => ({
            ...p,
            name: `Jugador ${index + 1}`
        }))
        : playerStats;

    const topAttendance = [...displayedStats].sort((a, b) => b.matchesAttended - a.matchesAttended).slice(0, 5);
    const topMvp = [...displayedStats].sort((a, b) => b.mvpCount - a.mvpCount).slice(0, 5);
    const topWinners = [...displayedStats].filter(p => p.matchesAttended >= 3).sort((a, b) => b.winRate - a.winRate).slice(0, 5);
    const topAbsences = [...displayedStats].sort((a, b) => b.absences - a.absences).slice(0, 5);
    const topScorers = [...displayedStats].sort((a, b) => b.goals - a.goals).slice(0, 5);
    const topSkills = [...displayedStats].sort((a, b) => b.skillsAverage - a.skillsAverage).slice(0, 5);

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold text-white">Estadísticas</h1>
                        {/* Privacy Toggle */}
                        <button
                            onClick={() => setPrivacyMode(!privacyMode)}
                            className="p-2 rounded-full hover:bg-slate-800 text-slate-500 hover:text-white transition-colors"
                            title={privacyMode ? "Desactivar Modo Privacidad" : "Activar Modo Privacidad"}
                        >
                            {privacyMode ? <EyeOff size={20} className="text-indigo-400" /> : <Eye size={20} />}
                        </button>
                    </div>
                    <p className="text-slate-400">Rendimiento individual y colectivo.</p>
                </div>
                <SeasonSelector seasons={seasons} activeSeasonId={activeSeasonId} />
            </div>

            {/* Team Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><Shield size={100} className="text-sky-500" /></div>
                    <TeamNameEditor
                        teamKey="team1Name"
                        currentName={settings?.team1Name || 'Celeste'}
                        defaultName="Celeste"
                        settings={settings}
                        colorClass="text-sky-400"
                    />
                    <p className="text-4xl font-bold text-white">{celesteWins} <span className="text-lg text-slate-500 font-normal">Victorias</span></p>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><Shield size={100} className="text-blue-600" /></div>
                    <TeamNameEditor
                        teamKey="team2Name"
                        currentName={settings?.team2Name || 'Azul'}
                        defaultName="Azul"
                        settings={settings}
                        colorClass="text-blue-400"
                    />
                    <p className="text-4xl font-bold text-white">{azulWins} <span className="text-lg text-slate-500 font-normal">Victorias</span></p>
                </div>
            </div>

            {/* Superclasico History Section */}
            {(captain1Wins > 0 || captain2Wins > 0) && (
                <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500/50 to-amber-600/50 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                    <div className="relative bg-slate-900 border border-amber-500/20 rounded-xl p-6 overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                            <Zap size={120} className="text-amber-500" fill="currentColor" />
                        </div>

                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="space-y-1">
                                <h2 className="text-lg font-black italic text-amber-500 uppercase flex items-center gap-2 tracking-tight">
                                    <Zap size={18} fill="currentColor" className="animate-pulse" />
                                    Historial Súperclásicos
                                </h2>
                                <p className="text-xs text-slate-400">Paternidad histórica entre Capitanes.</p>
                            </div>

                            <div className="flex items-center gap-8 justify-center md:justify-end">
                                <div className="text-center group/team">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 group-hover/team:text-amber-400 transition-colors">
                                        {captain1Name}
                                    </p>
                                    <p className="text-4xl font-black text-white">{captain1Wins}</p>
                                </div>
                                <div className="h-12 w-px bg-slate-800 rotate-12"></div>
                                <div className="text-center group/team">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 group-hover/team:text-amber-400 transition-colors">
                                        {captain2Name}
                                    </p>
                                    <p className="text-4xl font-black text-white">{captain2Wins}</p>
                                </div>
                            </div>
                        </div>

                        {/* Paternidad Indicator */}
                        <div className="mt-6 pt-4 border-t border-slate-800/50 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Estado de Paternidad:</span>
                                <span className={cn(
                                    "text-xs font-bold px-2 py-0.5 rounded-full",
                                    captain1Wins > captain2Wins ? "bg-amber-500/10 text-amber-500" :
                                        captain2Wins > captain1Wins ? "bg-amber-500/10 text-amber-500" :
                                            "bg-slate-800 text-slate-400"
                                )}>
                                    {captain1Wins > captain2Wins ? `+${captain1Wins - captain2Wins} ${captain1Name}` :
                                        captain2Wins > captain1Wins ? `+${captain2Wins - captain1Wins} ${captain2Name}` :
                                            "Empate Técnico"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:grid-cols-4">
                <StatCard
                    title="Partidos"
                    value={filteredMatches.length}
                    icon={<Activity size={20} className="text-slate-400" />}
                />
                <StatCard
                    title="Jugadores"
                    value={data.players.length}
                    icon={<TrendingUp size={20} className="text-slate-400" />}
                />
                <StatCard
                    title="Prom. Asistencia"
                    value={filteredMatches.length > 0 ? Math.round(data.participations.filter(p => p.status === 'Attended' && filteredMatches.some(m => m.id === p.matchId)).length / filteredMatches.length) : 0}
                    icon={<Activity size={20} className="text-slate-400" />}
                    subtext="Jugadores por partido"
                />
            </div>

            <h2 className="text-xl font-bold text-white mt-8">Rankings Individuales</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <RankingCard
                    title="Más Comprometido"
                    icon={<Activity size={18} className="text-emerald-400" />}
                    data={topAttendance}
                    valueKey="matchesAttended"
                    label="Partidos"
                    linkHref="/stats/rankings?type=attendance"
                />
                <RankingCard
                    title="Rating Global"
                    icon={<TrendingUp size={18} className="text-indigo-400" />}
                    data={topSkills}
                    valueKey="skillsAverage"
                    label="Rating"
                    linkHref="/stats/rankings?type=skills_average"
                />
                <RankingCard
                    title="Goleadores"
                    icon={<Activity size={18} className="text-orange-500" />}
                    data={topScorers}
                    valueKey="goals"
                    label="Goles"
                    linkHref="/stats/rankings?type=goals"
                />
                <RankingCard
                    title="Más MVP"
                    icon={<Trophy size={18} className="text-amber-400" />}
                    data={topMvp}
                    valueKey="mvpCount"
                    label="MVPs"
                    linkHref="/stats/rankings?type=mvp"
                />
                <RankingCard
                    title="Más Ganador"
                    icon={<Award size={18} className="text-indigo-400" />}
                    data={topWinners}
                    valueKey="winRate"
                    label="Win Rate"
                    suffix="%"
                    linkHref="/stats/rankings?type=winners"
                />
                <RankingCard
                    title="Más Faltador"
                    icon={<UserMinus size={18} className="text-red-400" />}
                    data={topAbsences}
                    valueKey="absences"
                    label="Faltas"
                    linkHref="/stats/rankings?type=absences"
                />
            </div>
        </div>
    );
}
