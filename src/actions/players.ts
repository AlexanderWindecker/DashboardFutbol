'use server';

import { addPlayer, getPlayers, updatePlayer } from '@/lib/data';
import { Player } from '@/types';
import { revalidatePath } from 'next/cache';

export async function createPlayerAction(formData: FormData) {
    const name = formData.get('name') as string;
    const phone = formData.get('phone') as string;
    if (!name) return;

    const newPlayer: Player = {
        id: crypto.randomUUID(),
        name,
        phone: phone || undefined,
        isActive: true,
        skills: { ritmo: 50, tiros: 50, regates: 50, velocidad: 50, pases: 50 } // defaults
    };

    await addPlayer(newPlayer);
    revalidatePath('/players');
}

export async function togglePlayerStatusAction(playerId: string) {
    const players = await getPlayers();
    const player = players.find(p => p.id === playerId);
    if (!player) return;

    player.isActive = !(player.isActive ?? true);
    await updatePlayer(player);
    revalidatePath('/players');
}

export async function updatePlayerNameAction(playerId: string, newName: string) {
    const players = await getPlayers();
    const player = players.find(p => p.id === playerId);
    if (!player) return;

    player.name = newName;
    await updatePlayer(player);
    revalidatePath('/players');
    revalidatePath(`/players/${playerId}`);
}

export async function updatePlayerSkillsAction(playerId: string, data: Partial<Player>) {
    const players = await getPlayers();
    const player = players.find(p => p.id === playerId);
    if (!player) return;

    if (data.affinities !== undefined) {
        const oldOpen = player.affinities || [];
        const newOpen = data.affinities || [];

        const added = newOpen.filter(id => !oldOpen.includes(id));
        const removed = oldOpen.filter(id => !newOpen.includes(id));

        // Handle reciprocity for added affinities
        for (const targetId of added) {
            const target = players.find(p => p.id === targetId);
            if (target) {
                target.affinities = [...(target.affinities || []), playerId];
                // Remove from conflicts if present (affinities and conflicts are mutually exclusive ideally)
                target.conflicts = (target.conflicts || []).filter(id => id !== playerId);
                await updatePlayer(target);
                revalidatePath(`/players/${targetId}`);
            }
        }

        // Handle reciprocity for removed affinities
        for (const targetId of removed) {
            const target = players.find(p => p.id === targetId);
            if (target) {
                target.affinities = (target.affinities || []).filter(id => id !== playerId);
                await updatePlayer(target);
                revalidatePath(`/players/${targetId}`);
            }
        }
        player.affinities = data.affinities;
    }

    if (data.conflicts !== undefined) {
        const oldConf = player.conflicts || [];
        const newConf = data.conflicts || [];

        const added = newConf.filter(id => !oldConf.includes(id));
        const removed = oldConf.filter(id => !newConf.includes(id));

        // Handle reciprocity for added conflicts
        for (const targetId of added) {
            const target = players.find(p => p.id === targetId);
            if (target) {
                target.conflicts = [...(target.conflicts || []), playerId];
                // Remove from affinities if present
                target.affinities = (target.affinities || []).filter(id => id !== playerId);
                await updatePlayer(target);
                revalidatePath(`/players/${targetId}`);
            }
        }

        // Handle reciprocity for removed conflicts
        for (const targetId of removed) {
            const target = players.find(p => p.id === targetId);
            if (target) {
                target.conflicts = (target.conflicts || []).filter(id => id !== playerId);
                await updatePlayer(target);
                revalidatePath(`/players/${targetId}`);
            }
        }
        player.conflicts = data.conflicts;
    }

    if (data.positions) player.positions = data.positions;
    if (data.preferredFoot) player.preferredFoot = data.preferredFoot;
    // if (data.preferredFoot) player.preferredFoot = data.preferredFoot; // Duplicate removed
    if (data.skills) player.skills = data.skills;
    if (data.traits) player.traits = data.traits;
    if (data.isInjured !== undefined) player.isInjured = data.isInjured;
    if (data.isVacation !== undefined) player.isVacation = data.isVacation;
    if (data.phone !== undefined) player.phone = data.phone;
    if (data.telegramId !== undefined) player.telegramId = data.telegramId;
    if (data.name !== undefined) player.name = data.name;

    await updatePlayer(player);
    revalidatePath(`/players/${playerId}`);
    revalidatePath('/players');
}
