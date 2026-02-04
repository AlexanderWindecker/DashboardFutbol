import { db } from '../index';
import { players } from '../schema';
import { eq } from 'drizzle-orm';
import fs from 'fs/promises';
import path from 'path';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function restore() {
    console.log('--- Iniciando restauración de posiciones ---');
    try {
        const dataPath = path.join(process.cwd(), 'data.json');
        const fileContent = await fs.readFile(dataPath, 'utf-8');
        const data = JSON.parse(fileContent);

        for (const p of data.players) {
            console.log(`Restaurando data para: ${p.name}`);
            await db.update(players)
                .set({
                    positions: JSON.stringify(p.positions || []),
                    affinities: JSON.stringify(p.affinities || []),
                    conflicts: JSON.stringify(p.conflicts || []),
                    preferredFoot: p.preferredFoot,
                    isInjured: p.isInjured || false,
                    telegramId: p.telegramId
                })
                .where(eq(players.id, p.id));
        }
        console.log('✅ Restauración completada con éxito');
    } catch (e) {
        console.error('❌ Error en restauración:', e);
    }
}

restore();
