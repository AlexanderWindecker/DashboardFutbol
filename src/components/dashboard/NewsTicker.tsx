import { DashboardData } from '@/types';
import { TickerMarquee } from '../ui/TickerMarquee';
import { Trophy, Flame, TrendingUp, Sparkles } from 'lucide-react';
import { ReactNode } from 'react';

interface NewsTickerProps {
    data: DashboardData;
}

export function NewsTicker({ data }: NewsTickerProps) {
    const { players, matches, participations, activeSeasonId, settings } = data;

    const playedMatches = matches
        .filter(m => !!m.result)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const pendingMatches = matches
        .filter(m => !m.result && new Date(m.date) >= new Date(new Date().setHours(0,0,0,0)))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const upcomingMatch = pendingMatches.length > 0 ? pendingMatches[0] : null;

    const items: ReactNode[] = [];

    // --- 0. Top 3 Global Rating & Ranking Ups ---
    const globalRatings = players
        .filter(p => p.isActive !== false) // Only active players
        .map(p => {
            const s = p.skills as any;
            if (!s) return null;
            const isGk = p.positions?.includes('Arquero') && p.positions?.length === 1;
            const currentAvg = isGk 
                ? Math.round(((s.reflejos || 50) + (s.posicionamiento || 50) + (s.estirada || 50) + (s.saque || 50) + (s.seguridad || 50)) / 5)
                : Math.round(((s.ritmo || 50) + (s.velocidad || 50) + (s.tiros || 50) + (s.pases || 50) + (s.regates || 50)) / 5);
            
            const d = s.deltas as any;
            const deltaAvg = d ? (
                isGk 
                    ? ((d.reflejos || 0) + (d.posicionamiento || 0) + (d.estirada || 0) + (d.saque || 0) + (d.seguridad || 0)) / 5
                    : ((d.ritmo || 0) + (d.velocidad || 0) + (d.tiros || 0) + (d.pases || 0) + (d.regates || 0)) / 5
            ) : 0;

            const prevAvg = currentAvg - deltaAvg;
            
            return { id: p.id, name: p.name, currentAvg, prevAvg };
        }).filter(Boolean) as { id: string, name: string, currentAvg: number, prevAvg: number }[];

    // Sort mappings
    const currentRankings = [...globalRatings].sort((a, b) => b.currentAvg - a.currentAvg);
    const prevRankings = [...globalRatings].sort((a, b) => b.prevAvg - a.prevAvg);

    const top3Ratings = currentRankings.slice(0, 3);
    if (top3Ratings.length > 0) {
        items.push(
            <span className="flex items-center gap-2" key="top-rating">
                <Trophy className="text-violet-400" size={18} />
                <span className="text-violet-400 font-black">TOP RATING GLOBAL:</span>
                <span className="text-white">🥇 {top3Ratings[0]?.name} <span className="text-violet-300 font-bold">({top3Ratings[0]?.currentAvg})</span></span>
                {top3Ratings[1] && <span className="text-slate-400">| 🥈 {top3Ratings[1].name} ({top3Ratings[1].currentAvg})</span>}
                {top3Ratings[2] && <span className="text-slate-400">| 🥉 {top3Ratings[2].name} ({top3Ratings[2].currentAvg})</span>}
            </span>
        );

        // Check for Rank Ups in the Top 3
        top3Ratings.forEach((player, currentIndex) => {
            const prevIndex = prevRankings.findIndex(p => p.id === player.id);
            if (prevIndex > currentIndex) {
                const placesMoved = prevIndex - currentIndex;
                const positionText = currentIndex === 0 ? "al #1" : `al puesto #${currentIndex + 1}`;
                items.push(
                    <span className="flex items-center gap-2" key={`rank-up-${player.id}`}>
                        <TrendingUp className="text-emerald-400" size={18} />
                        <span className="text-emerald-400 font-black">📈 RANKING UP:</span>
                        <span className="text-white">
                            {player.name} escaló {placesMoved} lugar(es) y llegó {positionText} del equipo!
                        </span>
                    </span>
                );
            }
        });
    }

    // --- 1. Top 3 Goleadores ---
    const playerGoals = new Map<string, number>();
    const relevantParticipations = activeSeasonId 
        ? participations.filter(p => {
            const m = matches.find(match => match.id === p.matchId);
            return m?.seasonId === activeSeasonId;
        })
        : participations;

    relevantParticipations.forEach(p => {
        if (p.goals && p.goals > 0) {
            playerGoals.set(p.playerId, (playerGoals.get(p.playerId) || 0) + p.goals);
        }
    });

    const sortedScorers = Array.from(playerGoals.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([playerId, goals]) => {
            const p = players.find(x => x.id === playerId);
            return { name: p?.name || 'Desconocido', goals };
        });

    if (sortedScorers.length > 0) {
        const top1 = sortedScorers[0];
        const top2 = sortedScorers[1];
        const top3 = sortedScorers[2];
        
        items.push(
            <span className="flex items-center gap-2">
                <Flame className="text-amber-500" size={18} />
                <span className="text-amber-500 font-black">GOLEADORES:</span>
                <span className="text-white">🥇 {top1.name} <span className="text-amber-400">({top1.goals})</span></span>
                {top2 && <span className="text-slate-400">| 🥈 {top2.name} ({top2.goals})</span>}
                {top3 && <span className="text-slate-400">| 🥉 {top3.name} ({top3.goals})</span>}
            </span>
        );
    }

    // --- 2. Último MVP (Partido más reciente) y On Fire ---
    if (playedMatches.length > 0) {
        const lastMatch = playedMatches[0];
        const lastMatchParts = participations.filter(p => p.matchId === lastMatch.id);
        
        // MVPs del partido
        const mvpNames = lastMatchParts
            .filter(p => p.isMvp)
            .map(p => players.find(pl => pl.id === p.playerId)?.name)
            .filter(Boolean);

        if (mvpNames.length > 0) {
            items.push(
                <span className="flex items-center gap-2" key="last-mvp">
                    <Trophy className="text-yellow-400" size={18} />
                    <span className="text-yellow-400 font-black">MVP DEL PARTIDO ANTERIOR:</span>
                    <span className="text-white">{mvpNames.join(' y ')}</span>
                </span>
            );
        }

        // Goleador(es) del partido (On Fire)
        const maxGoals = Math.max(...lastMatchParts.map(p => p.goals || 0));
        if (maxGoals > 0) {
            const topScorersLastMatch = lastMatchParts
                .filter(p => (p.goals || 0) === maxGoals)
                .map(p => players.find(pl => pl.id === p.playerId)?.name)
                .filter(Boolean);
            
            if (topScorersLastMatch.length > 0) {
                const isTie = topScorersLastMatch.length > 1;
                
                // Join names properly: "A y B" or "A, B y C"
                let namesText = topScorersLastMatch.join(', ');
                if (topScorersLastMatch.length > 1) {
                    const last = topScorersLastMatch.pop();
                    namesText = topScorersLastMatch.join(', ') + ' y ' + last;
                }
                
                let messageOptions: string[] = [];
                
                if (isTie) {
                    messageOptions = [
                        `${namesText} compartieron el podio de artilleros con ${maxGoals} goles cada uno`,
                        `¡Empate en la cima! ${namesText} fueron los máximos goleadores facturando ${maxGoals} veces`,
                        `${namesText} se cansaron de mojar y lideraron la tabla con ${maxGoals} goles`,
                        `La bota de oro se divide esta semana entre ${namesText} (${maxGoals} goles)`,
                        `${namesText} fueron la verdadera pesadilla de los arqueros: ${maxGoals} pepas para cada uno`,
                        `Lluvia de goles cortesía de ${namesText}, compartiendo la cima con ${maxGoals} tantos`,
                        `¡Intratables! ${namesText} cerraron la fecha en lo más alto con ${maxGoals} goles`
                    ];
                } else {
                    messageOptions = [
                        `${namesText} con el arco entre ceja y ceja (${maxGoals} goles en el último partido)`,
                        `${namesText} anduvo endiablado marcando ${maxGoals} pepas para su equipo`,
                        `No lo pudieron parar: ${namesText} se llevó el botín de oro con ${maxGoals} goles`,
                        `¡Peligro de gol! ${namesText} facturó por ${maxGoals} en la última fecha`,
                        `La red todavía está temblando. ${namesText} clavó ${maxGoals} goles redonditos`,
                        `El pichichi indiscutido de la fecha fue ${namesText} con una ráfaga de ${maxGoals} tantos`,
                        `${namesText} estuvo en modo bestia y lideró la tabla en solitario con ${maxGoals} goles`
                    ];
                }
                
                // Deterministic pseudo-random based on match ID to avoid flicker on re-renders
                const hash = lastMatch.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                const randomIdx = (hash + maxGoals) % messageOptions.length;
                const selectedMessage = messageOptions[randomIdx];

                items.push(
                    <span className="flex items-center gap-2" key="on-fire">
                        <Flame className="text-orange-500 animate-pulse" size={18} />
                        <span className="text-orange-400 font-black italic">🔥 ON FIRE:</span>
                        <span className="text-white">
                            {selectedMessage}
                        </span>
                    </span>
                );
            }
        }
    }

    // --- 3. Top 3 MVPs Históricos ---
    const playerMvps = new Map<string, number>();
    relevantParticipations.forEach(p => {
        if (p.isMvp) {
            playerMvps.set(p.playerId, (playerMvps.get(p.playerId) || 0) + 1);
        }
    });

    const sortedMvps = Array.from(playerMvps.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([playerId, mvpCount]) => {
            const p = players.find(x => x.id === playerId);
            return { name: p?.name || 'Desconocido', mvps: mvpCount };
        });

    if (sortedMvps.length > 0) {
        const top1Mvp = sortedMvps[0];
        const top2Mvp = sortedMvps[1];
        const top3Mvp = sortedMvps[2];
        
        items.push(
            <span className="flex items-center gap-2" key="mvps">
                <Trophy className="text-yellow-400" size={18} />
                <span className="text-yellow-400 font-black">TOP MVPs:</span>
                <span className="text-white">🥇 {top1Mvp.name} <span className="text-yellow-500 font-bold">({top1Mvp.mvps})</span></span>
                {top2Mvp && <span className="text-slate-400">| 🥈 {top2Mvp.name} ({top2Mvp.mvps})</span>}
                {top3Mvp && <span className="text-slate-400">| 🥉 {top3Mvp.name} ({top3Mvp.mvps})</span>}
            </span>
        );
    }

    // --- 3. Racha de Equipo Actual ---
    // Count consecutive wins for Celeste vs Azul in recent matches
    let currentStreak = 0;
    let streakTeam: 'Celeste' | 'Azul' | null = null;
    
    for (const match of playedMatches) {
        if (match.result === 'Empate') break; // Streak broken
        
        if (streakTeam === null && (match.result === 'Celeste' || match.result === 'Azul')) {
            streakTeam = match.result;
            currentStreak = 1;
        } else if (match.result === streakTeam) {
            currentStreak++;
        } else {
            break; // Streak broken by the other team winning
        }
    }

    if (currentStreak >= 2 && streakTeam) {
        const teamName = streakTeam === 'Celeste' ? (settings?.team1Name || 'Celeste') : (settings?.team2Name || 'Azul');
        const colorClass = streakTeam === 'Celeste' ? 'text-sky-400' : 'text-blue-500';
        
        items.push(
            <span className="flex items-center gap-2" key="team-streak">
                <TrendingUp className={colorClass} size={18} />
                <span className={`${colorClass} font-black`}>RACHA ACTIVA:</span>
                <span className="text-white">Equipo {teamName} con {currentStreak} victorias al hilo 🔥</span>
            </span>
        );
    }

    // --- 3.5. Player Streak Breakers (Rachas Rompidas) ---
    // We check if any player broke a Win/Loss streak in the LAST match.
    if (playedMatches.length > 1) { // We need at least 2 matches to have a "previous" streak
        const lastMatch = playedMatches[0];
        const prevMatches = playedMatches.slice(1);
        
        const lastMatchParts = participations.filter(p => p.matchId === lastMatch.id);
        const streakBreakerNames: string[] = [];
        
        lastMatchParts.forEach(p => {
            const playerTeam = p.team;
            if (!playerTeam || lastMatch.result === 'Empate') return;
            
            const wonLastMatch = lastMatch.result === playerTeam;
            
            // Reconstruct streak BEFORE this match
            let historicalStreakType: 'Win' | 'Loss' | null = null;
            let historicalStreakCount = 0;
            
            for (const m of prevMatches) {
                if (m.result === 'Empate') break; // Draws break streaks
                
                const part = participations.find(part => part.matchId === m.id && part.playerId === p.playerId);
                if (!part || !part.team) continue; // Didn't play or no team
                
                const wonThisMatch = m.result === part.team;
                
                if (historicalStreakType === null) {
                    historicalStreakType = wonThisMatch ? 'Win' : 'Loss';
                    historicalStreakCount = 1;
                } else if ((wonThisMatch && historicalStreakType === 'Win') || (!wonThisMatch && historicalStreakType === 'Loss')) {
                    historicalStreakCount++;
                } else {
                    break; // Streak history ended
                }
            }
            
            // Check if streak was >= 3 and broken
            if (historicalStreakCount >= 3) {
                const playerName = players.find(x => x.id === p.playerId)?.name || 'Jugador';
                if (historicalStreakType === 'Win' && !wonLastMatch) {
                    streakBreakerNames.push(`❌ ${playerName} cortó su racha de ${historicalStreakCount} victorias al hilo`);
                } else if (historicalStreakType === 'Loss' && wonLastMatch) {
                    streakBreakerNames.push(`✅ ¡Atención! ${playerName} cortó su racha negativa de ${historicalStreakCount} derrotas`);
                }
            }
        });
        
        streakBreakerNames.forEach(msg => {
            items.push(
                <span className="flex items-center gap-2" key={msg}>
                    <TrendingUp className="text-pink-500 animate-pulse" size={18} />
                    <span className="text-pink-400 font-black italic">FIN DE RACHA:</span>
                    <span className="text-white">{msg}</span>
                </span>
            );
        });
    }

    // --- 4. Bajas del Próximo Partido ---
    if (upcomingMatch) {
        const dropouts = participations.filter(p => 
            p.matchId === upcomingMatch.id && 
            (p.status === 'Declined' || p.status === 'LateCancel' || p.status === 'Absent')
        );

        if (dropouts.length > 0) {
            const dropoutNames = dropouts
                .map(p => players.find(pl => pl.id === p.playerId)?.name)
                .filter(Boolean);

            items.push(
                <span className="flex items-center gap-2" key="dropouts">
                    <span className="text-red-500 font-bold animate-pulse text-lg">🚨</span>
                    <span className="text-red-400 font-black">ÚLTIMO MOMENTO:</span>
                    <span className="text-white bg-red-500/20 px-2 rounded-md">
                        Baja confirmada de {dropoutNames.join(', ')} para el próximo partido.
                    </span>
                </span>
            );
        }
    }

    // --- 4. Intocables (Asistencia Perfecta) ---
    const intocables = players
        .filter(p => p.isActive !== false && (p.skills as any)?.streak >= 5)
        .map(p => p.name || 'Jugador');
    
    if (intocables.length > 0) {
        items.push(
            <span className="flex items-center gap-2" key="intocables">
                <Sparkles className="text-cyan-400" size={18} />
                <span className="text-cyan-400 font-black">🦾 INTOCABLES:</span>
                <span className="text-white">
                    {intocables.join(', ')} llevan asistencia perfecta (+5 partidos al hilo). ¡Fierros!
                </span>
            </span>
        );
    }

    // --- 5. Pólvora Mojada (Sequía >= 2) ---
    const sequia = players
        .filter(p => {
            if (p.isActive === false || p.isInjured || p.isVacation) return false;
            const isGk = p.positions?.includes('Arquero') && p.positions?.length === 1;
            if (isGk) return false; // Excluimos arqueros puros
            
            const drought = (p.skills as any)?.goalDrought || 0;
            return drought >= 2;
        })
        .map(p => p.name || 'Jugador');

    if (sequia.length > 0) {
        items.push(
            <span className="flex items-center gap-2" key="polvora-mojada">
                <span className="text-orange-500 font-bold text-lg leading-none">🌵</span>
                <span className="text-orange-400 font-black">PÓLVORA MOJADA:</span>
                <span className="text-white">
                    {sequia.join(', ')} acumulan varios partidos sin tocar la red... ¿romperán la mala racha?
                </span>
            </span>
        );
    }

    // --- 6. Desaparecidos (Diferenciados por 3 y 5+ partidos ausentes) ---
    if (playedMatches.length >= 3) {
        const last3Matches = playedMatches.slice(0, 3).map(m => m.id);
        const last5Matches = playedMatches.slice(0, 5).map(m => m.id);
        
        const desaparecidos3 = [] as string[];
        const desaparecidos5 = [] as string[];

        players.forEach(p => {
            if (p.isActive === false || p.isInjured || p.isVacation) return;
            
            const matchesPlayed = (p.skills as any)?.matchesPlayed || 0;
            if (matchesPlayed === 0) return;

            const playedInLast3 = participations.some(part => 
                part.playerId === p.id && 
                last3Matches.includes(part.matchId) && 
                part.status === 'Attended'
            );

            // Solo verificamos los últimos 5 si hay al menos 5 partidos jugados históricamente
            let playedInLast5 = true; 
            if (playedMatches.length >= 5) {
                 playedInLast5 = participations.some(part => 
                    part.playerId === p.id && 
                    last5Matches.includes(part.matchId) && 
                    part.status === 'Attended'
                );
            }

            if (!playedInLast5 && playedMatches.length >= 5) {
                // Faltó a los últimos 5 (o más) seguidos
                desaparecidos5.push(p.name || 'Jugador');
            } else if (!playedInLast3) {
                // Faltó a los últimos 3 o 4 seguidos, pero sí jugó alguno de los últimos 5
                desaparecidos3.push(p.name || 'Jugador');
            }
        });

        if (desaparecidos3.length > 0) {
            items.push(
                <span className="flex items-center gap-2" key="desaparecidos3">
                    <span className="text-zinc-500 font-bold text-lg leading-none">👻</span>
                    <span className="text-zinc-400 font-black">SE BUSCAN:</span>
                    <span className="text-white text-zinc-300">
                        {desaparecidos3.join(', ')} sin asistencia en las últimas 3 fechas. ¡Que aparezcan!
                    </span>
                </span>
            );
        }

        if (desaparecidos5.length > 0) {
            items.push(
                <span className="flex items-center gap-2" key="desaparecidos5">
                    <span className="text-indigo-500 font-bold text-lg leading-none">💌</span>
                    <span className="text-indigo-400 font-black">INVITACIÓN ESPECIAL:</span>
                    <span className="text-white text-indigo-200">
                        ¿{desaparecidos5.join(', ')}, les mandamos una invitación escrita o vienen solos? (+5 ausencias al hilo)
                    </span>
                </span>
            );
        }
    }

    // --- 7. Paternidades (Head-to-Head Histórico) ---
    const h2h = new Map<string, { winsA: number, winsB: number, draws: number, firstMatchDate: Date }>();
    
    // Invertimos para procesar de más antiguo a más nuevo y registrar la fecha del primer partido
    const chronologicalPlayedMatches = [...playedMatches].reverse();
    
    chronologicalPlayedMatches.forEach(match => {
        if (!match.result) return;
        const matchParts = participations.filter(p => p.matchId === match.id && p.team);
        
        const team1Players = matchParts.filter(p => p.team === 'Celeste').map(p => p.playerId);
        const team2Players = matchParts.filter(p => p.team === 'Azul').map(p => p.playerId);
        
        const team1Won = match.result === 'Celeste';
        const team2Won = match.result === 'Azul';
        const draw = match.result === 'Empate';

        team1Players.forEach(p1 => {
            team2Players.forEach(p2 => {
                 // Clave única invariante al orden
                 const [idA, idB] = [p1, p2].sort();
                 const key = `${idA}_VS_${idB}`;
                 
                 const aWon = (p1 === idA && team1Won) || (p2 === idA && team2Won);
                 const bWon = (p1 === idB && team1Won) || (p2 === idB && team2Won);

                 if (!h2h.has(key)) {
                     h2h.set(key, { winsA: 0, winsB: 0, draws: 0, firstMatchDate: new Date(match.date) });
                 }
                 
                 const stats = h2h.get(key)!;
                 if (draw) stats.draws++;
                 else if (aWon) stats.winsA++;
                 else if (bWon) stats.winsB++;
            });
        });
    });

    let maxDiff = 0;
    let paternityMsg: string | null = null;
    const now = new Date();

    Array.from(h2h.entries()).forEach(([key, stats]) => {
        const totalMatches = stats.winsA + stats.winsB + stats.draws;
        
        // REGLA: Más de 10 partidos compartidos de forma directa
        if (totalMatches <= 10) return;
        
        // REGLA: El feudo debe tener al menos 30 días de antigüedad
        const diffTime = Math.abs(now.getTime() - stats.firstMatchDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        if (diffDays < 30) return;

        const diffWins = Math.abs(stats.winsA - stats.winsB);
        
        // Encontramos la diferencia más brutal
        if (diffWins > maxDiff && diffWins >= 11) {
            maxDiff = diffWins;
            const [idA, idB] = key.split('_VS_');
            const fatherId = stats.winsA > stats.winsB ? idA : idB;
            const sonId = stats.winsA > stats.winsB ? idB : idA;
            const fWins = Math.max(stats.winsA, stats.winsB);
            const sWins = Math.min(stats.winsA, stats.winsB);
            
            const fatherName = players.find(p => p.id === fatherId)?.name || 'Jugador';
            const sonName = players.find(p => p.id === sonId)?.name || 'Jugador';
            
            if (diffWins === 11) {
                paternityMsg = `¡NUEVA PATERNIDAD CONFIRMADA! ${fatherName} logró la ventaja letal de 11 victorias sobre ${sonName} (${fWins} a ${sWins} en ${totalMatches} partidos en contra).`;
            } else {
                paternityMsg = `LA PATERNIDAD AÚN CONTINÚA: ${fatherName} no suelta a ${sonName} y ya le saca ${diffWins} triunfos históricos de diferencia (${fWins} a ${sWins}).`;
            }
        }
    });

    if (paternityMsg) {
        items.push(
            <span className="flex items-center gap-2" key="paternidad">
                <span className="text-indigo-400 font-bold text-lg leading-none">🍼</span>
                <span className="text-indigo-400 font-black">PATERNIDAD ABSOLUTA:</span>
                <span className="text-white text-zinc-300">
                    {paternityMsg}
                </span>
            </span>
        );
    }

    // --- 8. Info extra decorativa ---
    items.push(
        <span className="flex items-center gap-2" key="info">
            <Sparkles className="text-emerald-400" size={18} />
            <span className="text-emerald-400 font-black">FÚTBOL AMATEUR:</span>
            <span className="text-white">Mantente al día con las últimas estadísticas</span>
        </span>
    );

    return <TickerMarquee items={items} />;
}
