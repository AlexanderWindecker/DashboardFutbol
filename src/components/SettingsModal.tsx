'use client';

import { useState, useEffect } from 'react';
import { AppSettings } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { saveSettingsAction } from '@/actions/settings';
import { Settings, Save, Link2, MessageSquare, Info, CheckCircle2, Send, Trophy, Users } from 'lucide-react';
import clsx from 'clsx';
import { Season, Player } from '@/types';
import { SeasonManager } from './SeasonManager';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialSettings: AppSettings;
    seasons: Season[];
    activeSeasonId?: string;
    players: Player[];
}

export function SettingsModal({ isOpen, onClose, initialSettings, seasons, activeSeasonId, players }: SettingsModalProps) {
    const [settings, setSettings] = useState<AppSettings>(initialSettings);
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // Sync state when initialSettings changes (e.g. fetched from Sidebar)
    useEffect(() => {
        setSettings(initialSettings);
    }, [initialSettings]);

    const handleSave = async () => {
        setIsSaving(true);
        await saveSettingsAction(settings);
        setIsSaving(false);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Configuración del Sistema">
            <div className="space-y-6">
                <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-xl flex gap-3">
                    <Info className="text-indigo-400 shrink-0" size={20} />
                    <p className="text-xs text-slate-400 leading-relaxed">
                        Configura la integración con <strong>n8n</strong> para automatizar el envío de notificaciones a WhatsApp y Telegram.
                        Crea un workflow de tipo Webhook en n8n y pega la URL aquí.
                    </p>
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                WhatsApp Integration
                            </h3>
                            <div>
                                <label className="flex items-center gap-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                                    <Link2 size={12} className="text-emerald-400" />
                                    n8n Webhook URL
                                </label>
                                <input
                                    type="url"
                                    value={settings.n8nWebhookUrl || ''}
                                    onChange={(e) => setSettings({ ...settings, n8nWebhookUrl: e.target.value })}
                                    placeholder="https://n8n.../webhook/whatsapp"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                                />
                            </div>

                            <div>
                                <label className="flex items-center gap-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                                    <MessageSquare size={12} className="text-emerald-400" />
                                    Nombre del Grupo
                                </label>
                                <input
                                    type="text"
                                    value={settings.whatsappGroupName || ''}
                                    onChange={(e) => setSettings({ ...settings, whatsappGroupName: e.target.value })}
                                    placeholder="Ej: Los Pibes del Martes"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                                Telegram Integration
                            </h3>
                            <div>
                                <label className="flex items-center gap-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                                    <Link2 size={12} className="text-sky-400" />
                                    n8n Webhook URL
                                </label>
                                <input
                                    type="url"
                                    value={settings.telegramWebhookUrl || ''}
                                    onChange={(e) => setSettings({ ...settings, telegramWebhookUrl: e.target.value })}
                                    placeholder="https://n8n.../webhook/telegram"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all"
                                />
                            </div>

                            <div>
                                <label className="flex items-center gap-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                                    <Send size={12} className="text-sky-400" />
                                    Nombre del Grupo / ID
                                </label>
                                <input
                                    type="text"
                                    value={settings.telegramGroupName || ''}
                                    onChange={(e) => setSettings({ ...settings, telegramGroupName: e.target.value })}
                                    placeholder="Ej: @grupo_futbol"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-800/50 space-y-4">
                        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            Configuración Súperclásico
                        </h3>
                        <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl space-y-4">
                            <p className="text-[10px] text-slate-500 mb-2">
                                Para activar el "Súperclásico", configura 2 equipos exactos de 3 jugadores (Capitán + 2 compañeros). El diseño premium solo se activará cuando estos 6 jugadores se enfrenten 3 vs 3.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Team 1 */}
                                <div className="space-y-3 bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                                    <label className="text-[10px] font-bold text-amber-500/70 uppercase tracking-wider">Equipo 1 - Capitán y Compañeros</label>

                                    <select
                                        value={settings.captain1Id || ''}
                                        onChange={(e) => {
                                            const newCap = e.target.value;
                                            const newT1 = settings.team1EliteIds?.filter(id => id !== settings.captain1Id && id !== newCap) || [];
                                            if (newCap) newT1.push(newCap);

                                            setSettings({
                                                ...settings,
                                                captain1Id: newCap,
                                                team1EliteIds: newT1,
                                                elitePlayerIds: [...newT1, ...(settings.team2EliteIds || [])]
                                            });
                                        }}
                                        className="w-full bg-slate-950 border border-amber-500/20 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                                    >
                                        <option value="">Seleccionar Capitán 1</option>
                                        {players.filter(p => p.isActive).sort((a, b) => a.name.localeCompare(b.name)).map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>

                                    <div className="flex justify-between items-center text-[10px] text-slate-500">
                                        <span>Compañeros (Elegir 2):</span>
                                        <span className={clsx((settings.team1EliteIds?.length || 0) === 3 ? "text-emerald-400" : "")}>
                                            {(settings.team1EliteIds?.length || (settings.captain1Id ? 1 : 0)) - (settings.captain1Id ? 1 : 0)} / 2
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 gap-1 max-h-[150px] overflow-y-auto pr-1 no-scrollbar flex-1">
                                        {players.filter(p => p.isActive && p.id !== settings.captain1Id).sort((a, b) => a.name.localeCompare(b.name)).map(player => {
                                            const isSelected = settings.team1EliteIds?.includes(player.id);
                                            return (
                                                <button
                                                    key={player.id}
                                                    type="button"
                                                    onClick={() => {
                                                        const current = settings.team1EliteIds || (settings.captain1Id ? [settings.captain1Id] : []);
                                                        let newT1 = [...current];

                                                        if (isSelected) {
                                                            newT1 = newT1.filter(id => id !== player.id);
                                                        } else if (newT1.length < 3) {
                                                            newT1.push(player.id);
                                                        } else {
                                                            return; // max 3
                                                        }

                                                        setSettings({
                                                            ...settings,
                                                            team1EliteIds: newT1,
                                                            elitePlayerIds: [...newT1, ...(settings.team2EliteIds || [])]
                                                        });
                                                    }}
                                                    className={clsx(
                                                        "flex items-center gap-2 px-2 py-1.5 rounded-md text-[10px] font-medium transition-all border text-left",
                                                        isSelected ? "bg-amber-500/20 border-amber-500/50 text-amber-400" : "bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700"
                                                    )}
                                                >
                                                    <div className={clsx("w-2.5 h-2.5 rounded-full border flex items-center justify-center shrink-0", isSelected ? "bg-amber-500 border-amber-400" : "bg-slate-900 border-slate-800")}>
                                                        {isSelected && <CheckCircle2 size={8} className="text-amber-950" />}
                                                    </div>
                                                    <span className="truncate">{player.name}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Team 2 */}
                                <div className="space-y-3 bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                                    <label className="text-[10px] font-bold text-amber-500/70 uppercase tracking-wider">Equipo 2 - Capitán y Compañeros</label>

                                    <select
                                        value={settings.captain2Id || ''}
                                        onChange={(e) => {
                                            const newCap = e.target.value;
                                            const newT2 = settings.team2EliteIds?.filter(id => id !== settings.captain2Id && id !== newCap) || [];
                                            if (newCap) newT2.push(newCap);

                                            setSettings({
                                                ...settings,
                                                captain2Id: newCap,
                                                team2EliteIds: newT2,
                                                elitePlayerIds: [...(settings.team1EliteIds || []), ...newT2]
                                            });
                                        }}
                                        className="w-full bg-slate-950 border border-amber-500/20 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                                    >
                                        <option value="">Seleccionar Capitán 2</option>
                                        {players.filter(p => p.isActive).sort((a, b) => a.name.localeCompare(b.name)).map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>

                                    <div className="flex justify-between items-center text-[10px] text-slate-500">
                                        <span>Compañeros (Elegir 2):</span>
                                        <span className={clsx((settings.team2EliteIds?.length || 0) === 3 ? "text-emerald-400" : "")}>
                                            {(settings.team2EliteIds?.length || (settings.captain2Id ? 1 : 0)) - (settings.captain2Id ? 1 : 0)} / 2
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 gap-1 max-h-[150px] overflow-y-auto pr-1 no-scrollbar flex-1">
                                        {players.filter(p => p.isActive && p.id !== settings.captain2Id).sort((a, b) => a.name.localeCompare(b.name)).map(player => {
                                            const isSelected = settings.team2EliteIds?.includes(player.id);
                                            return (
                                                <button
                                                    key={player.id}
                                                    type="button"
                                                    onClick={() => {
                                                        const current = settings.team2EliteIds || (settings.captain2Id ? [settings.captain2Id] : []);
                                                        let newT2 = [...current];

                                                        if (isSelected) {
                                                            newT2 = newT2.filter(id => id !== player.id);
                                                        } else if (newT2.length < 3) {
                                                            newT2.push(player.id);
                                                        } else {
                                                            return; // max 3
                                                        }

                                                        setSettings({
                                                            ...settings,
                                                            team2EliteIds: newT2,
                                                            elitePlayerIds: [...(settings.team1EliteIds || []), ...newT2]
                                                        });
                                                    }}
                                                    className={clsx(
                                                        "flex items-center gap-2 px-2 py-1.5 rounded-md text-[10px] font-medium transition-all border text-left",
                                                        isSelected ? "bg-amber-500/20 border-amber-500/50 text-amber-400" : "bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700"
                                                    )}
                                                >
                                                    <div className={clsx("w-2.5 h-2.5 rounded-full border flex items-center justify-center shrink-0", isSelected ? "bg-amber-500 border-amber-400" : "bg-slate-900 border-slate-800")}>
                                                        {isSelected && <CheckCircle2 size={8} className="text-amber-950" />}
                                                    </div>
                                                    <span className="truncate">{player.name}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-800/50">
                        <SeasonManager seasons={seasons} activeSeasonId={activeSeasonId} />
                    </div>

                    <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {showSuccess && (
                                <span className="text-emerald-400 text-xs flex items-center gap-1 animate-in fade-in slide-in-from-left-2">
                                    <CheckCircle2 size={14} /> Guardado correctamente
                                </span>
                            )}
                        </div>
                        <div className="flex gap-3">
                            <Button variant="ghost" onClick={onClose} className="text-slate-400">
                                Cerrar
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="bg-indigo-600 hover:bg-indigo-700 gap-2 min-w-[120px]"
                            >
                                {isSaving ? 'Guardando...' : (
                                    <>
                                        <Save size={18} /> Guardar
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
