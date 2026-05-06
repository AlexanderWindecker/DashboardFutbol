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
import { Eye, EyeOff, Zap, Trophy, Crown, Star, Sun, CloudRain } from 'lucide-react';
import { cn, calculateMatchScore } from '@/lib/utils';
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
        <div className={cn("space-y-8 transition-all duration-700", match.isSuperclasico && "bg-amber-500/5 p-4 md:p-8 rounded-3xl border border-amber-500/20 shadow-[0_0_50px_rgba(245,158,11,0.05)]")}>
            {match.isSuperclasico && (
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
            )}

            {/* Superclasico Header Banner */}
            {match.isSuperclasico && (
                <div className="relative overflow-hidden bg-slate-950 border border-amber-500/30 rounded-2xl p-6 text-center shadow-2xl">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/10 to-transparent -translate-x-full animate-shimmer-gold pointer-events-none"></div>
                    <div className="relative flex flex-col items-center gap-2">
                        <div className="flex items-center gap-4 text-amber-500">
                            <Zap size={24} fill="currentColor" className="animate-pulse" />
                            <h2 className="text-2xl md:text-4xl font-black italic tracking-tighter uppercase whitespace-nowrap">
                                ✨ Súperclásico ✨
                            </h2>
                            <Zap size={24} fill="currentColor" className="animate-pulse" />
                        </div>
                        <p className="text-amber-500/60 text-[10px] font-bold uppercase tracking-[0.3em]">Enfrentamiento de Máxima Categoría</p>
                    </div>
                </div>
            )}

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
                        <Badge variant="outline" className={cn("text-lg px-3 py-1", match.isSuperclasico && "border-amber-500/50 text-amber-500 bg-amber-500/10")}>
                            {match.mode}
                        </Badge>
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

                        <div className="flex items-center gap-3 pt-1">
                            {match.weather === 'Lluvia' ? (
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400">
                                    <CloudRain size={16} />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">Clima: Lluvia</span>
                                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white shadow-lg shadow-blue-500/40">x2</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500">
                                    <Sun size={16} />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">Clima: Despejado</span>
                                </div>
                            )}
                        </div>
                    </div>

                <div className="flex flex-col items-end gap-3">
                    {isAdmin && (
                        <MatchResultSelector
                            matchId={match.id}
                            currentResult={match.result}
                            settings={settings}
                            captain1Name={players.find(p => p.id === settings.captain1Id)?.name}
                            captain2Name={players.find(p => p.id === settings.captain2Id)?.name}
                        />
                    )}

                    {/* Hide Notifications if not admin or in Privacy Mode */}
                    {isAdmin && !privacyMode && (
                        <div className="flex gap-2">
                            <NotifyWhatsApp match={match} settings={settings} />
                            <NotifyTelegram match={match} settings={settings} />
                        </div>
                    )}
                </div>
            </div>

            {/* Scoreboard (Only if match has result) */}
            {match.result && (
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 md:p-8 flex flex-col items-center justify-center relative overflow-hidden shadow-2xl mt-4 mb-8">
                    {/* Background glow based on winner */}
                    <div className={cn(
                        "absolute inset-0 opacity-20 pointer-events-none transition-colors duration-1000",
                        match.result === 'Celeste' ? "bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-sky-500/40 via-transparent to-transparent" :
                        match.result === 'Azul' ? "bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-600/40 via-transparent to-transparent" :
                        "bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-500/20 via-transparent to-transparent"
                    )} />
                    
                    <h3 className="text-slate-400 text-[10px] md:text-xs font-bold tracking-[0.3em] uppercase mb-4 z-10">Marcador Final</h3>
                    
                    {(() => {
                        const score = calculateMatchScore(participations);
                        const isCelesteWinner = match.result === 'Celeste';
                        const isAzulWinner = match.result === 'Azul';
                        
                        // Calculate total own goals to show in small text
                        const celesteOwnGoals = participations.filter(p => p.team === 'Celeste').reduce((acc, p) => acc + (p.ownGoals || 0), 0);
                        const azulOwnGoals = participations.filter(p => p.team === 'Azul').reduce((acc, p) => acc + (p.ownGoals || 0), 0);
                        
                        return (
                            <div className="flex flex-col items-center z-10 w-full max-w-2xl mx-auto">
                                <div className="flex items-center justify-between w-full">
                                    {/* Celeste Team */}
                                    <div className="flex flex-col items-center flex-1">
                                        <span className={cn(
                                            "text-lg md:text-2xl font-black uppercase tracking-wider mb-2 transition-colors text-center",
                                            isCelesteWinner ? "text-sky-400 drop-shadow-[0_0_15px_rgba(56,189,248,0.5)]" : "text-slate-500"
                                        )}>
                                            {settings?.team1Name || 'Celeste'}
                                        </span>
                                        <span className={cn(
                                            "text-6xl md:text-8xl font-black font-mono transition-colors drop-shadow-lg",
                                            isCelesteWinner ? "text-white" : "text-slate-400"
                                        )}>
                                            {score.celeste}
                                        </span>
                                    </div>
                                    
                                    {/* Divider */}
                                    <div className="flex flex-col items-center justify-center px-4 md:px-8">
                                        <span className="text-2xl md:text-4xl text-slate-700 font-black">-</span>
                                    </div>
                                    
                                    {/* Azul Team */}
                                    <div className="flex flex-col items-center flex-1">
                                        <span className={cn(
                                            "text-lg md:text-2xl font-black uppercase tracking-wider mb-2 transition-colors text-center",
                                            isAzulWinner ? "text-blue-500 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" : "text-slate-500"
                                        )}>
                                            {settings?.team2Name || 'Azul'}
                                        </span>
                                        <span className={cn(
                                            "text-6xl md:text-8xl font-black font-mono transition-colors drop-shadow-lg",
                                            isAzulWinner ? "text-white" : "text-slate-400"
                                        )}>
                                            {score.azul}
                                        </span>
                                    </div>
                                </div>
                                
                                {(celesteOwnGoals > 0 || azulOwnGoals > 0) && (
                                    <div className="mt-6 text-xs md:text-sm text-slate-400 bg-slate-900/80 px-4 py-2 rounded-full border border-slate-800">
                                        Goles en contra: 
                                        {celesteOwnGoals > 0 && <span className="ml-2 text-sky-400/70">{settings?.team1Name || 'Celeste'} ({celesteOwnGoals})</span>}
                                        {celesteOwnGoals > 0 && azulOwnGoals > 0 && <span className="mx-2 text-slate-600">|</span>}
                                        {azulOwnGoals > 0 && <span className="ml-2 text-blue-400/70">{settings?.team2Name || 'Azul'} ({azulOwnGoals})</span>}
                                    </div>
                                )}
                            </div>
                        )
                    })()}
                </div>
            )}

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
                elitePlayerIds={match.isSuperclasico ? settings?.elitePlayerIds : undefined}
            />

            {/* Detailed Stats Table */}
            <ParticipationTable players={displayedPlayers} participations={participations} matchId={match.id} settings={settings} />
        </div>
    );
}
