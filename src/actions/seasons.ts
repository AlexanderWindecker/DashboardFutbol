'use server';

import { saveSeason, deleteSeason, setActiveSeasonAction, getSeasons } from '@/lib/data';
import { Season } from '@/types';
import { revalidatePath } from 'next/cache';

export async function createSeasonAction(formData: FormData) {
    const name = formData.get('name') as string;
    const startDate = formData.get('startDate') as string;
    const endDate = formData.get('endDate') as string;

    const newSeason: Season = {
        id: crypto.randomUUID(),
        name,
        startDate,
        endDate,
    };

    await saveSeason(newSeason);
    revalidatePath('/settings');
    revalidatePath('/stats');
    revalidatePath('/matches');
}

export async function updateSeasonAction(id: string, formData: FormData) {
    const name = formData.get('name') as string;
    const startDate = formData.get('startDate') as string;
    const endDate = formData.get('endDate') as string;

    const updatedSeason: Season = {
        id,
        name,
        startDate,
        endDate,
    };

    await saveSeason(updatedSeason);
    revalidatePath('/settings');
    revalidatePath('/stats');
    revalidatePath('/matches');
}

export async function deleteSeasonAction(id: string) {
    await deleteSeason(id);
    revalidatePath('/settings');
    revalidatePath('/stats');
    revalidatePath('/matches');
}

export async function setActiveSeason(id: string | undefined) {
    await setActiveSeasonAction(id);
    revalidatePath('/');
    revalidatePath('/settings');
    revalidatePath('/stats');
    revalidatePath('/matches');
}
