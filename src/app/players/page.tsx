import { getPlayers } from '@/lib/data';
import { PlayersListView } from '@/components/players/PlayersListView';

export default async function PlayersPage() {
    const players = await getPlayers();

    return (
        <PlayersListView players={players} />
    );
}
