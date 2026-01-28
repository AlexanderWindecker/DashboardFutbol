import { getData } from '@/lib/data';
import { CalendarDashboard } from '@/components/dashboard/CalendarDashboard';
import { ArrowRight, Calendar, Users } from 'lucide-react';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/Badge';
import { InstallButton } from '@/components/layout/PWAHandler';

export default async function DashboardPage() {
  const { matches, players } = await getData();

  // Sort matches descending
  const sortedMatches = [...matches].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const nextMatch = sortedMatches.find(m => new Date(m.date) >= new Date()); // Simplistic next
  const recentMatches = sortedMatches.filter(m => new Date(m.date) < new Date()).slice(0, 3);
  // Actually "nextMatch" logic is tricky if all are in past.
  // Let's just show "Recent Matches".

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">
          Bienvenido al Dashboard
        </h1>
        <p className="text-slate-400">Resumen de actividad del equipo.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Main Column: Stats & Recent */}
        <div className="lg:col-span-2 space-y-8">
          <InstallButton />

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <Calendar size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{matches.length}</p>
                <p className="text-sm text-slate-500">Partidos Jugados</p>
              </div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <Users size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{players.filter(p => (p.isActive !== false) && !p.isInjured && !p.isVacation).length}</p>
                <p className="text-sm text-slate-500">Jugadores Disponibles</p>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h3 className="font-semibold text-white">Actividad Reciente</h3>
              <Link href="/matches" className="text-indigo-400 text-sm hover:text-indigo-300">Ver todos</Link>
            </div>
            <div className="divide-y divide-slate-800">
              {recentMatches.map(match => (
                <div key={match.id} className="p-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors">
                  <div>
                    <p className="text-white font-medium">
                      {format(parseISO(match.date), "EEEE d 'de' MMMM", { locale: es })}
                    </p>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="outline" className="text-[10px]">{match.mode}</Badge>
                      <span className="text-xs text-slate-500">{match.location}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    {match.result ? (
                      <Badge variant={match.result}>{match.result}</Badge>
                    ) : (
                      <Badge variant="outline">Pendiente</Badge>
                    )}
                  </div>
                </div>
              ))}
              {recentMatches.length === 0 && <p className="p-6 text-slate-500">No hay actividad reciente.</p>}
            </div>
          </div>
        </div>

        {/* Sidebar Column: Calendar */}
        <div>
          <h3 className="font-semibold text-white mb-4">Calendario</h3>
          <CalendarDashboard matches={matches} />
        </div>
      </div>
    </div>
  );
}
