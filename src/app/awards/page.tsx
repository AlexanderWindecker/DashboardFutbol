import { getData } from '@/lib/data';
import { HistoryPageView } from '@/components/history/HistoryPageView';

export const dynamic = 'force-dynamic';

export default async function AwardsPage() {
    const data = await getData() as any;

    return (
        <HistoryPageView
            players={data.players}
            matches={data.matches}
            participations={data.participations}
            seasons={data.seasons || []}
            seasonAwards={data.seasonAwards || []}
            activeSeasonId={data.activeSeasonId}
            initialView="salon"
        />
    );
}