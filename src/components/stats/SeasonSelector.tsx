'use client';

import { Season } from '@/types';
import { useRouter, useSearchParams } from 'next/navigation';
import { Trophy } from 'lucide-react';

interface SeasonSelectorProps {
    seasons: Season[];
    activeSeasonId?: string;
}

export function SeasonSelector({ seasons, activeSeasonId }: SeasonSelectorProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentSeasonId = searchParams.get('seasonId') || activeSeasonId || '';

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = e.target.value;
        const params = new URLSearchParams(searchParams.toString());
        if (id) {
            params.set('seasonId', id);
        } else {
            params.delete('seasonId');
        }
        router.push(`/stats?${params.toString()}`);
    };

    return (
        <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl shadow-lg">
            <Trophy size={16} className="text-amber-500" />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest hidden md:inline">Temporada:</span>
            <select
                value={currentSeasonId}
                onChange={handleChange}
                className="bg-transparent text-sm font-semibold text-white outline-none cursor-pointer hover:text-indigo-400 transition-colors"
            >
                <option value="" className="bg-slate-900 text-white">Todas las Temporadas</option>
                {seasons.map((season) => (
                    <option key={season.id} value={season.id} className="bg-slate-900 text-white">
                        {season.name} {activeSeasonId === season.id ? '(Activa)' : ''}
                    </option>
                ))}
            </select>
        </div>
    );
}
