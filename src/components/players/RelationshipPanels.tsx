'use client';

import { Player } from '@/types';
import { useMemo, useState } from 'react';
import { Heart, Zap, User, Search, ArrowRightLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';

interface RelationshipPanelsProps {
    players: Player[];
    privacyMode?: boolean;
}

export function RelationshipPanels({ players, privacyMode = false }: RelationshipPanelsProps) {
    const [searchTerm, setSearchTerm] = useState('');

    // Helper for stable masked names
    const getDisplayName = (player: Player) => {
        if (!privacyMode) return player.name;
        const index = players.findIndex(p => p.id === player.id);
        return `Jugador ${index + 1}`;
    };

    // Process relationships into unique pairs
    const { affinities, conflicts } = useMemo(() => {
        const affinityPairs: { p1: Player, p2: Player, id: string }[] = [];
        const conflictPairs: { p1: Player, p2: Player, id: string }[] = [];
        const processedAff = new Set<string>();
        const processedConf = new Set<string>();

        players.forEach(p1 => {
            // Affinities
            (p1.affinities || []).forEach(p2Id => {
                const key = [p1.id, p2Id].sort().join('-');
                if (!processedAff.has(key)) {
                    const p2 = players.find(p => p.id === p2Id);
                    if (p2) {
                        affinityPairs.push({ p1, p2, id: key });
                        processedAff.add(key);
                    }
                }
            });

            // Conflicts
            (p1.conflicts || []).forEach(p2Id => {
                const key = [p1.id, p2Id].sort().join('-');
                if (!processedConf.has(key)) {
                    const p2 = players.find(p => p.id === p2Id);
                    if (p2) {
                        conflictPairs.push({ p1, p2, id: key });
                        processedConf.add(key);
                    }
                }
            });
        });

        return { affinities: affinityPairs, conflicts: conflictPairs };
    }, [players]);

    // Filter by search
    const filteredAffinities = affinities.filter(pair => {
        const p1Name = getDisplayName(pair.p1).toLowerCase();
        const p2Name = getDisplayName(pair.p2).toLowerCase();
        const realP1Name = pair.p1.name.toLowerCase();
        const realP2Name = pair.p2.name.toLowerCase();
        const search = searchTerm.toLowerCase();
        return p1Name.includes(search) || p2Name.includes(search) ||
            realP1Name.includes(search) || realP2Name.includes(search);
    });

    const filteredConflicts = conflicts.filter(pair => {
        const p1Name = getDisplayName(pair.p1).toLowerCase();
        const p2Name = getDisplayName(pair.p2).toLowerCase();
        const realP1Name = pair.p1.name.toLowerCase();
        const realP2Name = pair.p2.name.toLowerCase();
        const search = searchTerm.toLowerCase();
        return p1Name.includes(search) || p2Name.includes(search) ||
            realP1Name.includes(search) || realP2Name.includes(search);
    });

    return (
        <div className="space-y-8 w-full max-w-6xl mx-auto">

            {/* Search Bar */}
            <div className="relative max-w-md mx-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                    type="text"
                    placeholder={privacyMode ? "Buscar (Jugador X o nombre)..." : "Buscar jugador..."}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-full py-2 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* Affinities Panel */}
                <div className="relative group">
                    <div className="absolute inset-0 bg-indigo-500/10 blur-[40px] rounded-3xl pointer-events-none group-hover:bg-indigo-500/15 transition-all" />
                    <div className="relative bg-slate-900/60 backdrop-blur-xl border border-indigo-500/30 rounded-3xl p-6 h-[600px] flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
                                    <Heart size={20} fill="currentColor" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white tracking-tight">Socios</h2>
                                    <p className="text-xs text-indigo-300/60 font-medium uppercase tracking-widest">Sinérgias Confirmadas</p>
                                </div>
                            </div>
                            <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30">{filteredAffinities.length}</Badge>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                            {filteredAffinities.length > 0 ? (
                                filteredAffinities.map((pair) => (
                                    <div key={pair.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-950/50 border border-indigo-500/10 hover:border-indigo-500/30 transition-colors group/item">
                                        <div className="flex items-center gap-3 w-[45%]">
                                            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-700">
                                                <User size={14} />
                                            </div>
                                            <span className="text-sm font-medium text-slate-200 truncate">{getDisplayName(pair.p1)}</span>
                                        </div>

                                        <div className="flex flex-col items-center justify-center w-[10%] opacity-30 group-hover/item:opacity-100 transition-opacity">
                                            <ArrowRightLeft size={12} className="text-indigo-400" />
                                        </div>

                                        <div className="flex items-center justify-end gap-3 w-[45%] text-right">
                                            <span className="text-sm font-medium text-slate-200 truncate">{getDisplayName(pair.p2)}</span>
                                            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-700">
                                                <User size={14} />
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-slate-500 italic text-sm">
                                    <Heart size={32} className="mb-2 opacity-20" />
                                    No hay socios encontrados
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Conflicts Panel */}
                <div className="relative group">
                    <div className="absolute inset-0 bg-rose-500/10 blur-[40px] rounded-3xl pointer-events-none group-hover:bg-rose-500/15 transition-all" />
                    <div className="relative bg-slate-900/60 backdrop-blur-xl border border-rose-500/30 rounded-3xl p-6 h-[600px] flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-rose-500/20 rounded-lg text-rose-400">
                                    <Zap size={20} fill="currentColor" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white tracking-tight">Rivales</h2>
                                    <p className="text-xs text-rose-300/60 font-medium uppercase tracking-widest">Conflictos Activos</p>
                                </div>
                            </div>
                            <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/30">{filteredConflicts.length}</Badge>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                            {filteredConflicts.length > 0 ? (
                                filteredConflicts.map((pair) => (
                                    <div key={pair.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-950/50 border border-rose-500/10 hover:border-rose-500/30 transition-colors group/item">
                                        <div className="flex items-center gap-3 w-[45%]">
                                            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-700">
                                                <User size={14} />
                                            </div>
                                            <span className="text-sm font-medium text-slate-200 truncate">{getDisplayName(pair.p1)}</span>
                                        </div>

                                        <div className="flex flex-col items-center justify-center w-[10%] opacity-30 group-hover/item:opacity-100 transition-opacity">
                                            <Zap size={12} className="text-rose-400" />
                                        </div>

                                        <div className="flex items-center justify-end gap-3 w-[45%] text-right">
                                            <span className="text-sm font-medium text-slate-200 truncate">{getDisplayName(pair.p2)}</span>
                                            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-700">
                                                <User size={14} />
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-slate-500 italic text-sm">
                                    <Zap size={32} className="mb-2 opacity-20" />
                                    No hay rivales encontrados
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
