'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface TooltipProps {
    content: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}

export function Tooltip({ content, children, className }: TooltipProps) {
    const [isVisible, setIsVisible] = React.useState(false);

    return (
        <div
            className="relative inline-flex"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            {children}
            {isVisible && (
                <div className={cn(
                    "absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5",
                    "bg-slate-950 border border-slate-800 rounded-lg shadow-xl",
                    "text-xs text-slate-300 z-50 w-auto max-w-xs text-center text-balance",
                    "animate-in fade-in zoom-in-95 duration-200",
                    className
                )}>
                    {content}
                    {/* Triangle Arrow */}
                    <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-950 border-r border-b border-slate-800 rotate-45 transform" />
                </div>
            )}
        </div>
    );
}
