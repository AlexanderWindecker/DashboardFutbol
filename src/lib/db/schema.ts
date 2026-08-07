import { pgTable, text, timestamp, boolean, doublePrecision, integer, primaryKey } from 'drizzle-orm/pg-core';

export const players = pgTable('players', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    phone: text('phone'),
    isActive: boolean('is_active').default(true),
    isVacation: boolean('is_vacation').default(false),
    photo: text('photo'),
    skills: text('skills'), // JSON
    traits: text('traits'), // JSON
    positions: text('positions'), // JSON array
    preferredFoot: text('preferred_foot'),
    telegramId: text('telegram_id'),
    isInjured: boolean('is_injured').default(false),
    isEsporadico: boolean('is_esporadico').default(false),
    affinities: text('affinities'), // JSON array
    conflicts: text('conflicts'), // JSON array
});

export const matches = pgTable('matches', {
    id: text('id').primaryKey(),
    date: text('date').notNull(),
    location: text('location'),
    mode: text('mode'),
    result: text('result'),
    scoreCeleste: integer('score_celeste'),
    scoreAzul: integer('score_azul'),
    seasonId: text('season_id'),
    isSuperclasico: boolean('is_superclasico').default(false),
    weather: text('weather').default('Despejado'),
    createdAt: timestamp('created_at').defaultNow(),
});

export const participations = pgTable('participations', {
    matchId: text('match_id').notNull(),
    playerId: text('player_id').notNull(),
    team: text('team'),
    status: text('status').notNull(), // 'Attended', 'Confirmed', etc.
    goals: integer('goals').default(0),
    ownGoals: integer('own_goals').default(0),
    assists: integer('assists').default(0),
    isMvp: boolean('is_mvp').default(false),
    isBestGoalkeeper: boolean('is_best_goalkeeper').default(false),
    rating: doublePrecision('rating'),
    tacticalRole: text('tactical_role'),
    skillReasons: text('skill_reasons'), // JSON array of strings
    notes: text('notes'),
}, (table) => ({
    pk: primaryKey({ columns: [table.matchId, table.playerId] }),
}));

export const seasons = pgTable('seasons', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    startDate: text('start_date'),
    endDate: text('end_date'),
});

export const specialtyRules = pgTable('specialty_rules', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    type: text('type'),
    category: text('category'),
    conditions: text('conditions'), // JSON
    description: text('description'),
});

export const traitRules = pgTable('trait_rules', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    type: text('type'),
    conditions: text('conditions'), // JSON
});

export const settings = pgTable('settings', {
    key: text('key').primaryKey(),
    value: text('value'),
});
