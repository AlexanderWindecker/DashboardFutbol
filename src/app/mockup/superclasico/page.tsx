import { getData, getSettings } from '@/lib/data';
import { MatchDetailView } from '@/components/matches/MatchDetailView';
import { Badge } from '@/components/ui/Badge';
import { Zap, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function SuperclasicoMockupPage() {
    const { matches, players, participations: allParticipations, seasons } = await getData() as any;
    const settings = await getSettings();

    // Find a Superclasico match to showcase
    const superMatch = matches.find((m: any) => m.isSuperclasico);

    if (!superMatch) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8 space-y-4">
                <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shadow-[0_0_30px_rgba(245,158,11,0.1)]">
                    <AlertTriangle size={40} className="text-amber-500" />
                </div>
                <h1 className="text-2xl font-bold text-white">No hay Súperclásicos detectados</h1>
                <p className="text-slate-400 max-w-md">Para habilitar el diseño premium de gala, asegúrate de tener 6 jugadores elite configurados y un partido donde se enfrenten 3 vs 3.</p>
                <Link href="/" className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition-all shadow-lg shadow-indigo-500/20">
                    Volver al Dashboard
                </Link>
            </div>
        );
    }

    const matchParticipations = allParticipations.filter((p: any) => p.matchId === superMatch.id);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                    <h1 className="text-2xl font-black italic tracking-tighter uppercase text-amber-500 flex items-center gap-2">
                        <Zap size={24} fill="currentColor" />
                        Showcase: Modo de Gala
                    </h1>
                    <p className="text-slate-500 text-xs">Esta es la visualización premium para los partidos Súperclásicos.</p>
                </div>
                <Badge className="bg-amber-500 text-amber-950 hover:bg-amber-600 font-bold">PREMIUM ACTIVE</Badge>
            </div>

            <MatchDetailView
                match={superMatch}
                players={players}
                participations={matchParticipations}
                settings={settings}
                seasons={seasons}
            />
        </div>
    );
}
