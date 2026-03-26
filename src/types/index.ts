export type MatchMode = '6v6' | '7v7' | '8v8' | '9v9';
export type Team = 'Celeste' | 'Azul' | null;
export type MatchResult = 'Celeste' | 'Azul' | 'Empate';
export type ParticipationStatus = 'Confirmed' | 'Declined' | 'Attended' | 'LateCancel' | 'Absent';
export interface AppSettings {
    n8nWebhookUrl?: string;
    whatsappGroupName?: string;
    telegramWebhookUrl?: string;
    telegramGroupName?: string;
    team1Name?: string; // Overrides 'Celeste'
    team2Name?: string; // Overrides 'Azul'
    elitePlayerIds?: string[]; // IDs of the 6 players for Superclasico (Union of both teams)
    team1EliteIds?: string[]; // IDs of Captain 1's teammates (exactly 3 including captain)
    team2EliteIds?: string[]; // IDs of Captain 2's teammates (exactly 3 including captain)
    captain1Id?: string; // ID of Captain 1
    captain2Id?: string; // ID of Captain 2
}

export type SkillKey = 'ritmo' | 'tiros' | 'regates' | 'velocidad' | 'pases' | 'average' | 'matchesAttended' | 'mvpCount';
export type RuleOperator = '>' | '>=' | '<' | '<=' | '==';

export interface RuleCondition {
    skill: SkillKey;
    operator: RuleOperator;
    value: number;
}

export interface CustomRule {
    id: string;
    name: string;
    conditions: RuleCondition[];
    type: 'specialty' | 'trait';
    category?: 'stats' | 'team' | 'high' | 'playstyle' | 'low';
    description?: string;
    color?: string;
}

export interface Player {
    id: string;
    name: string;
    isActive?: boolean; // Default true
    positions?: ('Delantero' | 'Mediocampista' | 'Defensor' | 'Arquero')[];
    preferredFoot?: 'Derecho' | 'Zurdo' | 'Ambidiestro';
    skills?: {
        ritmo: number;
        tiros: number;
        pases: number;
        regates: number;
        velocidad: number;
        deltas?: {
            ritmo: number;
            tiros: number;
            pases: number;
            regates: number;
            velocidad: number;
        };
        // GK Specific
        reflejos?: number;
        posicionamiento?: number; // Ubicacion
        estirada?: number;
        saque?: number;
        seguridad?: number; // Manos
    };
    traits?: string[];
    isInjured?: boolean;
    isVacation?: boolean;
    phone?: string;
    telegramId?: string;
    affinities?: string[]; // Player IDs who should be in the same team
    conflicts?: string[];  // Player IDs who should be in opposite teams
}

export interface PlayerStats {
    matchId: string;
    playerId: string;
    team: Team;
    status: ParticipationStatus;
    tacticalRole?: 'Arquero' | 'Defensor' | 'Mediocampista' | 'Delantero' | 'Suplente' | null;
    assists: number;
    goals?: number;
    rating?: number;
    isMvp: boolean; // MVP of their team
    skillReasons?: string[]; // Log of why skills changed
    notes?: string;
}

export interface Season {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
}

export interface Match {
    id: string;
    date: string; // ISO string
    mode: MatchMode;
    result?: MatchResult;
    matchMvpId?: string; // Overall MVP
    matchMvpTeam?: Team; // Just to help with UI potentially
    notes?: string;
    location?: string;
    seasonId?: string;
    isSuperclasico?: boolean;
}

export interface DashboardData {
    players: Player[];
    matches: Match[];
    participations: PlayerStats[];
    specialtyRules?: CustomRule[];
    traitRules?: CustomRule[];
    settings?: AppSettings;
    seasons?: Season[];
    activeSeasonId?: string;
}
