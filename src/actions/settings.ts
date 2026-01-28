'use server';

import { saveSettings } from '@/lib/data';
import { AppSettings } from '@/types';
import { revalidatePath } from 'next/cache';

export async function saveSettingsAction(settings: AppSettings) {
    await saveSettings(settings);
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
