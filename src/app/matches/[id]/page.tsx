import { getMatch, getParticipationsForMatch, getPlayers, getSettings, getSeasons } from '@/lib/data';
import { notFound } from 'next/navigation';
import { MatchDetailView } from '@/components/matches/MatchDetailView';

export const dynamic = 'force-dynamic';

export default async function MatchDetailPage({ params }: { params: { id: string } }) {
    // In Next.js 15, params might be a Promise.
    const resolvedParams = await Promise.resolve(params);
    const { id } = resolvedParams;

    const match = await getMatch(id);
    const players = await getPlayers();
    const participations = await getParticipationsForMatch(id);
    const settings = await getSettings();
    const seasons = await getSeasons();

    if (!match) {
        notFound();
    }

    return (
        <MatchDetailView
            match={match}
            players={players}
            participations={participations}
            settings={settings || {}}
            seasons={seasons}
        />
    );
}
