import { Match, PlayerStats } from '@/types';

// Types and Interfaces
export interface SkillDeltas {
    ritmo: number;
    velocidad: number;
    tiros: number;
    regates: number;
    pases: number;
    reflejos?: number;
    posicionamiento?: number;
    estirada?: number;
    saque?: number;
    seguridad?: number;
}

function applyDiminishingReturns(oldVal: number, newVal: number): number {
    if (newVal <= oldVal) return newVal; // only applies to buffs
    if (oldVal >= 85) {
        return oldVal + ((newVal - oldVal) * 0.5);
    } else if (newVal > 85) {
        return oldVal + (85 - oldVal) + ((newVal - 85) * 0.5);
    }
    return newVal;
}

export interface PlayerSkillsData {
    ritmo: number;
    velocidad: number;
    tiros: number;
    regates: number;
    pases: number;
    deltas?: SkillDeltas; // Last match difference
    streak?: number;     // Consecutive matches played
    winStreak?: number;  // Consecutive matches won
    goalDrought?: number;// Consecutive matches without scoring
    matchesPlayed?: number; 
    goals?: number;
    mvps?: number;
    reflejos?: number;
    posicionamiento?: number;
    estirada?: number;
    saque?: number;
    seguridad?: number;
}

export interface ParticipationUpdate {
    matchId: string;
    playerId: string;
    skillReasons: string[];
}

/**
 * Recalculates all players' skills across an array of sequential matches.
 */
