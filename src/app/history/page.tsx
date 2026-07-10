import { getData } from '@/lib/data';
import { HistoryPageView } from '@/components/history/HistoryPageView';

export const dynamic = 'force-dynamic';

export default async function HistoryPage({ searchParams }: { searchParams: { seasonId?: string } }) {
    const data = await getData() as any;
    
    // We will pass the full data and handle the processing in the client component
    // or we could calculate it here. For interactivity (dropdowns, animations) 
    // a client component wrapper is great. We'll do the heavy lifting here 
    // or pass raw data to let the client component switch seasons instantly.
    
    // We'll pass the raw data so the user can switch seasons without full page reloads if we want,
    // or use searchParams for server-side filtering. Let's pass the data.
    
    return (
        <HistoryPageView 
            players={data.players} 
            matches={data.matches} 
            participations={data.participations} 
            seasons={data.seasons || []}
            activeSeasonId={data.activeSeasonId}
        />
    );
}
