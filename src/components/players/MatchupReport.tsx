'use client';

import { useState, useMemo } from 'react';
import { Player, Match, PlayerStats } from '@/types';
import { Trophy, Users, Sword, TrendingUp, Star, User, ChevronDown, ChevronUp, UserX, Target, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MatchupReportProps {
    player: Player;
    allPlayers: Player[];
    matches: Match[];
    participations: PlayerStats[];
}

interface RivalStats {
    rivalId: string;
    rivalName: string;
    matches: number;
    wins: number;
    draws: number;
    losses: number;
    winRate: number;
}

export function MatchupReport({ player, allPlayers, matches, participations }: MatchupReportProps) {
    const [sortKey, setSortKey] = useState<'matches' | 'winRate'>('matches');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    const matchupStats = useMemo(() => {
        const statsMap = new Map<string, RivalStats>();
        
        // 1. Get all participations of the main player
        const myParts = participations.filter(p => p.playerId === player.id && p.status === 'Attended');
        
        // 2. Iterate through each match I played
        myParts.forEach(myPart => {
            const match = matches.find(m => m.id === myPart.matchId);
            if (!match || !match.result) return;
            
            // 3. Find all rivals in that match (players in the opposite team)
            const rivalsInMatch = participations.filter(p => 
                p.matchId === myPart.matchId && 
                p.status === 'Attended' && 
                p.team !== myPart.team
            );
            
            rivalsInMatch.forEach(rivalPart => {
                const rival = allPlayers.find(p => p.id === rivalPart.playerId);
                if (!rival) return;

                let rivalStat = statsMap.get(rival.id);
                if (!rivalStat) {
                    rivalStat = {
                        rivalId: rival.id,
                        rivalName: rival.name,
                        matches: 0,
                        wins: 0,
                        draws: 0,
                        losses: 0,
                        winRate: 0
                    };
                    statsMap.set(rival.id, rivalStat);
                }

                rivalStat.matches++;
                if (match.result === 'Empate') {
                    rivalStat.draws++;
                } else if (match.result === myPart.team) {
                    rivalStat.wins++;
                } else {
                    rivalStat.losses++;
                }
            });
        });

        // 4. Calculate win rate for each rival
        const result = Array.from(statsMap.values()).map(s => ({
            ...s,
            winRate: s.matches > 0 ? Math.round((s.wins / s.matches) * 100) : 0
        }));

        return result;
    }, [player.id, allPlayers, matches, participations]);

    const sortedRivals = useMemo(() => {
        return [...matchupStats].sort((a, b) => {
            const valA = a[sortKey];
            const valB = b[sortKey];
            if (sortOrder === 'desc') return (valB as number) - (valA as number);
            return (valA as number) - (valB as number);
        });
    }, [matchupStats, sortKey, sortOrder]);

    const nemesis = useMemo(() => {
        // Rivals with at least 3 matches, sorted by lowest win rate
        return matchupStats
            .filter(s => s.matches >= 3)
            .sort((a, b) => a.winRate - b.winRate)
            .slice(0, 3);
    }, [matchupStats]);

    const clients = useMemo(() => {
        // Rivals with at least 3 matches, sorted by highest win rate
        return matchupStats
            .filter(s => s.matches >= 3)
            .sort((a, b) => b.winRate - a.winRate)
            .slice(0, 3);
    }, [matchupStats]);

    const toggleSort = (key: 'matches' | 'winRate') => {
        if (sortKey === key) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortOrder('desc');
        }
    };

    return (
        <div className="space-y-10 pb-20">
            {/* Header / Hero */}
            <div className="relative overflow-hidden bg-slate-900 border border-slate-800 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="flex items-center gap-6 relative z-10">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-indigo-600 flex items-center justify-center font-black text-2xl md:text-3xl text-white shadow-[0_0_30px_rgba(79,70,229,0.4)] border border-indigo-400">
                        {Math.round(((player.skills?.ritmo || 50) + (player.skills?.tiros || 50) + (player.skills?.pases || 50) + (player.skills?.regates || 50) + (player.skills?.velocidad || 50)) / 5)}
                    </div>
                    <div>
                        <h2 className="text-2xl md:text-3xl font-black text-white italic uppercase tracking-tighter italic leading-none">{player.name}</h2>
                        <p className="text-slate-400 mt-2 font-bold tracking-widest uppercase text-xs">Análisis de Rivalidades de Carrera</p>
                    </div>
                </div>
                <div className="flex items-center gap-6 md:gap-10 relative z-10 px-6 py-4 bg-slate-950/50 rounded-2xl border border-white/5">
                    <div className="text-center">
                        <div className="text-xl md:text-2xl font-black text-white">{matchupStats.length}</div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase">Rivales Diferentes</div>
                    </div>
                    <div className="w-px h-8 bg-slate-800" />
                    <div className="text-center">
                        <div className="text-xl md:text-2xl font-black text-white">{matchupStats.reduce((acc, s) => acc + s.matches, 0)}</div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase">Duelos Totales</div>
                    </div>
                </div>
            </div>

            {/* Quick Insights (Nemesis & Clients) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Nemesis */}
                <div className="bg-slate-900/50 border border-rose-500/20 rounded-3xl p-6 relative group overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Zap size={80} className="text-rose-500" />
                    </div>
                    <h3 className="text-rose-400 font-black uppercase tracking-widest text-xs mb-6 flex items-center gap-2">
                        <Sword size={14} /> Tus Némesis (Tus Verdugos)
                    </h3>
                    <div className="space-y-3">
                        {nemesis.length === 0 ? (
                            <p className="text-slate-500 italic text-sm py-4">Aún no tienes rivales frecuentes que te ganen.</p>
                        ) : nemesis.map(n => (
                            <div key={n.rivalId} className="bg-slate-950/40 border border-slate-800 rounded-2xl p-4 flex items-center justify-between hover:border-rose-500/30 transition-all">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 font-bold">
                                        {n.rivalName.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="font-bold text-white text-sm">{n.rivalName}</div>
                                        <div className="text-[10px] text-slate-500">{n.matches} partidos jugados entre sí</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xl font-black text-rose-500 leading-none">{n.winRate}%</div>
                                    <div className="text-[8px] font-bold text-slate-600 uppercase mt-1">Tu % Vic.</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Clients */}
                <div className="bg-slate-900/50 border border-emerald-500/20 rounded-3xl p-6 relative group overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Trophy size={80} className="text-emerald-500" />
                    </div>
                    <h3 className="text-emerald-400 font-black uppercase tracking-widest text-xs mb-6 flex items-center gap-2">
                        <Target size={14} /> Tu Paternidad (Tus Clientes)
                    </h3>
                    <div className="space-y-3">
                        {clients.length === 0 ? (
                            <p className="text-slate-500 italic text-sm py-4">Aún no tienes rivales frecuentes contra los que domines.</p>
                        ) : clients.map(c => (
                            <div key={c.rivalId} className="bg-slate-950/40 border border-slate-800 rounded-2xl p-4 flex items-center justify-between hover:border-emerald-500/30 transition-all">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 font-bold">
                                        {c.rivalName.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="font-bold text-white text-sm">{c.rivalName}</div>
                                        <div className="text-[10px] text-slate-500">{c.matches} partidos jugados entre sí</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xl font-black text-emerald-500 leading-none">{c.winRate}%</div>
                                    <div className="text-[8px] font-bold text-slate-600 uppercase mt-1">Tu % Vic.</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Matrix Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-slate-800 bg-slate-950/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
                        <Users size={16} className="text-indigo-400" /> Matriz de Enfrentamientos
                    </h3>
                    <div className="flex gap-2">
                         <div className="text-[10px] font-bold text-slate-500 mr-2 uppercase self-center hidden sm:block">Ordenar por:</div>
                         <button 
                            onClick={() => toggleSort('matches')}
                            className={cn(
                                "text-[10px] font-bold px-3 py-1 rounded-full border transition-all",
                                sortKey === 'matches' ? "bg-indigo-600 border-indigo-500 text-white" : "bg-slate-800 border-slate-700 text-slate-400"
                            )}
                         >
                            Partidos {sortKey === 'matches' && (sortOrder === 'asc' ? <ChevronUp size={10} className="inline ml-1" /> : <ChevronDown size={10} className="inline ml-1" />)}
                         </button>
                         <button 
                            onClick={() => toggleSort('winRate')}
                            className={cn(
                                "text-[10px] font-bold px-3 py-1 rounded-full border transition-all",
                                sortKey === 'winRate' ? "bg-indigo-600 border-indigo-500 text-white" : "bg-slate-800 border-slate-700 text-slate-400"
                            )}
                         >
                            Tu % Victoria {sortKey === 'winRate' && (sortOrder === 'asc' ? <ChevronUp size={10} className="inline ml-1" /> : <ChevronDown size={10} className="inline ml-1" />)}
                         </button>
                    </div>
                </div>
                <div className="overflow-x-auto min-h-[300px]">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-950/30 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-800">
                            <tr>
                                <th className="p-6">Rival</th>
                                <th className="p-6 text-center">PJ</th>
                                <th className="p-6 text-center text-emerald-500 bg-emerald-500/5">V</th>
                                <th className="p-6 text-center text-slate-400 bg-slate-500/5">E</th>
                                <th className="p-6 text-center text-rose-500 bg-rose-500/5">D</th>
                                <th className="p-6 text-right">Tu % Vic.</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {sortedRivals.map(s => (
                                <tr key={s.rivalId} className="hover:bg-slate-800/30 transition-all group">
                                    <td className="p-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 font-bold border border-slate-700 group-hover:border-indigo-500/50 transition-colors">
                                                {s.rivalName.charAt(0)}
                                            </div>
                                            <span className="font-bold text-white">{s.rivalName}</span>
                                        </div>
                                    </td>
                                    <td className="p-6 text-center font-mono font-bold text-slate-400">{s.matches}</td>
                                    <td className="p-6 text-center font-mono font-black text-emerald-500 bg-emerald-500/[0.02]">{s.wins}</td>
                                    <td className="p-6 text-center font-mono font-bold text-slate-500 bg-slate-500/[0.02]">{s.draws}</td>
                                    <td className="p-6 text-center font-mono font-black text-rose-500 bg-rose-500/[0.02]">{s.losses}</td>
                                    <td className="p-6 text-right font-black text-white">
                                        <div className={cn(
                                            "inline-block px-3 py-1 rounded-lg text-xs whitespace-nowrap",
                                            s.winRate >= 70 ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                                            s.winRate <= 30 ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" :
                                            "bg-slate-800 text-slate-300 border border-slate-700"
                                        )}>
                                            {s.winRate}%
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {sortedRivals.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-20 text-center text-slate-600 italic">No hay suficientes datos de enfrentamientos todavía.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
