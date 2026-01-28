'use client';

import { useState } from 'react';
import { Player, PlayerStats, Match, AppSettings, Season } from '@/types';
import { Trophy, TrendingUp, Activity, Award, UserMinus, Shield, Eye, EyeOff } from 'lucide-react';
import { RankingCard, StatCard } from '@/components/stats/StatsComponents';
import { TeamNameEditor } from '@/components/stats/TeamNameEditor';
import { SeasonSelector } from '@/components/stats/SeasonSelector';

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
        filteredMatches: Match[];
    };
}

export function StatsPageView({ data, settings, seasons, activeSeasonId, calculatedStats }: StatsPageViewProps) {
    const [privacyMode, setPrivacyMode] = useState(false);

    const { playerStats, celesteWins, azulWins, filteredMatches } = calculatedStats;

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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <RankingCard
                    title="Más Comprometido"
                    icon={<Activity size={18} className="text-emerald-400" />}
                    data={topAttendance}
                    valueKey="matchesAttended"
                    label="Partidos"
                    linkHref="/stats/rankings?type=attendance"
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
