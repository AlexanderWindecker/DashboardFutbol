'use client';

import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface RankingCardProps {
    title: string;
    icon: React.ReactNode;
    data: any[];
    valueKey: string;
    label: string;
    linkHref?: string;
    suffix?: string;
    secondaryValueKey?: string;
    secondarySuffix?: string;
}

export function RankingCard({ title, icon, data, valueKey, label, linkHref, suffix = '', secondaryValueKey, secondarySuffix = '' }: RankingCardProps) {
    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-full">
            <div className="p-4 border-b border-slate-800 bg-slate-950/30 flex items-center justify-between">
                <h3 className="font-semibold text-white flex items-center gap-2">
                    {icon} {title}
                </h3>
                {linkHref && (
                    <Link href={linkHref} className="text-xs text-slate-500 hover:text-white flex items-center gap-1">
                        Ver más <ArrowRight size={12} />
                    </Link>
                )}
            </div>
            <div className="divide-y divide-slate-800 flex-1">
                {data.map((p: any, i: number) => (
                    <div key={p.id} className="p-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
                        <div className="flex items-center gap-3">
                            <span className={cn(
                                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                                i === 0 ? "bg-amber-400 text-amber-950" :
                                    i === 1 ? "bg-slate-300 text-slate-900" :
                                        i === 2 ? "bg-amber-700 text-amber-100" :
                                            "bg-slate-800 text-slate-500"
                            )}>
                                {i + 1}
                            </span>
                            <span className="text-slate-200 font-medium">{p.name}</span>
                        </div>
                        <span className="text-slate-400 font-mono text-sm">
                            {p[valueKey]}{suffix} <span className="text-slate-600 text-xs ml-1">{label}</span>
                            {secondaryValueKey && (
                                <span className="text-slate-500 text-xs ml-2">
                                    ({p[secondaryValueKey]}{secondarySuffix})
                                </span>
                            )}
                        </span>
                    </div>
                ))}
                {data.length === 0 && <p className="p-4 text-center text-slate-500 text-sm">Sin datos suficientes.</p>}
            </div>
        </div>
    );
}

export function StatCard({ title, value, icon, subtext }: { title: string, value: string | number, icon: React.ReactNode, subtext?: string }) {
    return (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-slate-400 text-sm font-medium">{title}</h3>
                {icon}
            </div>
            <p className="text-3xl font-bold text-white uppercase">{value}</p>
            {subtext && <p className="text-xs text-slate-500 mt-1">{subtext}</p>}
        </div>
    );
}
