'use client';

import { MatchResult, AppSettings } from '@/types';
import { Button } from '@/components/ui/Button';
import { updateMatchResultAction } from '@/actions/matches';
import { cn } from '@/lib/utils'; // Assuming utilities exist

export function MatchResultSelector({
    matchId,
    currentResult,
    settings
}: {
    matchId: string;
    currentResult?: MatchResult;
    settings?: AppSettings;
}) {
    const team1Name = settings?.team1Name || 'Celeste';
    const team2Name = settings?.team2Name || 'Azul';

    async function handleSetResult(result: MatchResult) {
        await updateMatchResultAction(matchId, result);
    }

    return (
        <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400 mr-2">Ganador:</span>
            <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800">
                <button
                    onClick={() => handleSetResult('Celeste')}
                    className={cn(
                        "px-3 py-1 text-xs font-medium rounded-md transition-all",
                        currentResult === 'Celeste' ? "bg-sky-500 text-white shadow" : "text-slate-400 hover:text-white"
                    )}
                >
                    {team1Name}
                </button>
                <button
                    onClick={() => handleSetResult('Empate')}
                    className={cn(
                        "px-3 py-1 text-xs font-medium rounded-md transition-all",
                        currentResult === 'Empate' ? "bg-slate-600 text-white shadow" : "text-slate-400 hover:text-white"
                    )}
                >
                    Empate
                </button>
                <button
                    onClick={() => handleSetResult('Azul')}
                    className={cn(
                        "px-3 py-1 text-xs font-medium rounded-md transition-all",
                        currentResult === 'Azul' ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-white"
                    )}
                >
                    {team2Name}
                </button>
            </div>
        </div>
    );
}
