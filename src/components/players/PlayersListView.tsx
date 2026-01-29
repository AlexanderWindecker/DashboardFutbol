'use client';

import { useState } from 'react';
import { Player } from '@/types';
import { UserPlus, UserX, UserCheck, User, Sword, Share2, Eye, EyeOff, Plus, Palmtree } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { EditablePlayerName } from '@/components/players/EditablePlayerName';
import { togglePlayerStatusAction, createPlayerAction } from '@/actions/players';
import Link from 'next/link';
import { useAdmin } from '@/hooks/useAdmin';

interface PlayersListViewProps {
    players: Player[];
}

export function PlayersListView({ players }: PlayersListViewProps) {
    const [privacyMode, setPrivacyMode] = useState(false);
    const { isAdmin } = useAdmin();

    // Sort logic
    const sortedPlayers = [...players].sort((a, b) => {
        const activeA = a.isActive ?? true;
        const activeB = b.isActive ?? true;
        const availableA = activeA && !a.isInjured && !a.isVacation;
        const availableB = activeB && !b.isInjured && !b.isVacation;

        if (availableA !== availableB) return availableA ? -1 : 1;
        if (activeA !== activeB) return activeA ? -1 : 1;

        const nameA = a.name || '';
        const nameB = b.name || '';
        return nameA.localeCompare(nameB);
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl md:text-3xl font-bold text-white">Jugadores</h1>
                        {/* Privacy Toggle */}
                        <button
                            onClick={() => setPrivacyMode(!privacyMode)}
                            className="p-2 rounded-full hover:bg-slate-800 text-slate-500 hover:text-white transition-colors"
                            title={privacyMode ? "Desactivar Modo Privacidad" : "Activar Modo Privacidad"}
                        >
                            {privacyMode ? <EyeOff size={18} className="text-indigo-400" /> : <Eye size={18} />}
                        </button>
                    </div>
                    <p className="text-xs md:text-sm text-slate-400">Administra el plantel.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Link href="/players/social">
                        <Button variant="outline" size="sm" className="border-slate-800 text-slate-300 hover:text-white h-9 px-3">
                            <Share2 size={16} className="mr-1.5" />
                            <span className="hidden xs:inline">Mapa Social</span>
                            <span className="xs:hidden">Mapa</span>
                        </Button>
                    </Link>
                    <Link href="/players/compare">
                        <Button variant="outline" size="sm" className="border-slate-800 text-slate-300 hover:text-white h-9 px-3">
                            <Sword size={16} className="mr-1.5" />
                            <span className="hidden xs:inline">Comparar</span>
                            <span className="xs:hidden">Versus</span>
                        </Button>
                    </Link>
                    {isAdmin && (
                        <form action={createPlayerAction} className="flex items-center gap-1.5 ml-auto sm:ml-0">
                            <input
                                name="name"
                                placeholder="Nombre"
                                required
                                className="h-9 px-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 w-24 xs:w-32"
                            />
                            <Button type="submit" size="sm" className="h-9 px-3">
                                <Plus size={16} />
                            </Button>
                        </form>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                {sortedPlayers.map((player, index) => {
                    const isActive = player.isActive ?? true;
                    // MASK LOGIC
                    const displayName = privacyMode ? `Jugador ${index + 1}` : player.name;
                    const displayPhone = privacyMode ? undefined : player.phone;
                    const displayId = player.id.slice(0, 8);

                    const isInjured = player.isInjured;
                    const isVacation = player.isVacation;
                    const isUnavailable = !isActive || isInjured || isVacation;

                    return (
                        <div key={player.id} className={cn(
                            "bg-slate-900 border border-slate-800 rounded-xl p-3 md:p-6 flex flex-col sm:flex-row items-center sm:justify-between gap-3 transition-colors group relative",
                            isUnavailable && "opacity-60 bg-slate-950/30"
                        )}>
                            <div className="flex items-center gap-2 md:gap-4 w-full">
                                <div className={cn("w-8 h-8 md:w-10 md:h-10 rounded-full shrink-0 flex items-center justify-center font-bold text-base md:text-lg", isActive ? "bg-slate-800 text-slate-300" : "bg-slate-950 text-slate-700")}>
                                    <User size={16} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5">
                                        {/* If privacy mode is on, just show text, else show editable if admin */}
                                        {privacyMode || !isAdmin ? (
                                            <span className="text-white font-medium text-xs md:text-base truncate">{displayName}</span>
                                        ) : (
                                            <div className="truncate flex-1">
                                                <EditablePlayerName id={player.id} name={player.name} isActive={isActive} />
                                            </div>
                                        )}

                                        <Link href={`/players/${player.id}`} className="text-slate-500 hover:text-sky-400 transition-colors p-1 shrink-0">
                                            <User size={12} />
                                        </Link>
                                    </div>
                                    <div className="text-[10px] md:text-xs text-slate-500 flex flex-wrap items-center gap-1.5 mt-0.5 md:mt-1">
                                        {displayPhone ? (
                                            <span className="text-sky-400 font-mono truncate">{displayPhone}</span>
                                        ) : (
                                            <span className="opacity-50">ID: {displayId}</span>
                                        )}
                                        <div className="flex flex-wrap gap-1">
                                            {!isActive && <Badge variant="outline" className="text-[8px] md:text-[10px] py-0 px-1 leading-tight">OFF</Badge>}
                                            {isActive && isInjured && <Badge variant="outline" className="text-[8px] md:text-[10px] py-0 px-1 border-red-500/50 text-red-500 flex items-center gap-0.5"><Plus size={8} />Cruz</Badge>}
                                            {isActive && isVacation && <Badge variant="outline" className="text-[8px] md:text-[10px] py-0 px-1 border-amber-500/50 text-amber-500 flex items-center gap-0.5"><Palmtree size={8} />Vacas</Badge>}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {isAdmin && (
                                <form action={togglePlayerStatusAction.bind(null, player.id)} className="absolute top-2 right-2 sm:relative sm:top-0 sm:right-0">
                                    <button
                                        className="p-1.5 rounded-full text-slate-600 hover:bg-slate-800 hover:text-white transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                        title={isActive ? "Desactivar" : "Reactivar"}
                                    >
                                        {isActive ? <UserX size={16} /> : <UserCheck size={16} className="text-emerald-400" />}
                                    </button>
                                </form>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    );
}
