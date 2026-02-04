import { sql } from '@vercel/postgres';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function patch() {
    console.log('--- Iniciando parche de esquema ---');
    try {
        await sql`ALTER TABLE players ADD COLUMN IF NOT EXISTS positions TEXT`;
        await sql`ALTER TABLE players ADD COLUMN IF NOT EXISTS preferred_foot TEXT`;
        await sql`ALTER TABLE players ADD COLUMN IF NOT EXISTS telegram_id TEXT`;
        await sql`ALTER TABLE players ADD COLUMN IF NOT EXISTS is_injured BOOLEAN DEFAULT FALSE`;
        await sql`ALTER TABLE players ADD COLUMN IF NOT EXISTS affinities TEXT`;
        await sql`ALTER TABLE players ADD COLUMN IF NOT EXISTS conflicts TEXT`;
        console.log('✅ Columnas añadidas con éxito (si no existían)');
    } catch (e) {
        console.error('❌ Error ejecutando parche SQL:', e);
    }
}

patch();
