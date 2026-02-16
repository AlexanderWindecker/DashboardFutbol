'use client';

import { useState } from 'react';
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
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                                    Jugadores Elite (Elegir 6)
                                </label>
                                <span className={clsx(
                                    "text-[10px] font-bold px-2 py-0.5 rounded-full",
                                    (settings.elitePlayerIds?.length || 0) === 6 ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-800 text-slate-500"
                                )}>
                                    {settings.elitePlayerIds?.length || 0} / 6
                                </span>
                            </div>
                            <p className="text-[10px] text-slate-500">
                                Cuando estos 6 jugadores se enfrenten 3 vs 3, el sistema activará automáticamente el diseño e historial de "Súperclásico".
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[200px] overflow-y-auto pr-2 no-scrollbar">
                                {players.filter(p => p.isActive).sort((a, b) => a.name.localeCompare(b.name)).map(player => {
                                    const isSelected = settings.elitePlayerIds?.includes(player.id);
                                    return (
                                        <button
                                            key={player.id}
                                            type="button"
                                            onClick={() => {
                                                const current = settings.elitePlayerIds || [];
                                                if (isSelected) {
                                                    setSettings({ ...settings, elitePlayerIds: current.filter(id => id !== player.id) });
                                                } else if (current.length < 6) {
                                                    setSettings({ ...settings, elitePlayerIds: [...current, player.id] });
                                                }
                                            }}
                                            className={clsx(
                                                "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all border text-left",
                                                isSelected
                                                    ? "bg-amber-500/20 border-amber-500/50 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.1)]"
                                                    : "bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700"
                                            )}
                                        >
                                            <div className={clsx(
                                                "w-3 h-3 rounded-full border flex items-center justify-center shrink-0",
                                                isSelected ? "bg-amber-500 border-amber-400" : "bg-slate-900 border-slate-800"
                                            )}>
                                                {isSelected && <CheckCircle2 size={10} className="text-amber-950" />}
                                            </div>
                                            <span className="truncate">{player.name}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Captains Selection */}
                            <div className="pt-4 border-t border-amber-500/10 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-amber-500/70 uppercase tracking-wider">Capitán 1 (Líder Histórico)</label>
                                    <select
                                        value={settings.captain1Id || ''}
                                        onChange={(e) => setSettings({ ...settings, captain1Id: e.target.value })}
                                        className="w-full bg-slate-950 border border-amber-500/20 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                                    >
                                        <option value="">Seleccionar Capitán 1</option>
                                        {players.filter(p => p.isActive).sort((a, b) => a.name.localeCompare(b.name)).map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-amber-500/70 uppercase tracking-wider">Capitán 2 (Líder Histórico)</label>
                                    <select
                                        value={settings.captain2Id || ''}
                                        onChange={(e) => setSettings({ ...settings, captain2Id: e.target.value })}
                                        className="w-full bg-slate-950 border border-amber-500/20 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                                    >
                                        <option value="">Seleccionar Capitán 2</option>
                                        {players.filter(p => p.isActive).sort((a, b) => a.name.localeCompare(b.name)).map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
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
