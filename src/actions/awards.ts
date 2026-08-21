'use server';

import { saveSettings } from '@/lib/data';
import { SeasonAwards } from '@/types';
import { revalidatePath } from 'next/cache';

export async function revealSeasonAwardsAction(award: SeasonAwards) {
    if (process.env.NODE_ENV !== 'production') {
        return { preview: true };
    }

    const currentAwards = await getStoredSeasonAwards();
    const nextAwards = [
        ...currentAwards.filter(item => item.seasonKey !== award.seasonKey),
        award,
    ];

    await saveSettings({ seasonAwards: nextAwards });
    revalidatePath('/history');
    revalidatePath('/players');
    return { preview: false };
}

async function getStoredSeasonAwards(): Promise<SeasonAwards[]> {
    const { db } = await import('@/lib/db');
    const { settings } = await import('@/lib/db/schema');
    const { eq } = await import('drizzle-orm');
    const result = await db.select().from(settings).where(eq(settings.key, 'seasonAwards'));

    if (!result[0]?.value) return [];

    try {
        return JSON.parse(result[0].value) as SeasonAwards[];
    } catch {
        return [];
    }
}