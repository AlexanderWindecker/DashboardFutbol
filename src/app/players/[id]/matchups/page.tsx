import { getData } from '@/lib/data';
import { MatchupReport } from '@/components/players/MatchupReport';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function PlayerMatchupsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const data = await getData() as any;
    const player = data.players.find((p: any) => p.id === id);

    if (!player) {
        notFound();
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href={`/players/${player.id}`} className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors">
                    <ChevronLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-white">Reporte de Rivalidades</h1>
                    <p className="text-slate-400">Historial histórico contra cada jugador.</p>
                </div>
            </div>

            <MatchupReport 
                player={player}
                allPlayers={data.players}
                matches={data.matches}
                participations={data.participations}
            />
        </div>
    );
}
