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
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold text-white">Jugadores</h1>
                        {/* Privacy Toggle */}
                        <button
                            onClick={() => setPrivacyMode(!privacyMode)}
                            className="p-2 rounded-full hover:bg-slate-800 text-slate-500 hover:text-white transition-colors"
                            title={privacyMode ? "Desactivar Modo Privacidad" : "Activar Modo Privacidad"}
                        >
                            {privacyMode ? <EyeOff size={20} className="text-indigo-400" /> : <Eye size={20} />}
                        </button>
                    </div>
                    <p className="text-slate-400">Administra el plantel.</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/players/social">
                        <Button variant="outline" className="border-slate-800 text-slate-300 hover:text-white">
                            <Share2 size={18} className="mr-2" />
                            Mapa Social
                        </Button>
                    </Link>
                    <Link href="/players/compare">
                        <Button variant="outline" className="border-slate-800 text-slate-300 hover:text-white">
                            <Sword size={18} className="mr-2" />
                            Comparar
                        </Button>
                    </Link>
                    {isAdmin && (
                        <form action={createPlayerAction} className="flex gap-2">
                            <input
                                name="name"
                                placeholder="Nombre"
                                required
                                className="h-10 px-3 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 w-32 md:w-48"
                            />
                            <input
                                name="phone"
                                placeholder="Teléfono"
                                className="h-10 px-3 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 w-32 md:w-32"
                            />
                            <Button type="submit">
                                <UserPlus size={18} className="mr-2" />
                                Agregar
                            </Button>
                        </form>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                            "bg-slate-900 border border-slate-800 rounded-xl p-6 flex items-center justify-between transition-colors group",
                            isUnavailable && "opacity-60 bg-slate-950/30"
                        )}>
                            <div className="flex items-center gap-4">
                                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg", isActive ? "bg-slate-800 text-slate-300" : "bg-slate-950 text-slate-700")}>
                                    <User size={20} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        {/* If privacy mode is on, just show text, else show editable if admin */}
                                        {privacyMode || !isAdmin ? (
                                            <span className="text-white font-medium">{displayName}</span>
                                        ) : (
                                            <EditablePlayerName id={player.id} name={player.name} isActive={isActive} />
                                        )}

                                        <Link href={`/players/${player.id}`} className="text-slate-500 hover:text-sky-400 transition-colors p-1">
                                            <User size={14} />
                                        </Link>
                                    </div>
                                    <div className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                                        {displayPhone ? (
                                            <span className="text-sky-400 font-mono">{displayPhone}</span>
                                        ) : (
                                            `ID: ${displayId}`
                                        )}
                                        <div className="flex gap-1">
                                            {!isActive && <Badge variant="outline" className="text-[10px] py-0">Inactivo</Badge>}
                                            {isActive && isInjured && <Badge variant="outline" className="text-[10px] py-0 border-red-500/50 text-red-500 flex items-center gap-0.5"><Plus size={8} />Lesionado</Badge>}
                                            {isActive && isVacation && <Badge variant="outline" className="text-[10px] py-0 border-amber-500/50 text-amber-500 flex items-center gap-0.5"><Palmtree size={8} />Vacaciones</Badge>}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {isAdmin && (
                                <form action={togglePlayerStatusAction.bind(null, player.id)}>
                                    <button
                                        className="p-2 rounded-full text-slate-600 hover:bg-slate-800 hover:text-white transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                        title={isActive ? "Desactivar" : "Reactivar"}
                                    >
                                        {isActive ? <UserX size={18} /> : <UserCheck size={18} className="text-emerald-400" />}
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
