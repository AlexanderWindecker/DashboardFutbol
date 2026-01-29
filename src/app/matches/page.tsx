import { getData, getSettings } from '@/lib/data';
import { CreateMatchDialog } from '@/components/matches/CreateMatchDialog';
import { MatchesTable } from '@/components/matches/MatchesTable';

export default async function MatchesPage() {
    const data = await getData();
    const settings = await getSettings();
    const sortedMatches = [...data.matches].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Partidos</h1>
                    <p className="text-slate-400">Gestiona y analiza el historial de juegos.</p>
                </div>
                <CreateMatchDialog
                    seasons={data.seasons || []}
                    activeSeasonId={data.activeSeasonId}
                />
            </div>

            <MatchesTable
                matches={sortedMatches}
                players={data.players}
                participations={data.participations}
                settings={settings}
            />
        </div>
    );
}
