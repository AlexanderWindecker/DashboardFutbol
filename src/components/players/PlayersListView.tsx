'use client';

import { useState } from 'react';
import { Player } from '@/types';
import { UserPlus, UserX, UserCheck, User, Sword, Share2, Eye, EyeOff, Plus, Palmtree, Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { EditablePlayerName } from '@/components/players/EditablePlayerName';
import { togglePlayerStatusAction, createPlayerAction, importPlayersAction } from '@/actions/players';
import { useRef } from 'react';
import Link from 'next/link';
import { useAdmin } from '@/hooks/useAdmin';

interface PlayersListViewProps {
    players: Player[];
}

export function PlayersListView({ players }: PlayersListViewProps) {
    const [privacyMode, setPrivacyMode] = useState(false);
    const { isAdmin } = useAdmin();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleExportCSV = () => {
        const headers = ['ID', 'Nombre', 'Telefono', 'Ritmo', 'Tiros', 'Pases', 'Regates', 'Velocidad'];
        const rows = players.map(p => [
            p.id,
            p.name,
            p.phone || '',
            p.skills?.ritmo || 50,
            p.skills?.tiros || 50,
            p.skills?.pases || 50,
            p.skills?.regates || 50,
            p.skills?.velocidad || 50
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(r => r.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `plantel_futbol_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target?.result as string;
            if (!text) return;

            const lines = text.split('\n');
            const headers = lines[0].split(',');
            const updates: any[] = [];

            for (let i = 1; i < lines.length; i++) {
                if (!lines[i].trim()) continue;
                const values = lines[i].split(',');
                const update: any = {
                    id: values[0],
                    name: values[1],
                    phone: values[2] || undefined,
                    skills: {
                        ritmo: parseInt(values[3]) || 50,
                        tiros: parseInt(values[4]) || 50,
                        pases: parseInt(values[5]) || 50,
                        regates: parseInt(values[6]) || 50,
                        velocidad: parseInt(values[7]) || 50
                    }
                };
                updates.push(update);
            }

            if (updates.length > 0) {
                if (confirm(`¿Estás seguro de importar cambios para ${updates.length} jugadores?`)) {
                    await importPlayersAction(updates);
                }
            }
        };
        reader.readAsText(file);
    };

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
                        <>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImportCSV}
                                accept=".csv"
                                className="hidden"
                            />
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleExportCSV}
                                className="border-amber-500/20 text-amber-500 hover:bg-amber-500/10 h-9 px-3"
                            >
                                <Download size={16} className="mr-1.5" />
                                <span className="hidden xs:inline">Exportar</span>
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => fileInputRef.current?.click()}
                                className="border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/10 h-9 px-3"
                            >
                                <Upload size={16} className="mr-1.5" />
                                <span className="hidden xs:inline">Importar</span>
                            </Button>

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
                        </>
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
                            "bg-slate-900 border border-slate-800 rounded-xl p-3 md:p-5 flex flex-col gap-3 transition-all group relative",
                            isUnavailable && "opacity-70 bg-slate-950/40"
                        )}>
                            <div className="flex items-start justify-between gap-3">
                                <Link href={`/players/${player.id}`} className="flex items-center gap-3 min-w-0 flex-1 group/link">
                                    <div className={cn(
                                        "w-10 h-10 md:w-12 md:h-12 rounded-xl shrink-0 flex items-center justify-center font-bold text-lg md:text-xl transition-transform group-hover/link:scale-105 shadow-lg border",
                                        isActive ? "bg-slate-800 border-slate-700 text-slate-300" : "bg-slate-950 border-slate-900 text-slate-700"
                                    )}>
                                        <User size={20} />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-white font-bold text-sm md:text-base truncate">{displayName}</span>
                                        </div>
                                        <div className="text-[10px] md:text-xs text-slate-500 mt-1 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                            {displayPhone ? (
                                                <span className="text-sky-400 font-mono font-medium truncate">{displayPhone}</span>
                                            ) : (
                                                <span className="opacity-40 font-mono">ID: {displayId}</span>
                                            )}
                                        </div>
                                    </div>
                                </Link>

                                {isAdmin && (
                                    <form action={togglePlayerStatusAction.bind(null, player.id)} className="shrink-0">
                                        <button
                                            className={cn(
                                                "p-2.5 rounded-xl transition-all border shadow-sm",
                                                isActive
                                                    ? "bg-slate-950/50 border-slate-800 text-slate-600 hover:text-white hover:bg-slate-800 hover:border-slate-700 active:scale-90"
                                                    : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/30 active:scale-90"
                                            )}
                                            title={isActive ? "Desactivar" : "Reactivar"}
                                        >
                                            {isActive ? <UserX size={18} /> : <UserCheck size={18} />}
                                        </button>
                                    </form>
                                )}
                            </div>

                            <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-800/50 mt-1">
                                {!isActive && <Badge variant="outline" className="text-[9px] md:text-[10px] py-0.5 px-2 bg-slate-950 font-bold tracking-wider">CUENTA DESACTIVADA</Badge>}
                                {isActive && isInjured && <Badge variant="outline" className="text-[9px] md:text-[10px] py-0.5 px-2 border-red-500/30 text-red-500 bg-red-500/10 flex items-center gap-1 font-bold"><Plus size={10} className="rotate-45" />LESIONADO</Badge>}
                                {isActive && isVacation && <Badge variant="outline" className="text-[9px] md:text-[10px] py-0.5 px-2 border-amber-500/30 text-amber-500 bg-amber-500/10 flex items-center gap-1 font-bold"><Palmtree size={10} />VACACIONES</Badge>}
                                {isActive && !isInjured && !isVacation && <Badge variant="outline" className="text-[9px] md:text-[10px] py-0.5 px-2 border-emerald-500/30 text-emerald-500 bg-emerald-500/10 font-bold">DISPONIBLE</Badge>}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    );
}
