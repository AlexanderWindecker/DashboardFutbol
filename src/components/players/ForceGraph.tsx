'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Player } from '@/types';
import { cn } from '@/lib/utils';
import { User, ZoomIn, ZoomOut, Maximize, Filter } from 'lucide-react';

interface Node extends Player {
    x: number;
    y: number;
    vx: number;
    vy: number;
}

interface Link {
    source: string;
    target: string;
    type: 'affinity' | 'conflict';
}

interface ForceGraphProps {
    players: Player[];
}

export function ForceGraph({ players }: ForceGraphProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [nodes, setNodes] = useState<Node[]>([]);
    const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
    const [simulationRunning, setSimulationRunning] = useState(true);

    // Transform State
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);

    // Physics Settings
    const REPULSION = 800;
    const SPRING_LENGTH = 180;
    const SPRING_STRENGTH = 0.04;
    const DAMPING = 0.85;
    const CENTER_PULL = 0.01;
    const MAX_SPEED = 8;

    // Initialize Layout
    useEffect(() => {
        const timer = setTimeout(() => {
            if (!containerRef.current) return;
            const width = containerRef.current.clientWidth;
            const height = containerRef.current.clientHeight;

            const count = players.length;
            const radius = Math.min(width, height) * 0.35;

            const newNodes = players.map((p, i) => {
                const angle = (i / count) * 2 * Math.PI;
                return {
                    ...p,
                    x: width / 2 + Math.cos(angle) * radius,
                    y: height / 2 + Math.sin(angle) * radius,
                    vx: 0,
                    vy: 0
                };
            });
            setNodes(newNodes);
            setSimulationRunning(true);
        }, 100);
        return () => clearTimeout(timer);
    }, [players]);

    // Graph Links
    const links = useMemo(() => {
        const l: Link[] = [];
        const processed = new Set<string>();

        players.forEach(p => {
            p.affinities?.forEach(targetId => {
                const key = [p.id, targetId].sort().join('-');
                if (!processed.has(key)) {
                    l.push({ source: p.id, target: targetId, type: 'affinity' });
                    processed.add(key);
                }
            });
            p.conflicts?.forEach(targetId => {
                const key = [p.id, targetId].sort().join('-');
                if (!processed.has(key)) {
                    l.push({ source: p.id, target: targetId, type: 'conflict' });
                    processed.add(key);
                }
            });
        });
        return l;
    }, [players]);

    // Physics Loop
    useEffect(() => {
        if (!simulationRunning || nodes.length === 0) return;

        let frameId: number;
        const tick = () => {
            setNodes(prev => {
                const next = prev.map(n => ({ ...n }));
                const width = containerRef.current?.clientWidth || 800;
                const height = containerRef.current?.clientHeight || 600;

                // 1. Repulsion
                for (let i = 0; i < next.length; i++) {
                    for (let j = i + 1; j < next.length; j++) {
                        const a = next[i];
                        const b = next[j];
                        const dx = b.x - a.x;
                        const dy = b.y - a.y;
                        let d2 = dx * dx + dy * dy;
                        if (d2 < 1) d2 = 1;

                        if (d2 < 250000) {
                            const dist = Math.sqrt(d2);
                            const force = REPULSION / (dist + 1);
                            const fx = (dx / dist) * force;
                            const fy = (dy / dist) * force;

                            a.vx -= fx * 0.1;
                            a.vy -= fy * 0.1;
                            b.vx += fx * 0.1;
                            b.vy += fy * 0.1;
                        }
                    }
                }

                // 2. Springs
                links.forEach(link => {
                    const sIdx = next.findIndex(n => n.id === link.source);
                    const tIdx = next.findIndex(n => n.id === link.target);
                    if (sIdx === -1 || tIdx === -1) return;

                    const source = next[sIdx];
                    const target = next[tIdx];

                    const dx = target.x - source.x;
                    const dy = target.y - source.y;
                    const dist = Math.sqrt(dx * dx + dy * dy) || 1;

                    const targetLen = link.type === 'conflict' ? SPRING_LENGTH * 1.8 : SPRING_LENGTH;
                    const displacement = dist - targetLen;
                    const force = displacement * SPRING_STRENGTH;

                    const fx = (dx / dist) * force;
                    const fy = (dy / dist) * force;

                    source.vx += fx;
                    source.vy += fy;
                    target.vx -= fx;
                    target.vy -= fy;
                });

                // 3. Integration
                next.forEach(node => {
                    node.vx += (width / 2 - node.x) * CENTER_PULL;
                    node.vy += (height / 2 - node.y) * CENTER_PULL;

                    const vMag = Math.sqrt(node.vx * node.vx + node.vy * node.vy);
                    if (vMag > MAX_SPEED) {
                        node.vx = (node.vx / vMag) * MAX_SPEED;
                        node.vy = (node.vy / vMag) * MAX_SPEED;
                    }

                    node.x += node.vx;
                    node.y += node.vy;

                    node.vx *= DAMPING;
                    node.vy *= DAMPING;

                    if (node.x < 20) node.vx += 1;
                    if (node.x > width - 20) node.vx -= 1;
                    if (node.y < 20) node.vy += 1;
                    if (node.y > height - 20) node.vy -= 1;
                });

                return next;
            });
            frameId = requestAnimationFrame(tick);
        };
        frameId = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frameId);
    }, [simulationRunning, links]);

    // Zoom Handlers
    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const delta = -e.deltaY * 0.001;
        setZoom(z => Math.min(Math.max(0.1, z + delta), 4));
    };

    const wasDraggingRef = useRef(false);

    // Interaction Handlers (Distinguish between panning canvas and dragging nodes)
    const dragRef = useRef<{
        type: 'node' | 'pan',
        id?: string,
        startX: number,
        startY: number,
        initialPanX?: number,
        initialPanY?: number,
        nodeOffsetX?: number,
        nodeOffsetY?: number
    } | null>(null);

    const handleMouseDown = (e: React.MouseEvent, type: 'node' | 'pan', id?: string) => {
        e.preventDefault();
        wasDraggingRef.current = false;

        if (type === 'node' && id) {
            const rect = containerRef.current?.getBoundingClientRect();
            if (!rect) return;

            // Calculate mouse position in world space
            const mouseX = (e.clientX - rect.left - pan.x) / zoom;
            const mouseY = (e.clientY - rect.top - pan.y) / zoom;

            // Find node to get its current position
            const node = nodes.find(n => n.id === id);
            if (node) {
                dragRef.current = {
                    type: 'node',
                    id,
                    startX: e.clientX,
                    startY: e.clientY,
                    nodeOffsetX: node.x - mouseX,
                    nodeOffsetY: node.y - mouseY
                };
                setSimulationRunning(true);
            }
        } else {
            setIsPanning(true);
            dragRef.current = { type: 'pan', startX: e.clientX, startY: e.clientY, initialPanX: pan.x, initialPanY: pan.y };
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!dragRef.current) return;

        const dx = e.clientX - dragRef.current.startX;
        const dy = e.clientY - dragRef.current.startY;

        // If moved significantly, mark as dragging to prevent click event
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
            wasDraggingRef.current = true;
        }

        if (dragRef.current.type === 'pan') {
            setPan({
                x: (dragRef.current.initialPanX || 0) + dx,
                y: (dragRef.current.initialPanY || 0) + dy
            });
        } else if (dragRef.current.type === 'node') {
            const rect = containerRef.current?.getBoundingClientRect();
            if (!rect) return;

            const mouseX = (e.clientX - rect.left - pan.x) / zoom;
            const mouseY = (e.clientY - rect.top - pan.y) / zoom;

            const offsetX = dragRef.current.nodeOffsetX || 0;
            const offsetY = dragRef.current.nodeOffsetY || 0;

            setNodes(prev => prev.map(n =>
                n.id === dragRef.current?.id ? { ...n, x: mouseX + offsetX, y: mouseY + offsetY, vx: 0, vy: 0 } : n
            ));
        }
    };

    const handleMouseUp = () => {
        dragRef.current = null;
        setIsPanning(false);
    };

    const isNodeRelevant = (nodeId: string) => {
        if (!activeNodeId) return true;
        if (nodeId === activeNodeId) return true;
        return links.some(l =>
            (l.source === activeNodeId && l.target === nodeId) ||
            (l.target === activeNodeId && l.source === nodeId)
        );
    };

    return (
        <div className="flex flex-col h-[700px] w-full bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden relative select-none">
            {/* Toolbar */}
            <div className="absolute top-4 left-4 z-10 flex gap-2">
                <button
                    onClick={() => setActiveNodeId(null)}
                    className={cn("p-2 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold",
                        activeNodeId
                            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                            : "bg-slate-900 border border-slate-700 text-slate-500 cursor-default"
                    )}
                    disabled={!activeNodeId}
                >
                    <Filter size={16} /> Ver Todo
                </button>
                <div className="px-3 py-2 rounded-lg bg-slate-900/90 border border-slate-700 backdrop-blur-sm flex items-center gap-3 text-xs text-slate-400">
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div> Socios</div>
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"></div> Rivales</div>
                </div>
            </div>

            {/* Zoom Controls */}
            <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-2 shadow-xl">
                <button onClick={() => setZoom(z => Math.min(z + 0.25, 4))} className="p-2 bg-slate-900/80 border border-slate-700 rounded-t-lg text-slate-300 hover:text-white hover:bg-slate-800 backdrop-blur"><ZoomIn size={18} /></button>
                <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} className="p-2 bg-slate-900/80 border-x border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 backdrop-blur font-mono text-[10px]">{Math.round(zoom * 100)}%</button>
                <button onClick={() => setZoom(z => Math.max(z - 0.25, 0.1))} className="p-2 bg-slate-900/80 border border-slate-700 rounded-b-lg text-slate-300 hover:text-white hover:bg-slate-800 backdrop-blur"><ZoomOut size={18} /></button>
            </div>

            <div
                ref={containerRef}
                className={cn("flex-1 w-full h-full cursor-grab active:cursor-grabbing", isPanning && "cursor-grabbing")}
                onMouseDown={(e) => handleMouseDown(e, 'pan')}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
            >
                {/* Transform Container */}
                <div
                    style={{
                        transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                        transformOrigin: '0 0',
                        width: '100%',
                        height: '100%'
                    }}
                    className="w-full h-full relative transition-transform duration-75 ease-out will-change-transform"
                >

                    {/* SVG Layer for Links */}
                    <svg className="w-full h-full pointer-events-none absolute inset-0 overflow-visible">
                        {links.map((link, i) => {
                            const s = nodes.find(n => n.id === link.source);
                            const t = nodes.find(n => n.id === link.target);
                            if (!s || !t) return null;

                            const isRelevant = (!activeNodeId) ||
                                (link.source === activeNodeId || link.target === activeNodeId);

                            const color = link.type === 'affinity' ? '#10b981' : '#f43f5e';

                            return (
                                <line
                                    key={i}
                                    x1={s.x} y1={s.y}
                                    x2={t.x} y2={t.y}
                                    stroke={color}
                                    strokeWidth={isRelevant ? 2 : 1}
                                    strokeOpacity={isRelevant ? 0.6 : 0.05}
                                    strokeLinecap="round"
                                    className="transition-all duration-500"
                                />
                            );
                        })}
                    </svg>

                    {/* DOM Layer for Nodes */}
                    {nodes.map(node => {
                        const relevant = isNodeRelevant(node.id);
                        const isActive = node.id === activeNodeId;

                        return (
                            <div
                                key={node.id}
                                onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, 'node', node.id); }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (!wasDraggingRef.current) {
                                        setActiveNodeId(activeNodeId === node.id ? null : node.id);
                                    }
                                }}
                                className={cn(
                                    "absolute w-12 h-12 -ml-6 -mt-6 rounded-full flex items-center justify-center border-2 transition-all duration-300 z-10 cursor-pointer",
                                    isActive
                                        ? "bg-indigo-600 border-indigo-400 scale-125 z-50 shadow-[0_0_30px_rgba(79,70,229,0.6)]"
                                        : relevant
                                            ? "bg-slate-800 border-slate-600 hover:border-slate-400 hover:scale-110"
                                            : "bg-slate-900 border-slate-800 opacity-20 scale-75 blur-[1px]"
                                )}
                                style={{ transform: `translate(${node.x}px, ${node.y}px)` }}
                            >
                                <span className="text-[10px] font-bold text-white pointer-events-none select-none">
                                    {node.name.substring(0, 2).toUpperCase()}
                                </span>

                                {/* Label */}
                                <div className={cn(
                                    "absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-950/90 border border-slate-800 rounded text-[10px] font-medium text-slate-200 whitespace-nowrap transition-opacity pointer-events-none select-none",
                                    (isActive || relevant) ? "opacity-100" : "opacity-0"
                                )}>
                                    {node.name}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {links.length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-40">
                    <User size={48} className="text-slate-600 mb-4" />
                    <p className="text-slate-500 font-medium">Sin relaciones definidas</p>
                    <p className="text-slate-600 text-sm mt-1">Visitá el comparador para agregar vínculos</p>
                </div>
            )}
        </div>
    );
}
