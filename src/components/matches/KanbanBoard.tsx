'use client';

import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, useDraggable, useDroppable } from '@dnd-kit/core';
import { Player, PlayerStats, ParticipationStatus, AppSettings } from '@/types';
import { updateParticipationAction, deleteParticipationAction } from '@/actions/matches';
import { cn } from '@/lib/utils';
import { Trash2, X, MoreVertical, Check, UserMinus, ShieldAlert, History, Crown, Star, Info } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/DropdownMenu';

// Types helpers
type KanbanColumn = {
    id: ParticipationStatus;
    title: string;
};

const COLUMNS: KanbanColumn[] = [
    { id: 'Confirmed', title: 'Confirmados' },
    { id: 'Declined', title: 'Confirmaron No Van' },
    { id: 'Attended', title: 'Asistieron' },
    { id: 'LateCancel', title: 'Baja' },
    { id: 'Absent', title: 'Ausentes / Sin Aviso' },
];

function DraggablePlayer({ player, stats, team1Name, team2Name, isAdmin, isElite, isCaptain }: {
    player: Player;
    stats?: PlayerStats;
    team1Name: string;
    team2Name: string;
    isAdmin: boolean;
    isElite?: boolean;
    isCaptain?: boolean;
}) {
    const [showReasons, setShowReasons] = useState(false);
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: player.id,
        data: { player, stats },
        disabled: !isAdmin,
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
            <div className="flex justify-between items-center gap-2">
                <div {...listeners} {...attributes} className="flex-1 cursor-grab active:cursor-grabbing">
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-sm font-medium text-slate-200">{player.name}</p>
                        {stats?.skillReasons && stats.skillReasons.length > 0 && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); setShowReasons(!showReasons); }}
                                className={cn(
                                    "p-1 rounded-full transition-colors",
                                    showReasons ? "bg-amber-500/20 text-amber-500" : "text-slate-500 hover:text-amber-400"
                                )}
                            >
                                <Info size={12} />
                            </button>
                        )}
                        {isCaptain && (
                            <div className="flex items-center gap-0.5 px-1 bg-indigo-500/20 rounded border border-indigo-500/30">
                                <Star size={8} className="text-indigo-400 fill-indigo-400" />
                                <span className="text-[7px] font-black text-indigo-400 uppercase">CAP</span>
                            </div>
                        )}
                    </div>
                    {stats?.team && (stats.status === 'Confirmed' || stats.status === 'Attended') && (
                        <span className={cn(
                            "text-[10px] uppercase font-bold px-1.5 py-0.5 rounded mt-1 inline-block",
                            stats.team === 'Celeste' ? "bg-sky-500/20 text-sky-400" : "bg-blue-600/20 text-blue-400"
                        )}>
                            {stats.team === 'Celeste' ? team1Name : team2Name}
                        </span>
                    )}
                    {stats?.skillReasons && stats.skillReasons.length > 0 && showReasons && (
                        <div className="mt-2 space-y-1 bg-slate-950/50 p-2 rounded border border-amber-500/10 animate-in fade-in slide-in-from-top-1 duration-200">
                            <div className="flex items-center gap-1.5 mb-1">
                                <span className="text-[7px] font-black text-amber-500 uppercase">Motivos RPG</span>
                            </div>
                            {stats.skillReasons.map((reason, idx) => (
                                <div key={idx} className="text-[9px] text-slate-400 flex items-center gap-1.5">
                                    <div className="w-1 h-1 rounded-full bg-amber-500/50" />
                                    {reason}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-1">
                    {isAdmin && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-700 rounded-md transition-colors" title="Acciones rápidas">
                                    <MoreVertical size={16} />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 bg-slate-900 border-slate-700">
                                <DropdownMenuItem
                                    className="text-emerald-400 focus:text-emerald-300 focus:bg-emerald-500/10 cursor-pointer"
                                    onClick={() => stats && updateParticipationAction(stats.matchId, player.id, { status: 'Attended' })}
                                >
                                    <Check className="mr-2 h-4 w-4" />
                                    <span>Marcar como Asistió</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    className="text-amber-400 focus:text-amber-300 focus:bg-amber-500/10 cursor-pointer"
                                    onClick={() => stats && updateParticipationAction(stats.matchId, player.id, { status: 'Confirmed' })}
                                >
                                    <History className="mr-2 h-4 w-4" />
                                    <span>Mover a Pendiente</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    className="text-rose-400 focus:text-rose-300 focus:bg-rose-500/10 cursor-pointer"
                                    onClick={() => stats && updateParticipationAction(stats.matchId, player.id, { status: 'Declined' })}
                                >
                                    <X className="mr-2 h-4 w-4" />
                                    <span>Mover a No Viene</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    className="text-orange-400 focus:text-orange-300 focus:bg-orange-500/10 cursor-pointer"
                                    onClick={() => stats && updateParticipationAction(stats.matchId, player.id, { status: 'LateCancel' })}
                                >
                                    <ShieldAlert className="mr-2 h-4 w-4" />
                                    <span>Baja</span>
                                </DropdownMenuItem>
                                <div className="h-px bg-slate-700 my-1" />
                                <DropdownMenuItem
                                    className="text-slate-400 focus:text-red-400 focus:bg-red-500/10 cursor-pointer"
                                    onClick={async () => {
                                        if (confirm(`¿Quitar a ${player.name} de este partido?`)) {
                                            const matchId = stats?.matchId;
                                            if (matchId) await deleteParticipationAction(matchId, player.id);
                                        }
                                    }}
                                >
                                    <UserMinus className="mr-2 h-4 w-4" />
                                    <span>Quitar del Partido</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </div>
        </div>
    );
}

function DroppableColumn({ id, title, players, participations, team1Name, team2Name, isAdmin, isActiveMobile, elitePlayerIds, captain1Id, captain2Id }: {
    id: ParticipationStatus;
    title: string;
    players: Player[];
    participations: PlayerStats[];
    team1Name: string;
    team2Name: string;
    isAdmin: boolean;
    isActiveMobile: boolean;
    elitePlayerIds?: string[];
    captain1Id?: string;
    captain2Id?: string;
}) {
    const { setNodeRef, isOver } = useDroppable({ id });

    const columnPlayers = players.filter(player => {
        const p = participations.find(stats => stats.playerId === player.id);
        if (!p) return false;
        return p.status === id;
    });

    return (
        <div
            ref={setNodeRef}
            className={cn(
                "bg-slate-900/50 rounded-xl p-4 min-h-[400px] border-2 border-transparent transition-all duration-300",
                "w-full sm:flex-1 sm:min-w-[280px]",
                isActiveMobile ? "block" : "hidden sm:block",
                isOver && "border-indigo-500/30 bg-indigo-500/5"
            )}
        >
            <h3 className="text-sm font-semibold text-slate-400 mb-4 flex items-center justify-between">
                <span className="flex items-center gap-2">
                    {title}
                    {id === 'Attended' && <Check size={14} className="text-emerald-500" />}
                </span>
                <span className="bg-slate-800 text-slate-500 px-2 py-0.5 rounded text-xs leading-none flex items-center justify-center min-w-[20px]">
                    {columnPlayers.length}
                </span>
            </h3>
            <div className="space-y-2.5">
                {columnPlayers.map(player => (
                    <DraggablePlayer
                        key={player.id}
                        player={player}
                        stats={participations.find(p => p.playerId === player.id)}
                        team1Name={team1Name}
                        team2Name={team2Name}
                        isAdmin={isAdmin}
                        isElite={elitePlayerIds?.includes(player.id)}
                        isCaptain={player.id === captain1Id || player.id === captain2Id}
                    />
                ))}
                {columnPlayers.length === 0 && (
                    <div className="h-32 border-dashed border-2 border-slate-800/50 rounded-lg flex items-center justify-center text-slate-600 text-xs text-center p-4">
                        {isAdmin ? 'Arrastra jugadores aquí para cambiar su estado' : 'Sin jugadores en esta categoría'}
                    </div>
                )}
            </div>
        </div>
    );
}

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAdmin } from '@/hooks/useAdmin';

export function KanbanBoard({ matchId, players, participations, settings }: {
    matchId: string;
    players: Player[];
    participations: PlayerStats[];
    settings?: AppSettings;
}) {
    const [activeId, setActiveId] = useState<string | null>(null);
    const [isMounted, setIsMounted] = useState(false);
    const [activeTab, setActiveTab] = useState<ParticipationStatus>('Confirmed');
    const { isAdmin } = useAdmin();
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
            <div className="space-y-4">
                {/* Mobile Tabs */}
                <div className="sm:hidden flex bg-slate-900/80 backdrop-blur-md p-1 rounded-xl border border-slate-800 overflow-x-auto scrollbar-hide sticky top-0 z-20">
                    {COLUMNS.map(col => {
                        const count = players.filter(player => {
                            const p = participations.find(stats => stats.playerId === player.id);
                            return p?.status === col.id;
                        }).length;

                        return (
                            <button
                                key={col.id}
                                onClick={() => setActiveTab(col.id)}
                                className={cn(
                                    "flex-1 px-4 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center justify-center gap-2",
                                    activeTab === col.id
                                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 scale-95"
                                        : "text-slate-500 hover:text-slate-300"
                                )}
                            >
                                {col.title}
                                <span className={cn(
                                    "px-1.5 py-0.5 rounded-md text-[10px]",
                                    activeTab === col.id ? "bg-white/20 text-white" : "bg-slate-800 text-slate-600"
                                )}>
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Columns Grid */}
                <div className="flex gap-4 overflow-x-auto pb-6 sm:overflow-visible scrollbar-hide">
                    {COLUMNS.map(col => (
                        <DroppableColumn
                            key={col.id}
                            id={col.id}
                            title={col.title}
                            players={players}
                            participations={participations}
                            team1Name={team1Name}
                            team2Name={team2Name}
                            isAdmin={isAdmin}
                            isActiveMobile={activeTab === col.id}
                            elitePlayerIds={settings?.elitePlayerIds}
                            captain1Id={settings?.captain1Id}
                            captain2Id={settings?.captain2Id}
                        />
                    ))}
                </div>
            </div>
            <DragOverlay>
                {activeId ? (
                    <div className="bg-slate-700 p-3 rounded-lg shadow-2xl opacity-90 border border-indigo-500 transform rotate-3 min-w-[200px]">
                        <p className="text-sm font-bold text-white">
                            {players.find(p => p.id === activeId)?.name}
                        </p>
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}
