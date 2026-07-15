'use client';

import { Match, MatchResult, AppSettings } from '@/types';
import { updateMatchResultAction } from '@/actions/matches';
import { cn } from '@/lib/utils';
import { useState } from 'react';

export function MatchResultSelector({
    match,
    settings,
    captain1Name,
    captain2Name
}: {
    match: Match;
    settings?: AppSettings;
    captain1Name?: string;
    captain2Name?: string;
}) {
    const team1Name = settings?.team1Name || 'Celeste';
    const team2Name = settings?.team2Name || 'Azul';
    
    const [scoreCeleste, setScoreCeleste] = useState(match.scoreCeleste?.toString() || '');
    const [scoreAzul, setScoreAzul] = useState(match.scoreAzul?.toString() || '');

    async function handleSetResult(result: MatchResult) {
        await updateMatchResultAction(
            match.id, 
            result, 
            scoreCeleste !== '' ? parseInt(scoreCeleste) : null, 
            scoreAzul !== '' ? parseInt(scoreAzul) : null
        );
    }

    async function handleSaveScore() {
        if (match.result) {
            await updateMatchResultAction(
                match.id, 
                match.result, 
                scoreCeleste !== '' ? parseInt(scoreCeleste) : null, 
                scoreAzul !== '' ? parseInt(scoreAzul) : null
            );
        }
    }

    return (
        <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
                <span className="text-sm text-slate-400 mr-2">Ganador:</span>
                <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800">
                    <button
                        onClick={() => handleSetResult('Celeste')}
                        className={cn(
                            "px-3 py-1 text-xs font-medium rounded-md transition-all flex flex-col items-center",
                            match.result === 'Celeste' ? "bg-sky-500 text-white shadow" : "text-slate-400 hover:text-white"
                        )}
                    >
                        <span>{team1Name}</span>
                    </button>
                    <button
                        onClick={() => handleSetResult('Empate')}
                        className={cn(
                            "px-3 py-1 text-xs font-medium rounded-md transition-all",
                            match.result === 'Empate' ? "bg-slate-600 text-white shadow" : "text-slate-400 hover:text-white"
                        )}
                    >
                        Empate
                    </button>
                    <button
                        onClick={() => handleSetResult('Azul')}
                        className={cn(
                            "px-3 py-1 text-xs font-medium rounded-md transition-all flex flex-col items-center",
                            match.result === 'Azul' ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-white"
                        )}
                    >
                        <span>{team2Name}</span>
                    </button>
                </div>
            </div>
            
            {match.result && (
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 bg-slate-900/50 p-1.5 rounded-lg border border-slate-800">
                        <span 
                            className="text-xs text-slate-500 mr-1 ml-1 cursor-help" 
                            title="Usá este marcador si no sabés quién hizo los goles. Se limpiará automáticamente si cargás goles individuales."
                        >
                            Marcador:
                        </span>
                        <input 
                            type="number" 
                            min="0"
                            className="w-12 bg-slate-800 text-white text-xs text-center rounded px-1 py-1 border border-slate-700 focus:outline-none focus:border-sky-500" 
                            placeholder="Cel"
                            value={scoreCeleste}
                            onChange={(e) => setScoreCeleste(e.target.value)}
                        />
                        <span className="text-slate-500">-</span>
                        <input 
                            type="number" 
                            min="0"
                            className="w-12 bg-slate-800 text-white text-xs text-center rounded px-1 py-1 border border-slate-700 focus:outline-none focus:border-blue-500" 
                            placeholder="Azul"
                            value={scoreAzul}
                            onChange={(e) => setScoreAzul(e.target.value)}
                        />
                        <button 
                            onClick={handleSaveScore}
                            className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-1 rounded transition-colors ml-1"
                        >
                            Guardar
                        </button>
                    </div>
                    <p className="text-[10px] text-slate-600 text-right pr-1">
                        {(match.scoreCeleste !== undefined || match.scoreAzul !== undefined) 
                            ? '⚡ Marcador manual activo · se limpia al cargar goles individuales'
                            : '· calculado desde goles individuales'
                        }
                    </p>
                </div>
            )}
        </div>
    );
}
