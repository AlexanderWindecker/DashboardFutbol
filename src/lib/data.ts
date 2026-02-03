// src/lib/data.ts
'use server';

import { db } from './db';
import { players, matches, participations, seasons, settings, specialtyRules, traitRules } from './db/schema';
import { DashboardData, Match, Player, PlayerStats, Season, MatchMode, MatchResult, Team } from '@/types';
import { eq, and } from 'drizzle-orm';

export async function getData(): Promise<DashboardData> {
    try {
        const allPlayers = await db.select().from(players);
        const allMatches = await db.select().from(matches);
        const allParticipations = await db.select().from(participations);
        const allSeasons = await db.select().from(seasons);
        const allSettingsList = await db.select().from(settings);
        const sRules = await db.select().from(specialtyRules);
        const tRules = await db.select().from(traitRules);

        const activeSeasonSetting = allSettingsList.find(s => s.key === 'activeSeasonId');

        // Map settings list to object
        const settingsObj = {
            n8nWebhookUrl: allSettingsList.find(s => s.key === 'n8nWebhookUrl')?.value || '',
            whatsappGroupName: allSettingsList.find(s => s.key === 'whatsappGroupName')?.value || ''
        };

        return {
            players: allPlayers.map(p => {
                const defaultSkills = {
                    ritmo: 50, tiros: 50, regates: 50, velocidad: 50, pases: 50,
                    reflejos: 50, posicionamiento: 50, estirada: 50, saque: 50, seguridad: 50
                };
                return {
                    ...p,
                    skills: { ...defaultSkills, ...(p.skills ? JSON.parse(p.skills) : {}) },
                    traits: p.traits ? JSON.parse(p.traits) : [],
                };
            }) as Player[],
            matches: allMatches.map(m => ({
                ...m,
                mode: (m.mode || '7v7') as MatchMode,
                result: (m.result || undefined) as MatchResult | undefined,
                location: m.location || undefined,
                seasonId: m.seasonId || undefined,
            })) as Match[],
            participations: allParticipations.map(p => ({
                ...p,
                team: p.team as Team,
                tacticalRole: p.tacticalRole as any,
                notes: p.notes || undefined,
            })) as PlayerStats[],
            specialtyRules: sRules.map(r => ({
                ...r,
                type: r.type as 'specialty',
                category: (r.category || undefined) as any,
                conditions: r.conditions ? JSON.parse(r.conditions) : [],
                description: r.description || undefined
            })),
            traitRules: tRules.map(r => ({
                ...r,
                type: r.type as 'trait',
                conditions: r.conditions ? JSON.parse(r.conditions) : []
            })),
            settings: settingsObj,
            seasons: allSeasons as Season[],
            activeSeasonId: activeSeasonSetting?.value || undefined
        };
    } catch (error) {
        console.error('❌ Error in getData:', error);
        throw error;
    }
}

export async function addMatch(match: Match) {
    await db.insert(matches).values(match);
}

export async function updateMatch(updatedMatch: Match) {
    await db.update(matches)
        .set(updatedMatch)
        .where(eq(matches.id, updatedMatch.id));
}

export async function getMatch(id: string) {
    const res = await db.select().from(matches).where(eq(matches.id, id));
    if (!res[0]) return null;
    const m = res[0];
    return {
        ...m,
        mode: (m.mode || '7v7') as MatchMode,
        result: (m.result || undefined) as MatchResult | undefined,
        location: m.location || undefined,
        seasonId: m.seasonId || undefined,
    } as Match;
}

export async function getParticipationsForMatch(matchId: string) {
    const res = await db.select().from(participations).where(eq(participations.matchId, matchId));
    return res.map(p => ({
        ...p,
        team: p.team as Team,
        tacticalRole: p.tacticalRole as any,
        notes: p.notes || undefined,
    })) as PlayerStats[];
}

export async function updateParticipation(participation: PlayerStats) {
    await db.insert(participations)
        .values(participation)
        .onConflictDoUpdate({
            target: [participations.matchId, participations.playerId],
            set: participation
        });
}

