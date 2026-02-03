import { sql } from '@vercel/postgres';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function checkSchema() {
    try {
        const result = await sql`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'players';
        `;
        console.log('Columns in "players" table:');
        console.table(result.rows);
    } catch (e) {
        console.error('Error checking schema:', e);
    }
}

checkSchema();
