'use client';

import { useState } from 'react';
import { Season } from '@/types';
import { Button } from '@/components/ui/Button';
import { createSeasonAction, deleteSeasonAction, setActiveSeason } from '@/actions/seasons';
import { Calendar, Trash2, Trophy, Plus, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SeasonManagerProps {
    seasons: Season[];
    activeSeasonId?: string;
}

export function SeasonManager({ seasons, activeSeasonId }: SeasonManagerProps) {
    const [isCreating, setIsCreating] = useState(false);
    const [newName, setNewName] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('name', newName);
        formData.append('startDate', startDate);
        formData.append('endDate', endDate);
        await createSeasonAction(formData);
        setIsCreating(false);
        setNewName('');
        setStartDate('');
        setEndDate('');
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Trophy size={14} className="text-amber-500" />
                    Gestión de Temporadas
                </h3>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsCreating(!isCreating)}
                    className="h-7 text-[10px] gap-1 text-indigo-400 hover:text-indigo-300"
                >
                    <Plus size={12} /> Nueva Temporada
                </Button>
            </div>

            {isCreating && (
                <form onSubmit={handleCreate} className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl space-y-4 animate-in fade-in slide-in-from-top-2">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nombre</label>
                            <input
                                type="text"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder="Ej: Clausura 2024"
                                required
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Inicio</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                required
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Fin</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                required
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="ghost" size="sm" onClick={() => setIsCreating(false)} className="text-[10px]">
                            Cancelar
                        </Button>
                        <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-[10px]">
                            Crear Temporada
                        </Button>
                    </div>
                </form>
            )}

            <div className="grid grid-cols-1 gap-2">
                {seasons.length === 0 ? (
                    <p className="text-xs text-slate-500 italic py-4 text-center">No hay temporadas definidas.</p>
                ) : (
                    seasons.map((season) => (
                        <div
                            key={season.id}
                            className={cn(
                                "group p-3 rounded-xl border flex items-center justify-between transition-all",
                                activeSeasonId === season.id
                                    ? "bg-indigo-500/10 border-indigo-500/30"
                                    : "bg-slate-900/30 border-slate-800"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "w-8 h-8 rounded-lg flex items-center justify-center",
                                    activeSeasonId === season.id ? "bg-indigo-500/20" : "bg-slate-800"
                                )}>
                                    <Calendar size={14} className={activeSeasonId === season.id ? "text-indigo-400" : "text-slate-500"} />
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-white flex gap-2 items-center">
                                        {season.name}
                                        {activeSeasonId === season.id && (
                                            <span className="px-1.5 py-0.5 rounded-full bg-indigo-500 text-[8px] uppercase tracking-tighter text-white">
                                                Activa
                                            </span>
                                        )}
                                    </h4>
                                    <p className="text-[9px] text-slate-500 flex items-center gap-1 font-medium italic">
                                        {season.startDate} • {season.endDate}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {activeSeasonId !== season.id && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setActiveSeason(season.id)}
                                        className="h-7 px-2 text-[9px] font-bold text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10"
                                    >
                                        Activar
                                    </Button>
                                )}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteSeasonAction(season.id)}
                                    className="h-7 w-7 p-0 text-slate-500 hover:text-red-400 hover:bg-red-400/10"
                                >
                                    <Trash2 size={12} />
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
