'use client';

import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, useDraggable, useDroppable } from '@dnd-kit/core';
import { Player, PlayerStats, ParticipationStatus, AppSettings } from '@/types';
import { updateParticipationAction, deleteParticipationAction } from '@/actions/matches';
import { cn } from '@/lib/utils';
import { Trash2, X } from 'lucide-react';

// Types helpers
type KanbanColumn = {
    id: ParticipationStatus;
    title: string;
};

const COLUMNS: KanbanColumn[] = [
    { id: 'Confirmed', title: 'Confirmados' },
    { id: 'Declined', title: 'Confirmaron No Van' },
    { id: 'Attended', title: 'Asistieron' },
    { id: 'LateCancel', title: 'Baja Tardía' },
    { id: 'Absent', title: 'Ausentes / Sin Aviso' },
];

function DraggablePlayer({ player, stats, team1Name, team2Name }: {
    player: Player;
    stats?: PlayerStats;
    team1Name: string;
    team2Name: string;
}) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: player.id,
        data: { player, stats },
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    } : undefined;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "relative bg-slate-800 p-3 rounded-lg border border-slate-700 shadow-sm transition-colors group/card",
                isDragging && "opacity-50 ring-2 ring-indigo-500 z-50 pointer-events-none"
            )}
        >
            <div className="flex justify-between items-start">
                <div {...listeners} {...attributes} className="flex-1 cursor-grab active:cursor-grabbing">
                    <p className="text-sm font-medium text-slate-200">{player.name}</p>
                    {stats?.team && (stats.status === 'Confirmed' || stats.status === 'Attended') && (
                        <span className={cn(
                            "text-[10px] uppercase font-bold px-1.5 py-0.5 rounded mt-1 inline-block",
                            stats.team === 'Celeste' ? "bg-sky-500/20 text-sky-400" : "bg-blue-600/20 text-blue-400"
                        )}>
                            {stats.team === 'Celeste' ? team1Name : team2Name}
                        </span>
                    )}
                </div>

                <button
                    onClick={async (e) => {
                        e.stopPropagation();
                        if (confirm(`¿Quitar a ${player.name} de este partido?`)) {
                            // We need matchId here, let's pass it or get it from context if we had one.
                            // Since it's a small app, let's just pass it to the component.
                            const matchId = stats?.matchId;
                            if (matchId) await deleteParticipationAction(matchId, player.id);
                        }
                    }}
                    className="p-1 text-slate-500 hover:text-red-400 opacity-0 group-hover/card:opacity-100 transition-opacity"
                    title="Quitar jugador"
                >
                    <X size={14} />
                </button>
            </div>
        </div>
    );
}

function DroppableColumn({ id, title, players, participations, team1Name, team2Name }: {
    id: ParticipationStatus;
    title: string;
    players: Player[];
    participations: PlayerStats[];
    team1Name: string;
    team2Name: string;
}) {
    const { setNodeRef, isOver } = useDroppable({ id });

    // Filter players that are in this column
    // Players in this column are those who have a participation record with this status
    // OR if this is the DEFAULT column (maybe 'Absent' or a 'Pool'?)
    // For simplicity, let's assume all players start in a 'Pool' or 'Absent' unless they have a record.
    // Actually, let's define that players without record are NOT in the kanban? 
    // No, user wants to manage participation. So we need a pool of "Available Players" vs "In Match".
    // But the request says: "mover la participación... (confirmado, asistió, baja tardía)".
    // So maybe a list of ALL players is needed to drag them IN?
    // Let's assume we show players who have *some* participation record in this match.
    // Wait, how do we add a player to the match initially? "Pool" column?
    // Let's add a "Pool" or assume "Absent" is the default for everyone not confirmed?

    // Let's simplify: Show only players that have a participation entry for this match.
    // If we want to add players, we might need an 'Add Player' button that creates a 'Confirmed' entry.

    // However, dragging from Confirmed -> Attended is the main goal.

    const columnPlayers = players.filter(player => {
        const p = participations.find(stats => stats.playerId === player.id);
        if (!p) return false; // Not in this match yet
        return p.status === id;
    });

    return (
        <div ref={setNodeRef} className={cn("bg-slate-900/50 rounded-xl p-4 min-h-[400px] flex-1 border-2 border-transparent transition-colors", isOver && "border-indigo-500/30 bg-indigo-500/5")}>
            <h3 className="text-sm font-semibold text-slate-400 mb-4 flex items-center justify-between">
                {title}
                <span className="bg-slate-800 text-slate-500 px-2 py-0.5 rounded text-xs">{columnPlayers.length}</span>
            </h3>
            <div className="space-y-3">
                {columnPlayers.map(player => (
                    <DraggablePlayer
                        key={player.id}
                        player={player}
                        stats={participations.find(p => p.playerId === player.id)}
                        team1Name={team1Name}
                        team2Name={team2Name}
                    />
                ))}
                {columnPlayers.length === 0 && (
                    <div className="h-20 border-dashed border-2 border-slate-800 rounded-lg flex items-center justify-center text-slate-600 text-xs text-center p-2">
                        Arrastra jugadores aquí
                    </div>
                )}
            </div>
        </div>
    );
}

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export function KanbanBoard({ matchId, players, participations, settings }: {
    matchId: string;
    players: Player[];
    participations: PlayerStats[];
    settings?: AppSettings;
}) {
    const [activeId, setActiveId] = useState<string | null>(null);
    const [isMounted, setIsMounted] = useState(false);
    const router = useRouter();

    const team1Name = settings?.team1Name || 'Celeste';
    const team2Name = settings?.team2Name || 'Azul';

    useEffect(() => {
        setIsMounted(true);
        const interval = setInterval(() => {
            router.refresh();
        }, 5000);
        return () => clearInterval(interval);
    }, [router]);

    if (!isMounted) return <div className="flex gap-4 overflow-x-auto pb-4 h-[450px] animate-pulse bg-slate-900/20 rounded-xl" />;

    async function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        setActiveId(null);

        if (over && active.id !== over.id) {
            // Check if over.id is a column
            const status = over.id as ParticipationStatus;
            const validStatus = COLUMNS.find(c => c.id === status);

            if (validStatus) {
                // Update stats
                await updateParticipationAction(matchId, active.id as string, { status: status });
            }
        }
    }

    function handleDragStart(event: DragStartEvent) {
        setActiveId(event.active.id as string);
    }

    // Filter to only show players currently 'participating' in the Kanban flow
    // If we want to allow adding new players, we might need a separate component or a "Available Players" sidebar.
    // For now, let's assume we pass all players that are "in the list".

    return (
        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="flex gap-4 overflow-x-auto pb-4">
                {COLUMNS.map(col => (
                    <DroppableColumn
                        key={col.id}
                        id={col.id}
                        title={col.title}
                        players={players}
                        participations={participations}
                        team1Name={team1Name}
                        team2Name={team2Name}
                    />
                ))}
            </div>
            <DragOverlay>
                {activeId ? (
                    <div className="bg-slate-700 p-3 rounded-lg shadow-xl opacity-90 border border-indigo-500 transform rotate-3">
                        {players.find(p => p.id === activeId)?.name}
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}
