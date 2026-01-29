'use client';

import { useState } from 'react';
import { Match, Player, PlayerStats, AppSettings, Season } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { AddPlayerToMatch } from '@/components/matches/AddPlayerToMatch';
import { ParticipationTable } from '@/components/matches/ParticipationTable';
import { MatchResultSelector } from '@/components/matches/MatchResultSelector';
import { EditMatchDialog } from '@/components/matches/EditMatchDialog';
import { NotifyWhatsApp } from '@/components/matches/NotifyWhatsApp';
import { NotifyTelegram } from '@/components/matches/NotifyTelegram';
import { MatchPitch } from '@/components/matches/MatchPitch';
import { KanbanBoard } from '@/components/matches/KanbanBoard';
import { Eye, EyeOff } from 'lucide-react';
import { useAdmin } from '@/hooks/useAdmin';

interface MatchDetailViewProps {
    match: Match;
    players: Player[];
    participations: PlayerStats[];
    settings: AppSettings;
    seasons: Season[];
}

export function MatchDetailView({ match, players, participations, settings, seasons }: MatchDetailViewProps) {
    const [privacyMode, setPrivacyMode] = useState(false);
    const { isAdmin } = useAdmin();

    // Mask players if in Privacy Mode
    const displayedPlayers = privacyMode
        ? players.map((p, index) => ({
            ...p,
            name: `Jugador ${index + 1}`,
            phone: undefined, // Hide phone too
            telegramId: undefined
        }))
        : players;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold text-white">
                            {(() => {
                                const date = parseISO(match.date);
                                return isNaN(date.getTime())
                                    ? 'Fecha inválida'
                                    : format(date, "EEEE d 'de' MMMM", { locale: es });
                            })()}
                        </h1>
                        <Badge variant="outline" className="text-lg px-3 py-1">{match.mode}</Badge>
                        {isAdmin && <EditMatchDialog match={match} seasons={seasons} />}

                        {/* Privacy Toggle */}
                        <button
                            onClick={() => setPrivacyMode(!privacyMode)}
                            className="p-2 rounded-full hover:bg-slate-800 text-slate-500 hover:text-white transition-colors ml-2"
                            title={privacyMode ? "Desactivar Modo Privacidad" : "Activar Modo Privacidad"}
                        >
                            {privacyMode ? <EyeOff size={20} className="text-indigo-400" /> : <Eye size={20} />}
                        </button>
                    </div>
                    <p className="text-slate-400 flex items-center gap-2">
                        {match.location || 'Sin ubicación definida'}
                    </p>
                </div>

                <div className="flex flex-col items-end gap-3">
                    {isAdmin && <MatchResultSelector matchId={match.id} currentResult={match.result} settings={settings} />}

                    {/* Hide Notifications if not admin or in Privacy Mode */}
                    {isAdmin && !privacyMode && (
                        <div className="flex gap-2">
                            <NotifyWhatsApp match={match} settings={settings} />
                            <NotifyTelegram match={match} settings={settings} />
                        </div>
                    )}
                </div>
            </div>

            {/* Kanban Section */}
            <div className="space-y-4">
                <div className="flex justify-between items-end">
                    <div>
                        <h2 className="text-xl font-semibold text-white">Gestión de Asistencia</h2>
                        <p className="text-sm text-slate-400">Arrastra a los jugadores para actualizar su estado.</p>
                    </div>
                    {isAdmin && <AddPlayerToMatch matchId={match.id} availablePlayers={displayedPlayers} currentParticipations={participations} />}
                </div>

                <KanbanBoard matchId={match.id} players={displayedPlayers} participations={participations} settings={settings} />
            </div>

            {/* Tactical Pitch Preview */}
            <MatchPitch
                players={displayedPlayers}
                participations={participations}
                team1Name={settings?.team1Name}
                team2Name={settings?.team2Name}
                mode={match.mode}
            />

            {/* Detailed Stats Table */}
            <ParticipationTable players={displayedPlayers} participations={participations} matchId={match.id} settings={settings} />
        </div>
    );
}
