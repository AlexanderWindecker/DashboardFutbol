'use client';

import { useState } from 'react';
import { updateMatchDetailsAction, deleteMatchAction } from '@/actions/matches';
import { Match, Season } from '@/types';
import { Button } from '@/components/ui/Button';
import { X, Pencil, Loader2, Save, Trash2, Trophy } from 'lucide-react';

export function EditMatchDialog({ match, seasons }: { match: Match, seasons: Season[] }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isPending, setIsPending] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    async function handleSubmit(formData: FormData) {
        setIsPending(true);
        await updateMatchDetailsAction(match.id, formData);
        setIsPending(false);
        setIsOpen(false);
    }

    async function handleDelete() {
        if (confirm('¿Estás seguro de que quieres eliminar este partido? Esta acción no se puede deshacer.')) {
            setIsDeleting(true);
            await deleteMatchAction(match.id);
        }
    }

    if (!isOpen) {
        return (
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(true)} className="text-slate-400 hover:text-white">
                <Pencil size={14} className="mr-2" />
                Editar
            </Button>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-white">Editar Partido</h2>
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
                            defaultValue={match.date}
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
                                defaultValue={match.seasonId || ''}
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
                            defaultValue={match.mode}
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
                            defaultValue={match.location}
                            placeholder="Ej. Canchas del Centro"
                            className="w-full h-10 px-3 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <div className="flex items-center justify-between mt-8 pt-4 border-t border-slate-800">
                        <Button
                            type="button"
                            variant="ghost"
                            className="text-red-400 hover:text-red-300 hover:bg-red-950/30"
                            onClick={handleDelete}
                            disabled={isDeleting || isPending}
                        >
                            {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 size={16} className="mr-2" />}
                            Eliminar Partido
                        </Button>

                        <div className="flex gap-2">
                            <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isPending || isDeleting}>
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Guardar
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
