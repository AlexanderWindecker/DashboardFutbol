'use client';

import { useState } from 'react';
import { updatePlayerNameAction } from '@/actions/players';
import { Pencil, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

import { useAdmin } from '@/hooks/useAdmin';

export function EditablePlayerName({ id, name, isActive, className }: { id: string, name: string, isActive: boolean, className?: string }) {
    const { isAdmin } = useAdmin();
    const [isEditing, setIsEditing] = useState(false);
    const [newName, setNewName] = useState(name);

    if (!isAdmin) {
        return <h3 className={cn("font-semibold", isActive ? "text-white" : "text-slate-500 line-through", className)}>{name}</h3>;
    }

    async function handleSave() {
        if (newName && newName !== name) {
            await updatePlayerNameAction(id, newName);
        }
        setIsEditing(false);
    }

    if (isEditing) {
        return (
            <div className="flex items-center gap-2">
                <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-base md:text-2xl text-white font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full max-w-[200px] md:max-w-[300px] shadow-xl"
                    autoFocus
                />
                <button
                    onClick={handleSave}
                    className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 rounded-xl border border-emerald-500/20 transition-all active:scale-90"
                    title="Guardar"
                >
                    <Check size={20} />
                </button>
                <button
                    onClick={() => setIsEditing(false)}
                    className="p-2 bg-slate-800/50 hover:bg-slate-800 text-slate-400 rounded-xl border border-slate-700 transition-all active:scale-90"
                    title="Cancelar"
                >
                    <X size={20} />
                </button>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-3">
            <h1 className={cn("font-bold text-2xl md:text-3xl tracking-tight leading-none", isActive ? "text-white" : "text-slate-500 line-through", className)}>{name}</h1>
            <button
                onClick={() => setIsEditing(true)}
                className="p-2 rounded-xl bg-slate-800/30 text-slate-500 hover:text-indigo-400 hover:bg-slate-800 transition-all border border-transparent hover:border-slate-700 shadow-sm active:scale-90"
                title="Editar nombre"
            >
                <Pencil size={18} />
            </button>
        </div>
    );
}
