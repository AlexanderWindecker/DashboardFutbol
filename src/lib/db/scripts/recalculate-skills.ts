import { db } from '../index';
import { players, matches, participations } from '../schema';
import { asc, eq } from 'drizzle-orm';
import { recalculateAllSkills } from '../../skills-engine';

/**
 * Run this script to completely reset all players to 50
 * and recalculate their stats history based on all matches played.
 */
async function main() {
    console.log("Fetching all data from database...");
    const allPlayers = await db.select().from(players);
    const allMatches = await db.select().from(matches).orderBy(asc(matches.date));
    const allParticipations = await db.select().from(participations);

    console.log(`Found ${allPlayers.length} players, ${allMatches.length} matches.`);
    console.log("Recalculating skills using the Engine...");

    const { playerStats, participationUpdates } = recalculateAllSkills(allPlayers, allMatches, allParticipations);

    console.log("Saving new stats and deltas to Database...");
    let savedPlayers = 0;
    for (const [playerId, newStats] of playerStats.entries()) {
        try {
            await db.update(players)
                .set({
                    skills: JSON.stringify(newStats)
                })
                .where(eq(players.id, playerId));
            savedPlayers++;
        } catch (e) {
            console.error(`Failed to update player ${playerId}`, e);
        }
    }

    console.log(`Successfully updated ${savedPlayers}/${playerStats.size} players!`);

    console.log("Updating participation logs (skill reasons)...");
    let savedLogs = 0;
    const { and } = await import('drizzle-orm');
    
    for (const update of participationUpdates) {
        try {
            await db.update(participations)
                .set({
                    skillReasons: JSON.stringify(update.skillReasons)
                })
                .where(and(
                    eq(participations.matchId, update.matchId),
                    eq(participations.playerId, update.playerId)
                ));
            savedLogs++;
        } catch (e) {
            console.error(`Failed to update log for player ${update.playerId} in match ${update.matchId}`, e);
        }
    }

    console.log(`Successfully updated ${savedLogs}/${participationUpdates.length} participation logs!`);
    process.exit(0);
}

main().catch(console.error);
