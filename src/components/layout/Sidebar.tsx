'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Calendar, Users, Trophy, MoreHorizontal, FileText, Settings as SettingsIcon } from 'lucide-react';
import clsx from 'clsx';
import { useState, useEffect } from 'react';
import { SettingsModal } from '../SettingsModal';
import { getSettings, getSeasons, getActiveSeasonId } from '@/lib/data';
import { AppSettings, Season } from '@/types';

async function fetchSettings(): Promise<AppSettings> {
    const res = await getSettings();
    return res;
}

const API_NAV_ITEMS = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Partidos', href: '/matches', icon: Calendar },
    { name: 'Jugadores', href: '/players', icon: Users },
    { name: 'Estadísticas', href: '/stats', icon: Trophy },
];

export function Sidebar() {
    const pathname = usePathname();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [settings, setSettings] = useState<AppSettings>({ n8nWebhookUrl: '', whatsappGroupName: '' });
    const [seasons, setSeasons] = useState<Season[]>([]);
    const [activeSeasonId, setActiveSeasonId] = useState<string | undefined>();

    useEffect(() => {
        getSettings().then(setSettings);
        getSeasons().then(setSeasons);
        getActiveSeasonId().then(setActiveSeasonId);
    }, [isSettingsOpen]);

    return (
        <>
            <aside className="w-64 bg-slate-900 border-r border-slate-800 h-screen flex flex-col fixed left-0 top-0 z-40">
                <div className="p-6">
                    <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">
                        Futbol Amateur
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">Dashboard Manager</p>
                </div>

                <nav className="flex-1 px-4 space-y-2">
                    {API_NAV_ITEMS.map((item) => {
                        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={clsx(
                                    'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                                    isActive
                                        ? 'bg-indigo-500/10 text-indigo-400'
                                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                                )}
                            >
                                <item.icon size={20} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <div className="px-4 py-2">
                    <button
                        onClick={() => setIsSettingsOpen(true)}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
                    >
                        <SettingsIcon size={20} />
                        Configuración
                    </button>
                </div>

                <div className="p-4 border-t border-slate-800">
                    <div className="flex items-center gap-3 px-4 py-3 text-slate-400">
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                            <span className="text-xs font-bold text-white">AD</span>
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-white">Admin</p>
                            <p className="text-xs text-slate-500">View Only</p>
                        </div>
                    </div>
                </div>
            </aside>

            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                initialSettings={settings}
                seasons={seasons}
                activeSeasonId={activeSeasonId}
            />
        </>
    );
}
