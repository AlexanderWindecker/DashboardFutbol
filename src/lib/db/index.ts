import { sql } from '@vercel/postgres';
import { drizzle } from 'drizzle-orm/vercel-postgres';
import * as schema from './schema';

if (!process.env.POSTGRES_URL) {
    console.warn('⚠️ WARNING: POSTGRES_URL is not defined in environment variables!');
} else {
    console.log('✅ DB Client initialized with POSTGRES_URL');
}

export const db = drizzle(sql, { schema });
