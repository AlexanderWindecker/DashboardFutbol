import { db } from '../index';
import { players, matches, participations, seasons, settings, specialtyRules, traitRules } from '../schema';
import fs from 'fs/promises';
import path from 'path';

async function migrate() {
    console.log('--- Iniciando migración de datos ---');

    const dataPath = path.join(process.cwd(), 'data.json');
    const fileContent = await fs.readFile(dataPath, 'utf-8');
    const data = JSON.parse(fileContent);

    // 1. Migrar Temporadas
    console.log('Migrando temporadas...');
    for (const season of data.seasons) {
        await db.insert(seasons).values(season).onConflictDoNothing();
    }

    // 2. Migrar Jugadores
    console.log('Migrando jugadores...');
    for (const p of data.players) {
        await db.insert(players).values({
            ...p,
            skills: JSON.stringify(p.skills),
            traits: JSON.stringify(p.traits),
        }).onConflictDoNothing();
    }

    // 3. Migrar Partidos
    console.log('Migrando partidos...');
    for (const match of data.matches) {
        await db.insert(matches).values(match).onConflictDoNothing();
    }

    // 4. Migrar Participaciones
    console.log('Migrando participaciones...');
    for (const part of data.participations) {
        await db.insert(participations).values(part).onConflictDoNothing();
    }

    // 5. Migrar Reglas de Especialidad
    console.log('Migrando reglas de especialidad...');
    if (data.specialtyRules) {
        for (const rule of data.specialtyRules) {
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
    }

    // 6. Migrar Reglas de Rasgos
    console.log('Migrando reglas de rasgos...');
    if (data.traitRules) {
        for (const rule of data.traitRules) {
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
    }

    // 7. Migrar Settings
    console.log('Migrando settings...');
    if (data.settings) {
        for (const [key, value] of Object.entries(data.settings)) {
            await db.insert(settings).values({ key, value: String(value) }).onConflictDoUpdate({
                target: settings.key,
                set: { value: String(value) }
            });
        }
    }

    console.log('--- Migración completada con éxito ---');
}

migrate().catch(console.error);
