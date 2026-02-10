import { getData } from '@/lib/data';
import { PlayerSkillsEditor } from '@/components/players/PlayerSkillsEditor';
import { ArrowLeft, Activity, Trophy, UserMinus, UserX } from 'lucide-react';
import Link from 'next/link';
import { StatCard } from '@/components/stats/StatsComponents';
import { PlayerStreak, StreakResult } from '@/components/players/PlayerStreak';
import { EditablePlayerName } from '@/components/players/EditablePlayerName';
import { parseISO } from 'date-fns';

export default async function PlayerProfilePage({ params }: { params: { id: string } }) {
    // Await params for Next 15
    const { id } = await Promise.resolve(params);
    const { players, matches, participations, specialtyRules = [], traitRules = [] } = await getData();
    const player = players.find(p => p.id === id);

    if (!player) {
        return <div className="p-8 text-white">Jugador no encontrado</div>;
    }

    const playerParticipations = participations.filter(p => p.playerId === id);
    const isActive = player.isActive ?? true;

    // Stats Calculations
    const matchesAttended = playerParticipations.filter(p => p.status === 'Attended').length;
    const mvpCount = playerParticipations.filter(p => p.isMvp).length;
    const lateCancels = playerParticipations.filter(p => p.status === 'LateCancel').length;
    const absences = playerParticipations.filter(p => p.status === 'Absent').length;
    const matchesAzul = playerParticipations.filter(p => p.team === 'Azul').length;
    const matchesCeleste = playerParticipations.filter(p => p.team === 'Celeste').length;

    // Advanced Stats Calculations
    const attendedParticipations = playerParticipations.filter(p => p.status === 'Attended');

    let wins = 0;
    let losses = 0;
    let draws = 0;

    // Affinity Records: { [playerId]: { name, wins, losses, draws } }
    const affinityRecords: Record<string, { name: string; wins: number; losses: number; draws: number }> = {};

    attendedParticipations.forEach(p => {
        const match = matches.find(m => m.id === p.matchId);
        if (!match || !match.result) return;

        if (match.result === 'Empate') {
            draws++;
        } else if (match.result === p.team) {
            wins++;
        } else {
            losses++;
        }

        // Calculate Affinity (Teammates in this match)
        const matchParticipations = participations.filter(part => part.matchId === p.matchId && part.status === 'Attended');
        matchParticipations.forEach(mp => {
            if (mp.playerId === id) return; // Skip self
            if (mp.team !== p.team) return; // Only teammates

            if (!affinityRecords[mp.playerId]) {
                const teammateName = players.find(pl => pl.id === mp.playerId)?.name || 'Desconocido';
                affinityRecords[mp.playerId] = { name: teammateName, wins: 0, losses: 0, draws: 0 };
            }

            if (match.result === 'Empate') {
                affinityRecords[mp.playerId].draws++;
            } else if (match.result === p.team) {
                affinityRecords[mp.playerId].wins++;
            } else {
                affinityRecords[mp.playerId].losses++;
            }
        });
    });

    // Calculate Affinity (Socios/Némesis)
    const allTeammates = Object.entries(affinityRecords)
        .map(([pid, stats]) => ({ id: pid, ...stats }));

    // Top Affinities (Socios) - Must have at least 1 win OR be generally positive
    const sortedAllAffinity = [...allTeammates].sort((a, b) =>
        (b.wins - a.wins) || (b.draws - a.draws) || (a.losses - b.losses)
    );

    const topAffinity = sortedAllAffinity
        .filter(t => t.wins > 0 || t.draws > 0)
        .slice(0, 3);

    const topIds = new Set(topAffinity.map(t => t.id));

    // Worst Affinities (Némesis) - Must have at least 1 loss AND not be in Top
    const worstAffinity = allTeammates
        .filter(t => t.losses > 0 && !topIds.has(t.id))
        .sort((a, b) => (b.losses - a.losses) || (a.wins - b.wins))
        .slice(0, 3);

    const sortedParticipations = attendedParticipations
        .sort((a, b) => {
            const matchA = matches.find(m => m.id === a.matchId);
            const matchB = matches.find(m => m.id === b.matchId);
            return new Date(matchA?.date || 0).getTime() - new Date(matchB?.date || 0).getTime();
        });

    let currentMvpStreak = 0;
    let maxMvpStreak = 0;
    sortedParticipations.forEach(p => {
        if (p.isMvp) {
            currentMvpStreak++;
            if (currentMvpStreak > maxMvpStreak) maxMvpStreak = currentMvpStreak;
        } else {
            currentMvpStreak = 0;
        }
    });

    const mvpGames = playerParticipations.filter(p => p.isMvp);
    const mvpWins = mvpGames.filter(p => {
        const match = matches.find(m => m.id === p.matchId);
        return match?.result === p.team;
    }).length;
    const mvpWinRate = mvpGames.length > 0 ? (mvpWins / mvpGames.length) * 100 : 0;

    // Calculate Last 5 Streak
    const last5Streak: StreakResult[] = attendedParticipations
        .map(p => {
            const match = matches.find(m => m.id === p.matchId);
            return {
                date: match?.date || '',
                result: !match || !match.result ? null : (match.result === 'Empate' ? 'D' : (match.result === p.team ? 'W' : 'L'))
            };
        })
        .filter(p => p.result !== null)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5)
        .map(p => p.result as StreakResult)
        .reverse(); // Show chronological order in UI (oldest to newest)

    // Global Stats for Comparisons
    const totalGoals = playerParticipations.reduce((sum, p) => sum + (p.goals || 0), 0);
    const totalAssists = participations.reduce((sum, p) => sum + (p.assists || 0), 0);
    const totalAttendances = participations.filter(p => p.status === 'Attended').length;
    const globalAssistsPerMatch = totalAttendances > 0 ? totalAssists / totalAttendances : 0;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/players" className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white">
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <div className="flex flex-wrap items-center gap-3">
                        <EditablePlayerName id={player.id} name={player.name} isActive={isActive} />
                        <PlayerStreak streak={last5Streak} className="mt-1" />
                    </div>
                    <p className="text-slate-400 text-sm">Detalle de jugador</p>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <StatCard
                    title="Partidos"
                    value={matchesAttended}
                    icon={<Activity size={20} className="text-emerald-400" />}
                    subtext="Asistidos"
                />
                <StatCard
                    title="Goles"
                    value={totalGoals}
                    icon={<Activity size={20} className="text-orange-500" />}
                    subtext="Totales"
                />
                <StatCard
                    title="MVP"
                    value={mvpCount}
                    icon={<Trophy size={20} className="text-amber-400" />}
                    subtext="Premios"
                />
                <StatCard
                    title="Bajas Tardías"
                    value={lateCancels}
                    icon={<UserMinus size={20} className="text-orange-400" />}
                    subtext="Faltas avisadas tarde"
                />
                <StatCard
                    title="Ausencias"
                    value={absences}
                    icon={<UserX size={20} className="text-red-500" />}
                    subtext="No asistió sin aviso"
                />
            </div>

            {/* Skills & Profile */}
            <PlayerSkillsEditor
                player={player}
                allPlayers={players}
                stats={{
                    matchesAttended,
                    mvpCount,
                    totalPlayed: matchesAttended + lateCancels + absences,
                    matchesAzul,
                    matchesCeleste,
                    absences,
                    maxMvpStreak,
                    mvpWinRate,
                    assists: playerParticipations.reduce((acc, p) => acc + (p.assists || 0), 0),
                    globalAssistsPerMatch,
                    wins,
                    losses,
                    draws,
                    goals: totalGoals,
                    topAffinity,
                    worstAffinity,
                    allAffinity: sortedAllAffinity
                }}
                specialtyRules={specialtyRules}
                traitRules={traitRules}
            />
        </div>
    );
}
