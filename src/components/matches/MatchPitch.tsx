'use client';

import { Player, PlayerStats, Team } from '@/types';
import { cn } from '@/lib/utils';
import { Shield, User } from 'lucide-react';

interface MatchPitchProps {
    players: Player[];
    participations: PlayerStats[];
    team1Name?: string;
    team2Name?: string;
    mode?: string;
}

export function MatchPitch({ players, participations, team1Name = 'Celeste', team2Name = 'Azul', mode }: MatchPitchProps) {
    // Parse mode to get max players per team (e.g., "6v6" -> 6)
    const maxPlayersPerTeam = mode ? parseInt(mode.split('v')[0]) : 6;

    const allCeleste = participations
        .filter(p => p.team === 'Celeste' && (p.status === 'Attended' || p.status === 'Confirmed'))
        .map(p => ({ ...p, info: players.find(pl => pl.id === p.playerId) }));

    const allAzul = participations
        .filter(p => p.team === 'Azul' && (p.status === 'Attended' || p.status === 'Confirmed'))
        .map(p => ({ ...p, info: players.find(pl => pl.id === p.playerId) }));

    if (allCeleste.length === 0 && allAzul.length === 0) return null;

    // Logic: Explicitly marked 'Suplente' are ALWAYS subs. 
    // Others are starters until we reach maxPlayersPerTeam.
    const splitPlayers = (teamPlayers: any[]) => {
        const forcedSubs = teamPlayers.filter(p => p.tacticalRole === 'Suplente');
        const potentialStarters = teamPlayers.filter(p => p.tacticalRole !== 'Suplente');

        const starters = potentialStarters.slice(0, maxPlayersPerTeam);
        const automaticallySubbed = potentialStarters.slice(maxPlayersPerTeam);

        return {
            starters,
            subs: [...forcedSubs, ...automaticallySubbed]
        };
    };

    const celeste = splitPlayers(allCeleste);
    const azul = splitPlayers(allAzul);

    const celestePlayers = celeste.starters;
    const celesteSubs = celeste.subs;

    const azulPlayers = azul.starters;
    const azulSubs = azul.subs;

    // Helper to calculate OVR
    const getOvr = (p: Player | undefined) => {
        if (!p || !p.skills) return 50;
        const s = p.skills;
        return Math.round((s.ritmo + s.tiros + s.pases + s.regates + s.velocidad) / 5);
    };

    const getTeamAvg = (teamPlayers: any[]) => {
        if (!teamPlayers.length) return 0;
        const total = teamPlayers.reduce((sum, p) => sum + getOvr(p.info), 0);
        return Math.round(total / teamPlayers.length);
    };

    const celesteAvg = getTeamAvg(allCeleste);
    const azulAvg = getTeamAvg(allAzul);

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Shield size={20} className="text-indigo-400" />
                Previsualización Táctica
            </h3>

            <div className="flex flex-col xl:flex-row gap-4 justify-center items-stretch">

                {/* Left Panel (Celeste List) - Top aligned */}
                <div className="hidden xl:block w-48 bg-slate-950 border border-slate-800 rounded-xl p-4 shadow-lg shrink-0 border-r-4 border-r-sky-500/50 self-start">
                    <h4 className="text-sky-400 font-bold uppercase tracking-wider text-xs mb-3 border-b border-slate-800 pb-2">{team1Name.toUpperCase()}</h4>
                    <PlayerList players={allCeleste} />
                </div>

                <div className="flex flex-col gap-4 w-full max-w-4xl mx-auto">
                    <div className="flex items-start gap-1.5 md:gap-4 px-2">
                        {/* Celeste Subs Dugout */}
                        <div className={cn(
                            "flex flex-col gap-3 p-2 rounded-xl border-2 border-sky-500/30 bg-sky-950/40 backdrop-blur-md self-start min-w-[50px] md:min-w-[64px] transition-all duration-300 shadow-xl z-30",
                            celesteSubs.length === 0 ? "opacity-0 scale-95 pointer-events-none" : "opacity-100 scale-100"
                        )}>
                            <div className="text-center border-b border-sky-500/20 pb-1 mb-1">
                                <span className="text-[7px] md:text-[9px] font-black text-sky-400 uppercase tracking-tighter">SUPL.</span>
                            </div>
                            <div className="flex flex-col gap-4">
                                {celesteSubs.map(s => (
                                    <SideSubMarker key={s.playerId} player={s} color="bg-sky-500" getOvr={getOvr} align="left" />
                                ))}
                            </div>
                        </div>

                        <div className="relative flex-1 aspect-[3/4] bg-emerald-900 rounded-2xl border-4 border-slate-800 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden group/pitch">
                            {/* Field Markings */}
                            <div className="absolute inset-4 border-2 border-emerald-400/30 rounded-lg pointer-events-none overflow-hidden">
                                {/* Halfway Line */}
                                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-emerald-400/30 -translate-y-1/2" />
                                <div className="absolute top-1/2 left-1/2 w-24 h-24 border-2 border-emerald-400/30 rounded-full -translate-x-1/2 -translate-y-1/2" />

                                {/* Penalty Areas */}
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-36 h-14 border-2 border-emerald-400/30 border-t-0 rounded-b-lg" />
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-36 h-14 border-2 border-emerald-400/30 border-b-0 rounded-t-lg" />
                            </div>

                            {/* Teams Layout */}
                            <div className="absolute inset-0 flex flex-col p-4">
                                {/* Top Team */}
                                <div className="flex-1 relative pt-6">
                                    <div className="absolute -top-3 -left-2 flex items-center gap-2 z-10 transition-transform group-hover/pitch:scale-105">
                                        <div className="px-2 py-1 rounded-lg bg-sky-950/80 backdrop-blur-sm border border-sky-500/30 text-sky-400 text-[10px] font-bold uppercase tracking-widest shadow-lg">
                                            {team1Name || 'Celeste'}
                                        </div>
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-b from-white via-slate-200 to-slate-400 border border-white/50 flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.3)] ring-1 ring-black/10">
                                            <span className="text-slate-900 font-black text-sm drop-shadow-sm">{celesteAvg}</span>
                                        </div>
                                    </div>
                                    <PositionGrid teamPlayers={celestePlayers} isTop={true} color="bg-sky-500" getOvr={getOvr} />
                                </div>

                                {/* Bottom Team */}
                                <div className="flex-1 relative pb-6 border-t border-emerald-400/20">
                                    <div className="absolute -bottom-3 -right-2 flex items-center gap-2 z-10 transition-transform group-hover/pitch:scale-105">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-b from-white via-slate-200 to-slate-400 border border-white/50 flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.3)] ring-1 ring-black/10">
                                            <span className="text-slate-900 font-black text-sm drop-shadow-sm">{azulAvg}</span>
                                        </div>
                                        <div className="px-2 py-1 rounded-lg bg-blue-950/80 backdrop-blur-sm border border-blue-500/30 text-blue-400 text-[10px] font-bold uppercase tracking-widest shadow-lg">
                                            {team2Name || 'Azul'}
                                        </div>
                                    </div>
                                    <PositionGrid teamPlayers={azulPlayers} isTop={false} color="bg-blue-600" getOvr={getOvr} />
                                </div>
                            </div>
                        </div>

                        {/* Azul Subs Dugout */}
                        <div className={cn(
                            "flex flex-col gap-3 p-2 rounded-xl border-2 border-blue-600/30 bg-blue-950/40 backdrop-blur-md self-end min-w-[50px] md:min-w-[64px] transition-all duration-300 shadow-xl z-30",
                            azulSubs.length === 0 ? "opacity-0 scale-95 pointer-events-none" : "opacity-100 scale-100"
                        )}>
                            <div className="text-center border-b border-blue-600/20 pb-1 mb-1">
                                <span className="text-[7px] md:text-[9px] font-black text-blue-400 uppercase tracking-tighter">SUPL.</span>
                            </div>
                            <div className="flex flex-col gap-4">
                                {azulSubs.map(s => (
                                    <SideSubMarker key={s.playerId} player={s} color="bg-blue-600" getOvr={getOvr} align="right" />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Panel (Azul List) - Bottom aligned */}
                <div className="hidden xl:block w-48 bg-slate-950 border border-slate-800 rounded-xl p-4 shadow-lg shrink-0 border-l-4 border-l-blue-600/50 self-end">
                    <h4 className="text-blue-400 font-bold uppercase tracking-wider text-xs mb-3 border-b border-slate-800 pb-2 text-right">{team2Name.toUpperCase()}</h4>
                    <PlayerList players={allAzul} alignRight />
                </div>

            </div>

            {/* Mobile Lists (Visible only on small screens) */}
            <div className="grid grid-cols-2 gap-4 xl:hidden">
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                    <h4 className="text-sky-400 font-bold uppercase tracking-wider text-xs mb-2">{team1Name} ({celesteAvg})</h4>
                    <PlayerList players={allCeleste} />
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                    <h4 className="text-blue-400 font-bold uppercase tracking-wider text-xs mb-2 text-right">{team2Name} ({azulAvg})</h4>
                    <PlayerList players={allAzul} alignRight />
                </div>
            </div>

        </div>
    );
}

