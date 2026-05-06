// src/lib/data.ts
'use server';

import { db } from './db';
import { players, matches, participations, seasons, settings, specialtyRules, traitRules } from './db/schema';
import { DashboardData, Match, Player, PlayerStats, Season, MatchMode, MatchResult, Team, AppSettings } from '@/types';
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

        const settingsObj: AppSettings = {
            n8nWebhookUrl: allSettingsList.find(s => s.key === 'n8nWebhookUrl')?.value || '',
            whatsappGroupName: allSettingsList.find(s => s.key === 'whatsappGroupName')?.value || '',
            elitePlayerIds: allSettingsList.find(s => s.key === 'elitePlayerIds')?.value ? JSON.parse(allSettingsList.find(s => s.key === 'elitePlayerIds')!.value!) : [],
            team1EliteIds: allSettingsList.find(s => s.key === 'team1EliteIds')?.value ? JSON.parse(allSettingsList.find(s => s.key === 'team1EliteIds')!.value!) : [],
            team2EliteIds: allSettingsList.find(s => s.key === 'team2EliteIds')?.value ? JSON.parse(allSettingsList.find(s => s.key === 'team2EliteIds')!.value!) : []
        };

        return {
            players: allPlayers.map(p => {
                const defaultSkills = {
                    ritmo: 50, tiros: 50, regates: 50, velocidad: 50, pases: 50,
                    reflejos: 50, posicionamiento: 50, estirada: 50, saque: 50, seguridad: 50
                };
                return {
                    ...p,
                    isActive: p.isActive ?? true,
                    isVacation: p.isVacation ?? false,
                    isInjured: p.isInjured ?? false,
                    skills: { ...defaultSkills, ...(p.skills ? JSON.parse(p.skills) : {}) },
                    traits: p.traits ? JSON.parse(p.traits) : [],
                    positions: p.positions ? JSON.parse(p.positions) : [],
                    affinities: p.affinities ? JSON.parse(p.affinities) : [],
                    conflicts: p.conflicts ? JSON.parse(p.conflicts) : [],
                };
            }) as Player[],
            matches: allMatches.map(m => ({
                ...m,
                mode: (m.mode || '7v7') as MatchMode,
                result: (m.result || undefined) as MatchResult | undefined,
                location: m.location || undefined,
                seasonId: m.seasonId || undefined,
                isSuperclasico: !!m.isSuperclasico,
            })) as Match[],
            participations: allParticipations.map(p => ({
                ...p,
                isMvp: !!p.isMvp,
                team: p.team as Team,
                tacticalRole: p.tacticalRole as any,
                skillReasons: p.skillReasons ? JSON.parse(p.skillReasons) : [],
                notes: p.notes || undefined,
                ownGoals: p.ownGoals || 0,
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
            seasons: allSeasons.map(s => ({
                ...s,
                startDate: s.startDate || '',
                endDate: s.endDate || ''
            })) as Season[],
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
        isSuperclasico: !!m.isSuperclasico,
    } as Match;
}

export async function getParticipationsForMatch(matchId: string) {
    const res = await db.select().from(participations).where(eq(participations.matchId, matchId));
    return res.map(p => ({
        ...p,
        isMvp: !!p.isMvp,
        team: p.team as Team,
        tacticalRole: p.tacticalRole as any,
        skillReasons: p.skillReasons ? JSON.parse(p.skillReasons) : [],
        notes: p.notes || undefined,
        ownGoals: p.ownGoals || 0,
    })) as PlayerStats[];
}

export async function updateParticipation(participation: PlayerStats) {
    const dataToSave = {
        ...participation,
        skillReasons: participation.skillReasons ? JSON.stringify(participation.skillReasons) : null
    };
    await db.insert(participations)
        .values(dataToSave as any)
        .onConflictDoUpdate({
            target: [participations.matchId, participations.playerId],
            set: dataToSave as any
        });
}

export async function getPlayers() {
    const res = await db.select().from(players);
    return res.map(p => ({
        ...p,
        isActive: p.isActive ?? true,
        isVacation: p.isVacation ?? false,
        isInjured: p.isInjured ?? false,
        skills: p.skills ? JSON.parse(p.skills) : {},
        traits: p.traits ? JSON.parse(p.traits) : [],
        positions: p.positions ? JSON.parse(p.positions) : [],
        affinities: p.affinities ? JSON.parse(p.affinities) : [],
        conflicts: p.conflicts ? JSON.parse(p.conflicts) : [],
    })) as Player[];
}

export async function addPlayer(player: Player) {
    await db.insert(players).values({
        ...player,
        skills: JSON.stringify(player.skills),
        traits: JSON.stringify(player.traits),
        positions: JSON.stringify(player.positions || []),
        affinities: JSON.stringify(player.affinities || []),
        conflicts: JSON.stringify(player.conflicts || []),
    }).onConflictDoNothing();
}

export async function updatePlayer(player: Player) {
    await db.update(players)
        .set({
            ...player,
            skills: JSON.stringify(player.skills),
            traits: JSON.stringify(player.traits),
            positions: JSON.stringify(player.positions || []),
            affinities: JSON.stringify(player.affinities || []),
            conflicts: JSON.stringify(player.conflicts || []),
        })
        .where(eq(players.id, player.id));
}

export async function deletePlayer(id: string) {
    // Delete participations first
    await db.delete(participations).where(eq(participations.playerId, id));
    // Then delete player
    await db.delete(players).where(eq(players.id, id));
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
        whatsappGroupName: all.find(s => s.key === 'whatsappGroupName')?.value || '',
        elitePlayerIds: all.find(s => s.key === 'elitePlayerIds')?.value ? JSON.parse(all.find(s => s.key === 'elitePlayerIds')!.value!) : [],
        team1EliteIds: all.find(s => s.key === 'team1EliteIds')?.value ? JSON.parse(all.find(s => s.key === 'team1EliteIds')!.value!) : [],
        team2EliteIds: all.find(s => s.key === 'team2EliteIds')?.value ? JSON.parse(all.find(s => s.key === 'team2EliteIds')!.value!) : [],
        captain1Id: all.find(s => s.key === 'captain1Id')?.value || '',
        captain2Id: all.find(s => s.key === 'captain2Id')?.value || '',
        team1Name: all.find(s => s.key === 'team1Name')?.value || 'Celeste',
        team2Name: all.find(s => s.key === 'team2Name')?.value || 'Azul',
    };
}

export async function saveSettings(settingsObj: any) {
    for (const [key, value] of Object.entries(settingsObj)) {
        const valueToSave = typeof value === 'object' ? JSON.stringify(value) : String(value);
        await db.insert(settings).values({ key, value: valueToSave }).onConflictDoUpdate({
            target: settings.key,
            set: { value: valueToSave }
        });
    }
}

export async function getSeasons() {
    const res = await db.select().from(seasons);
    return res.map(s => ({
        ...s,
        startDate: s.startDate || '',
        endDate: s.endDate || ''
    })) as Season[];
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

export async function checkSuperclasico(matchId: string) {
    try {
        const s = await getSettings();
        const eliteIds = s.elitePlayerIds || [];
        const t1EliteIds = s.team1EliteIds || [];
        const t2EliteIds = s.team2EliteIds || [];

        if (eliteIds.length !== 6 || t1EliteIds.length !== 3 || t2EliteIds.length !== 3) {
            await db.update(matches).set({ isSuperclasico: false }).where(eq(matches.id, matchId));
            return false;
        }

        const participations = await getParticipationsForMatch(matchId);
        const attendedElite = participations.filter(p => (p.status === 'Attended' || p.status === 'Confirmed') && eliteIds.includes(p.playerId));

        if (attendedElite.length !== 6) {
            await db.update(matches).set({ isSuperclasico: false }).where(eq(matches.id, matchId));
            return false;
        }

        const team1Elite = attendedElite.filter(p => p.team === 'Celeste').map(p => p.playerId);
        const team2Elite = attendedElite.filter(p => p.team === 'Azul').map(p => p.playerId);

        // Sort arrays to compare equality regardless of order
        const sortedT1Config = [...t1EliteIds].sort();
        const sortedT2Config = [...t2EliteIds].sort();

        const sortedT1Actual = [...team1Elite].sort();
        const sortedT2Actual = [...team2Elite].sort();

        const matchConfig1 = JSON.stringify(sortedT1Config) === JSON.stringify(sortedT1Actual) && JSON.stringify(sortedT2Config) === JSON.stringify(sortedT2Actual);
        // Also check swapped teams case (e.g. Captain 1's team is now Azul instead of Celeste)
        const matchConfig2 = JSON.stringify(sortedT1Config) === JSON.stringify(sortedT2Actual) && JSON.stringify(sortedT2Config) === JSON.stringify(sortedT1Actual);

        const isSuper = matchConfig1 || matchConfig2;

        await db.update(matches).set({ isSuperclasico: isSuper }).where(eq(matches.id, matchId));
        return isSuper;
    } catch (error) {
        console.error('Error checking superclasico:', error);
        return false;
    }
}
