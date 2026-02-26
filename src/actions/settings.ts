'use server';

import { saveSettings, getData, checkSuperclasico } from '@/lib/data';
import { AppSettings } from '@/types';
import { revalidatePath } from 'next/cache';

export async function saveSettingsAction(settings: AppSettings) {
    await saveSettings(settings); // Saving settings to db

    // Now trigger re-evaluation for all matches (or at least recent ones)
    // To be safe we can just re-evaluate all matches since this is a global setting
    const { matches } = await getData();
    for (const m of matches) {
        await checkSuperclasico(m.id);
    }

    revalidatePath('/');
    revalidatePath('/matches');
    revalidatePath('/stats');
}

export async function triggerNotificationAction(url: string, payload: any) {
    console.log('Triggering notification to:', url);
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        console.log('n8n response status:', response.status);
        return { success: response.ok, status: response.status };
    } catch (error) {
        console.error('Error in triggerNotificationAction:', error);
        return { success: false, error: String(error) };
    }
}