export function recalculateAllSkills(
    allPlayers: any[],
    allMatches: any[],
    allParticipations: any[]
): { 
    playerStats: Map<string, PlayerSkillsData>, 
    participationUpdates: ParticipationUpdate[] 
} {
    const participationUpdates: ParticipationUpdate[] = [];
    
    const playerStats = new Map<string, PlayerSkillsData>();

    // Initialize all players at 50
    for (const p of allPlayers) {
        // Parse existing or use default 50
        playerStats.set(p.id, {
            ritmo: 50,
            velocidad: 50,
            tiros: 50,
            regates: 50,
            pases: 50,
            deltas: { ritmo: 0, velocidad: 0, tiros: 0, regates: 0, pases: 0 },
            streak: 0,
            winStreak: 0,
            goalDrought: 0,
            matchesPlayed: 0,
            goals: 0,
            mvps: 0,
            reflejos: p.skills?.reflejos || 50,
            posicionamiento: p.skills?.posicionamiento || 50,
            estirada: p.skills?.estirada || 50,
            saque: p.skills?.saque || 50,
            seguridad: p.skills?.seguridad || 50
        });
    }

    // Process each match chronologically
    for (const match of allMatches) {
        const matchParts = allParticipations.filter(p => p.matchId === match.id);
        
        let maxGoals = 0;
        const matchAttended = matchParts.filter(p => p.status === 'Attended');
        const teamGoals: Record<string, number> = {};

        for (const p of matchAttended) {
            if ((p.goals || 0) > maxGoals) maxGoals = p.goals || 0;
            if (p.team) {
                teamGoals[p.team] = (teamGoals[p.team] || 0) + (p.goals || 0);
            }
        }

        const topScorers = matchAttended.filter(p => (p.goals || 0) === maxGoals && maxGoals > 0);
        
        const teamsInMatch = Object.keys(teamGoals).filter(t => teamGoals[t] > 0 || matchAttended.some(m => m.team === t));
        const goalDiffs: Record<string, number> = {};
        
        if (teamsInMatch.length === 2) {
            goalDiffs[teamsInMatch[0]] = teamGoals[teamsInMatch[0]] - teamGoals[teamsInMatch[1]];
            goalDiffs[teamsInMatch[1]] = teamGoals[teamsInMatch[1]] - teamGoals[teamsInMatch[0]];
        }

        for (const p of matchParts) {
            const stats = playerStats.get(p.playerId);
            if (!stats) continue;

            const prev = { ...stats };
            const reasons: string[] = [];

            if (p.status === 'Attended') {
                stats.matchesPlayed = (stats.matchesPlayed || 0) + 1;
                stats.streak = (stats.streak || 0) + 1;
                
                // 1. Presencia (Entrenamiento base del partido)
                stats.ritmo += 0.2; stats.velocidad += 0.1; stats.pases += 0.1; stats.regates += 0.1;
                reasons.push("Asistencia +0.2 Ritmo/Físico");

                // Determine Goal Multiplier based on match mode
                let goalMultiplier = 0.5;
                if (match.mode === '7v7') goalMultiplier = 0.3;
                else if (match.mode === '6v6' || match.mode === '5v5') goalMultiplier = 0.2;

                // 2. Goles y Sequía (Pólvora Mojada)
                if (p.goals && p.goals > 0) {
                    stats.tiros += (goalMultiplier * p.goals);
                    stats.goals = (stats.goals || 0) + p.goals;
                    stats.goalDrought = 0; // reset drought
                    const label = match.mode === '9v9' || match.mode === '8v8' ? 'Fútbol 9' : 'Fútbol Chico';
                    reasons.push(`Goles ${label} +${(goalMultiplier * p.goals).toFixed(1)} Tiros`);
                } else {
                    stats.goalDrought = (stats.goalDrought || 0) + 1;
                    if (stats.goalDrought === 3) {
                        stats.tiros -= 0.5; // Castigo por no meter goles en 3 partidos seguidos
                        stats.goalDrought = 0; // reset to avoid infinite stacking every game
                        reasons.push("Sequía Goleadora -0.5 Tiros");
                    }
                }

                // 3. Goleador
                if (maxGoals > 0 && topScorers.some(s => s.playerId === p.playerId)) {
                    stats.tiros += 1.0; stats.ritmo += 0.5; stats.velocidad += 0.5;
                    reasons.push("Goleador del Partido +1.0");
                }

                // 4. MVP
                if (p.isMvp) {
                    stats.tiros += 0.5; stats.pases += 0.5; stats.regates += 0.5; stats.velocidad += 0.5; stats.ritmo += 0.5;
                    stats.mvps = (stats.mvps || 0) + 1;
                    reasons.push("Premio MVP +0.5 Global");
                }

                // 5. Resultados del Partido (Win/Loss) y Rachas de Victoria
                let won = false;
                let lost = false;
                if (match.result && match.result !== 'Empate') {
                    if (match.result === p.team) won = true;
                    else lost = true;
                }

                if (won) {
                    stats.pases += 0.2; stats.regates += 0.2;
                    stats.winStreak = (stats.winStreak || 0) + 1;
                    reasons.push("Victoria +0.2 Pases/Deltas");
                    
                    if (stats.winStreak === 3) {
                        stats.ritmo += 0.5; stats.velocidad += 0.5; stats.tiros += 0.5; stats.pases += 0.5; stats.regates += 0.5;
                        reasons.push("Racha de Victorias (3x) +0.5");
                    } else if (stats.winStreak === 5) {
                        stats.ritmo += 0.75; stats.velocidad += 0.75; stats.tiros += 0.75; stats.pases += 0.75; stats.regates += 0.75;
                        reasons.push("Imbatible (5x Victorias) +0.75");
                    }
                } else if (lost) {
                    stats.winStreak = 0;
                    stats.ritmo -= 0.1; stats.pases -= 0.1; stats.regates -= 0.1;
                    reasons.push("Derrota -0.1 Moral/Táctica");
                } else {
                    stats.winStreak = 0; // Break streak on draw
                }

                // 6. Rachas de Asistencia
                if (stats.streak === 3) { 
                    stats.ritmo += 0.5; stats.regates += 0.5; 
                    reasons.push("Racha Asistencia (3x) +0.5");
                } 
                else if (stats.streak === 5) { 
                    stats.tiros += 0.75; stats.pases += 0.75; stats.regates += 0.75; stats.velocidad += 0.75; stats.ritmo += 0.75; 
                    reasons.push("Racha Asistencia (5x) +0.75");
                } 
                else if (stats.streak === 10) { 
                    stats.tiros += 1.0; stats.pases += 1.0; stats.regates += 1.0; stats.velocidad += 1.0; stats.ritmo += 1.0; 
                    reasons.push("Constancia (10x partidos) +1.0");
                } 
                else if (stats.streak === 15) { 
                    stats.tiros += 1.5; stats.pases += 1.5; stats.regates += 1.5; stats.velocidad += 1.5; stats.ritmo += 1.5; 
                    reasons.push("Leyenda (15x partidos) +1.5");
                }

                // 6. Diferencia de Goles
                if (p.team && goalDiffs[p.team] !== undefined) {
                    const diff = goalDiffs[p.team];
                    if (diff >= 10) { stats.pases += 0.5; stats.regates += 0.5; stats.tiros += 0.5; }
                    else if (diff >= 5) { stats.pases += 0.3; stats.regates += 0.3; }
                    else if (diff <= -10) { stats.pases -= 0.5; stats.regates -= 0.5; stats.tiros -= 0.5; }
                    else if (diff <= -5) { stats.pases -= 0.3; stats.regates -= 0.3; }
                }

            } else if (p.status === 'Absent' || p.status === 'LateCancel') {
                stats.streak = 0;
                stats.ritmo -= 0.5; stats.velocidad -= 0.5; stats.tiros -= 0.5; stats.pases -= 0.5; stats.regates -= 0.5;
                reasons.push("Falta sin aviso -0.5 Global");
            } else if (p.status === 'Declined') {
                stats.streak = 0;
                stats.ritmo -= 0.1; stats.velocidad -= 0.1; stats.tiros -= 0.1; stats.pases -= 0.1; stats.regates -= 0.1;
                reasons.push("Ausencia Justificada -0.1");
            } else if (p.status === 'Injured') {
                stats.streak = 0;
                stats.tiros -= 1; stats.pases -= 1; stats.regates -= 1; stats.velocidad -= 1; stats.ritmo -= 1;
                reasons.push("Lesión de Gravedad -1.0");
            } else if (p.status === 'Vacation') {
                stats.streak = 0;
                stats.ritmo -= 0.5; stats.velocidad -= 0.5;
                reasons.push("Vacaciones -0.5 Físico");
            }

            // Apply soft-cap (Diminishing Returns) > 85
            stats.ritmo = applyDiminishingReturns(prev.ritmo, stats.ritmo);
            stats.velocidad = applyDiminishingReturns(prev.velocidad, stats.velocidad);
            stats.tiros = applyDiminishingReturns(prev.tiros, stats.tiros);
            stats.regates = applyDiminishingReturns(prev.regates, stats.regates);
            stats.pases = applyDiminishingReturns(prev.pases, stats.pases);

            // Calculate exact deltas
            stats.deltas = {
                ritmo: Number((stats.ritmo - prev.ritmo).toFixed(1)),
                velocidad: Number((stats.velocidad - prev.velocidad).toFixed(1)),
                tiros: Number((stats.tiros - prev.tiros).toFixed(1)),
                regates: Number((stats.regates - prev.regates).toFixed(1)),
                pases: Number((stats.pases - prev.pases).toFixed(1)),
                reflejos: stats.reflejos !== undefined && prev.reflejos !== undefined ? Number((stats.reflejos - prev.reflejos).toFixed(1)) : 0,
                posicionamiento: stats.posicionamiento !== undefined && prev.posicionamiento !== undefined ? Number((stats.posicionamiento - prev.posicionamiento).toFixed(1)) : 0,
                estirada: stats.estirada !== undefined && prev.estirada !== undefined ? Number((stats.estirada - prev.estirada).toFixed(1)) : 0,
                saque: stats.saque !== undefined && prev.saque !== undefined ? Number((stats.saque - prev.saque).toFixed(1)) : 0,
                seguridad: stats.seguridad !== undefined && prev.seguridad !== undefined ? Number((stats.seguridad - prev.seguridad).toFixed(1)) : 0,
            };
            
            // Format to 1 decimal place permanently to avoid huge floats
            stats.ritmo = Number(stats.ritmo.toFixed(1));
            stats.velocidad = Number(stats.velocidad.toFixed(1));
            stats.tiros = Number(stats.tiros.toFixed(1));
            stats.regates = Number(stats.regates.toFixed(1));
            stats.pases = Number(stats.pases.toFixed(1));
            if (stats.reflejos !== undefined) stats.reflejos = Number(stats.reflejos.toFixed(1));
            if (stats.posicionamiento !== undefined) stats.posicionamiento = Number(stats.posicionamiento.toFixed(1));
            if (stats.estirada !== undefined) stats.estirada = Number(stats.estirada.toFixed(1));
            if (stats.saque !== undefined) stats.saque = Number(stats.saque.toFixed(1));
            if (stats.seguridad !== undefined) stats.seguridad = Number(stats.seguridad.toFixed(1));
            
            playerStats.set(p.playerId, stats);

            participationUpdates.push({
                matchId: match.id,
                playerId: p.playerId,
                skillReasons: reasons
            });
        }

        // Penalty for players entirely missing from this match (Inactivity Decay)
        const activeIds = new Set(matchParts.map(p => p.playerId));
        for (const [playerId, stats] of playerStats.entries()) {
            if (!activeIds.has(playerId)) {
                
                // SOLO penalizar inactividad si el jugador YA DEBUTÓ en el grupo.
                if ((stats.matchesPlayed || 0) > 0) {
                    const prevInactive = { ...stats };
                    stats.streak = 0;
                    
                    // Decay -0.2 to all skills for missing a match entirely
                    stats.ritmo -= 0.2; stats.velocidad -= 0.2; stats.tiros -= 0.2; stats.pases -= 0.2; stats.regates -= 0.2;
                    if (stats.reflejos !== undefined) stats.reflejos -= 0.2;
                    if (stats.posicionamiento !== undefined) stats.posicionamiento -= 0.2;
                    if (stats.estirada !== undefined) stats.estirada -= 0.2;
                    if (stats.saque !== undefined) stats.saque -= 0.2;
                    if (stats.seguridad !== undefined) stats.seguridad -= 0.2;
                    
                    stats.deltas = {
                        ritmo: Number((stats.ritmo - prevInactive.ritmo).toFixed(1)),
                        velocidad: Number((stats.velocidad - prevInactive.velocidad).toFixed(1)),
                        tiros: Number((stats.tiros - prevInactive.tiros).toFixed(1)),
                        regates: Number((stats.regates - prevInactive.regates).toFixed(1)),
                        pases: Number((stats.pases - prevInactive.pases).toFixed(1)),
                        reflejos: stats.reflejos !== undefined && prevInactive.reflejos !== undefined ? Number((stats.reflejos - prevInactive.reflejos).toFixed(1)) : 0,
                        posicionamiento: stats.posicionamiento !== undefined && prevInactive.posicionamiento !== undefined ? Number((stats.posicionamiento - prevInactive.posicionamiento).toFixed(1)) : 0,
                        estirada: stats.estirada !== undefined && prevInactive.estirada !== undefined ? Number((stats.estirada - prevInactive.estirada).toFixed(1)) : 0,
                        saque: stats.saque !== undefined && prevInactive.saque !== undefined ? Number((stats.saque - prevInactive.saque).toFixed(1)) : 0,
                        seguridad: stats.seguridad !== undefined && prevInactive.seguridad !== undefined ? Number((stats.seguridad - prevInactive.seguridad).toFixed(1)) : 0,
                    };
                    
                    stats.ritmo = Number(stats.ritmo.toFixed(1));
                    stats.velocidad = Number(stats.velocidad.toFixed(1));
                    stats.tiros = Number(stats.tiros.toFixed(1));
                    stats.regates = Number(stats.regates.toFixed(1));
                    stats.pases = Number(stats.pases.toFixed(1));
                    if (stats.reflejos !== undefined) stats.reflejos = Number(stats.reflejos.toFixed(1));
                    if (stats.posicionamiento !== undefined) stats.posicionamiento = Number(stats.posicionamiento.toFixed(1));
                    if (stats.estirada !== undefined) stats.estirada = Number(stats.estirada.toFixed(1));
                    if (stats.saque !== undefined) stats.saque = Number(stats.saque.toFixed(1));
                    if (stats.seguridad !== undefined) stats.seguridad = Number(stats.seguridad.toFixed(1));
                }
            }
        }
    }

    return { playerStats, participationUpdates };
}

export async function syncAllPlayerStats() {
    const { db } = await import('@/lib/db');
    const { players, matches, participations } = await import('@/lib/db/schema');
    const { asc, eq, and } = await import('drizzle-orm');

    const allPlayers = await db.select().from(players);
    const allMatches = await db.select().from(matches).orderBy(asc(matches.date));
    const allParticipations = await db.select().from(participations);

    const { playerStats, participationUpdates } = recalculateAllSkills(allPlayers, allMatches, allParticipations);

    // Update global skills in Players table
    for (const [playerId, newStats] of playerStats.entries()) {
        try {
            await db.update(players)
                .set({ skills: JSON.stringify(newStats) })
                .where(eq(players.id, playerId));
        } catch (e) {
            console.error(`Failed to update player ${playerId}`, e);
        }
    }

    // Update reasons in Participations table
    for (const update of participationUpdates) {
        try {
            await db.update(participations)
                .set({ skillReasons: JSON.stringify(update.skillReasons) })
                .where(and(
                    eq(participations.matchId, update.matchId),
                    eq(participations.playerId, update.playerId)
                ));
        } catch (e) {
            console.error(`Failed to update participation log for ${update.playerId}`, e);
        }
    }

    return playerStats;
}
