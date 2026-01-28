'use client';

import { Player } from '@/types';
import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Zap, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';

interface SocialBloodwebProps {
    players: Player[];
    privacyMode?: boolean;
}

interface Node {
    player: Player;
    x: number;
    y: number;
    angle: number;
    type: 'center' | 'affinity' | 'conflict' | 'neutral';
}

export function SocialBloodweb({ players, privacyMode = false }: SocialBloodwebProps) {
    const [centerId, setCenterId] = useState<string>(players[0]?.id || '');
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 1000, height: 700 });

    // Helper for stable masked names
    const getDisplayName = (player: Player) => {
        if (!privacyMode) return player.name;
        const index = players.findIndex(p => p.id === player.id);
        return `Jugador ${index + 1}`;
    };

    // Get center player
    const centerPlayer = useMemo(() => players.find(p => p.id === centerId), [players, centerId]);

    // Update dimensions on mount/resize
    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                setDimensions({
                    width: containerRef.current.clientWidth,
                    height: containerRef.current.clientHeight
                });
            }
        };

        updateDimensions();
        window.addEventListener('resize', updateDimensions);
        return () => window.removeEventListener('resize', updateDimensions);
    }, []);

    // Calculate Nodes Layout
    const { nodes, connections } = useMemo(() => {
        if (!centerPlayer) return { nodes: [], connections: [] };

        const centerX = dimensions.width / 2;
        const centerY = dimensions.height / 2;
        // Adjust radius based on screen size, max 260
        const radius = Math.min(centerX, centerY) * 0.7;

        const relationships: Node[] = [];

        // Find related players
        // Find related players
        const affinityIds = centerPlayer.affinities || [];
        const conflictIds = centerPlayer.conflicts || [];

        const affinities = affinityIds.map(id => ({ id, type: 'affinity' as const }));
        const conflicts = conflictIds.map(id => ({ id, type: 'conflict' as const }));

        // Find neutrals (players not in affinity/conflict lists)
        // Limit to 5 random neutrals to fill the web without overcrowding
        const neutrals = players
            .filter(p => p.id !== centerId && !affinityIds.includes(p.id) && !conflictIds.includes(p.id))
            // Filter out same name to avoid duplicates with "clones"
            .filter(p => p.name !== centerPlayer.name)
            .slice(0, 5)
            .map(p => ({ id: p.id, type: 'neutral' as const }));

        // Filter out self-reference by ID AND Name (to catch duplicates with diff IDs)
        const rawRelated = [...affinities, ...conflicts, ...neutrals].filter(rel => {
            if (rel.id === centerId) return false;
            const p = players.find(player => player.id === rel.id);
            if (p && p.name === centerPlayer.name) return false;
            return true;
        });

        // Deduplicate by Name (prefer ID check, but fallback to name to avoid visual stacking)
        const uniqueRelatedMap = new Map();
        rawRelated.forEach(rel => {
            const p = players.find(player => player.id === rel.id);
            if (p) {
                // Use Name as key to ensure unique people, not just unique IDs
                // Priority: Affinity/Conflict > Neutral
                if (uniqueRelatedMap.has(p.name)) {
                    const existing = uniqueRelatedMap.get(p.name);
                    if (existing.type === 'neutral' && rel.type !== 'neutral') {
                        uniqueRelatedMap.set(p.name, rel); // Upgrade to specific relation
                    }
                } else {
                    uniqueRelatedMap.set(p.name, rel);
                }
            }
        });

        const allRelated = Array.from(uniqueRelatedMap.values());
        const totalNodes = allRelated.length;

        // Create nodes with positions
        allRelated.forEach((rel, index) => {
            const player = players.find(p => p.id === rel.id);
            if (!player) return;

            const angle = (index / totalNodes) * 2 * Math.PI - (Math.PI / 2); // Start from top
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);

            relationships.push({
                player,
                x,
                y,
                angle,
                type: rel.type
            });
        });

        const centerNode: Node = {
            player: centerPlayer,
            x: centerX,
            y: centerY,
            angle: 0,
            type: 'center'
        };

        return {
            nodes: [centerNode, ...relationships],
            connections: relationships.map(node => ({
                source: centerNode,
                target: node,
                type: node.type
            }))
        };
    }, [centerPlayer, players, dimensions]);

    // Helper to generate jagged line path (for conflicts)
    const getJaggedPath = (x1: number, y1: number, x2: number, y2: number) => {
        const segments = 6;
        let path = `M ${x1} ${y1}`;
        const dx = (x2 - x1) / segments;
        const dy = (y2 - y1) / segments;

        for (let i = 1; i < segments; i++) {
            const px = x1 + dx * i + (Math.random() - 0.5) * 30; // More jitter
            const py = y1 + dy * i + (Math.random() - 0.5) * 30;
            path += ` L ${px} ${py}`;
        }
        path += ` L ${x2} ${y2}`;
        return path;
    };

    // Helper to generate bezier curve (for affinities)
    const getBezierPath = (x1: number, y1: number, x2: number, y2: number) => {
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        // Calculate control point: Perpendicular offset from midpoint
        // This makes the curve "bulge" slightly
        const dx = x2 - x1;
        const dy = y2 - y1;
        // Normalize and rotate 90 degrees
        const length = Math.sqrt(dx * dx + dy * dy);
        const offsetX = -dy / length * 40; // 40px curve depth
        const offsetY = dx / length * 40;

        return `M ${x1} ${y1} Q ${midX + offsetX} ${midY + offsetY} ${x2} ${y2}`;
    };

    if (!centerPlayer) return <div className="text-center text-slate-500">Selecciona un jugador</div>;

    return (
        <div
            ref={containerRef}
            className="relative w-full h-[700px] bg-black rounded-3xl border border-slate-900 overflow-hidden shadow-2xl group flex items-center justify-center"
        >
            {/* 1. Base Fog Layer (Static Turbulence) */}
            <div className="absolute inset-0 opacity-40 pointer-events-none mix-blend-screen">
                <svg width="100%" height="100%">
                    <filter id="fog">
                        <feTurbulence type="fractalNoise" baseFrequency="0.01" numOctaves="5" result="noise" />
                        <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.5 -0.1" in="noise" result="alphaNoise" />
                        <feBlend in="SourceGraphic" in2="alphaNoise" mode="screen" />
                    </filter>
                    <rect width="100%" height="100%" filter="url(#fog)" fill="rgba(50,50,70,0.5)" />
                </svg>
            </div>

            {/* 2. Animated Smoke Clouds (CSS) */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-30">
                <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/40 via-transparent to-transparent animate-[spin_60s_linear_infinite]" />
                <div className="absolute top-[-50%] right-[-50%] w-[200%] h-[200%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/30 via-transparent to-transparent animate-[spin_45s_linear_infinite_reverse]" />
            </div>

            {/* 3. Radial Vignette for Focus */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,black_100%)] z-0 pointer-events-none" />


            {/* SVG Layer for Connections */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                <defs>
                    <filter id="glow-green" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                    <filter id="glow-red" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {connections.map((conn, i) => (
                    <motion.path
                        key={`conn-${conn.target.player.id}-${centerId}`}
                        d={conn.type === 'conflict'
                            ? getJaggedPath(conn.source.x, conn.source.y, conn.target.x, conn.target.y)
                            : getBezierPath(conn.source.x, conn.source.y, conn.target.x, conn.target.y)
                        }
                        stroke={
                            conn.type === 'affinity' ? '#10b981' :
                                conn.type === 'conflict' ? '#f43f5e' :
                                    '#3b82f6' // Blue for neutral
                        }
                        strokeWidth={conn.type === 'conflict' ? 2 : 4}
                        fill="none"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 1.5, delay: i * 0.1, ease: "easeInOut" }}
                        strokeDasharray={conn.type === 'conflict' ? "none" : conn.type === 'neutral' ? "2,8" : "none"}
                        strokeLinecap="round"
                    />
                ))}
            </svg>

            {/* HTML Layer for Nodes */}
            <div className="absolute inset-0 z-10 w-full h-full pointer-events-none">
                {nodes.map((node, i) => (
                    <motion.div
                        key={node.player.id}
                        className={cn(
                            "absolute flex flex-col items-center justify-center rounded-full cursor-pointer pointer-events-auto transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300",
                            node.type === 'center' ? "w-40 h-40 z-20" : "w-32 h-32 hover:scale-105 z-10"
                        )}
                        style={{ left: node.x, top: node.y }}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5, delay: node.type === 'center' ? 0 : 0.5 + (i * 0.1) }}
                        onClick={() => setCenterId(node.player.id)}
                    >
                        {/* Outer Glow Ring */}
                        <div className={cn(
                            "absolute inset-0 rounded-full border-2 opacity-60",
                            node.type === 'center' ? "border-amber-500/50 animate-[spin_10s_linear_infinite]" :
                                node.type === 'affinity' ? "border-emerald-500/40" :
                                    node.type === 'conflict' ? "border-rose-500/40" : "border-cyan-500/40",
                            node.type !== 'center' && "scale-75"
                        )} />

                        {/* Avatar Ring */}
                        <div className={cn(
                            "relative rounded-full flex items-center justify-center border-[3px] shadow-[0_0_30px_rgba(0,0,0,0.5)] overflow-hidden bg-black transition-colors z-10",
                            node.type === 'center' ? "w-32 h-32 border-amber-500 shadow-amber-500/40" :
                                node.type === 'affinity' ? "w-20 h-20 border-emerald-500 shadow-emerald-500/60 hover:border-emerald-400" :
                                    node.type === 'conflict' ? "w-20 h-20 border-rose-500 shadow-rose-500/60 hover:border-rose-400" :
                                        "w-20 h-20 border-cyan-500 shadow-cyan-500/60 hover:border-cyan-400"
                        )}>
                            <User size={node.type === 'center' ? 56 : 32} className={cn(
                                "text-slate-200",
                                node.type === 'center' && "text-amber-100",
                                node.type === 'affinity' && "text-emerald-50",
                                node.type === 'conflict' && "text-rose-50",
                                node.type === 'neutral' && "text-cyan-50"
                            )} />

                            {/* Inner Shine */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />
                        </div>

                        {/* Floating Icon Badge */}
                        {node.type !== 'center' && (
                            <div className={cn(
                                "absolute bottom-6 -right-1 w-8 h-8 rounded-full flex items-center justify-center border-2 border-slate-900 text-white shadow-lg z-30",
                                node.type === 'affinity' ? "bg-emerald-600 shadow-[0_0_10px_rgba(16,185,129,0.8)]" :
                                    node.type === 'conflict' ? "bg-rose-600 shadow-[0_0_10px_rgba(244,63,94,0.8)]" :
                                        "bg-cyan-600 shadow-[0_0_10px_rgba(6,182,212,0.8)]"
                            )}>
                                {node.type === 'affinity' ? <Heart size={14} fill="currentColor" /> :
                                    node.type === 'conflict' ? <Zap size={14} fill="currentColor" /> :
                                        <div className="w-2.5 h-2.5 rounded-full border border-white/50" />
                                }
                            </div>
                        )}

                        {/* Name Label */}
                        <motion.div
                            className="absolute -bottom-2"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1 + (i * 0.1) }}
                        >
                            <span className={cn(
                                "px-3 py-1 rounded-full bg-black/90 backdrop-blur-md text-sm font-bold whitespace-nowrap border shadow-xl z-40",
                                node.type === 'center' ? "text-amber-400 border-amber-500/50" :
                                    node.type === 'affinity' ? "text-emerald-400 border-emerald-500/50" :
                                        node.type === 'conflict' ? "text-rose-400 border-rose-500/50" :
                                            "text-cyan-400 border-cyan-500/50"
                            )}>
                                {getDisplayName(node.player)}
                            </span>
                        </motion.div>
                    </motion.div>
                ))}
            </div>

            {/* Selector (Floating) */}
            <div className="absolute top-4 left-4 z-30 pointer-events-auto">
                <select
                    value={centerId}
                    onChange={(e) => setCenterId(e.target.value)}
                    className="bg-black/50 backdrop-blur border border-slate-700 text-slate-200 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5"
                >
                    {players.map(p => (
                        <option key={p.id} value={p.id}>{getDisplayName(p)}</option>
                    ))}
                </select>
            </div>
        </div>
    );
}
