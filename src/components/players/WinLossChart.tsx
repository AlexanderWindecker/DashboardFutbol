'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface WinLossChartProps {
    wins: number;
    losses: number;
    draws: number;
}

export function WinLossChart({ wins, losses, draws }: WinLossChartProps) {
    const data = [
        { name: 'Victorias', value: wins, color: '#10b981' }, // emerald-500
        { name: 'Empates', value: draws, color: '#64748b' }, // slate-500
        { name: 'Derrotas', value: losses, color: '#f43f5e' }, // rose-500
    ].filter(item => item.value > 0);

    if (data.length === 0) {
        return (
            <div className="h-48 flex items-center justify-center border border-dashed border-slate-800 rounded-xl">
                <p className="text-slate-500 text-sm italic">Sin historial de partidos</p>
            </div>
        );
    }

    return (
        <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        animationBegin={0}
                        animationDuration={1500}
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#0f172a',
                            border: '1px solid #1e293b',
                            borderRadius: '8px',
                            color: '#f8fafc'
                        }}
                    />
                    <Legend
                        verticalAlign="bottom"
                        height={36}
                        formatter={(value) => <span className="text-slate-400 text-xs font-medium">{value}</span>}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}
