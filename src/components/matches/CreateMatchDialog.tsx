'use client';

import { useState } from 'react';
import { createMatchAction } from '@/actions/matches';
import { Button } from '@/components/ui/Button';
import { X, Plus, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Season } from '@/types';
import { Trophy } from 'lucide-react';

interface CreateMatchDialogProps {
    seasons: Season[];
    activeSeasonId?: string;
}

export function CreateMatchDialog({ seasons, activeSeasonId }: CreateMatchDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isPending, setIsPending] = useState(false);
    const router = useRouter();

    async function handleSubmit(formData: FormData) {
        setIsPending(true);
        await createMatchAction(formData);
        setIsPending(false);
        setIsOpen(false);
        // Router refresh is handled by server action redirect/revalidate usually, but sometimes client refresh is nice
        // router.refresh(); 
    }

    if (!isOpen) {
        return (
            <Button onClick={() => setIsOpen(true)}>
                <Plus size={16} className="mr-2" />
                Nuevo Partido
            </Button>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-white">Nuevo Partido</h2>
                    <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                <form action={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Fecha</label>
                        <input
                            name="date"
                            type="date"
                            required
                            className="w-full h-10 px-3 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    {seasons.length > 0 && (
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1 flex items-center gap-2">
                                <Trophy size={14} className="text-amber-500" />
                                Temporada
                            </label>
                            <select
                                name="seasonId"
                                defaultValue={activeSeasonId}
                                className="w-full h-10 px-3 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="">Ninguna / Fuera de Temporada</option>
                                {seasons.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Modalidad</label>
                        <select
                            name="mode"
                            className="w-full h-10 px-3 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="6v6">6 vs 6</option>
                            <option value="7v7">7 vs 7</option>
                            <option value="8v8">8 vs 8</option>
                            <option value="9v9">9 vs 9</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Cancha / Ubicación</label>
                        <input
                            name="location"
                            type="text"
                            placeholder="Ej. Canchas del Centro"
                            className="w-full h-10 px-3 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Crear Partido
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
