'use client';

import { Player } from '@/types';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Users, Heart, Zap, X, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AffinityManagerProps {
    player: Player;
    allPlayers: Player[];
    onSave: (affinities: string[], conflicts: string[]) => void;
    isPending?: boolean;
}

export function AffinityManager({ player, allPlayers, onSave, isPending }: AffinityManagerProps) {
    const [affinities, setAffinities] = useState<string[]>(Array.from(new Set(player.affinities || [])));
    const [conflicts, setConflicts] = useState<string[]>(Array.from(new Set(player.conflicts || [])));
    const [searchTerm, setSearchTerm] = useState('');

    const otherPlayers = allPlayers.filter(p => p.id !== player.id);
    const filteredPlayers = otherPlayers.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !affinities.includes(p.id) &&
        !conflicts.includes(p.id)
    );

    const handleAddAffinity = (id: string) => {
        setAffinities(prev => [...prev, id]);
        setSearchTerm('');
    };

    const handleAddConflict = (id: string) => {
        setConflicts(prev => [...prev, id]);
        setSearchTerm('');
    };

    const removeAffinity = (id: string) => {
        setAffinities(prev => prev.filter(a => a !== id));
    };

    const removeConflict = (id: string) => {
        setConflicts(prev => prev.filter(c => c !== id));
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Affinities (Friends/Favorites) */}
                <div className="space-y-4">
                    <h4 className="flex items-center gap-2 text-emerald-400 text-sm font-bold uppercase tracking-wider">
                        <Heart size={16} fill="currentColor" />
                        Socios Predilectos
                    </h4>
                    <p className="text-xs text-slate-500">Estos jugadores intentarán estar en el MISMO equipo.</p>
                    <div className="flex flex-wrap gap-2">
                        {Array.from(new Set(affinities)).map(id => {
                            const p = allPlayers.find(pl => pl.id === id);
                            return (
                                <div key={id} className="flex items-center gap-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-1 rounded-full text-xs font-medium">
                                    {p?.name || 'Desconocido'}
                                    <button onClick={() => removeAffinity(id)} className="hover:text-emerald-300">
                                        <X size={12} />
                                    </button>
                                </div>
                            );
                        })}
                        {affinities.length === 0 && <span className="text-slate-600 text-xs italic">Sin socios definidos</span>}
                    </div>
                </div>

                {/* Conflicts (Rivals) */}
                <div className="space-y-4">
                    <h4 className="flex items-center gap-2 text-rose-400 text-sm font-bold uppercase tracking-wider">
                        <Zap size={16} fill="currentColor" />
                        Rivales (Separar)
                    </h4>
                    <p className="text-xs text-slate-500">Estos jugadores intentarán estar en equipos DIFERENTES.</p>
                    <div className="flex flex-wrap gap-2">
                        {Array.from(new Set(conflicts)).map(id => {
                            const p = allPlayers.find(pl => pl.id === id);
                            return (
                                <div key={id} className="flex items-center gap-1 bg-rose-500/10 text-rose-500 border border-rose-500/20 px-2 py-1 rounded-full text-xs font-medium">
                                    {p?.name || 'Desconocido'}
                                    <button onClick={() => removeConflict(id)} className="hover:text-rose-300">
                                        <X size={12} />
                                    </button>
                                </div>
                            );
                        })}
                        {conflicts.length === 0 && <span className="text-slate-600 text-xs italic">Sin rivales definidos</span>}
                    </div>
                </div>
            </div>

            {/* Search and Add */}
            <div className="pt-4 border-t border-slate-800">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Buscar jugador para agregar regla..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    {searchTerm && (
                        <div className="absolute z-10 w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                            {filteredPlayers.length > 0 ? filteredPlayers.map(p => (
                                <div key={p.id} className="flex items-center justify-between p-2 hover:bg-slate-800 transition-colors">
                                    <span className="text-sm text-slate-200">{p.name}</span>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => handleAddAffinity(p.id)}
                                            className="p-1.5 rounded bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30 transition-colors"
                                            title="Agregar como Socio"
                                        >
                                            <Heart size={14} fill="currentColor" />
                                        </button>
                                        <button
                                            onClick={() => handleAddConflict(p.id)}
                                            className="p-1.5 rounded bg-rose-500/20 text-rose-500 hover:bg-rose-500/30 transition-colors"
                                            title="Agregar como Rival"
                                        >
                                            <Zap size={14} fill="currentColor" />
                                        </button>
                                    </div>
                                </div>
                            )) : (
                                <div className="p-4 text-center text-slate-500 text-xs">No se encontraron jugadores.</div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex justify-end">
                <Button
                    onClick={() => onSave(affinities, conflicts)}
                    disabled={isPending}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                    {isPending ? 'Guardando...' : 'Guardar Reglas de Afinidad'}
                </Button>
            </div>
        </div>
    );
}