function SideSubMarker({ player, color, getOvr, align }: { player: any, color: string, getOvr: (p: any) => number, align: 'left' | 'right' }) {
    return (
        <div className="group relative flex flex-col items-center">
            <div className={cn(
                "w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center border border-white/20 shadow-md transition-transform group-hover:scale-110",
                color,
                "opacity-80 group-hover:opacity-100 cursor-default"
            )}>
                <span className="text-[10px] font-bold text-white">
                    {getOvr(player.info)}
                </span>
                {player.rating !== undefined && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-600 rounded-full border border-white flex items-center justify-center shadow-sm">
                        <span className="text-[7px] font-bold text-white">{player.rating}</span>
                    </div>
                )}
            </div>
            <div className={cn(
                "absolute top-1/2 -translate-y-1/2 bg-slate-900 border border-slate-700 px-2 py-1 rounded text-[10px] text-white font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-2xl",
                align === 'left' ? "left-full ml-3" : "right-full mr-3"
            )}>
                {player.info?.name || 'Invitado'} {player.rating ? `(${player.rating})` : ''}
                <span className="block text-[8px] text-slate-400 mt-0.5 uppercase tracking-tighter">SUPLENTE</span>
            </div>
        </div>
    );
}

function PlayerList({ players, alignRight = false }: { players: any[], alignRight?: boolean }) {
    const getPos = (p: any): string => {
        const val = String(p.tacticalRole || p.info?.positions?.[0] || '').toLowerCase().trim();
        if (val.includes('arquero')) return 'ARQ';
        if (val.includes('defensor')) return 'DEF';
        if (val.includes('mediocampista')) return 'MED';
        if (val.includes('delantero')) return 'DEL';
        if (val.includes('suplente')) return 'SUP';
        return '???';
    };

    const sortedByPos = [...players].sort((a, b) => {
        const order = { 'ARQ': 1, 'DEF': 2, 'MED': 3, 'DEL': 4, 'SUP': 5, '???': 6 };
        return (order[getPos(a) as keyof typeof order] || 6) - (order[getPos(b) as keyof typeof order] || 6);
    });

    return (
        <div className="space-y-1">
            {sortedByPos.map(p => (
                <div key={p.playerId} className={cn("flex items-center justify-between text-xs py-1 border-b border-slate-800/50 last:border-0", alignRight && "flex-row-reverse")}>
                    <div className={cn("flex items-center gap-2", alignRight && "flex-row-reverse")}>
                        <span className="font-bold text-slate-500 w-6 text-[10px]">{getPos(p)}</span>
                        <span className="text-slate-300 truncate max-w-[80px]">{p.info?.name.split(' ')[0]}</span>
                    </div>
                </div>
            ))}
        </div>
    );
}