export async function getPlayers() {
    const res = await db.select().from(players);
    return res.map(p => ({
        ...p,
        skills: p.skills ? JSON.parse(p.skills) : {},
        traits: p.traits ? JSON.parse(p.traits) : [],
    })) as Player[];
}

export async function addPlayer(player: Player) {
    await db.insert(players).values({
        ...player,
        skills: JSON.stringify(player.skills),
        traits: JSON.stringify(player.traits),
    }).onConflictDoNothing();
}

export async function updatePlayer(player: Player) {
    await db.update(players)
        .set({
            ...player,
            skills: JSON.stringify(player.skills),
            traits: JSON.stringify(player.traits),
        })
        .where(eq(players.id, player.id));
}

export async function deleteMatch(id: string) {
    await db.delete(participations).where(eq(participations.matchId, id));
    await db.delete(matches).where(eq(matches.id, id));
}

export async function deleteParticipation(matchId: string, playerId: string) {
    await db.delete(participations)
        .where(and(eq(participations.matchId, matchId), eq(participations.playerId, playerId)));
}

export async function getSpecialtyRules() {
    const res = await db.select().from(specialtyRules);
    return res.map(r => ({
        ...r,
        type: r.type as 'specialty',
        category: (r.category || undefined) as any,
        conditions: r.conditions ? JSON.parse(r.conditions) : [],
        description: r.description || undefined
    }));
}

export async function getTraitRules() {
    const res = await db.select().from(traitRules);
    return res.map(r => ({
        ...r,
        type: r.type as 'trait',
        conditions: r.conditions ? JSON.parse(r.conditions) : []
    }));
}

export async function saveSpecialtyRule(rule: any) {
    await db.insert(specialtyRules).values({
        ...rule,
        conditions: JSON.stringify(rule.conditions)
    }).onConflictDoUpdate({
        target: specialtyRules.id,
        set: {
            ...rule,
            conditions: JSON.stringify(rule.conditions)
        }
    });
}

export async function saveTraitRule(rule: any) {
    await db.insert(traitRules).values({
        ...rule,
        conditions: JSON.stringify(rule.conditions)
    }).onConflictDoUpdate({
        target: traitRules.id,
        set: {
            ...rule,
            conditions: JSON.stringify(rule.conditions)
        }
    });
}

export async function deleteRule(id: string, type: 'specialty' | 'trait') {
    if (type === 'specialty') {
        await db.delete(specialtyRules).where(eq(specialtyRules.id, id));
    } else {
        await db.delete(traitRules).where(eq(traitRules.id, id));
    }
}

export async function getSettings() {
    const all = await db.select().from(settings);
    return {
        n8nWebhookUrl: all.find(s => s.key === 'n8nWebhookUrl')?.value || '',
        whatsappGroupName: all.find(s => s.key === 'whatsappGroupName')?.value || ''
    };
}

export async function saveSettings(settingsObj: any) {
    for (const [key, value] of Object.entries(settingsObj)) {
        await db.insert(settings).values({ key, value: String(value) }).onConflictDoUpdate({
            target: settings.key,
            set: { value: String(value) }
        });
    }
}

export async function getSeasons() {
    return await db.select().from(seasons);
}

export async function saveSeason(season: Season) {
    await db.insert(seasons).values(season).onConflictDoUpdate({
        target: seasons.id,
        set: season
    });
}

export async function deleteSeason(id: string) {
    await db.delete(seasons).where(eq(seasons.id, id));
}

export async function getActiveSeasonId() {
    const res = await db.select().from(settings).where(eq(settings.key, 'activeSeasonId'));
    return res[0]?.value;
}

export async function setActiveSeasonAction(id: string | undefined) {
    await db.insert(settings).values({ key: 'activeSeasonId', value: id || '' }).onConflictDoUpdate({
        target: settings.key,
        set: { value: id || '' }
    });
}
