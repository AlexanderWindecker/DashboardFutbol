import { Users, TrendingUp, TrendingDown, History, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';

interface AffinityRecord {
    id: string;
    name: string;
    wins: number;
    losses: number;
    draws: number;
}

interface PlayerAffinityProps {
    topAffinity: AffinityRecord[];
    worstAffinity: AffinityRecord[];
    allAffinity: AffinityRecord[];
}

export function PlayerAffinity({ topAffinity, worstAffinity, allAffinity }: PlayerAffinityProps) {
    const [showFullHistory, setShowFullHistory] = useState(false);

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h4 className="flex items-center gap-2 text-emerald-400 text-sm font-bold uppercase tracking-wider mb-4">
                        <TrendingUp size={16} />
                        Mejores Socios
                    </h4>
                    <div className="grid grid-cols-1 gap-2">
                        {topAffinity.length > 0 ? topAffinity.map((record) => (
                            <AffinityCard key={record.id} record={record} variant="success" />
                        )) : (
                            <p className="text-slate-500 text-xs italic">No hay suficientes datos positivos.</p>
                        )}
                    </div>
                </div>

                <div>
                    <h4 className="flex items-center gap-2 text-rose-400 text-sm font-bold uppercase tracking-wider mb-4">
                        <TrendingDown size={16} />
                        Bajo Rendimiento Juntos
                    </h4>
                    <div className="grid grid-cols-1 gap-2">
                        {worstAffinity.length > 0 ? worstAffinity.map((record) => (
                            <AffinityCard key={record.id} record={record} variant="danger" />
                        )) : (
                            <p className="text-slate-500 text-xs italic">No hay suficientes datos negativos.</p>
                        )}
                    </div>
                </div>
            </div>

            <button
                onClick={() => setShowFullHistory(true)}
                className="w-full py-3 px-4 rounded-xl border border-slate-800 bg-slate-900/50 text-indigo-400 hover:text-indigo-300 hover:bg-slate-800/80 transition-all flex items-center justify-center gap-2 text-sm font-semibold group"
            >
                <History size={16} className="group-hover:rotate-[-45deg] transition-transform" />
                Ver Historial Completo con Compañeros
                <ChevronRight size={16} />
            </button>

            {showFullHistory && (
                <Modal
                    isOpen={showFullHistory}
                    title="Historial de Afinidad con Compañeros"
                    onClose={() => setShowFullHistory(false)}
                >
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                        <div className="grid grid-cols-1 gap-3">
                            {[...allAffinity].sort((a, b) => {
                                const totalA = a.wins + a.losses + a.draws;
                                const totalB = b.wins + b.losses + b.draws;
                                const rateA = totalA > 0 ? a.wins / totalA : 0;
                                const rateB = totalB > 0 ? b.wins / totalB : 0;
                                if (rateB !== rateA) return rateB - rateA;
                                return totalB - totalA; // Tiebreaker: total matches played
                            }).map((record) => {
                                const total = record.wins + record.losses + record.draws;
                                const winRate = total > 0 ? Math.round((record.wins / total) * 100) : 0;
                                let variant: 'success' | 'danger' | 'default' = 'default';
                                if (winRate >= 60) variant = 'success';
                                if (winRate <= 40) variant = 'danger';

                                return (
                                    <div key={record.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-slate-800">
                                        <div className="flex flex-col">
                                            <span className="text-white font-semibold">{record.name}</span>
                                            <span className="text-xs text-slate-500 font-bold uppercase tracking-tight">
                                                {record.wins}V - {record.draws}E - {record.losses}D
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right hidden sm:block">
                                                <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                                    <div
                                                        className={cn(
                                                            "h-full rounded-full transition-all duration-1000",
                                                            winRate >= 60 ? "bg-emerald-500" : winRate <= 40 ? "bg-rose-500" : "bg-sky-500"
                                                        )}
                                                        style={{ width: `${winRate}%` }}
                                                    />
                                                </div>
                                            </div>
                                            <div className={cn(
                                                "px-3 py-1 rounded-lg text-xs font-black min-w-[50px] text-center",
                                                winRate >= 60 ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" :
                                                    winRate <= 40 ? "bg-rose-500/10 text-rose-500 border border-rose-500/20" :
                                                        "bg-sky-500/10 text-sky-500 border border-sky-500/20"
                                            )}>
                                                {winRate}%
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}

function AffinityCard({ record, variant }: { record: AffinityRecord; variant: 'success' | 'danger' }) {
    const total = record.wins + record.losses + record.draws;
    const winRate = total > 0 ? Math.round((record.wins / total) * 100) : 0;

    return (
        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800/50">
            <div className="flex flex-col">
                <span className="text-white font-medium text-sm">{record.name}</span>
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">
                    {record.wins}V - {record.draws}E - {record.losses}D
                </span>
            </div>
            <div className={cn(
                "px-2 py-1 rounded text-xs font-bold",
                variant === 'success' ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
            )}>
                {winRate}% Eficacia
            </div>
        </div>
    );
}
