import { getData } from '@/lib/data';
import { Player, PlayerStats, Match } from '@/types';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

function calculateStats(players: Player[], matches: Match[], participations: PlayerStats[]) {
    const playerStats = players.map(player => {
        const playerParticipations = participations.filter(p => p.playerId === player.id);
        const attendedStats = playerParticipations.filter(p => p.status === 'Attended');
        const matchesAttended = attendedStats.length;
        const absences = playerParticipations.filter(p => p.status === 'Absent' || p.status === 'LateCancel').length;
        const mvpCount = attendedStats.filter(p => p.isMvp).length;

        const wins = attendedStats.filter(p => {
            const match = matches.find(m => m.id === p.matchId);
            if (!match || !match.result || match.result === 'Empate') return false;
            return match.result === p.team;
        }).length;

        const celesteApps = attendedStats.filter(p => p.team === 'Celeste').length;
        const azulApps = attendedStats.filter(p => p.team === 'Azul').length;

        return {
            ...player,
            matchesAttended,
            absences,
            mvpCount,
            wins,
            winRate: matchesAttended > 0 ? Math.round((wins / matchesAttended) * 100) : 0,
            celesteApps,
            azulApps,
            totalApps: celesteApps + azulApps,
            goals: playerParticipations.reduce((sum, p) => sum + (p.goals || 0), 0)
        };
    });
    return playerStats;
}

export default async function RankingsPage({ searchParams }: { searchParams: { type: string } }) {
    const { players, matches, participations } = await getData();
    const stats = calculateStats(players, matches, participations);

    // In Next 15 searchParams is a promise
    const params = await Promise.resolve(searchParams);
    const type = params.type || 'attendance';

    let title = 'Ranking';
    let data = [...stats];
    let valueKey = 'matchesAttended';
    let label = 'Partidos';

    switch (type) {
        case 'attendance':
            title = 'Más Comprometido';
            data.sort((a, b) => b.matchesAttended - a.matchesAttended);
            valueKey = 'matchesAttended';
            label = 'Partidos';
            break;
        case 'mvp':
            title = 'Más MVP';
            data.sort((a, b) => b.mvpCount - a.mvpCount);
            valueKey = 'mvpCount';
            label = 'MVPs';
            break;
        case 'winners':
            title = 'Porcentaje de Victorias (Min 3 partidos)';
            data = data.filter(p => p.matchesAttended >= 3);
            data.sort((a, b) => b.winRate - a.winRate);
            valueKey = 'winRate';
            label = '% Victorias';
            break;
        case 'absences':
            title = 'Más Faltador';
            data.sort((a, b) => b.absences - a.absences);
            valueKey = 'absences';
            label = 'Faltas';
            break;
        case 'goals':
            title = 'Goleadores';
            data.sort((a, b) => (b.goals || 0) - (a.goals || 0));
            valueKey = 'goals';
            label = 'Goles';
            break;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/stats" className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white">
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-white">{title}</h1>
                    <p className="text-slate-400">Ranking completo de jugadores.</p>
                </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                        <tr>
                            <th className="p-4 w-16 text-center">#</th>
                            <th className="p-4">Jugador</th>
                            <th className="p-4 text-center">Celeste / Azul</th>
                            <th className="p-4 text-right font-bold text-white">{label}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {data.map((p, i) => (
                            <tr key={p.id} className="hover:bg-slate-800/50">
                                <td className="p-4 text-center text-slate-500 font-mono">{i + 1}</td>
                                <td className="p-4 font-medium text-white">{p.name}</td>
                                <td className="p-4 text-center">
                                    <div className="flex items-center justify-center gap-2 text-xs">
                                        <span className="text-sky-400">{p.celesteApps}</span>
                                        <span className="text-slate-600">/</span>
                                        <span className="text-blue-400">{p.azulApps}</span>
                                    </div>
                                </td>
                                <td className="p-4 text-right font-mono text-lg text-indigo-300">
                                    {/* @ts-ignore dynamic key access */}
                                    {p[valueKey]}{type === 'winners' ? '%' : ''}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
