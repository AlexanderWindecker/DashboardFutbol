'use client';

import { cn } from '@/lib/utils';
import { MatchResult, Team } from '@/types';
import { Tooltip } from '@/components/ui/Tooltip';

export type StreakResult = 'W' | 'L' | 'D';

interface PlayerStreakProps {
    streak: StreakResult[];
    className?: string;
}

export function PlayerStreak({ streak, className }: PlayerStreakProps) {
    if (streak.length === 0) return null;

    return (
        <div className={cn("flex items-center gap-1.5", className)}>
            {streak.map((result, index) => (
                <Tooltip
                    key={index}
                    content={result === 'W' ? 'Victoria' : result === 'L' ? 'Derrota' : 'Empate'}
                >
                    <div
                        className={cn(
                            "w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold border cursor-help",
                            result === 'W' && "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
                            result === 'L' && "bg-red-500/20 text-red-400 border-red-500/30",
                            result === 'D' && "bg-slate-500/20 text-slate-400 border-slate-500/30"
                        )}
                    >
                        {result}
                    </div>
                </Tooltip>
            ))}
            <span className="text-[10px] text-slate-500 ml-1 uppercase tracking-wider font-medium">Últimos {streak.length}</span>
        </div>
    );
}
