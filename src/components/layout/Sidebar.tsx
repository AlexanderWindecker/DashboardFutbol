'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Calendar, Users, Trophy, MoreHorizontal, FileText, Settings as SettingsIcon, X, Menu, LogOut } from 'lucide-react';
import clsx from 'clsx';
import { useState, useEffect } from 'react';
import { SettingsModal } from '../SettingsModal';
import { getSettings, getSeasons, getActiveSeasonId, getPlayers } from '@/lib/data';
import { AppSettings, Season, Player } from '@/types';

const API_NAV_ITEMS = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Partidos', href: '/matches', icon: Calendar },
    { name: 'Jugadores', href: '/players', icon: Users },
    { name: 'Estadísticas', href: '/stats', icon: Trophy },
];

export function Sidebar({ isOpen, onClose, isAdmin }: { isOpen?: boolean; onClose?: () => void; isAdmin?: boolean }) {
    const pathname = usePathname();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [settings, setSettings] = useState<AppSettings>({ n8nWebhookUrl: '', whatsappGroupName: '' });
    const [seasons, setSeasons] = useState<Season[]>([]);
    const [activeSeasonId, setActiveSeasonId] = useState<string | undefined>();
    const [players, setPlayers] = useState<Player[]>([]);
    const [pressTimer, setPressTimer] = useState<any>(null);

    // Mismo truco para el escritorio
    const triggerAdmin = () => {
        if (!isAdmin) {
            const pin = prompt('Ingrese PIN de Administrador:');
            if (pin === '1986') { // Debería usar el hook pero aquí es más directo para el ejemplo
                localStorage.setItem('fb_admin_key', '1986');
                window.location.reload();
            }
        }
    };
    const startT = () => setPressTimer(setTimeout(triggerAdmin, 3000));
    const clearT = () => pressTimer && clearTimeout(pressTimer);

    useEffect(() => {
        if (isAdmin) {
            getSettings().then(setSettings);
            getSeasons().then(s => setSeasons(s.map(season => ({
                ...season,
                startDate: season.startDate || '',
                endDate: season.endDate || ''
            })) as Season[]));
            getActiveSeasonId().then(id => setActiveSeasonId(id || undefined));
            getPlayers().then(setPlayers);
        }
    }, [isSettingsOpen, isAdmin]);

    const navItems = API_NAV_ITEMS;

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            <aside className={clsx(
                "w-64 bg-slate-900 border-r border-slate-800 h-screen flex flex-col fixed left-0 top-0 z-50 transition-transform duration-300 lg:translate-x-0",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div
                    className="p-6 flex items-center gap-3 select-none"
                    onMouseDown={startT}
                    onMouseUp={clearT}
                    onTouchStart={startT}
                    onTouchEnd={clearT}
                >
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-indigo-500/30 flex items-center justify-center bg-white shadow-[0_0_15px_rgba(99,102,241,0.2)] shrink-0">
                        <img src="/logo.png" alt="Logo" className="w-[110%] h-[110%] object-cover" />
                    </div>
                    <div className="flex-1">
                        <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">
                            {isAdmin ? '🛡️ Admin' : 'Futbol Amateur'}
                        </h1>
                        <p className="text-xs text-slate-500 mt-0.5">Dashboard Manager</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-white lg:hidden"
                    >
                        <X size={20} />
                    </button>
                </div>

                <nav className="flex-1 px-4 space-y-2">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={onClose}
                                className={clsx(
                                    'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all',
                                    isActive
                                        ? 'bg-indigo-500/10 text-indigo-400 shadow-inner'
                                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                                )}
                            >
                                <item.icon size={20} className={isActive ? "text-indigo-400" : "text-slate-500"} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                {isAdmin && (
                    <>
                        <div className="px-4 py-2">
                            <button
                                onClick={() => {
                                    setIsSettingsOpen(true);
                                    onClose?.();
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
                            >
                                <SettingsIcon size={20} />
                                Configuración
                            </button>
                        </div>

                        <div className="p-4 border-t border-slate-800 space-y-1">
                            <div className="flex items-center gap-3 px-4 py-3 text-slate-400">
                                <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                                    <span className="text-xs font-bold text-white uppercase">AD</span>
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <p className="text-sm font-semibold text-white truncate">Alexander</p>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Dashboard Admin</p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    localStorage.removeItem('fb_admin_key');
                                    window.location.reload();
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                            >
                                <LogOut size={16} />
                                Cerrar Sesión Admin
                            </button>
                        </div>
                    </>
                )}
            </aside>

            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                initialSettings={settings}
                seasons={seasons}
                activeSeasonId={activeSeasonId}
                players={players}
            />
        </>
    );
}
