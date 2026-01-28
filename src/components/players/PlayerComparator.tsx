'use client';

import { useState, useMemo } from 'react';
import { Player, Match, PlayerStats } from '@/types';
import { Trophy, Users, Sword, TrendingUp, Star, User } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

interface PlayerComparatorProps {
    players: Player[];
    initialP1?: Player;
    initialP2?: Player;
    matches: Match[];
    participations: PlayerStats[];
}

export function PlayerComparator({ players, initialP1, initialP2, matches, participations }: PlayerComparatorProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [p1Id, setP1Id] = useState(initialP1?.id || '');
    const [p2Id, setP2Id] = useState(initialP2?.id || '');

    const p1 = useMemo(() => players.find(p => p.id === p1Id), [p1Id, players]);
    const p2 = useMemo(() => players.find(p => p.id === p2Id), [p2Id, players]);

    const stats = useMemo(() => {
        if (!p1 || !p2) return null;

        const p1Parts = participations.filter(p => p.playerId === p1.id && p.status === 'Attended');
        const p2Parts = participations.filter(p => p.playerId === p2.id && p.status === 'Attended');

        const commonMatches = matches.filter(m =>
            p1Parts.some(p => p.matchId === m.id) &&
            p2Parts.some(p => p.matchId === m.id)
        );

        // Duels
        const duels = commonMatches.filter(m => {
            const p1P = p1Parts.find(p => p.matchId === m.id);
            const p2P = p2Parts.find(p => p.matchId === m.id);
            return p1P?.team !== p2P?.team;
        });

        const p1DuelWins = duels.filter(m => {
            const p1P = p1Parts.find(p => p.matchId === m.id);
            return m.result === p1P?.team;
        }).length;

        const p2DuelWins = duels.filter(m => {
            const p2P = p2Parts.find(p => p.matchId === m.id);
            return m.result === p2P?.team;
        }).length;

        return {
            duels: {
                total: duels.length,
                p1Wins: p1DuelWins,
                p2Wins: p2DuelWins,
                draws: duels.length - p1DuelWins - p2DuelWins
            }
        };
    }, [p1, p2, matches, participations]);

    const handleSelect = (playerId: string, isP1: boolean) => {
        const params = new URLSearchParams(searchParams.toString());
        if (isP1) {
            setP1Id(playerId);
            params.set('p1', playerId);
        } else {
            setP2Id(playerId);
            params.set('p2', playerId);
        }
        router.push(`?${params.toString()}`);
    };

    const radarData = useMemo(() => {
        if (!p1 || !p2) return [];
        return [
            { subject: 'Ritmo', A: p1.skills?.ritmo || 50, B: p2.skills?.ritmo || 50, fullMark: 100 },
            { subject: 'Tiros', A: p1.skills?.tiros || 50, B: p2.skills?.tiros || 50, fullMark: 100 },
            { subject: 'Pases', A: p1.skills?.pases || 50, B: p2.skills?.pases || 50, fullMark: 100 },
            { subject: 'Regates', A: p1.skills?.regates || 50, B: p2.skills?.regates || 50, fullMark: 100 },
            { subject: 'Velocidad', A: p1.skills?.velocidad || 50, B: p2.skills?.velocidad || 50, fullMark: 100 },
        ];
    }, [p1, p2]);

    const getOvr = (p?: Player) => {
        if (!p || !p.skills) return 50;
        const s = p.skills;
        return Math.round((s.ritmo + s.tiros + s.pases + s.regates + s.velocidad) / 5);
    };

    return (
        <div className="space-y-8 pb-20">
            {/* Selectors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-400">Jugador 1 (Azul)</label>
                    <select
                        value={p1Id}
                        onChange={(e) => handleSelect(e.target.value, true)}
                        className="w-full h-12 px-4 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="">Seleccionar jugador...</option>
                        {players.map(p => (
                            <option key={p.id} value={p.id} disabled={p.id === p2Id}>{p.name}</option>
                        ))}
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-400">Jugador 2 (Rojo)</label>
                    <select
                        value={p2Id}
                        onChange={(e) => handleSelect(e.target.value, false)}
                        className="w-full h-12 px-4 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                    >
                        <option value="">Seleccionar jugador...</option>
                        {players.map(p => (
                            <option key={p.id} value={p.id} disabled={p.id === p1Id}>{p.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {!p1 || !p2 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-slate-900/50 rounded-2xl border border-dashed border-slate-800 text-slate-500">
                    <Users size={48} className="mb-4 opacity-20" />
                    <p>Seleccioná dos jugadores para ver el Cara a Cara</p>
                </div>
            ) : (
                <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">

                    {/* Background Glows */}
                    <div className="absolute top-0 left-1/4 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />
                    <div className="absolute top-0 right-1/4 w-64 h-64 bg-rose-500/10 blur-[100px] rounded-full pointer-events-none" />

                    {/* 1. Header Cards & VS */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                        {/* Player 1 Card */}
                        <div className="md:col-span-5 relative group">
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-transparent rounded-2xl blur-sm group-hover:blur-md transition-all" />
                            <div className="relative bg-slate-900/80 backdrop-blur-md border border-indigo-500/30 rounded-2xl p-6 flex items-center justify-between shadow-[0_0_15px_rgba(99,102,241,0.1)]">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-full bg-indigo-500/20 border-2 border-indigo-500 flex items-center justify-center overflow-hidden">
                                        <User size={32} className="text-indigo-200" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">{p1.name}</h2>
                                        <p className="text-indigo-400 text-xs font-bold tracking-widest uppercase">{(p1 as any).position || 'JUGADOR'}</p>
                                    </div>
                                </div>
                                <div className="w-14 h-14 rounded-full border-4 border-indigo-500 flex items-center justify-center bg-slate-950 shadow-lg relative">
                                    <span className="text-xl font-black text-white">{getOvr(p1)}</span>
                                    <span className="absolute -bottom-4 text-[10px] font-bold text-slate-500">OVR</span>
                                </div>
                            </div>
                        </div>

                        {/* VS Badge */}
                        <div className="md:col-span-2 flex justify-center z-10">
                            <div className="w-20 h-20 bg-slate-950 border-4 border-slate-800 rounded-full flex items-center justify-center shadow-2xl relative">
                                <span className="text-2xl font-black italic bg-gradient-to-br from-white to-slate-500 bg-clip-text text-transparent">VS</span>
                            </div>
                        </div>

                        {/* Player 2 Card */}
                        <div className="md:col-span-5 relative group">
                            <div className="absolute inset-0 bg-gradient-to-l from-rose-500/20 to-transparent rounded-2xl blur-sm group-hover:blur-md transition-all" />
                            <div className="relative bg-slate-900/80 backdrop-blur-md border border-rose-500/30 rounded-2xl p-6 flex items-center justify-between shadow-[0_0_15px_rgba(244,63,94,0.1)] text-right flex-row-reverse">
                                <div className="flex items-center gap-4 flex-row-reverse">
                                    <div className="w-16 h-16 rounded-full bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center overflow-hidden">
                                        <User size={32} className="text-rose-200" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">{p2.name}</h2>
                                        <p className="text-rose-400 text-xs font-bold tracking-widest uppercase">{(p2 as any).position || 'JUGADOR'}</p>
                                    </div>
                                </div>
                                <div className="w-14 h-14 rounded-full border-4 border-rose-500 flex items-center justify-center bg-slate-950 shadow-lg relative">
                                    <span className="text-xl font-black text-white">{getOvr(p2)}</span>
                                    <span className="absolute -bottom-4 text-[10px] font-bold text-slate-500">OVR</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 2. Head-to-Head Glass box */}
                    <div className="relative mx-auto max-w-lg mt-[-30px] z-0">
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 text-center shadow-2xl">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Historial Directo</h3>
                            <div className="flex items-center justify-center gap-8">
                                <div className="text-5xl font-black text-indigo-400 drop-shadow-[0_0_10px_rgba(99,102,241,0.5)]">
                                    {stats?.duels.p1Wins}
                                </div>
                                <Sword size={32} className="text-slate-600" />
                                <div className="text-5xl font-black text-rose-400 drop-shadow-[0_0_10px_rgba(244,63,94,0.5)]">
                                    {stats?.duels.p2Wins}
                                </div>
                            </div>
                            <div className="mt-2 text-xs text-slate-500 font-medium">
                                {stats?.duels.draws} Empates
                            </div>
                        </div>
                    </div>

                    {/* 3. Skills Radar & Bars */}
                    <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-3xl p-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

                            {/* Radar Chart */}
                            <div className="h-[300px] w-full relative">
                                <h4 className="absolute top-0 left-0 text-xs font-bold text-slate-500 uppercase tracking-widest">Radar de Habilidades</h4>
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                                        <PolarGrid stroke="#334155" strokeDasharray="3 3" />
                                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} />
                                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                        <Radar
                                            name={p1.name}
                                            dataKey="A"
                                            stroke="#6366f1"
                                            strokeWidth={3}
                                            fill="#6366f1"
                                            fillOpacity={0.3}
                                        />
                                        <Radar
                                            name={p2.name}
                                            dataKey="B"
                                            stroke="#f43f5e"
                                            strokeWidth={3}
                                            fill="#f43f5e"
                                            fillOpacity={0.3}
                                        />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Skill Bars */}
                            <div className="space-y-6 flex flex-col justify-center">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Atributos Clave</h4>
                                {radarData.map((d) => (
                                    <div key={d.subject} className="space-y-2">
                                        <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-1">
                                            <span className="text-slate-400 w-1/4">{d.subject}</span>
                                        </div>

                                        {/* Player 1 Bar (Indigo) */}
                                        <div className="relative h-4 bg-slate-950 rounded-full border border-slate-800 overflow-hidden group">
                                            <div
                                                className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-900 to-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)] transition-all duration-1000"
                                                style={{ width: `${d.A}%` }}
                                            />
                                            <span className="absolute right-2 top-0 text-[10px] font-bold text-white leading-4 z-10 drop-shadow-md">{d.A}</span>
                                        </div>

                                        {/* Player 2 Bar (Rose) */}
                                        <div className="relative h-4 bg-slate-950 rounded-full border border-slate-800 overflow-hidden group">
                                            <div
                                                className="absolute top-0 left-0 h-full bg-gradient-to-r from-rose-900 to-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)] transition-all duration-1000"
                                                style={{ width: `${d.B}%` }}
                                            />
                                            <span className="absolute right-2 top-0 text-[10px] font-bold text-white leading-4 z-10 drop-shadow-md">{d.B}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                </div>
            )}
        </div>
    );
}