function PositionGrid({ teamPlayers, isTop, color, getOvr }: { teamPlayers: any[], isTop: boolean, color: string, getOvr: (p: any) => number }) {
    // Robust position helper
    const getPos = (p: any): string => {
        const val = String(p.tacticalRole || p.info?.positions?.[0] || '').toLowerCase().trim();
        if (val.includes('arquero')) return 'arquero';
        if (val.includes('defensor')) return 'defensor';
        if (val.includes('mediocampista')) return 'mediocampista';
        if (val.includes('delantero')) return 'delantero';
        return val;
    };

    const goalie = teamPlayers.filter(p => getPos(p) === 'arquero');
    const defenders = teamPlayers.filter(p => getPos(p) === 'defensor');
    const midfielders = teamPlayers.filter(p => getPos(p) === 'mediocampista');
    const forwards = teamPlayers.filter(p => getPos(p) === 'delantero');

    // Others (if any) or shared
    const others = teamPlayers.filter(p => !['arquero', 'defensor', 'mediocampista', 'delantero'].includes(getPos(p)));

    // Merge midfielders and others in the center row
    const rows = isTop
        ? [goalie, defenders, [...midfielders, ...others], forwards]
        : [forwards, [...midfielders, ...others], defenders, goalie];

    return (
        <div className="w-full h-full flex flex-col justify-around items-center py-2">
            {rows.map((row, idx) => (
                <div key={idx} className="flex justify-center gap-12 md:gap-32 w-full min-h-[4.5rem]">
                    {row.map((p: any) => (
                        <div key={p.playerId} className="group relative flex flex-col items-center">
                            <div className={cn(
                                "w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center border-2 border-white/20 shadow-lg transition-transform group-hover:scale-110",
                                color
                            )}>
                                <User size={20} className="text-white md:hidden" />
                                <span className="hidden md:block text-[13px] font-black text-white">
                                    {getOvr(p.info)}
                                </span>

                                {/* Rating Badge */}
                                {p.rating !== undefined && (
                                    <div className="absolute -top-1 -right-1 w-5 h-5 md:w-6 md:h-6 bg-indigo-600 rounded-full border border-white flex items-center justify-center shadow-lg">
                                        <span className="text-[8px] md:text-[10px] font-bold text-white leading-none">
                                            {p.rating}
                                        </span>
                                    </div>
                                )}
                            </div>
                            {/* Role Label */}
                            <div className="flex items-center justify-center mt-1">
                                <span className="text-[10px] md:text-[11px] font-bold text-slate-200 tracking-tighter uppercase leading-none z-10 shadow-black drop-shadow-md">
                                    {(() => {
                                        const r = getPos(p);
                                        if (r === 'arquero') return 'ARQ';
                                        if (r === 'defensor') return 'DEF';
                                        if (r === 'mediocampista') return 'MED';
                                        if (r === 'delantero') return 'DEL';
                                        return r ? '??' : '';
                                    })()}
                                </span>
                            </div>
                            {/* Tooltip on hover */}
                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700 px-2 py-1 rounded text-[10px] text-white font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-xl">
                                {p.info?.name || 'Invitado'} {p.rating ? `(${p.rating})` : ''}
                            </div>
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
}
