import { NextRequest, NextResponse } from 'next/server';
import { getPlayers, updateParticipation, getParticipationsForMatch, updatePlayer, getData } from '@/lib/data';
import { revalidatePath } from 'next/cache';
import { ParticipationStatus } from '@/types';
import fs from 'fs';
import path from 'path';

export async function GET() {
    return NextResponse.json({ status: 'Webhook endpoint is active and waiting for POST requests' });
}

function logToFile(message: string) {
    const logPath = path.join(process.cwd(), 'webhook_logs.txt');
    const timestamp = new Date().toLocaleString();
    fs.appendFileSync(logPath, `[${timestamp}] ${message}\n`);
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        console.log('Incoming webhook confirmation:', body);
        logToFile(`Incoming: ${JSON.stringify(body)}`);

        const { matchId, playerName, action, telegramId } = body;

        if (!matchId || !playerName) {
            return NextResponse.json({ error: 'Faltan parámetros matchId o playerName' }, { status: 400 });
        }

        const players = await getPlayers();
        const actionStr = String(action).trim().toLowerCase();

        // Remove @botname suffix if present (e.g. /ayuda@botname -> /ayuda)
        let normalizedAction = actionStr.split('@')[0];
        const cleanAction = normalizedAction.startsWith('/') ? normalizedAction.substring(1) : normalizedAction;

        // --- NEW: Handle Commands ---

        // 1. HELP COMMAND
        if (cleanAction === 'ayuda' || cleanAction === 'help') {
            const helpMsg = `📖 *Comandos Disponibles:*\n\n` +
                `• *1* o *si*: Confirma asistencia.\n` +
                `• *2* o *no*: Cancela asistencia.\n` +
                `• */soy [Nombre]*: Vincula tu cuenta.\n` +
                `• */perfil*: Mira tus estadísticas.\n` +
                `• */ranking*: Top 5 de mejores jugadores.\n` +
                `• */proximo*: Info del próximo partido.\n` +
                `• */equipos*: Equipos del partido actual.\n` +
                `• */rachas*: Los más ganadores del momento.\n` +
                `• */ayuda*: Muestra este mensaje.`;
            return NextResponse.json({ success: true, message: helpMsg });
        }

        // 2. PROFILE COMMAND
        if (cleanAction === 'perfil' || cleanAction === 'status') {
            if (!telegramId) {
                return NextResponse.json({ error: 'Para ver tu perfil necesito tu ID de Telegram (usa /soy primero).' }, { status: 400 });
            }

            const player = players.find(p => p.telegramId === String(telegramId));
            if (!player) {
                return NextResponse.json({ error: 'Tu cuenta de Telegram no está vinculada. Usa /soy [TuNombre] para vincularla.' }, { status: 404 });
            }

            const { participations, activeSeasonId, matches: allMatches } = await getData();
            const seasonMatchIds = activeSeasonId
                ? new Set(allMatches.filter(m => m.seasonId === activeSeasonId).map(m => m.id))
                : null;

            const pParts = participations.filter((p: any) => {
                if (p.playerId !== player.id) return false;
                if (seasonMatchIds && !seasonMatchIds.has(p.matchId)) return false;
                return true;
            });

            const attended = pParts.filter((p: any) => p.status === 'Attended').length;
            const mvps = pParts.filter((p: any) => p.isMvp).length;

            const skills = player.skills;
            const generalAvg = skills
                ? Math.round((skills.ritmo + skills.tiros + skills.regates + skills.velocidad + skills.pases) / 5)
                : '?';

            const profileMsg = `👤 *Perfil de ${player.name}:*\n\n` +
                `⚽ Partidos jugados: ${attended}\n` +
                `🏆 MVPs ganados: ${mvps}\n` +
                `⭐ Puntuación media: ${generalAvg}\n` +
                `🧤 Posiciones: ${player.positions?.join(', ') || 'N/A'}`;
            return NextResponse.json({ success: true, message: profileMsg });
        }

        // 3. RANKING COMMAND
        if (cleanAction === 'ranking') {
            const { activeSeasonId, matches: allMatches, participations, seasons } = await getData();
            const activeSeason = seasons?.find(s => s.id === activeSeasonId);

            const seasonMatchIds = activeSeasonId
                ? new Set(allMatches.filter(m => m.seasonId === activeSeasonId).map(m => m.id))
                : null;

            const filteredParticipations = seasonMatchIds
                ? participations.filter(p => seasonMatchIds.has(p.matchId))
                : participations;

            const sortedBySkill = [...players]
                .filter(p => p.isActive !== false)
                .map(p => {
                    const pParts = filteredParticipations.filter(part => part.playerId === p.id && part.status === 'Attended');
                    if (pParts.length === 0) return null;

                    const wins = pParts.filter(part => {
                        const m = allMatches.find(match => match.id === part.matchId);
                        return m?.result === part.team;
                    }).length;

                    const wr = Math.round((wins / pParts.length) * 100);
                    const mvps = pParts.filter(part => part.isMvp).length;

                    return { name: p.name, wr, mvps, attended: pParts.length };
                })
                .filter(p => p !== null && p.attended >= 2)
                .sort((a: any, b: any) => b.wr - a.wr || b.mvps - a.mvps)
                .slice(0, 5);

            let rankingMsg = activeSeason
                ? `🏆 *RANKING: ${activeSeason.name}*\n_(Mínimo 2 partidos)_\n\n`
                : `🏆 *RANKING HISTÓRICO*\n\n`;

            if (sortedBySkill.length === 0) {
                rankingMsg += `_No hay datos suficientes aún._`;
            } else {
                sortedBySkill.forEach((p: any, i) => {
                    const medal = i === 0 ? '🥇' : (i === 1 ? '🥈' : (i === 2 ? '🥉' : '🔹'));
                    rankingMsg += `${medal} *${p.name}*: ${p.wr}% Eficacia (${p.mvps} ⭐)\n`;
                });
            }

            return NextResponse.json({ success: true, message: rankingMsg });
        }

        // 4. PROXIMO COMMAND
        if (cleanAction === 'proximo') {
            const { matches, participations } = await getData();
            const now = new Date();
            now.setHours(0, 0, 0, 0); // Reset time to compare only dates

            const upcoming = matches
                .filter(m => new Date(m.date) >= now)
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

            if (!upcoming) {
                return NextResponse.json({ success: true, message: '📭 No hay partidos programados próximamente.' });
            }

            const confirmedCount = participations.filter(p => p.matchId === upcoming.id && (p.status === 'Confirmed' || p.status === 'Attended')).length;
            const dateStr = new Date(upcoming.date).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });

            const proximoMsg = `📅 *Próximo Partido:*\n\n` +
                `🗓️ *Fecha:* ${dateStr}\n` +
                `📍 *Lugar:* ${upcoming.location || 'A definir'}\n` +
                `👥 *Confirmados:* ${confirmedCount} jugadores\n\n` +
                `¡Mandá un *1* para sumarte!`;
            return NextResponse.json({ success: true, message: proximoMsg });
        }

        // 5. EQUIPOS COMMAND
        if (cleanAction === 'equipos') {
            const { matches, participations } = await getData();

            // Try to use matchId from body or find the closest match
            let currentMatch = matches.find(m => m.id === matchId);

            if (!currentMatch) {
                const now = new Date();
                now.setHours(0, 0, 0, 0);
                currentMatch = matches
                    .filter(m => new Date(m.date) >= now)
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
            }

            if (!currentMatch) {
                return NextResponse.json({ success: true, message: '📭 No hay equipos porque no encontré ningún partido próximo.' });
            }

            const inMatch = participations.filter(p => p.matchId === currentMatch!.id && (p.status === 'Confirmed' || p.status === 'Attended'));
            const team1 = inMatch.filter(p => p.team === 'Celeste').map(p => players.find(pl => pl.id === p.playerId)?.name || 'Anónimo');
            const team2 = inMatch.filter(p => p.team === 'Azul').map(p => players.find(pl => pl.id === p.playerId)?.name || 'Anónimo');

            let equiposMsg = `⚔️ *Equipos para el ${new Date(currentMatch.date).toLocaleDateString()}:*\n\n` +
                `👕 *Celeste:* \n${team1.length > 0 ? `• ${team1.join('\n• ')}` : '_Sin jugadores_'}\n\n` +
                `👕 *Azul:* \n${team2.length > 0 ? `• ${team2.join('\n• ')}` : '_Sin jugadores_'}`;

            return NextResponse.json({ success: true, message: equiposMsg });
        }

        // 6. RACHAS COMMAND
        if (cleanAction === 'rachas') {
            const { matches: allMatches, participations, activeSeasonId } = await getData();

            const seasonMatchIds = activeSeasonId
                ? new Set(allMatches.filter(m => m.seasonId === activeSeasonId).map(m => m.id))
                : null;

            // Calculate streaks for each player
            const streaks = players.map(player => {
                const playerParts = participations
                    .filter(p => p.playerId === player.id && p.status === 'Attended' && (!seasonMatchIds || seasonMatchIds.has(p.matchId)))
                    .map(p => {
                        const m = allMatches.find(match => match.id === p.matchId);
                        return { date: m?.date || '', win: m?.result === p.team };
                    })
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                let currentStreak = 0;
                for (const p of playerParts) {
                    if (p.win) currentStreak++;
                    else break;
                }
                return { name: player.name, streak: currentStreak };
            })
                .filter(s => s.streak > 0)
                .sort((a, b) => b.streak - a.streak)
                .slice(0, 3);

            if (streaks.length === 0) {
                return NextResponse.json({ success: true, message: '🔥 Todavía nadie tiene una racha activa de victorias.' });
            }

            let rachasMsg = `🔥 *Los más ganadores (Racha actual):*\n\n`;
            streaks.forEach((s, i) => {
                const fire = '🔥'.repeat(s.streak);
                rachasMsg += `${i + 1}. *${s.name}*: ${s.streak} victorias seguidas ${fire}\n`;
            });

            return NextResponse.json({ success: true, message: rachasMsg });
        }

        // 3. REGISTRATION COMMAND (These work even without a match)
        if (cleanAction.startsWith('soy') || cleanAction.startsWith('registrar')) {
            if (!telegramId) {
                return NextResponse.json({ error: 'No se recibió telegramId para registrar' }, { status: 400 });
            }

            // Extract name from command (e.g., "/soy Kevin" or "soy Kevin")
            const parts = actionStr.split(' ');
            let nameToLink = parts.length > 1 ? parts.slice(1).join(' ').trim() : playerName;

            const cleanLinkingName = nameToLink.toLowerCase().replace(/[^\w\s]|_/g, "").trim();

            const playerToLink = players.find(p =>
                p.name.toLowerCase().replace(/[^\w\s]|_/g, "").trim() === cleanLinkingName
            );

            if (!playerToLink) {
                return NextResponse.json({ error: `No encontré ningún jugador llamado "${nameToLink}" para vincular.` }, { status: 404 });
            }

            // Link the ID
            playerToLink.telegramId = String(telegramId);
            await updatePlayer(playerToLink);

            const msg = `✅ *¡Vinculación Exitosa!*\n\nTu cuenta de Telegram ahora está unida a *${playerToLink.name}*.\n\nYa podés confirmar mandando un '1'.`;
            logToFile(msg);
            return NextResponse.json({ success: true, message: msg });
        }

        // --- MATCH VALIDATION (For 1, 2, 3, 4, 5) ---
        const { matches } = await getData();
        const activeMatch = matches.find(m => m.id === matchId);

        if (!activeMatch) {
            return NextResponse.json({
                success: true,
                message: `⚠️ No hay ningún partido activo a la vista para confirmar ahora.`
            });
        }

        // 1. Map numbered actions
        // 1: Confirmado, 2: Declined, 3: Attended, 4: LateCancel, 5: Absent
        let newStatus: ParticipationStatus | null = null;

        // Strict number matching or specific keywords
        if (actionStr === '1' || actionStr === 'si' || actionStr === 'confirmado' || actionStr === 'confirmo') {
            newStatus = 'Confirmed';
        } else if (actionStr === '2' || actionStr === 'no' || actionStr === 'no voy' || actionStr === 'cancel' || actionStr === 'me bajo') {
            newStatus = 'Declined';
        } else if (actionStr === '3') {
            newStatus = 'Attended';
        } else if (actionStr === '4' || actionStr === 'baja') {
            newStatus = 'LateCancel';
        } else if (actionStr === '5' || actionStr === 'ausente') {
            newStatus = 'Absent';
        }

        if (!newStatus) {
            const ignoreMsg = `Acción no reconocida: "${actionStr}"`;
            console.log(ignoreMsg);
            logToFile(ignoreMsg);

            // Return 200 instead of 400 to avoid n8n "red" error, but with a helpful message
            return NextResponse.json({
                success: true,
                message: `🤔 No entendí esa opción. Escribí */ayuda* para ver qué puedo hacer.`
            });
        }

        // 2. Normalize search name and phone
        const cleanName = (n: string) => n.toLowerCase()
            .replace(/[^\w\s]|_/g, "") // Remueve emojis y símbolos
            .replace(/\s+/g, " ")       // Normaliza espacios
            .trim();

        const searchName = cleanName(playerName);
        const normalizePhone = (p: string) => p.replace(/\D/g, ''); // Deja solo números
        const searchPhone = body.phone ? normalizePhone(String(body.phone)) : null;

        const debugMsg = `Searching for player: "${searchName}" (ID: ${telegramId || 'N/A'})${searchPhone ? ` or phone: "${searchPhone}"` : ''}`;
        console.log(debugMsg);
        logToFile(debugMsg);

        // 3. Try to find the player by Telegram ID first, then phone, then name
        // Prioritize active players
        const sortedPlayers = [...players].sort((a, b) => {
            const activeA = a.isActive !== false ? 1 : 0;
            const activeB = b.isActive !== false ? 1 : 0;
            return activeB - activeA;
        });

        const player = sortedPlayers.find(p => {
            // A. Match by Telegram ID (MOST ACCURATE)
            if (telegramId && p.telegramId === String(telegramId)) {
                console.log(`Matched player by Telegram ID: "${p.name}"`);
                return true;
            }

            // B. Match by phone if provided
            if (searchPhone && p.phone && normalizePhone(p.phone) === searchPhone) {
                console.log(`Matched player by phone: "${p.name}" (ID: ${p.id})`);
                return true;
            }

            // C. Fallback to name matching
            const dpName = cleanName(p.name);
            const nameMatches = dpName === searchName ||
                searchName.includes(dpName) ||
                dpName.includes(searchName);

            if (nameMatches) {
                const matchMsg = `Matched player by name: "${p.name}" (ID: ${p.id}, Active: ${p.isActive !== false})`;
                console.log(matchMsg);
                logToFile(matchMsg);
            }
            return nameMatches;
        });

        if (!player) {
            const errorMsg = `Player not found in list. Available names: ${players.map(p => `"${p.name}"`).join(', ')}`;
            console.log(errorMsg);
            logToFile(errorMsg);
            return NextResponse.json({ error: `Jugador no encontrado: ${playerName}` }, { status: 404 });
        }

        const participations = await getParticipationsForMatch(matchId);
        let current = participations.find(p => p.playerId === player.id);

        if (!current) {
            current = {
                matchId,
                playerId: player.id,
                team: null,
                status: newStatus,
                assists: 0,
                isMvp: false,
            };
        } else {
            current.status = newStatus;
        }

        await updateParticipation(current);

        // Revalidate the pages to show the change
        revalidatePath(`/matches/${matchId}`);
        revalidatePath('/matches');

        let responseMsg = `Jugador ${player.name} actualizado a ${newStatus}`;
        if (newStatus === 'Confirmed') {
            responseMsg = `✅ *${player.name}* está firme como rulo de muñeca.`;
        } else if (newStatus === 'Declined') {
            responseMsg = `❌ *${player.name}* abandonó el barco y no juega.`;
        } else if (newStatus === 'Attended') {
            responseMsg = `🏃‍♂️ *${player.name}* ya está en la cancha con los botines puestos.`;
        } else if (newStatus === 'LateCancel') {
            responseMsg = `💣 *${player.name}* tiró la bomba sobre la hora y se bajó.`;
        } else if (newStatus === 'Absent') {
            responseMsg = `👻 ¡Faltazo olímpico de *${player.name}*! Ni rastro de él.`;
        }

        return NextResponse.json({
            success: true,
            message: responseMsg,
            player: player.name,
            status: newStatus
        });

    } catch (error) {
        console.error('Error en webhook:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
