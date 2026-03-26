import { getData } from '@/lib/data';
import { PlayerComparator } from '@/components/players/PlayerComparator';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ComparePlayersPage({ searchParams }: { searchParams: Promise<{ p1?: string, p2?: string }> }) {
    const { p1: p1Id, p2: p2Id } = await searchParams;
    const data = await getData() as any;
    const players = data.players.filter((p: any) => p.isActive !== false);

    const player1 = players.find((p: any) => p.id === p1Id);
    const player2 = players.find((p: any) => p.id === p2Id);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/players" className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors">
                    <ChevronLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-white">Cara a Cara</h1>
                    <p className="text-slate-400">Comparativa técnica y duelos directos.</p>
                </div>
            </div>

            <PlayerComparator
                players={players}
                initialP1={player1}
                initialP2={player2}
                matches={data.matches}
                participations={data.participations}
            />
        </div>
    );
}
