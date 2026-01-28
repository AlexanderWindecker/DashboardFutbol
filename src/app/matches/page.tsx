import { getData, getSettings } from '@/lib/data';
import { CreateMatchDialog } from '@/components/matches/CreateMatchDialog';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowRight, Trophy } from 'lucide-react';

export default async function MatchesPage() {
    const data = await getData();
    const settings = await getSettings();
    const sortedMatches = [...data.matches].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const team1Name = settings?.team1Name || 'Celeste';
    const team2Name = settings?.team2Name || 'Azul';

    // Helper to find player name for MVP
    const getPlayerName = (id?: string) => {
        if (!id) return null;
        return data.players.find(p => p.id === id)?.name || 'Desconocido';
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Partidos</h1>
                    <p className="text-slate-400">Gestiona y analiza el historial de juegos.</p>
                </div>
                <CreateMatchDialog
                    seasons={data.seasons || []}
                    activeSeasonId={data.activeSeasonId}
                />
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm">
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
                        {sortedMatches.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-slate-500">
                                    No hay partidos registrados. ¡Crea el primero!
                                </td>
                            </tr>
                        ) : (
                            sortedMatches.map((match) => (
                                <tr key={match.id} className="hover:bg-slate-800/50 transition-colors group">
                                    <td className="p-4 font-medium text-white">
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
                                            const matchParticipations = data.participations.filter(p => p.matchId === match.id);
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
                                        <Link
                                            href={`/matches/${match.id}`}
                                            className="inline-flex items-center text-indigo-400 hover:text-indigo-300 font-medium text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            Ver Detalle <ArrowRight size={14} className="ml-1" />
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
