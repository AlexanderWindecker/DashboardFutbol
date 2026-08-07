import { getData } from '@/lib/data';
import { PlayerSkillsEditor } from '@/components/players/PlayerSkillsEditor';
import { PlayerSeasonAwards } from '@/components/players/PlayerSeasonAwards';
import { ArrowLeft, Activity, Trophy, UserMinus, UserX, Sword, Award, Shield, Volleyball } from 'lucide-react';
import Link from 'next/link';
import { StatCard } from '@/components/stats/StatsComponents';
import { PlayerStreak, StreakResult } from '@/components/players/PlayerStreak';
import { EditablePlayerName } from '@/components/players/EditablePlayerName';
import { Button } from '@/components/ui/Button';

export default async function PlayerProfilePage({ params }: { params: { id: string } }) {
    // Await params for Next 15
    const { id } = await Promise.resolve(params);
    const { players, matches, participations, seasons = [], specialtyRules = [], traitRules = [] } = await getData();
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

    // Calculate seasons top goalscorers to find Botines de Oro
    const seasonWinners = seasons.map(season => {
        const seasonMatches = matches.filter(m => m.seasonId === season.id);
        const seasonMatchIds = new Set(seasonMatches.map(m => m.id));
        
        // Sum goals for each player in this season
        const playerGoals: Record<string, number> = {};
        participations
            .filter(p => seasonMatchIds.has(p.matchId) && p.status === 'Attended')
            .forEach(p => {
                playerGoals[p.playerId] = (playerGoals[p.playerId] || 0) + (p.goals || 0);
            });
            
        let topScorerId = '';
        let maxGoals = 0;
        Object.entries(playerGoals).forEach(([pid, g]) => {
            if (g > maxGoals) {
                maxGoals = g;
                topScorerId = pid;
            }
        });
        
        return {
            seasonId: season.id,
            seasonName: season.name,
            topScorerId: maxGoals > 0 ? topScorerId : null,
            maxGoals
        };
    });

    const balonDeOroSeasons = seasons
        .map(season => {
            const seasonMatchIds = new Set(matches.filter(m => m.seasonId === season.id).map(m => m.id));
            const seasonParticipations = participations.filter(p => seasonMatchIds.has(p.matchId) && p.status === 'Attended');

            const playersStats = players.map(pl => {
                const playerSeasonParts = seasonParticipations.filter(p => p.playerId === pl.id);
                const matchesAttendedSeason = playerSeasonParts.length;
                if (matchesAttendedSeason === 0) return null;

                const goalsSeason = playerSeasonParts.reduce((sum, p) => sum + (p.goals || 0), 0);
                const winsSeason = playerSeasonParts.filter(p => {
                    const match = matches.find(m => m.id === p.matchId);
                    return match && match.result === p.team;
                }).length;
                const gkAwardsSeason = playerSeasonParts.filter(p => p.isBestGoalkeeper).length;
                const absencesSeason = participations.filter(p => seasonMatchIds.has(p.matchId) && p.playerId === pl.id && (p.status === 'Absent' || p.status === 'LateCancel')).length;

                const skill = pl.skills as any || {};
                const isGk = pl.positions && pl.positions.length === 1 && pl.positions[0] === 'Arquero';
                const skillsAverageSeason = isGk
                    ? Math.round(((skill.reflejos || 50) + (skill.posicionamiento || 50) + (skill.estirada || 50) + (skill.saque || 50) + (skill.seguridad || 50)) / 5)
                    : Math.round(((skill.ritmo || 50) + (skill.tiros || 50) + (skill.pases || 50) + (skill.regates || 50) + (skill.velocidad || 50)) / 5);

                return {
                    playerId: pl.id,
                    matchesAttendedSeason,
                    goalsSeason,
                    winsSeason,
                    gkAwardsSeason,
                    absencesSeason,
                    skillsAverageSeason
                };
            }).filter(Boolean) as Array<{
                playerId: string;
                matchesAttendedSeason: number;
                goalsSeason: number;
                winsSeason: number;
                gkAwardsSeason: number;
                absencesSeason: number;
                skillsAverageSeason: number;
            }>;

            const maxSkill = Math.max(...playersStats.map(s => s.skillsAverageSeason), 1);
            const maxWins = Math.max(...playersStats.map(s => s.winsSeason), 1);
            const maxAttend = Math.max(...playersStats.map(s => s.matchesAttendedSeason), 1);
            const maxGoals = Math.max(...playersStats.map(s => s.goalsSeason), 1);
            const maxGkAward = Math.max(...playersStats.map(s => s.gkAwardsSeason), 1);
            const maxAbs = Math.max(...playersStats.map(s => s.absencesSeason), 1);

            const scored = playersStats.map(s => ({
                playerId: s.playerId,
                total: Math.round(
                    (s.skillsAverageSeason / maxSkill) * 35 +
                    (s.winsSeason / maxWins) * 25 +
                    (s.matchesAttendedSeason / maxAttend) * 15 +
                    (s.goalsSeason / maxGoals) * 15 +
                    (s.gkAwardsSeason / maxGkAward) * 10 -
                    (s.absencesSeason / maxAbs) * 10
                )
            }));

            const winner = [...scored].sort((a, b) => b.total - a.total)[0];
            return { seasonId: season.id, seasonName: season.name, winnerId: winner?.playerId || null };
        })
        .filter(w => w.winnerId === player.id)
        .map(w => w.seasonName);

    const guanteDeOroSeasons = seasons
        .map(season => {
            const seasonMatchIds = new Set(matches.filter(m => m.seasonId === season.id).map(m => m.id));
            const gkCounts = players.map(pl => {
                const count = participations.filter(p => p.playerId === pl.id && seasonMatchIds.has(p.matchId) && p.status === 'Attended' && p.isBestGoalkeeper).length;
                return { playerId: pl.id, count };
            });

            const winner = [...gkCounts].sort((a, b) => b.count - a.count)[0];
            return { seasonId: season.id, seasonName: season.name, winnerId: winner?.count ? winner.playerId : null };
        })
        .filter(w => w.winnerId === player.id)
        .map(w => w.seasonName);

    const botinesDeOroSeasons = seasonWinners
        .filter(w => w.topScorerId === player.id)
        .map(w => w.seasonName);

    const bestGkCount = playerParticipations.filter(p => p.isBestGoalkeeper).length;

    const isPrimaryGoalkeeper = player.positions?.includes('Arquero');
    const goalkeeperStatus = (player.skills as any)?.goalkeeperStatus || 'Debutante de Tres Palos 🧤';

    const awardItems: {
        key: 'balon' | 'botin' | 'guante';
        label: string;
        seasons: string[];
        icon: JSX.Element;
    }[] = [
        {
            key: 'balon',
            label: 'Balón de Oro',
            seasons: balonDeOroSeasons,
            icon: <Award size={20} />,
        },
        {
            key: 'botin',
            label: 'Botín de Oro',
            seasons: botinesDeOroSeasons,
            icon: <Volleyball size={20} />,
        },
        ...(isPrimaryGoalkeeper ? [{
            key: 'guante',
            label: 'Guante de Oro',
            seasons: guanteDeOroSeasons,
            icon: <Shield size={20} />,
        }] : []),
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4 w-full">
                    <Link href="/players" className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white shrink-0">
                        <ArrowLeft size={20} />
                    </Link>
                    <div className="min-w-0 flex-1 space-y-3">
                        <div className="flex flex-wrap items-center gap-3">
                            <EditablePlayerName id={player.id} name={player.name} isActive={isActive} />
                            <PlayerSeasonAwards awards={awardItems} iconOnly />
                            {isPrimaryGoalkeeper && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-sky-600/30 to-blue-600/30 text-sky-400 border border-sky-500/30 shadow-[0_0_10px_rgba(56,189,248,0.15)] animate-pulse">
                                    {goalkeeperStatus}
                                </span>
                            )}
                        </div>
                        <p className="text-slate-400 text-sm">Detalle de jugador</p>
                        <PlayerStreak streak={last5Streak} className="mt-2" />
                    </div>
                </div>
                <div className="flex shrink-0">
                    <Link href={`/players/${player.id}/matchups`} className="w-full sm:w-auto">
                        <Button variant="outline" className="w-full border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 gap-2 h-10 px-4">
                            <Sword size={16} />
                            <span>Historial vs Todos</span>
                        </Button>
                    </Link>
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
                    title="Guante de Oro"
                    value={bestGkCount}
                    icon={<Shield size={20} className="text-cyan-400" />}
                    subtext="Mejor arquero"
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
                    allAffinity: sortedAllAffinity,
                }}
                specialtyRules={specialtyRules}
                traitRules={traitRules}
            />
        </div>
    );
}
