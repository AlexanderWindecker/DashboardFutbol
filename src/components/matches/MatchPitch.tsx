'use client';

import { useState } from 'react';
import { Player, PlayerStats, Team } from '@/types';
import { cn } from '@/lib/utils';
import { Shield, User, LayoutGrid, Users2, Swords } from 'lucide-react';

interface MatchPitchProps {
    players: Player[];
    participations: PlayerStats[];
    team1Name?: string;
    team2Name?: string;
    mode?: string;
}

type ViewMode = 'versus' | 'team1' | 'team2';

export function MatchPitch({ players, participations, team1Name = 'Celeste', team2Name = 'Azul', mode }: MatchPitchProps) {
    const [viewMode, setViewMode] = useState<ViewMode>('versus');

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
        // Check if GK
        const isGk = p.positions?.includes('Arquero') && p.positions?.length === 1;
        if (isGk && s.reflejos !== undefined) {
            return Math.round(((s.reflejos || 50) + (s.posicionamiento || 50) + (s.estirada || 50) + (s.saque || 50) + (s.seguridad || 50)) / 5);
        }
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
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Shield size={20} className="text-indigo-400" />
                    Previsualización Táctica
                </h3>

                {/* Tab Switcher */}
                <div className="flex p-1 bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-xl">
                    <button
                        onClick={() => setViewMode('versus')}
                        className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2",
                            viewMode === 'versus' ? "bg-indigo-600 text-white shadow-lg" : "text-slate-400 hover:text-slate-200"
                        )}
                    >
                        <Swords size={14} />
                        <span>Versus</span>
                    </button>
                    <button
                        onClick={() => setViewMode('team1')}
                        className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2",
                            viewMode === 'team1' ? "bg-sky-500 text-white shadow-lg" : "text-slate-400 hover:text-slate-200"
                        )}
                    >
                        <Users2 size={14} />
                        <span>{team1Name}</span>
                        {celesteAvg > 0 && <span className="ml-1 px-1.5 py-0.5 rounded bg-black/20 text-[10px]">{celesteAvg}</span>}
                    </button>
                    <button
                        onClick={() => setViewMode('team2')}
                        className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2",
                            viewMode === 'team2' ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:text-slate-200"
                        )}
                    >
                        <Users2 size={14} />
                        <span>{team2Name}</span>
                        {azulAvg > 0 && <span className="ml-1 px-1.5 py-0.5 rounded bg-black/20 text-[10px]">{azulAvg}</span>}
                    </button>
                </div>
            </div>

            <div className="flex flex-col xl:flex-row gap-4 justify-center items-stretch">

                {/* Left Panel (Celeste List) - Top aligned */}
                <div className={cn(
                    "hidden xl:block w-48 bg-slate-950 border border-slate-800 rounded-xl p-4 shadow-lg shrink-0 border-r-4 border-r-sky-500/50 self-start transition-opacity",
                    viewMode === 'team2' ? "opacity-30" : "opacity-100"
                )}>
                    <h4 className="text-sky-400 font-bold uppercase tracking-wider text-xs mb-3 border-b border-slate-800 pb-2">{team1Name.toUpperCase()} {celesteAvg > 0 && `(${celesteAvg})`}</h4>
                    <PlayerList players={allCeleste} />
                </div>

                <div className="flex flex-col gap-4 w-full max-w-4xl mx-auto">
                    <div className="flex items-start gap-1.5 md:gap-4 px-2">
                        {/* Celeste Subs Dugout */}
                        {(viewMode === 'versus' || viewMode === 'team1') && (
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
                        )}

                        <div className={cn(
                            "relative flex-1 bg-emerald-900 rounded-2xl border-4 border-slate-800 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-visible group/pitch",
                            viewMode === 'versus' ? "aspect-[1/2] sm:aspect-[2/3]" : "aspect-[3/4]"
                        )}>
                            {/* Grass Pattern */}
                            <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 10%, rgba(255,255,255,0.05) 10%, rgba(255,255,255,0.05) 20%)' }} />

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
                                {viewMode === 'versus' && (
                                    <>
                                        {/* Top Team */}
                                        <div className="flex-1 relative animate-in fade-in zoom-in-95 duration-300">
                                            <PositionGrid teamPlayers={celestePlayers} isTop={true} color="bg-sky-500" getOvr={getOvr} isSmall={true} />
                                        </div>

                                        {/* Bottom Team */}
                                        <div className="flex-1 relative border-t border-emerald-400/20 animate-in fade-in zoom-in-95 duration-300">
                                            <PositionGrid teamPlayers={azulPlayers} isTop={false} color="bg-blue-600" getOvr={getOvr} isSmall={true} />
                                        </div>
                                    </>
                                )}

                                {viewMode === 'team1' && (
                                    <div className="flex-1 relative animate-in fade-in slide-in-from-top-4 duration-500">
                                        <PositionGrid teamPlayers={celestePlayers} isTop={false} color="bg-sky-500" getOvr={getOvr} isFullHeight={true} />
                                    </div>
                                )}

                                {viewMode === 'team2' && (
                                    <div className="flex-1 relative animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <PositionGrid teamPlayers={azulPlayers} isTop={false} color="bg-blue-600" getOvr={getOvr} isFullHeight={true} />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Azul Subs Dugout */}
                        {(viewMode === 'versus' || viewMode === 'team2') && (
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
                        )}
                    </div>
                </div>

                {/* Right Panel (Azul List) - Bottom aligned */}
                <div className={cn(
                    "hidden xl:block w-48 bg-slate-950 border border-slate-800 rounded-xl p-4 shadow-lg shrink-0 border-l-4 border-l-blue-600/50 self-end transition-opacity",
                    viewMode === 'team1' ? "opacity-30" : "opacity-100"
                )}>
                    <h4 className="text-blue-400 font-bold uppercase tracking-wider text-xs mb-3 border-b border-slate-800 pb-2 text-right">{team2Name.toUpperCase()} {azulAvg > 0 && `(${azulAvg})`}</h4>
                    <PlayerList players={allAzul} alignRight />
                </div>

            </div>

            {/* Mobile Lists (Visible only on small screens) */}
            <div className="grid grid-cols-2 gap-4 xl:hidden">
                <div className={cn("bg-slate-950 border border-slate-800 rounded-xl p-4 transition-opacity", viewMode === 'team2' ? "opacity-30" : "opacity-100")}>
                    <h4 className="text-sky-400 font-bold uppercase tracking-wider text-xs mb-2">{team1Name} ({celesteAvg})</h4>
                    <PlayerList players={allCeleste} />
                </div>
                <div className={cn("bg-slate-950 border border-slate-800 rounded-xl p-4 transition-opacity", viewMode === 'team1' ? "opacity-30" : "opacity-100")}>
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

function PositionGrid({ teamPlayers, isTop, color, getOvr, isSmall, isFullHeight }: { teamPlayers: any[], isTop: boolean, color: string, getOvr: (p: any) => number, isSmall?: boolean, isFullHeight?: boolean }) {
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

    // In full height mode, we always want GK at the bottom like a standard tactical view
    const rows = (isFullHeight || !isTop)
        ? [forwards, [...midfielders, ...others], defenders, goalie]
        : [goalie, defenders, [...midfielders, ...others], forwards];

    return (
        <div className={cn(
            "w-full flex flex-col items-center px-1",
            isFullHeight ? "h-full justify-between py-6" : "h-full justify-around py-6"
        )}>
            {rows.map((row, idx) => (
                <div key={idx} className={cn(
                    "flex justify-center w-full",
                    isSmall ? "gap-6 md:gap-16" : "gap-12 md:gap-24"
                )}>
                    {row.map((p: any) => (
                        <div key={p.playerId} className="group relative flex flex-col items-center">
                            <div className={cn(
                                "rounded-full flex items-center justify-center border-2 border-white/20 shadow-lg transition-all duration-300 group-hover:scale-110",
                                color,
                                isSmall ? "w-7 h-7 md:w-9 md:h-9" : "w-11 h-11 md:w-14 md:h-14 bg-gradient-to-br from-white/10 to-transparent"
                            )}>
                                <span className={cn(
                                    "font-black text-white drop-shadow-sm",
                                    isSmall ? "text-[10px] md:text-xs" : "text-sm md:text-base"
                                )}>
                                    {getOvr(p.info)}
                                </span>

                                {/* Rating Badge */}
                                {p.rating !== undefined && (
                                    <div className={cn(
                                        "absolute -top-1 -right-1 bg-indigo-600 rounded-full border border-white flex items-center justify-center shadow-lg",
                                        isSmall ? "w-4 h-4 md:w-5 md:h-5" : "w-5 h-5 md:w-7 md:h-7"
                                    )}>
                                        <span className={cn(
                                            "font-bold text-white leading-none",
                                            isSmall ? "text-[7px] md:text-[8px]" : "text-[8px] md:text-xs"
                                        )}>
                                            {p.rating}
                                        </span>
                                    </div>
                                )}
                            </div>
                            {/* Role Label */}
                            <div className="flex items-center justify-center mt-1">
                                <span className={cn(
                                    "font-black text-slate-200 tracking-tighter uppercase leading-none z-10 drop-shadow-md",
                                    isSmall ? "text-[8px] md:text-[9px]" : "text-[10px] md:text-xs"
                                )}>
                                    {(() => {
                                        const r = getPos(p);
                                        if (r === 'arquero') return 'ARQ';
                                        if (r === 'defensor') return 'DEF';
                                        if (r === 'mediocampista') return 'MED';
                                        if (r === 'delantero') return 'DEL';
                                        return r ? r.substring(0, 3).toUpperCase() : '';
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
