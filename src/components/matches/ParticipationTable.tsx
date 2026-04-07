import { useState, useEffect } from 'react';
import { Player, PlayerStats, AppSettings } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { updateParticipationAction } from '@/actions/matches';
import { Check, Star, Shield, AlertCircle, Trash2, Users, X, Save, RefreshCcw, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdmin } from '@/hooks/useAdmin';
import { Modal } from '@/components/ui/Modal';

export function ParticipationTable({
    players,
    participations: initialParticipations,
    matchId,
    settings
}: {
    players: Player[];
    participations: PlayerStats[];
    matchId: string;
    settings?: AppSettings;
}) {
    const { isAdmin } = useAdmin();
    const [localParticipations, setLocalParticipations] = useState<PlayerStats[]>(initialParticipations);
    const [hasChanges, setHasChanges] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [openInfoPlayerId, setOpenInfoPlayerId] = useState<string | null>(null);

    // Sync from props if no local changes
    useEffect(() => {
        if (!hasChanges) {
            setLocalParticipations(initialParticipations);
        }
    }, [initialParticipations, hasChanges]);

    const team1Name = settings?.team1Name || 'Celeste';
    const team2Name = settings?.team2Name || 'Azul';

    // Show players who are Confirmed OR Attended
    const matchPlayers = localParticipations
        .filter(p => p.status === 'Attended' || p.status === 'Confirmed')
        .map(p => {
            const player = players.find(pl => pl.id === p.playerId);
            return { ...p, playerName: player?.name || 'Unknown' };
        }).sort((a, b) => {
            // Sort by Team (No Team first) then Name
            if (a.team !== b.team) {
                if (!a.team) return -1;
                if (!b.team) return 1;
                return a.team === 'Celeste' ? -1 : 1;
            }
            return a.playerName.localeCompare(b.playerName);
        });

    const handleLocalUpdate = (playerId: string, updates: Partial<PlayerStats>) => {
        setLocalParticipations(curr => curr.map(p =>
            p.playerId === playerId ? { ...p, ...updates } : p
        ));
        setHasChanges(true);
    };

    const handleSave = async () => {
        if (!isAdmin || isSaving) return;
        setIsSaving(true);
        try {
            // Find what changed
            const changes = localParticipations.filter(lp => {
                const initial = initialParticipations.find(ip => ip.playerId === lp.playerId);
                if (!initial) return true; // New?
                return JSON.stringify(lp) !== JSON.stringify(initial);
            });

            // Save each change (ideally this would be a bulk action, but let's use existing one for now)
            for (const p of changes) {
                await updateParticipationAction(matchId, p.playerId, p);
            }
            setHasChanges(false);
        } catch (error) {
            console.error("Error saving changes:", error);
            alert("Error al guardar los cambios.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleReset = () => {
        setLocalParticipations(initialParticipations);
        setHasChanges(false);
    };

    const selectedPlayer = matchPlayers.find(p => p.playerId === openInfoPlayerId);

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden mt-8">
            <div className="p-4 border-b border-slate-800 bg-slate-950/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h3 className="font-semibold text-white">Detalle de Participación</h3>
                    <p className="text-sm text-slate-400">Resultados, equipos y estadísticas individuales.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {hasChanges && isAdmin && (
                        <div className="flex gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
                            <button
                                onClick={handleReset}
                                disabled={isSaving}
                                className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-bold transition-all border border-slate-700 disabled:opacity-50"
                            >
                                <RefreshCcw size={16} className={cn(isSaving && "animate-spin")} />
                                Descartar
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                            >
                                {isSaving ? <RefreshCcw size={16} className="animate-spin" /> : <Save size={16} />}
                                Guardar Cambios
                            </button>
                        </div>
                    )}
                    {isAdmin && (
                        <button
                            onClick={async () => {
                                const { generateRandomTeamsAction } = await import('@/actions/teams');
                                const res = await generateRandomTeamsAction(matchId);
                                if (res.error) alert(res.error);
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold transition-all shadow-lg shadow-indigo-500/20 group"
                        >
                            <Users size={16} className="group-hover:rotate-12 transition-transform" />
                            Generar Equipos Aleatorios
                        </button>
                    )}
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-slate-950 text-slate-400">
                        <tr>
                            <th className="p-3 text-left">Jugador</th>
                            <th className="p-3 text-left">Equipo</th>
                            <th className="p-3 text-left">Puesto</th>
                            <th className="p-3 text-center">Goles</th>
                            <th className="p-3 text-center">Asistió</th>
                            <th className="p-3 text-center">MVP Equipo</th>
                            <th className="p-3 text-left">Notas</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {matchPlayers.map((p) => (
                            <tr key={p.playerId} className="hover:bg-slate-800/30">
                                <td className="p-3 font-medium text-slate-200">
                                    <div className="flex items-center gap-2 group">
                                        <span>{p.playerName}</span>
                                        {p.skillReasons && p.skillReasons.length > 0 && (
                                            <button 
                                                onClick={() => setOpenInfoPlayerId(openInfoPlayerId === p.playerId ? null : p.playerId)}
                                                className={cn(
                                                    "p-1 rounded-full transition-colors",
                                                    openInfoPlayerId === p.playerId ? "bg-amber-500/20 text-amber-500" : "text-slate-500 hover:text-amber-400 group-hover:text-slate-400"
                                                )}
                                                title="Ver desglose de habilidades"
                                            >
                                                <Info size={14} />
                                            </button>
                                        )}
                                    </div>
                                </td>
                                <td className="p-3">
                                    <div className="flex gap-1.5">
                                        <button
                                            disabled={!isAdmin}
                                            onClick={() => handleLocalUpdate(p.playerId, { team: 'Celeste' })}
                                            className={cn("w-6 h-6 rounded border flex items-center justify-center transition-colors text-[10px] font-bold", p.team === 'Celeste' ? "bg-sky-500 text-white border-sky-400" : "border-slate-700 text-slate-600 hover:border-sky-500/50", !isAdmin && "cursor-default")}
                                            title={isAdmin ? `Mover a ${team1Name}` : undefined}
                                        >
                                            {team1Name.charAt(0)}
                                        </button>
                                        <button
                                            disabled={!isAdmin}
                                            onClick={() => handleLocalUpdate(p.playerId, { team: 'Azul' })}
                                            className={cn("w-6 h-6 rounded border flex items-center justify-center transition-colors text-[10px] font-bold", p.team === 'Azul' ? "bg-blue-600 text-white border-blue-500" : "border-slate-700 text-slate-600 hover:border-blue-600/50", !isAdmin && "cursor-default")}
                                            title={isAdmin ? `Mover a ${team2Name}` : undefined}
                                        >
                                            {team2Name.charAt(0)}
                                        </button>
                                        {isAdmin && (
                                            <button
                                                onClick={() => handleLocalUpdate(p.playerId, { team: null })}
                                                className={cn("w-6 h-6 rounded border flex items-center justify-center transition-colors text-slate-600 hover:text-red-400 border-slate-700 hover:border-red-400/50", !p.team && "bg-slate-700 text-slate-300")}
                                                title="Quitar de equipo (Pendiente)"
                                            >
                                                <X size={12} />
                                            </button>
                                        )}
                                    </div>
                                </td>
                                <td className="p-3">
                                    <select
                                        disabled={!isAdmin}
                                        value={p.tacticalRole || ''}
                                        onChange={(e) => handleLocalUpdate(p.playerId, { tacticalRole: e.target.value as any || null })}
                                        className={cn(
                                            "bg-slate-800 border-none text-slate-300 text-[10px] font-bold py-1 px-2 rounded hover:bg-slate-750 transition-colors uppercase outline-none",
                                            isAdmin ? "cursor-pointer" : "cursor-default opacity-80"
                                        )}
                                    >
                                        <option value="">Auto</option>
                                        <option value="Arquero">ARQ</option>
                                        <option value="Defensor">DEF</option>
                                        <option value="Mediocampista">MED</option>
                                        <option value="Delantero">DEL</option>
                                        <option value="Suplente">SUP</option>
                                    </select>
                                </td>
                                <td className="p-3 text-center">
                                    <input
                                        type="number"
                                        min="0"
                                        readOnly={!isAdmin}
                                        value={p.goals || 0}
                                        onChange={(e) => {
                                            if (!isAdmin) return;
                                            const goals = parseInt(e.target.value) || 0;
                                            const updates: Partial<PlayerStats> = { goals };
                                            if (goals > 0 && p.status === 'Confirmed') {
                                                updates.status = 'Attended';
                                            }
                                            handleLocalUpdate(p.playerId, updates);
                                        }}
                                        className={cn(
                                            "w-12 bg-slate-800 border-none text-slate-300 text-center text-xs font-bold py-1 rounded outline-none",
                                            isAdmin ? "focus:ring-1 focus:ring-indigo-500" : "opacity-80"
                                        )}
                                    />
                                </td>
                                <td className="p-3 text-center">
                                    <div className="flex justify-center gap-1">
                                        <button
                                            disabled={!isAdmin}
                                            onClick={() => handleLocalUpdate(p.playerId, { status: 'Confirmed' })}
                                            className={cn(
                                                "px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors border",
                                                p.status === 'Confirmed'
                                                    ? "bg-amber-500/20 text-amber-500 border-amber-500/50"
                                                    : "bg-slate-800 text-slate-500 border-slate-700",
                                                isAdmin && "hover:border-amber-500/30",
                                                !isAdmin && "cursor-default"
                                            )}
                                        >
                                            Confirmó
                                        </button>
                                        <button
                                            disabled={!isAdmin}
                                            onClick={() => handleLocalUpdate(p.playerId, { status: 'Attended' })}
                                            className={cn(
                                                "px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors border",
                                                p.status === 'Attended'
                                                    ? "bg-emerald-500/20 text-emerald-500 border-emerald-500/50"
                                                    : "bg-slate-800 text-slate-500 border-slate-700",
                                                isAdmin && "hover:border-emerald-500/30",
                                                !isAdmin && "cursor-default"
                                            )}
                                        >
                                            Asistió
                                        </button>
                                    </div>
                                </td>
                                <td className="p-3 text-center">
                                    <button
                                        disabled={!isAdmin}
                                        onClick={() => {
                                            const isMvp = !p.isMvp;
                                            const updates: Partial<PlayerStats> = { isMvp };
                                            if (isMvp && p.status === 'Confirmed') {
                                                updates.status = 'Attended';
                                            }
                                            handleLocalUpdate(p.playerId, updates);
                                        }}
                                        className={cn("transition-colors", p.isMvp ? "text-amber-400" : "text-slate-700", isAdmin && "hover:text-amber-400/50", !isAdmin && "cursor-default")}
                                    >
                                        <Star size={18} fill={p.isMvp ? "currentColor" : "none"} />
                                    </button>
                                </td>
                                <td className="p-3">
                                    <div className="flex items-center gap-4">
                                        <input
                                            readOnly={!isAdmin}
                                            className={cn(
                                                "bg-transparent border-b border-transparent outline-none text-slate-300 flex-1",
                                                isAdmin ? "hover:border-slate-700 focus:border-indigo-500" : "opacity-80"
                                            )}
                                            value={p.notes ?? ''}
                                            onChange={(e) => {
                                                if (!isAdmin) return;
                                                handleLocalUpdate(p.playerId, { notes: e.target.value });
                                            }}
                                            placeholder={isAdmin ? "..." : ""}
                                        />
                                        {isAdmin && (
                                            <button
                                                onClick={async () => {
                                                    if (confirm(`¿Eliminar participación de ${p.playerName}?`)) {
                                                        const { deleteParticipationAction } = await import('@/actions/matches');
                                                        await deleteParticipationAction(matchId, p.playerId);
                                                    }
                                                }}
                                                className="text-slate-600 hover:text-red-400 transition-colors p-1"
                                                title="Eliminar participación"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {matchPlayers.length === 0 && (
                            <tr><td colSpan={7} className="p-4 text-center text-slate-500">Sin jugadores presentes asignados.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Player Info Modal */}
            <Modal
                isOpen={!!selectedPlayer}
                onClose={() => setOpenInfoPlayerId(null)}
                title={`Desglose RPG - ${selectedPlayer?.playerName}`}
            >
                <div className="space-y-4">
                    <p className="text-sm text-slate-400 mb-4">
                        Detalle de las variaciones de habilidades aplicadas en este partido basados en su desempeño y constancia.
                    </p>
                    <div className="space-y-2">
                        {selectedPlayer?.skillReasons?.map((reason, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl border border-amber-500/10 text-slate-200">
                                <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                                <span className="text-sm">{reason}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </Modal>
        </div>
    );
}
