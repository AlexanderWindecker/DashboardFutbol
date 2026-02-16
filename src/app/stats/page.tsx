import { getData, getSettings } from '@/lib/data';
import { Player, PlayerStats, Match } from '@/types';
import { StatsPageView } from '@/components/stats/StatsPageView';
import { AppSettings } from '@/types';

export const dynamic = 'force-dynamic';

function calculateStats(players: Player[], matches: Match[], participations: PlayerStats[], settings?: AppSettings) {
    // Filter participations to only include those from the provided matches
    const matchIds = new Set(matches.map(m => m.id));
    const relevantParticipations = participations.filter(p => matchIds.has(p.matchId));

    // Team Wins
    const celesteWins = matches.filter(m => m.result === 'Celeste').length;
    const azulWins = matches.filter(m => m.result === 'Azul').length;

    const playerStats = players.map(player => {
        const playerParticipations = relevantParticipations.filter(p => p.playerId === player.id);

        const attendedStats = playerParticipations.filter(p => p.status === 'Attended');
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

        // Skills Average (Ficha)
        const s = player.skills || { ritmo: 50, tiros: 50, pases: 50, regates: 50, velocidad: 50 };
        const positions = player.positions || [];
        const isPureGoalkeeper = positions.length === 1 && positions[0] === 'Arquero';

        let skillsAverage = 0;
        if (isPureGoalkeeper) {
            const skillValues = [
                s.reflejos || 50,
                s.posicionamiento || 50,
                s.estirada || 50,
                s.saque || 50,
                s.seguridad || 50
            ];
            skillsAverage = Math.round(skillValues.reduce((a, b) => a + b, 0) / 5);
        } else {
            const skillValues = [
                s.ritmo || 50,
                s.tiros || 50,
                s.pases || 50,
                s.regates || 50,
                s.velocidad || 50
            ];
            skillsAverage = Math.round(skillValues.reduce((a, b) => a + b, 0) / 5);
        }

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
            goals,
            skillsAverage
        };
    });

    // Superclasico Wins by Captain
    const superMatches = matches.filter(m => m.isSuperclasico);
    const captain1Id = settings?.captain1Id;
    const captain2Id = settings?.captain2Id;

    let captain1Wins = 0;
    let captain2Wins = 0;

    if (captain1Id && captain2Id) {
        superMatches.forEach(m => {
            if (!m.result || m.result === 'Empate') return;

            const p1 = participations.find(p => p.matchId === m.id && p.playerId === captain1Id);
            const p2 = participations.find(p => p.matchId === m.id && p.playerId === captain2Id);

            if (p1 && p1.team === m.result) captain1Wins++;
            if (p2 && p2.team === m.result) captain2Wins++;
        });
    }

    return { playerStats, celesteWins, azulWins, captain1Wins, captain2Wins };
}

export default async function StatsPage({ searchParams }: { searchParams: Promise<{ seasonId?: string }> }) {
    const params = await searchParams;
    const data = await getData();
    const settings = await getSettings();
    const seasons = data.seasons || [];
    const activeSeasonId = data.activeSeasonId;

    const selectedSeasonId = params.seasonId || activeSeasonId;

    // Filter data by season
    const filteredMatches = selectedSeasonId
        ? data.matches.filter(m => m.seasonId === selectedSeasonId)
        : data.matches;

    const calculatedStats = {
        ...calculateStats(data.players, filteredMatches, data.participations, settings),
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
