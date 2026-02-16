'use client';

import { Match, Player, PlayerStats, AppSettings, Season } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowRight, Trophy, Zap, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface MatchesTableProps {
    matches: Match[];
    players: Player[];
    participations: PlayerStats[];
    settings: AppSettings | null;
}

export function MatchesTable({ matches, players, participations, settings }: MatchesTableProps) {
    const router = useRouter();
    const team1Name = settings?.team1Name || 'Celeste';
    const team2Name = settings?.team2Name || 'Azul';

    const getPlayerName = (id?: string) => {
        if (!id) return null;
        return players.find(p => p.id === id)?.name || 'Desconocido';
    };

    if (matches.length === 0) {
        return (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-500">
                No hay partidos registrados. ¡Crea el primero!
            </div>
        );
    }

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden overflow-x-auto">
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes shimmer-gold {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                .animate-shimmer-gold {
                    animation: shimmer-gold 3s infinite;
                }
                `
            }} />
            <table className="w-full text-left text-sm min-w-[600px]">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                    <tr>
                        <th className="p-4 font-medium">Fecha</th>
                        <th className="p-4 font-medium">Modalidad</th>
                        <th className="p-4 font-medium">Sede</th>
                        <th className="p-4 font-medium">Resultado</th>
                        <th className="p-4 font-medium">MVP del Partido</th>
                        <th className="p-4 font-medium text-right">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                    {matches.map((match) => {
                        const isSuper = !!match.isSuperclasico;
                        return (
                            <tr
                                key={match.id}
                                className={cn(
                                    "hover:bg-slate-800/80 transition-all group cursor-pointer active:bg-slate-800 relative",
                                    isSuper && "bg-amber-500/5 hover:bg-amber-500/10"
                                )}
                                onClick={() => router.push(`/matches/${match.id}`)}
                            >
                                <td className="p-4 font-medium text-white group-hover:text-indigo-400 transition-colors relative overflow-hidden">
                                    {isSuper && (
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/10 to-transparent -translate-x-full animate-shimmer-gold pointer-events-none"></div>
                                    )}
                                    <div className="flex items-center gap-3">
                                        {isSuper && <Zap size={14} className="text-amber-500 animate-pulse shrink-0" fill="currentColor" />}
                                        <div className="flex flex-col">
                                            <span>
                                                {(() => {
                                                    const date = parseISO(match.date);
                                                    return isNaN(date.getTime())
                                                        ? 'Fecha inválida'
                                                        : format(date, "EEEE d 'de' MMMM, yyyy", { locale: es });
                                                })()}
                                            </span>
                                            {isSuper && (
                                                <span className="text-[10px] font-black italic text-amber-500 tracking-tighter uppercase">✨ Súperclásico</span>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <Badge variant="outline" className={cn(isSuper && "border-amber-500/30 text-amber-500 bg-amber-500/5")}>
                                        {match.mode}
                                    </Badge>
                                </td>
                                <td className="p-4 text-slate-300">
                                    {match.location || <span className="text-slate-600">-</span>}
                                </td>
                                <td className="p-4 text-slate-300">
                                    {match.result ? (
                                        <Badge variant={match.result}>
                                            {match.result === 'Celeste' ? team1Name :
                                                match.result === 'Azul' ? team2Name :
                                                    match.result}
                                        </Badge>
                                    ) : (
                                        <span className="text-slate-600">-</span>
                                    )}
                                </td>
                                <td className="p-4 text-slate-300">
                                    {(() => {
                                        const matchParticipations = participations.filter(p => p.matchId === match.id);
                                        const teamMvpIds = matchParticipations.filter(p => p.isMvp).map(p => p.playerId);

                                        // Prioritize matchMvpId if exists, otherwise show team MVPs
                                        const mvpIds = match.matchMvpId ? [match.matchMvpId] : teamMvpIds;

                                        if (mvpIds.length === 0) return <span className="text-slate-600">-</span>;

                                        return (
                                            <div className="flex flex-col gap-1">
                                                {mvpIds.map(id => (
                                                    <div key={id} className="flex items-center gap-2">
                                                        <Trophy size={14} className={cn("select-none", isSuper ? "text-amber-500" : "text-amber-400")} />
                                                        <span className="truncate max-w-[120px]">{getPlayerName(id)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    })()}
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end items-center gap-2 text-indigo-400 font-medium text-xs">
                                        <span className={cn("opacity-0 lg:group-hover:opacity-100 transition-opacity", isSuper && "text-amber-500")}>Detalle</span>
                                        <ArrowRight size={16} className={cn("text-slate-600 group-hover:text-indigo-400 transition-colors", isSuper && "group-hover:text-amber-500")} />
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
