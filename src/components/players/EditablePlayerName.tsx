'use client';

import { useState } from 'react';
import { updatePlayerNameAction } from '@/actions/players';
import { Pencil, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

export function EditablePlayerName({ id, name, isActive, className }: { id: string, name: string, isActive: boolean, className?: string }) {
    const [isEditing, setIsEditing] = useState(false);
    const [newName, setNewName] = useState(name);

    async function handleSave() {
        if (newName && newName !== name) {
            await updatePlayerNameAction(id, newName);
        }
        setIsEditing(false);
    }

    if (isEditing) {
        return (
            <div className="flex items-center gap-1">
                <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500 w-32"
                    autoFocus
                />
                <button onClick={handleSave} className="p-1 hover:bg-emerald-500/20 text-emerald-500 rounded"><Check size={14} /></button>
                <button onClick={() => setIsEditing(false)} className="p-1 hover:bg-slate-800 text-slate-400 rounded"><X size={14} /></button>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2 group/edit">
            <h3 className={cn("font-semibold", isActive ? "text-white" : "text-slate-500 line-through", className)}>{name}</h3>
            <button
                onClick={() => setIsEditing(true)}
                className="opacity-0 group-hover/edit:opacity-100 text-slate-500 hover:text-indigo-400 transition-opacity"
            >
                <Pencil size={12} />
            </button>
        </div>
    );
}
