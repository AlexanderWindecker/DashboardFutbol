import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SkillDeltaBadgeProps {
    delta?: number;
    className?: string;
    showZero?: boolean;
}

export function SkillDeltaBadge({ delta, className, showZero = false }: SkillDeltaBadgeProps) {
    if (delta === undefined || delta === null) return null;
    if (delta === 0 && !showZero) return null;

    const isPositive = delta > 0;
    const isNegative = delta < 0;

    return (
        <span className={cn(
            "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold tracking-tight shadow-sm border",
            isPositive && "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
            isNegative && "bg-rose-500/10 text-rose-500 border-rose-500/20",
            !isPositive && !isNegative && "bg-slate-800/50 text-slate-400 border-slate-700/50",
            className
        )}>
            {isPositive && <ArrowUpRight size={12} strokeWidth={3} />}
            {isNegative && <ArrowDownRight size={12} strokeWidth={3} />}
            {!isPositive && !isNegative && <Minus size={12} strokeWidth={3} />}
            {isPositive ? '+' : ''}{delta.toFixed(1)}
        </span>
    );
}

export function GlobalSkillBadge({ global, delta, className }: { global: number, delta?: number, className?: string }) {
    const isPositive = delta && delta > 0;
    const isNegative = delta && delta < 0;
    
    return (
        <div className={cn("flex flex-col items-end", className)}>
            <div className={cn(
                "text-2xl font-black tracking-tighter",
                isPositive ? "text-emerald-400" : isNegative ? "text-rose-400" : "text-white"
            )}>
                {Math.round(global)}
            </div>
            {delta !== undefined && delta !== 0 && (
                <div className={cn(
                    "text-[10px] font-bold flex items-center -mt-1",
                    isPositive ? "text-emerald-500" : "text-rose-500"
                )}>
                    {isPositive ? '+' : ''}{delta.toFixed(1)}
                </div>
            )}
        </div>
    );
}
