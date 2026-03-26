import { db } from '../index';
import { players, participations } from '../schema';

async function check() {
    const allPlayers = await db.select().from(players);
    const cope = allPlayers.find(p => p.name.toLowerCase().includes('cope'));
    const lucas = allPlayers.find(p => p.name.toLowerCase().includes('lucas'));

    const allParts = await db.select().from(participations);

    if (cope) {
        const parts = allParts.filter(p => p.playerId === cope.id);
        const attended = parts.filter(p => p.status === 'Attended').length;
        const goals = parts.reduce((sum, p) => sum + (p.goals || 0), 0);
        const mvps = parts.filter(p => p.isMvp).length;
        console.log(`COPE -> Partidos jugados: ${attended}, Goles: ${goals}, MVPs: ${mvps}`);
        console.log(`COPE SKILLS ->`, JSON.stringify(cope.skills));
    }

    if (lucas) {
        const parts = allParts.filter(p => p.playerId === lucas.id);
        const attended = parts.filter(p => p.status === 'Attended').length;
        const goals = parts.reduce((sum, p) => sum + (p.goals || 0), 0);
        const mvps = parts.filter(p => p.isMvp).length;
        console.log(`LUCAS -> Partidos jugados: ${attended}, Goles: ${goals}, MVPs: ${mvps}`);
        console.log(`LUCAS SKILLS ->`, JSON.stringify(lucas.skills));
    }
}

check().then(() => process.exit(0));
