// src/lib/data.ts
'use server';

import fs from 'fs/promises';
import path from 'path';
import { DashboardData, Match, Player, PlayerStats, Season } from '@/types';

const DATA_FILE_PATH = path.join(process.cwd(), 'data.json');

const INITIAL_DATA: DashboardData = {
    players: [],
    matches: [],
    participations: [],
    specialtyRules: [],
    traitRules: [],
    settings: {
        n8nWebhookUrl: '',
        whatsappGroupName: ''
    },
    seasons: [],
    activeSeasonId: undefined
};

async function ensureDataFile() {
    try {
        await fs.access(DATA_FILE_PATH);
    } catch {
        await fs.writeFile(DATA_FILE_PATH, JSON.stringify(INITIAL_DATA, null, 2));
    }
}

export async function getData(): Promise<DashboardData> {
    await ensureDataFile();
    const fileContent = await fs.readFile(DATA_FILE_PATH, 'utf-8');
    try {
        return JSON.parse(fileContent) as DashboardData;
    } catch (error) {
        console.error("Error parsing data file, returning initial data", error);
        return INITIAL_DATA;
    }
}

export async function saveData(data: DashboardData) {
    await fs.writeFile(DATA_FILE_PATH, JSON.stringify(data, null, 2));
}

export async function addMatch(match: Match) {
    const data = await getData();
    data.matches.push(match);
    await saveData(data);
}

export async function updateMatch(updatedMatch: Match) {
    const data = await getData();
    const index = data.matches.findIndex(m => m.id === updatedMatch.id);
    if (index !== -1) {
        data.matches[index] = updatedMatch;
        await saveData(data);
    }
}

export async function getMatch(id: string) {
    const data = await getData();
    return data.matches.find(m => m.id === id);
}

export async function getParticipationsForMatch(matchId: string) {
    const data = await getData();
    return data.participations.filter(p => p.matchId === matchId);
}

export async function updateParticipation(participation: PlayerStats) {
    const data = await getData();
    const index = data.participations.findIndex(
        p => p.matchId === participation.matchId && p.playerId === participation.playerId
    );

    if (index !== -1) {
        data.participations[index] = participation;
    } else {
        data.participations.push(participation);
    }
    await saveData(data);
}

export async function getPlayers() {
    const data = await getData();
    return data.players;
}

export async function addPlayer(player: Player) {
    const data = await getData();
    if (!data.players.find(p => p.id === player.id)) {
        player.isActive = true;
        data.players.push(player);
        await saveData(data);
    }
}

export async function updatePlayer(player: Player) {
    const data = await getData();
    const index = data.players.findIndex(p => p.id === player.id);
    if (index !== -1) {
        data.players[index] = player;
        await saveData(data);
    }
}

export async function deleteMatch(id: string) {
    const data = await getData();
    data.matches = data.matches.filter(m => m.id !== id);
    data.participations = data.participations.filter(p => p.matchId !== id);
    await saveData(data);
}

export async function deleteParticipation(matchId: string, playerId: string) {
    const data = await getData();
    data.participations = data.participations.filter(
        p => !(p.matchId === matchId && p.playerId === playerId)
    );
    await saveData(data);
}

export async function getSpecialtyRules() {
    const data = await getData();
    return data.specialtyRules || [];
}

export async function getTraitRules() {
    const data = await getData();
    return data.traitRules || [];
}

export async function saveSpecialtyRule(rule: any) {
    const data = await getData();
    if (!data.specialtyRules) data.specialtyRules = [];
    const index = data.specialtyRules.findIndex((r: any) => r.id === rule.id);
    if (index !== -1) {
        data.specialtyRules[index] = rule;
    } else {
        data.specialtyRules.push(rule);
    }
    await saveData(data);
}

export async function saveTraitRule(rule: any) {
    const data = await getData();
    if (!data.traitRules) data.traitRules = [];
    const index = data.traitRules.findIndex((r: any) => r.id === rule.id);
    if (index !== -1) {
        data.traitRules[index] = rule;
    } else {
        data.traitRules.push(rule);
    }
    await saveData(data);
}

export async function deleteRule(id: string, type: 'specialty' | 'trait') {
    const data = await getData();
    if (type === 'specialty' && data.specialtyRules) {
        data.specialtyRules = data.specialtyRules.filter((r: any) => r.id !== id);
    } else if (type === 'trait' && data.traitRules) {
        data.traitRules = data.traitRules.filter((r: any) => r.id !== id);
    }
    await saveData(data);
}

export async function getSettings() {
    const data = await getData();
    return data.settings || { n8nWebhookUrl: '', whatsappGroupName: '' };
}

export async function saveSettings(settings: any) {
    const data = await getData();
    data.settings = settings;
    await saveData(data);
}

export async function getSeasons() {
    const data = await getData();
    return data.seasons || [];
}

export async function saveSeason(season: Season) {
    const data = await getData();
    if (!data.seasons) data.seasons = [];
    const index = data.seasons.findIndex(s => s.id === season.id);
    if (index !== -1) {
        data.seasons[index] = season;
    } else {
        data.seasons.push(season);
    }
    await saveData(data);
}

export async function deleteSeason(id: string) {
    const data = await getData();
    if (data.seasons) {
        data.seasons = data.seasons.filter(s => s.id !== id);
        if (data.activeSeasonId === id) {
            data.activeSeasonId = undefined;
        }
        await saveData(data);
    }
}

export async function getActiveSeasonId() {
    const data = await getData();
    return data.activeSeasonId;
}

export async function setActiveSeasonAction(id: string | undefined) {
    const data = await getData();
    data.activeSeasonId = id;
    await saveData(data);
}
