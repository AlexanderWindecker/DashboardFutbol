'use client';

import { useState } from 'react';
import { Pencil, Check, X } from 'lucide-react';
import { AppSettings } from '@/types';
import { saveSettingsAction } from '@/actions/settings';
import { cn } from '@/lib/utils';

interface TeamNameEditorProps {
    teamKey: 'team1Name' | 'team2Name';
    currentName: string;
    defaultName: string;
    settings: AppSettings;
    colorClass: string;
}

export function TeamNameEditor({ teamKey, currentName, defaultName, settings, colorClass }: TeamNameEditorProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(currentName || defaultName);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async (e: React.MouseEvent | React.KeyboardEvent) => {
        // Prevent event bubbling just in case
        e.stopPropagation();

        if (!name.trim() || isSaving) return;

        try {
            setIsSaving(true);
            const updatedSettings = { ...settings, [teamKey]: name.trim() };
            await saveSettingsAction(updatedSettings);
            setIsEditing(false);
        } catch (error) {
            console.error("Error saving team name:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = (e: React.MouseEvent | React.KeyboardEvent) => {
        e.stopPropagation();
        setName(currentName || defaultName);
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <div className="flex items-center gap-2 mb-2 animate-in fade-in zoom-in-95 duration-200 relative z-10 max-w-full">
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 flex-1 min-w-0"
                    autoFocus
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSave(e);
                        if (e.key === 'Escape') handleCancel(e);
                    }}
                />
                <button
                    type="button"
                    onClick={(e) => handleSave(e)}
                    disabled={isSaving}
                    className="p-1 text-emerald-500 hover:bg-emerald-500/10 rounded shrink-0 disabled:opacity-50"
                >
                    <Check size={16} />
                </button>
                <button
                    type="button"
                    onClick={(e) => handleCancel(e)}
                    disabled={isSaving}
                    className="p-1 text-red-500 hover:bg-red-500/10 rounded shrink-0 disabled:opacity-50"
                >
                    <X size={16} />
                </button>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2 mb-2 group">
            <h3 className={cn("text-sm font-medium uppercase tracking-wider", colorClass)}>
                {name}
            </h3>
            <button
                onClick={() => setIsEditing(true)}
                className="p-1 text-slate-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                title="Editar nombre"
            >
                <Pencil size={14} />
            </button>
        </div>
    );
}
