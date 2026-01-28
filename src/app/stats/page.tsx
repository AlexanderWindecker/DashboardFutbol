import { getData, getSettings } from '@/lib/data';
import { Player, PlayerStats, Match } from '@/types';
import { StatsPageView } from '@/components/stats/StatsPageView';

export const dynamic = 'force-dynamic';

function calculateStats(players: Player[], matches: Match[], participations: PlayerStats[]) {
    // Filter participations to only include those from the provided matches
    const matchIds = new Set(matches.map(m => m.id));
    const relevantParticipations = participations.filter(p => matchIds.has(p.matchId));

    // Team Wins
    const celesteWins = matches.filter(m => m.result === 'Celeste').length;
    const azulWins = matches.filter(m => m.result === 'Azul').length;

    const playerStats = players.map(player => {
        const playerParticipations = relevantParticipations.filter(p => p.playerId === player.id);

        // Attendance
        const attendedStats = playerParticipations.filter(p =>
            p.status === 'Attended' ||
            (p.goals || 0) > 0 ||
            p.isMvp ||
            !!p.tacticalRole
        );
        const matchesAttended = attendedStats.length;

        // Absences
        const absences = playerParticipations.filter(p => p.status === 'Absent' || p.status === 'LateCancel').length;

        // MVPs
        const mvpCount = attendedStats.filter(p => p.isMvp).length;

        // Wins
        const wins = attendedStats.filter(p => {
            const match = matches.find(m => m.id === p.matchId);
            if (!match || !match.result || match.result === 'Empate') return false;
            return match.result === p.team;
        }).length;

        // Team Affinity
        const celesteApps = attendedStats.filter(p => p.team === 'Celeste').length;
        const azulApps = attendedStats.filter(p => p.team === 'Azul').length;
        const mainTeam = celesteApps > azulApps ? 'Celeste' : (azulApps > celesteApps ? 'Azul' : 'Neutro');

        // Goals
        const goals = playerParticipations.reduce((sum, p) => sum + (p.goals || 0), 0);

        return {
            ...player,
            matchesAttended,
            absences,
            mvpCount,
            wins,
            winRate: matchesAttended >= 3 ? Math.round((wins / matchesAttended) * 100) : (matchesAttended > 0 ? Math.round((wins / matchesAttended) * 100) : 0),
            celesteApps,
            azulApps,
            mainTeam,
            goals
        };
    });

    return { playerStats, celesteWins, azulWins };
}

export default async function StatsPage({ searchParams }: { searchParams: { seasonId?: string } }) {
    const data = await getData();
    const settings = await getSettings();
    const seasons = data.seasons || [];
    const activeSeasonId = data.activeSeasonId;

    const selectedSeasonId = searchParams.seasonId || activeSeasonId;

    // Filter data by season
    const filteredMatches = selectedSeasonId
        ? data.matches.filter(m => m.seasonId === selectedSeasonId)
        : data.matches;

    const calculatedStats = {
        ...calculateStats(data.players, filteredMatches, data.participations),
        filteredMatches
    };

    return (
        <StatsPageView
            data={data}
            settings={settings}
            seasons={seasons}
            activeSeasonId={activeSeasonId}
            calculatedStats={calculatedStats}
        />
    );
}
