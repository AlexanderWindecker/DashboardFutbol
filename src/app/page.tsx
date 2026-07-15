import { getData } from '@/lib/data';
import { CalendarDashboard } from '@/components/dashboard/CalendarDashboard';

export const dynamic = 'force-dynamic';
import { ArrowRight, Calendar, Users, Zap } from 'lucide-react';
import { cn, calculateMatchScore } from '@/lib/utils';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/Badge';
import { InstallButton } from '@/components/layout/PWAHandler';
import { NewsTicker } from '@/components/dashboard/NewsTicker';

export default async function DashboardPage() {
  const { matches: allMatches, players, activeSeasonId, participations, settings } = await getData() as any;

  const matches = activeSeasonId
    ? allMatches.filter((m: any) => m.seasonId === activeSeasonId)
    : allMatches;

  // Sort matches descending
  const sortedMatches = [...matches].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const recentMatches = sortedMatches.filter(m => new Date(m.date) < new Date()).slice(0, 3);
  // Actually "nextMatch" logic is tricky if all are in past.
  // Let's just show "Recent Matches".

  return (
    <div className="space-y-8 pb-16">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">
          Inicio
        </h1>
        <p className="text-xs md:text-sm text-slate-400">Resumen de actividad del equipo.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">

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
                <p className="text-2xl font-bold text-white">{players.filter((p: any) => (p.isActive !== false) && !p.isInjured && !p.isVacation).length}</p>
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
                <Link
                  key={match.id}
                  href={`/matches/${match.id}`}
                  className={cn(
                    "p-4 flex items-center gap-4 hover:bg-slate-800/80 transition-all active:scale-[0.99] group",
                    match.isSuperclasico && "bg-amber-500/5 hover:bg-amber-500/10 border-l-2 border-amber-500/30"
                  )}
                >
                  {match.isSuperclasico && (
                    <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                      <Zap size={16} fill="currentColor" />
                    </div>
                  )}

                  <div className="flex-1">
                    <p className={cn(
                      "text-white font-semibold transition-colors",
                      match.isSuperclasico ? "text-lg md:text-xl" : "text-sm md:text-base",
                      "group-hover:text-indigo-400"
                    )}>
                      {format(parseISO(match.date), "EEEE d 'de' MMMM, yyyy", { locale: es })}
                    </p>

                    {match.isSuperclasico ? (
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-amber-500 text-[10px] drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]">✨</span>
                        <span className="text-[12px] font-black italic tracking-tighter uppercase text-amber-500">Súperclásico</span>
                      </div>
                    ) : (
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline" className="text-[10px]">{match.mode}</Badge>
                        <span className="text-xs text-slate-500">{match.location}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      {match.result ? (
                        (() => {
                            const matchParticipations = participations.filter((p: any) => p.matchId === match.id);
                            const score = calculateMatchScore(matchParticipations as any, match as any);
                            const isCelesteWinner = match.result === 'Celeste';
                            const isAzulWinner = match.result === 'Azul';
                            const isDraw = match.result === 'Empate';
                            
                            const t1Name = settings?.team1Name || 'Celeste';
                            const t2Name = settings?.team2Name || 'Azul';

                            return (
                                <div className={cn(
                                    "text-[10px] md:text-xs font-mono font-bold flex gap-1.5 items-center px-2 py-1 rounded-md border",
                                    isCelesteWinner ? "bg-sky-950/30 border-sky-900/50" : 
                                    isAzulWinner ? "bg-blue-950/30 border-blue-900/50" : 
                                    "bg-slate-900 border-slate-700"
                                )}>
                                    <span className={cn(isCelesteWinner ? "text-sky-400 drop-shadow-md" : isDraw ? "text-slate-300" : "text-slate-500")}>
                                        {t1Name.substring(0,3).toUpperCase()} {score.celeste}
                                    </span>
                                    <span className="text-slate-600">-</span>
                                    <span className={cn(isAzulWinner ? "text-blue-500 drop-shadow-md" : isDraw ? "text-slate-300" : "text-slate-500")}>
                                        {score.azul} {t2Name.substring(0,3).toUpperCase()}
                                    </span>
                                </div>
                            )
                        })()
                      ) : (
                        <Badge variant="outline">Pendiente</Badge>
                      )}
                    </div>
                    <ArrowRight size={16} className="text-slate-600 group-hover:text-indigo-400 transition-colors" />
                  </div>
                </Link>
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

      {/* Render the NewsTicker globally for the dashboard */}
      <NewsTicker data={await getData()} />
    </div>
  );
}
