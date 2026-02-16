'use client';

import { Match } from '@/types';
import { DayPicker } from 'react-day-picker';
import { es } from 'date-fns/locale';
import { format, parseISO, isSameDay } from 'date-fns';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
// Need styles for DayPicker, usually imported but we are using custom valid Nextjs CSS or library CSS
import 'react-day-picker/dist/style.css';

export function CalendarDashboard({ matches }: { matches: Match[] }) {
    const router = useRouter();

    // Create modifiers for days that have matches
    const matchDays = matches.map(m => parseISO(m.date));

    // Custom render for day content to show chips? 
    // react-day-picker v8 allows custom components or formatters.
    // For simplicity, we just highlight the days.

    const modifiers = {
        hasMatch: matchDays
    };

    const modifiersStyles = {
        hasMatch: {
            color: 'white',
            backgroundColor: 'var(--primary)',
            fontWeight: 'bold',
            borderRadius: '100%'
        }
    };

    const handleDayClick = (day: Date) => {
        // Find match on this day
        const match = matches.find(m => isSameDay(parseISO(m.date), day));
        if (match) {
            router.push(`/matches/${match.id}`);
        }
    };

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex justify-center">
            <DayPicker
                mode="single"
                locale={es}
                modifiers={modifiers}
                modifiersStyles={modifiersStyles}
                onDayClick={handleDayClick}
                styles={{
                    head_cell: { color: '#94a3b8' },
                    day: { color: '#e2e8f0' },
                    caption: { color: '#f8fafc' },
                    nav_button: { color: '#cbd5e1' }
                }}
                components={{
                    DayContent: (props: any) => {
                        const matchOnDay = matches.find(m => isSameDay(parseISO(m.date), props.date));
                        const isSuper = matchOnDay?.isSuperclasico;

                        return (
                            <div className={cn(
                                "relative w-full h-full flex items-center justify-center transition-all",
                                isSuper && "text-amber-400 font-black drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                            )}>
                                {props.date.getDate()}
                                {matchOnDay && (
                                    <div className={cn(
                                        "absolute bottom-1 w-1.5 h-1.5 rounded-full",
                                        isSuper ? "bg-amber-500 animate-pulse" : "bg-sky-400"
                                    )}></div>
                                )}
                            </div>
                        )
                    }
                } as any}
            />
        </div>
    );
}
