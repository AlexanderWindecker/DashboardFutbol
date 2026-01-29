'use client';

import { Match, Player, PlayerStats, AppSettings, Season } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowRight, Trophy } from 'lucide-react';
import { useRouter } from 'next/navigation';

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
                    {matches.map((match) => (
                        <tr
                            key={match.id}
                            className="hover:bg-slate-800/80 transition-all group cursor-pointer active:bg-slate-800"
                            onClick={() => router.push(`/matches/${match.id}`)}
                        >
                            <td className="p-4 font-medium text-white group-hover:text-indigo-400 transition-colors">
                                {(() => {
                                    const date = parseISO(match.date);
                                    return isNaN(date.getTime())
                                        ? 'Fecha inválida'
                                        : format(date, "EEEE d 'de' MMMM, yyyy", { locale: es });
                                })()}
                            </td>
                            <td className="p-4">
                                <Badge variant="outline">{match.mode}</Badge>
                            </td>
                            <td className="p-4 text-slate-300">
                                {match.location || <span className="text-slate-600">-</span>}
                            </td>
                            <td className="p-4">
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
                                                    <Trophy size={14} className="text-amber-400 select-none" />
                                                    <span className="truncate max-w-[120px]">{getPlayerName(id)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })()}
                            </td>
                            <td className="p-4 text-right">
                                <div className="flex justify-end items-center gap-2 text-indigo-400 font-medium text-xs">
                                    <span className="opacity-0 lg:group-hover:opacity-100 transition-opacity">Detalle</span>
                                    <ArrowRight size={16} className="text-slate-600 group-hover:text-indigo-400 transition-colors" />
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
