'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Zap } from 'lucide-react';

interface TickerMarqueeProps {
    items: ReactNode[];
}

export function TickerMarquee({ items }: TickerMarqueeProps) {
    if (!items || items.length === 0) return null;

    return (
        <div className="fixed bottom-0 left-0 lg:left-64 right-0 h-10 md:h-12 bg-slate-950 border-t border-slate-800 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] z-40 overflow-hidden flex items-center">
            
            {/* Glowing left edge to fade text in */}
            <div className="absolute left-0 top-0 bottom-0 w-8 md:w-16 bg-gradient-to-r from-slate-950 to-transparent z-10 pointer-events-none" />

            <div className="flex w-max animate-ticker hover:[animation-play-state:paused] items-center">
                {/* We render the items multiple times to create the infinite loop effect seamlessly */}
                {[...Array(4)].map((_, arrayIndex) => (
                    <div key={arrayIndex} className="flex items-center min-w-max">
                        {items.map((item, index) => (
                            <div key={index} className="flex items-center text-sm md:text-base font-bold text-slate-300 px-6 whitespace-nowrap">
                                {item}
                                <Zap size={14} className="ml-12 text-indigo-500/50" fill="currentColor" />
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            {/* Glowing right edge to fade text out */}
            <div className="absolute right-0 top-0 bottom-0 w-8 md:w-16 bg-gradient-to-l from-slate-950 to-transparent z-10 pointer-events-none" />

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes ticker {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); } 
                }
                .animate-ticker {
                    animation: ticker 120s linear infinite;
                }
                `
            }} />
        </div>
    );
}
