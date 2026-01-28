'use client';

import { useState } from 'react';
import { AppSettings } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { saveSettingsAction } from '@/actions/settings';
import { Settings, Save, Link2, MessageSquare, Info, CheckCircle2, Send, Trophy } from 'lucide-react';
import { Season } from '@/types';
import { SeasonManager } from './SeasonManager';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialSettings: AppSettings;
    seasons: Season[];
    activeSeasonId?: string;
}

export function SettingsModal({ isOpen, onClose, initialSettings, seasons, activeSeasonId }: SettingsModalProps) {
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
