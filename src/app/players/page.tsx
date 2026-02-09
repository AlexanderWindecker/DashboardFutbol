import { getPlayers } from '@/lib/data';
import { PlayersListView } from '@/components/players/PlayersListView';

export const dynamic = 'force-dynamic';

export default async function PlayersPage() {
    const players = await getPlayers();

    return (
        <PlayersListView players={players} />
    );
}
