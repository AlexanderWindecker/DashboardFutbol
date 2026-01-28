'use client';

import { Player } from '@/types';
import { useState, useMemo } from 'react';
import { Heart, Zap, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SocialGraphProps {
    players: Player[];
}

export function SocialGraph({ players }: SocialGraphProps) {
    const [hoveredPlayerId, setHoveredPlayerId] = useState<string | null>(null);

    // Calculate circular positions
    const radius = 220; // Radius of the circle
    const center = 300; // Center point in the 600x600 SVG
    const nodes = useMemo(() => {
        return players.map((player, index) => {
            const angle = (index / players.length) * 2 * Math.PI - Math.PI / 2;
            return {
                ...player,
                x: center + radius * Math.cos(angle),
                y: center + radius * Math.sin(angle),
                angle
            };
        });
    }, [players]);

    // Calculate connections
    const connections = useMemo(() => {
        const lines: { from: any, to: any, type: 'affinity' | 'conflict' }[] = [];
        nodes.forEach(node => {
            // Affinities
            (node.affinities || []).forEach(targetId => {
                const targetNode = nodes.find(n => n.id === targetId);
                if (targetNode) {
                    lines.push({ from: node, to: targetNode, type: 'affinity' });
                }
            });
            // Conflicts
            (node.conflicts || []).forEach(targetId => {
                const targetNode = nodes.find(n => n.id === targetId);
                if (targetNode) {
                    lines.push({ from: node, to: targetNode, type: 'conflict' });
                }
            });
        });
        return lines;
    }, [nodes]);

    const isConnected = (p1: string, p2: string) => {
        const player = players.find(p => p.id === p1);
        return player?.affinities?.includes(p2) || player?.conflicts?.includes(p2);
    };

    return (
        <div className="relative w-[600px] h-[600px] select-none scale-75 md:scale-100">
            <svg viewBox="0 0 600 600" className="w-full h-full">
                {/* Connection Lines */}
                <g>
                    {connections.map((conn, i) => {
                        const isPrimary = hoveredPlayerId === conn.from.id || hoveredPlayerId === conn.to.id;
                        const isHidden = hoveredPlayerId && !isPrimary;

                        return (
                            <path
                                key={i}
                                d={`M ${conn.from.x} ${conn.from.y} Q 300 300 ${conn.to.x} ${conn.to.y}`}
                                fill="none"
                                stroke={conn.type === 'affinity' ? '#10b981' : '#f43f5e'}
                                strokeWidth={isPrimary ? 3 : 1.5}
                                strokeDasharray={conn.type === 'conflict' ? "5,5" : "0"}
                                className={cn(
                                    "transition-all duration-500",
                                    isPrimary ? "opacity-100" : "opacity-20",
                                    isHidden && "opacity-0"
                                )}
                            />
                        );
                    })}
                </g>

                {/* Nodes (Players) */}
                {nodes.map((node) => {
                    const isHovered = hoveredPlayerId === node.id;
                    const isRelated = hoveredPlayerId && (isConnected(hoveredPlayerId, node.id) || isConnected(node.id, hoveredPlayerId));
                    const isDimmed = hoveredPlayerId && !isHovered && !isRelated;

                    return (
                        <g
                            key={node.id}
                            className={cn(
                                "cursor-pointer transition-all duration-300",
                                isDimmed ? "opacity-30 blur-[1px]" : "opacity-100"
                            )}
                            onMouseEnter={() => setHoveredPlayerId(node.id)}
                            onMouseLeave={() => setHoveredPlayerId(null)}
                        >
                            {/* Glow Effect */}
                            {isHovered && (
                                <circle
                                    cx={node.x}
                                    cy={node.y}
                                    r={30}
                                    className="fill-indigo-500/20 blur-md animate-pulse"
                                />
                            )}

                            {/* Avatar Circle */}
                            <circle
                                cx={node.x}
                                cy={node.y}
                                r={22}
                                className={cn(
                                    "fill-slate-900 stroke-2 transition-colors",
                                    isHovered ? "stroke-indigo-500" : "stroke-slate-700"
                                )}
                            />

                            {/* Icon Placeholder */}
                            <g transform={`translate(${node.x - 10}, ${node.y - 10})`}>
                                <User size={20} className={isHovered ? "text-white" : "text-slate-500"} />
                            </g>

                            {/* Player Name */}
                            <g transform={`translate(${node.x}, ${node.y})`}>
                                <text
                                    y={35}
                                    textAnchor="middle"
                                    className={cn(
                                        "text-[10px] font-bold uppercase tracking-wider transition-colors",
                                        isHovered ? "fill-white" : "fill-slate-400"
                                    )}
                                >
                                    {node.name.split(' ')[0]}
                                </text>
                            </g>

                            {/* Relation Indicators on Hover */}
                            {isHovered && node.affinities?.length ? (
                                <circle cx={node.x + 15} cy={node.y - 15} r={8} fill="#10b981" />
                            ) : null}
                            {isHovered && node.conflicts?.length ? (
                                <circle cx={node.x - 15} cy={node.y - 15} r={8} fill="#f43f5e" />
                            ) : null}
                        </g>
                    );
                })}
            </svg>

            {/* Central Info Tooltip */}
            {hoveredPlayerId && (
                <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 bg-slate-900/90 backdrop-blur-xl border border-slate-700 p-4 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200 pointer-events-none text-center"
                >
                    <p className="text-white font-bold text-lg mb-1">{nodes.find(n => n.id === hoveredPlayerId)?.name}</p>
                    <div className="flex justify-center gap-4 text-xs">
                        <div className="flex items-center gap-1 text-emerald-400">
                            <Heart size={12} fill="currentColor" />
                            {nodes.find(n => n.id === hoveredPlayerId)?.affinities?.length || 0}
                        </div>
                        <div className="flex items-center gap-1 text-rose-400">
                            <Zap size={12} fill="currentColor" />
                            {nodes.find(n => n.id === hoveredPlayerId)?.conflicts?.length || 0}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
