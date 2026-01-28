'use server';

import { getData, updateParticipation } from '@/lib/data';
import { Player, PlayerStats, Team } from '@/types';
import { revalidatePath } from 'next/cache';

/**
 * Generates teams randomly but balanced by:
 * 1. Global Skill Score (Average)
 * 2. Affinities (Friends together)
 * 3. Conflicts (Rivals apart)
 */
export async function generateRandomTeamsAction(matchId: string) {
    const { players, participations } = await getData();

    // 1. Get current participations for this match
    const matchParticipations = participations.filter(p => p.matchId === matchId);

    // 2. Filter confirmed/attended players
    const playersToBalance = matchParticipations
        .filter(p => p.status === 'Confirmed' || p.status === 'Attended')
        .map(p => {
            const player = players.find(pl => pl.id === p.playerId);
            const skills = player?.skills || { ritmo: 50, tiros: 50, regates: 50, velocidad: 50, pases: 50 };
            const avg = (skills.ritmo + skills.tiros + skills.regates + skills.velocidad + skills.pases) / 5;

            return {
                ...p,
                name: player?.name || 'Unknown',
                avg,
                affinities: player?.affinities || [],
                conflicts: player?.conflicts || [],
                positions: player?.positions || []
            };
        });

    if (playersToBalance.length < 2) return { error: 'Se necesitan al menos 2 jugadores.' };

    const teamSize = Math.ceil(playersToBalance.length / 2);

    let bestTeams: { celeste: typeof playersToBalance, azul: typeof playersToBalance } | null = null;
    let bestScore = -Infinity;

    // Monte Carlo approach: Try many random distributions and pick the one with the highest quality score
    const iterations = 1000;

    for (let i = 0; i < iterations; i++) {
        // Shuffle
        const shuffled = [...playersToBalance].sort(() => Math.random() - 0.5);

        const celeste = shuffled.slice(0, teamSize);
        const azul = shuffled.slice(teamSize);

        const score = calculateDistributionScore(celeste, azul);

        if (score > bestScore) {
            bestScore = score;
            bestTeams = { celeste, azul };
        }
    }

    if (!bestTeams) return { error: 'No se pudo generar una formación adecuada.' };

    // 3. Update participations in data
    const updates = [
        ...bestTeams.celeste.map(p => ({ ...p, team: 'Celeste' as Team })),
        ...bestTeams.azul.map(p => ({ ...p, team: 'Azul' as Team }))
    ];

    for (const update of updates) {
        // Remove helper fields before saving
        const { name, avg, affinities, conflicts, positions, ...cleanParticipation } = update as any;
        await updateParticipation(cleanParticipation);
    }

    revalidatePath(`/matches/${matchId}`);
    return { success: true };
}

function calculateDistributionScore(team1: any[], team2: any[]) {
    // A. Skill Balance (Weight: High)
    const skill1 = team1.reduce((sum, p) => sum + p.avg, 0);
    const skill2 = team2.reduce((sum, p) => sum + p.avg, 0);
    const balanceDiff = Math.abs(skill1 - skill2);

    // Penalty for skill difference
    let score = -balanceDiff * 2;

    // B. Affinities (Weight: Medium)
    // +10 points for each pair of friends on the same team
    const team1Ids = new Set(team1.map(p => p.playerId));
    const team2Ids = new Set(team2.map(p => p.playerId));

    const checkRelationships = (team: any[], otherTeamIds: Set<string>, sameTeamIds: Set<string>) => {
        let relScore = 0;
        team.forEach(p => {
            // Affinities: Friends on same team
            p.affinities.forEach((friendId: string) => {
                if (sameTeamIds.has(friendId)) relScore += 10;
            });
            // Conflicts: Rivals on same team (Penalty)
            p.conflicts.forEach((rivalId: string) => {
                if (sameTeamIds.has(rivalId)) relScore -= 15;
            });
        });
        return relScore;
    };

    score += checkRelationships(team1, team2Ids, team1Ids);
    score += checkRelationships(team2, team1Ids, team2Ids);

    // C. Position Balance (Weight: High for Goalies)
    const countPos = (team: any[]) => {
        const counts: Record<string, number> = { 'Arquero': 0, 'Defensor': 0, 'Mediocampista': 0, 'Delantero': 0 };
        team.forEach(p => {
            p.positions.forEach((pos: string, idx: number) => {
                if (counts.hasOwnProperty(pos)) {
                    // Weight: Primary (1.0), Secondary (0.4)
                    const weight = idx === 0 ? 1.0 : 0.4;
                    counts[pos] += weight;
                }
            });
        });
        return counts;
    };

    const counts1 = countPos(team1);
    const counts2 = countPos(team2);

    // Goalie Rule: Huge penalty if mismatch in goalkeepers
    const goalieDiff = Math.abs(counts1['Arquero'] - counts2['Arquero']);
    if (goalieDiff > 0) score -= 150 * goalieDiff; // Increased from 100

    // CRITICAL: Penalty for 0 goalkeeper weight on either team if there's available weight in playersToBalance
    // Total weight in pool:
    const totalGoalieWeight = team1.reduce((sum, p) => sum + (p.positions[0] === 'Arquero' ? 1.0 : p.positions.includes('Arquero') ? 0.4 : 0), 0) +
        team2.reduce((sum, p) => sum + (p.positions[0] === 'Arquero' ? 1.0 : p.positions.includes('Arquero') ? 0.4 : 0), 0);

    if (totalGoalieWeight >= 0.4) {
        if (counts1['Arquero'] === 0) score -= 300;
        if (counts2['Arquero'] === 0) score -= 300;
    }

    // Defense/Mid/Attack balance
    const defDiff = Math.abs(counts1['Defensor'] - counts2['Defensor']);
    const midDiff = Math.abs(counts1['Mediocampista'] - counts2['Mediocampista']);
    const fwdDiff = Math.abs(counts1['Delantero'] - counts2['Delantero']);

    score -= (defDiff + midDiff + fwdDiff) * 5;

    // D. Specific Formation Targets (Weight: Medium)
    // Favored formations: 1-2-1-2 or 1-2-2-1 (Total 6 per team)
    const checkFormation = (counts: Record<string, number>) => {
        // More lenient on Goalie check here since we have a dedicated penalty above
        const hasGoalie = counts['Arquero'] >= 0.35;
        const is1212 = hasGoalie && counts['Defensor'] >= 1.4 && counts['Mediocampista'] >= 0.7 && counts['Delantero'] >= 1.4;
        const is1221 = hasGoalie && counts['Defensor'] >= 1.4 && counts['Mediocampista'] >= 1.4 && counts['Delantero'] >= 0.7;
        return is1212 || is1221;
    };

    if (!checkFormation(counts1)) score -= 20;
    if (!checkFormation(counts2)) score -= 20;

    return score;
}
