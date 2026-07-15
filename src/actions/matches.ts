'use server';

import { addMatch, updateMatch, updateParticipation, getParticipationsForMatch, getMatch, deleteMatch, checkSuperclasico } from '@/lib/data';
import { Match, MatchMode, PlayerStats, MatchResult } from '@/types';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { syncAllPlayerStats } from '@/lib/skills-engine';

export async function createMatchAction(formData: FormData) {
    const date = formData.get('date') as string;
    const mode = formData.get('mode') as MatchMode;
    const location = formData.get('location') as string;
    const seasonId = formData.get('seasonId') as string;
    const weather = (formData.get('weather') as 'Despejado' | 'Lluvia') || 'Despejado';

    const newMatch: Match = {
        id: crypto.randomUUID(),
        date,
        mode,
        location,
        seasonId: seasonId || undefined,
        weather,
    };

    await addMatch(newMatch);
    revalidatePath('/matches');
    revalidatePath('/');
    redirect('/matches');
}

export async function updateMatchResultAction(matchId: string, result: MatchResult, scoreCeleste?: number | null, scoreAzul?: number | null) {
    const match = await getMatch(matchId);
    if (!match) return;

    match.result = result;
    if (scoreCeleste !== undefined) match.scoreCeleste = scoreCeleste ?? undefined;
    if (scoreAzul !== undefined) match.scoreAzul = scoreAzul ?? undefined;

    await updateMatch(match);
    await syncAllPlayerStats(); // Trigger recalculation
    revalidatePath(`/matches/${matchId}`);
    revalidatePath('/matches');
    revalidatePath('/stats');
    revalidatePath('/players');
}

export async function updateMatchDetailsAction(matchId: string, formData: FormData) {
    const match = await getMatch(matchId);
    if (!match) return;

    match.date = formData.get('date') as string;
    match.mode = formData.get('mode') as MatchMode;
    match.location = formData.get('location') as string;
    match.seasonId = (formData.get('seasonId') as string) || undefined;
    match.weather = (formData.get('weather') as 'Despejado' | 'Lluvia') || 'Despejado';

    await updateMatch(match);
    await syncAllPlayerStats(); // Trigger recalculation when details/weather change
    
    revalidatePath(`/matches/${matchId}`);
    revalidatePath('/matches');
    revalidatePath('/stats');
    revalidatePath('/players');
}

export async function updateParticipationAction(matchId: string, playerId: string, updates: Partial<PlayerStats>) {
    const existing = await getParticipationsForMatch(matchId);
    let current = existing.find(p => p.playerId === playerId);

    if ((updates.goals && updates.goals > 0) || updates.isMvp === true) {
        updates.status = 'Attended';
    }

    if (!current) {
        current = {
            matchId,
            playerId,
            team: null,
            status: 'Confirmed',
            assists: 0,
            isMvp: false,
            ...updates
        };
    } else {
        current = { ...current, ...updates };
    }

    await updateParticipation(current);

    // Si se están cargando goles individuales, limpiar el marcador manual
    // para que el marcador se calcule automáticamente desde los goles de cada jugador.
    if (updates.goals !== undefined || updates.ownGoals !== undefined) {
        const match = await getMatch(matchId);
        if (match && (match.scoreCeleste !== undefined || match.scoreAzul !== undefined)) {
            match.scoreCeleste = undefined;
            match.scoreAzul = undefined;
            await updateMatch(match);
        }
    }

    await checkSuperclasico(matchId);
    await syncAllPlayerStats(); // Trigger recalculation
    revalidatePath(`/matches/${matchId}`);
    revalidatePath('/matches'); // Crucial for the matches list
    revalidatePath('/stats'); // Also revalidate stats page
    revalidatePath('/players');
}

export async function deleteParticipationAction(matchId: string, playerId: string) {
    const { deleteParticipation } = await import('@/lib/data');
    await deleteParticipation(matchId, playerId);
    await syncAllPlayerStats();
    revalidatePath(`/matches/${matchId}`);
    revalidatePath('/players');
}

export async function addPlayerToMatchAction(matchId: string, playerId: string) {
    const newStats: PlayerStats = {
        matchId,
        playerId,
        team: null,
        status: 'Confirmed',
        assists: 0,
        isMvp: false,
    };
    await updateParticipation(newStats);
    await checkSuperclasico(matchId);
    revalidatePath(`/matches/${matchId}`);
}

export async function deleteMatchAction(matchId: string) {
    await deleteMatch(matchId);
    revalidatePath('/matches');
    revalidatePath('/stats');
    redirect('/matches');
}
