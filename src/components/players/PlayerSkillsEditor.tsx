'use client';

import { Player } from '@/types';
import { useState } from 'react';
import { updatePlayerSkillsAction } from '@/actions/players';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Loader2, Save, Plus, Users, TrendingUp, Info, Palmtree, Target, Waves } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';
import { Tooltip } from '@/components/ui/Tooltip';
import { Modal } from '@/components/ui/Modal';
import { SpecialtiesGuide } from './SpecialtiesGuide';
import { WinLossChart } from './WinLossChart';
import { PlayerAffinity } from './PlayerAffinity';
import { Pencil, Settings } from 'lucide-react';
import { RulesEditorModal, SKILLS } from './RulesEditorModal';
import { getPlayerSpecialties, getPlayerTraits } from '@/lib/rules-engine';
import { AffinityManager } from './AffinityManager';
import { CustomRule } from '@/types';
import { useAdmin } from '@/hooks/useAdmin';

interface PlayerSkillsEditorProps {
    player: Player;
    allPlayers: Player[];
    stats: {
        matchesAttended: number;
        mvpCount: number;
        totalPlayed: number;
        matchesAzul: number;
        matchesCeleste: number;
        absences: number;
        maxMvpStreak: number;
        mvpWinRate: number;
        assists: number;
        globalAssistsPerMatch: number;
        wins: number;
        losses: number;
        draws: number;
        goals: number;
        topAffinity: { id: string; name: string; wins: number; losses: number; draws: number }[];
        worstAffinity: { id: string; name: string; wins: number; losses: number; draws: number }[];
        allAffinity: { id: string; name: string; wins: number; losses: number; draws: number }[];
    };
    specialtyRules: CustomRule[];
    traitRules: CustomRule[];
}

export function PlayerSkillsEditor({ player, allPlayers, stats, specialtyRules, traitRules }: PlayerSkillsEditorProps) {
    const [skills, setSkills] = useState(player.skills || {
        ritmo: 50,
        tiros: 50,
        regates: 50,
        velocidad: 50,
        pases: 50,
        // GK defaults
        reflejos: 50,
        posicionamiento: 50,
        estirada: 50,
        saque: 50,
        seguridad: 50
    });
    const [positions, setPositions] = useState<string[]>(player.positions || ((player as any).position ? [(player as any).position] : ['Mediocampista']));
    const [preferredFoot, setPreferredFoot] = useState(player.preferredFoot || 'Derecho');
    const [userTraits, setUserTraits] = useState<string[]>(player.traits || []);
    const [isInjured, setIsInjured] = useState(player.isInjured || false);
    const [phone, setPhone] = useState(player.phone || '');
    const [telegramId, setTelegramId] = useState(player.telegramId || '');
    const [playerName, setPlayerName] = useState(player.name);
    const [isVacation, setIsVacation] = useState(player.isVacation || false);
    const [isPending, setIsPending] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [showGuide, setShowGuide] = useState(false);
    const [showRulesEditor, setShowRulesEditor] = useState<'specialty' | 'trait' | null>(null);
    const { isAdmin } = useAdmin();

    const POSSIBLE_POSITIONS = ['Delantero', 'Mediocampista', 'Defensor', 'Arquero'];

    const attendanceRate = stats.totalPlayed > 0 ? (stats.matchesAttended / stats.totalPlayed) * 100 : 0;
    const mvpRate = stats.matchesAttended > 0 ? (stats.mvpCount / stats.matchesAttended) * 100 : 0;

    // Team Affinity Rates
    const azulRate = stats.matchesAttended > 0 ? (stats.matchesAzul / stats.matchesAttended) * 100 : 0;
    const celesteRate = stats.matchesAttended > 0 ? (stats.matchesCeleste / stats.matchesAttended) * 100 : 0;

    // Logic: Is Primary Position Goalkeeper?
    const isPrimaryGoalkeeper = positions.length > 0 && positions[0] === 'Arquero';

    // Logic: Does the player have any Field position?
    const hasFieldPosition = positions.some(p => p !== 'Arquero');

    // Logic: Does the player have Arquero as position (regardless of order)?
    const hasGoalkeeperPosition = positions.includes('Arquero');

    const data = isPrimaryGoalkeeper ? [
        { subject: 'Reflejos', A: skills.reflejos || 50, fullMark: 100 },
        { subject: 'Ubicación', A: skills.posicionamiento || 50, fullMark: 100 },
        { subject: 'Defensa', A: skills.estirada || 50, fullMark: 100 },
        { subject: 'Saque', A: skills.saque || 50, fullMark: 100 },
        { subject: 'Seguridad', A: skills.seguridad || 50, fullMark: 100 },
    ] : [
        { subject: 'Ritmo', A: skills.ritmo, fullMark: 100 },
        { subject: 'Veloc.', A: skills.velocidad, fullMark: 100 },
        { subject: 'Tiros', A: skills.tiros, fullMark: 100 },
        { subject: 'Pases', A: skills.pases, fullMark: 100 },
        { subject: 'Regates', A: skills.regates, fullMark: 100 },
    ];

    async function handleSave() {
        setIsPending(true);
        await updatePlayerSkillsAction(player.id, {
            name: playerName,
            skills,
            positions: positions as any,
            preferredFoot: preferredFoot as any,
            traits: userTraits,
            isInjured,
            isVacation,
            phone: phone || undefined,
            telegramId: telegramId || undefined
        });
        setIsPending(false);
        setIsEditing(false);
    }

    const handleChange = (key: keyof typeof skills, value: number) => {
        setSkills(prev => ({ ...prev, [key]: value }));
    };

    const togglePosition = (pos: string) => {
        setPositions(prev =>
            prev.includes(pos)
                ? prev.filter(p => p !== pos)
                : [...prev, pos]
        );
    };

    const average = isPrimaryGoalkeeper
        ? Math.round(((skills.reflejos || 50) + (skills.posicionamiento || 50) + (skills.estirada || 50) + (skills.saque || 50) + (skills.seguridad || 50)) / 5)
        : Math.round((skills.ritmo + skills.tiros + skills.regates + skills.velocidad + skills.pases) / 5);

    const getRatingColor = (score: number) => {
        if (score >= 90) return "bg-violet-600 border-violet-400 shadow-violet-500/50 shadow-lg"; // Elite
        if (score >= 80) return "bg-emerald-600 border-emerald-400 shadow-emerald-500/50"; // Very Good
        if (score >= 70) return "bg-blue-600 border-blue-400 shadow-blue-500/50"; // Good
        if (score >= 60) return "bg-yellow-600 border-yellow-400 shadow-yellow-500/50"; // Decent
        return "bg-slate-600 border-slate-500"; // Average/Low
    };

    const getScoreDescription = (score: number) => {
        if (score >= 90) return "Leyenda del Club";
        if (score >= 85) return "Jugador Elite";
        if (score >= 80) return "Jugador Confiable";
        if (score >= 75) return "Titular Sólido";
        if (score >= 70) return "Buen Rendimiento";
        if (score >= 60) return "En Desarrollo";
        return "Promesa";
    };

    const earnedSpecialties = getPlayerSpecialties(player, specialtyRules, stats);
    const earnedTraits = getPlayerTraits(player, traitRules, stats);

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold text-white">Perfil & Habilidades</h3>
                    <div className="flex items-center gap-2">
                        <div className={cn("text-white font-bold text-sm px-3 py-1 rounded-full border transition-all duration-300 relative group", getRatingColor(average))}>
                            {average}
                            <div className="absolute -top-1 -right-1 flex gap-0.5">
                                {isInjured && (
                                    <Tooltip content="Jugador Lesionado">
                                        <div className="bg-red-600 rounded-full p-0.5 border border-white shadow-sm animate-pulse flex items-center justify-center">
                                            <Plus size={10} className="text-white stroke-[3px]" />
                                        </div>
                                    </Tooltip>
                                )}
                                {isVacation && (
                                    <Tooltip content="En Vacaciones">
                                        <div className="bg-amber-500 rounded-full p-0.5 border border-white shadow-sm flex items-center justify-center">
                                            <Palmtree size={10} className="text-white" />
                                        </div>
                                    </Tooltip>
                                )}
                            </div>
                        </div>
                        <span className="text-sm text-slate-400 font-medium italic">
                            {getScoreDescription(average)}
                        </span>
                    </div>
                </div>
                {isAdmin && (
                    <div className="flex items-center gap-2">
                        {isEditing && (
                            <div className="flex items-center gap-2">
                                <label className="flex items-center gap-2 cursor-pointer bg-slate-800/50 px-3 py-1 rounded-full border border-slate-700 hover:bg-slate-800 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={isInjured}
                                        onChange={(e) => setIsInjured(e.target.checked)}
                                        className="w-4 h-4 rounded border-slate-600 text-red-600 focus:ring-red-500 bg-slate-900"
                                    />
                                    <span className="text-xs text-slate-300 font-medium flex items-center gap-1">
                                        <Plus size={12} className="text-red-500 stroke-[3px]" />
                                        Lesionado
                                    </span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer bg-slate-800/50 px-3 py-1 rounded-full border border-slate-700 hover:bg-slate-800 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={isVacation}
                                        onChange={(e) => setIsVacation(e.target.checked)}
                                        className="w-4 h-4 rounded border-slate-600 text-amber-500 focus:ring-amber-500 bg-slate-900"
                                    />
                                    <span className="text-xs text-slate-300 font-medium flex items-center gap-1">
                                        <Palmtree size={12} className="text-amber-500" />
                                        Vacaciones
                                    </span>
                                </label>
                            </div>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => isEditing ? handleSave() : setIsEditing(true)}>
                            {isPending ? <Loader2 className="animate-spin" /> : (isEditing ? <Save size={18} /> : 'Editar')}
                        </Button>
                    </div>
                )}
            </div>

            {isEditing && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 bg-slate-800/20 p-4 rounded-lg border border-slate-800">
                    <div className="space-y-2">
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Nombre del Jugador</label>
                        <input
                            type="text"
                            value={playerName || ''}
                            onChange={(e) => setPlayerName(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                            placeholder="Nombre"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Teléfono (para matching)</label>
                        <input
                            type="text"
                            value={phone || ''}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                            placeholder="Ej: +54911..."
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">ID de Telegram (Automático o Manual)</label>
                        <input
                            type="text"
                            value={telegramId || ''}
                            onChange={(e) => setTelegramId(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                            placeholder="Ej: 123456789"
                        />
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                {/* Visual Radar */}
                <div className="h-[300px] w-full flex items-center justify-center relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                            <PolarGrid stroke="#334155" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                            <Radar
                                name={playerName}
                                dataKey="A"
                                stroke="#38bdf8"
                                strokeWidth={2}
                                fill="#38bdf8"
                                fillOpacity={0.3}
                            />
                        </RadarChart>
                    </ResponsiveContainer>

                    {/* Overlay Stat when editing? No, sliders below are better */}
                </div>

                {/* Controls */}
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Posiciones</label>
                            {isEditing ? (
                                <div className="flex flex-wrap gap-2">
                                    {POSSIBLE_POSITIONS.map(pos => {
                                        const rank = positions.indexOf(pos);
                                        return (
                                            <button
                                                key={pos}
                                                onClick={() => togglePosition(pos)}
                                                className={cn(
                                                    "px-2 py-1 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5",
                                                    rank !== -1
                                                        ? "bg-sky-500/20 border-sky-500 text-sky-400"
                                                        : "bg-slate-800/40 border-slate-700 text-slate-400 hover:bg-slate-800"
                                                )}
                                            >
                                                {rank !== -1 && (
                                                    <span className="bg-sky-500 text-white w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold">
                                                        {rank + 1}
                                                    </span>
                                                )}
                                                {pos}
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="flex flex-wrap gap-1.5">
                                    {positions.length > 0 ? (
                                        positions.map((pos, idx) => (
                                            <span key={pos} className="bg-slate-800 text-slate-200 px-2 py-0.5 rounded text-sm border border-slate-700 flex items-center gap-1.5">
                                                <span className="text-sky-400 font-bold text-[10px] border-r border-slate-700 pr-1.5">
                                                    {idx + 1}°
                                                </span>
                                                {pos}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-slate-500 italic text-sm">Sin posición</span>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="space-y-2">
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Pie Hábil</label>
                            {isEditing ? (
                                <select
                                    value={preferredFoot}
                                    onChange={(e) => setPreferredFoot(e.target.value as any)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                                >
                                    <option value="Derecho">Derecho</option>
                                    <option value="Zurdo">Zurdo</option>
                                    <option value="Ambidiestro">Ambidiestro</option>
                                </select>
                            ) : (
                                <p className="text-white font-medium">{preferredFoot}</p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2">
                        {hasFieldPosition && (
                            <div className="space-y-3">
                                <div className="text-xs font-bold text-slate-500 uppercase mb-2 border-b border-slate-800 pb-1 flex items-center gap-2">
                                    <Target size={12} className="text-amber-500" />
                                    Atributos de Campo
                                    {!isPrimaryGoalkeeper && <span className="text-[10px] bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded ml-auto">Influye en Global</span>}
                                </div>
                                {['ritmo', 'velocidad', 'tiros', 'pases', 'regates'].map((key) => {
                                    const k = key as keyof typeof skills;
                                    return (
                                        <div key={key}>
                                            <div className="flex justify-between text-xs mb-1">
                                                <span className="capitalize text-slate-400">{key === 'ritmo' ? 'Ritmo (Estado Fisico)' : (key === 'velocidad' ? 'Velocidad Pura' : key)}</span>
                                                <span className="text-sky-400 font-mono">{skills[k]}</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                disabled={!isEditing}
                                                value={skills[k] ?? 50}
                                                onChange={(e) => handleChange(k, parseInt(e.target.value))}
                                                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer disabled:cursor-default disabled:opacity-50 accent-sky-500"
                                            />
                                        </div>
                                    )
                                })}
                            </div>
                        )}

                        {hasGoalkeeperPosition && (
                            <div className="space-y-3 pt-4 border-t border-slate-800">
                                <div className="text-xs font-bold text-sky-400 uppercase mb-2 border-b border-slate-800 pb-1 flex items-center gap-2">
                                    <Waves size={12} className="text-sky-400" />
                                    Atributos de Arquero
                                    {isPrimaryGoalkeeper && <span className="text-[10px] bg-sky-500/10 text-sky-500 px-1.5 py-0.5 rounded ml-auto">Influye en Global</span>}
                                </div>
                                {['reflejos', 'posicionamiento', 'estirada', 'saque', 'seguridad'].map((key) => {
                                    const k = key as keyof typeof skills;
                                    return (
                                        <div key={key}>
                                            <div className="flex justify-between text-xs mb-1">
                                                <span className="capitalize text-slate-400">
                                                    {key === 'posicionamiento' ? 'Ubicación' : (key === 'estirada' ? 'Defensa' : key)}
                                                </span>
                                                <span className="text-sky-400 font-mono">{skills[k] || 50}</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                disabled={!isEditing}
                                                value={skills[k] ?? 50}
                                                onChange={(e) => handleChange(k, parseInt(e.target.value))}
                                                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer disabled:cursor-default disabled:opacity-50 accent-sky-500"
                                            />
                                        </div>
                                    )
                                })}
                            </div>
                        )}

                        {!hasFieldPosition && !hasGoalkeeperPosition && (
                            <div className="text-center py-10 text-slate-500 text-sm italic">
                                Selecciona una posición para ver los atributos.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Performance Stats */}
            <div className="mt-8 border-t border-slate-800 pt-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Win/Loss Graph */}
                    <div className="lg:col-span-1">
                        <h4 className="text-white font-semibold mb-6 flex items-center gap-2">
                            <TrendingUp size={18} className="text-emerald-400" />
                            Historial de Resultados
                        </h4>
                        <div className="bg-slate-950/40 rounded-2xl p-4 border border-slate-800/50">
                            <WinLossChart wins={stats.wins} losses={stats.losses} draws={stats.draws} />
                            <div className="mt-4 grid grid-cols-3 gap-2">
                                <div className="text-center p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                                    <p className="text-[10px] text-emerald-500 font-bold uppercase">Vic.</p>
                                    <p className="text-lg font-bold text-white">{stats.wins}</p>
                                </div>
                                <div className="text-center p-2 rounded-lg bg-slate-500/5 border border-slate-500/10">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">Emp.</p>
                                    <p className="text-lg font-bold text-white">{stats.draws}</p>
                                </div>
                                <div className="text-center p-2 rounded-lg bg-rose-500/5 border border-rose-500/10">
                                    <p className="text-[10px] text-rose-500 font-bold uppercase">Der.</p>
                                    <p className="text-lg font-bold text-white">{stats.losses}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Affinity */}
                    <div className="lg:col-span-2">
                        <div className="flex items-center justify-between mb-6">
                            <h4 className="text-white font-semibold flex items-center gap-2">
                                <Users size={18} className="text-indigo-400" />
                                Afinidad con Jugadores
                            </h4>
                            {isEditing && (
                                <Badge variant="outline" className="text-[10px] border-indigo-500/30 text-indigo-400">
                                    Modo Edición de Reglas
                                </Badge>
                            )}
                        </div>
                        <div className="bg-slate-950/40 rounded-2xl p-6 border border-slate-800/50">
                            {isEditing ? (
                                <AffinityManager
                                    player={player}
                                    allPlayers={allPlayers}
                                    isPending={isPending}
                                    onSave={async (affs: string[], confs: string[]) => {
                                        setIsPending(true);
                                        await updatePlayerSkillsAction(player.id, {
                                            affinities: affs,
                                            conflicts: confs
                                        });
                                        setIsPending(false);
                                        // No setEditing(false) to allow continuing editing other things
                                    }}
                                />
                            ) : (
                                <PlayerAffinity
                                    topAffinity={stats.topAffinity}
                                    worstAffinity={stats.worstAffinity}
                                    allAffinity={stats.allAffinity}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <div className="mt-8 border-t border-slate-800 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Automatic Specialties */}
                    <div>
                        <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                            <span className="bg-sky-500/10 text-sky-500 p-1 rounded">★</span>
                            Especialidades
                            <div className="flex items-center">
                                <button
                                    onClick={() => setShowGuide(true)}
                                    className="ml-1 p-1 text-slate-500 hover:text-sky-400 transition-colors"
                                    title="Ver guía de especialidades"
                                >
                                    <Info size={14} />
                                </button>
                                {isAdmin && (
                                    <button
                                        onClick={() => setShowRulesEditor('specialty')}
                                        className="ml-1 p-1 text-slate-500 hover:text-amber-400 transition-colors"
                                        title="Editar reglas de especialidades"
                                    >
                                        <Pencil size={12} />
                                    </button>
                                )}
                            </div>
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {/* Team Affinity Badges (Still kept manual as they depend on team stats) */}
                            {azulRate > 50 && (
                                <Tooltip content="Más del 50% de partidos en Equipo Azul">
                                    <Badge variant="default" className="bg-blue-600 text-white border-blue-500 hover:bg-blue-700">Talismán Azul</Badge>
                                </Tooltip>
                            )}
                            {celesteRate > 50 && (
                                <Tooltip content="Más del 50% de partidos en Equipo Celeste">
                                    <Badge variant="default" className="bg-sky-400 text-white border-sky-300 hover:bg-sky-500">ADN Celeste</Badge>
                                </Tooltip>
                            )}

                            {/* Dynamic Rule-based Specialty Badges */}
                            {earnedSpecialties.map(spec => {
                                const rule = specialtyRules.find(r => r.name === spec);
                                const isHigh = rule?.category === 'high';
                                const isLow = rule?.category === 'low';

                                // Generate a friendly description from conditions if not provided
                                const autoDesc = rule?.conditions.map((c: any) => {
                                    const skillName = SKILLS.find(s => s.key === c.skill)?.label || c.skill;
                                    return `${skillName} ${c.operator} ${c.value}`;
                                }).join(' y ');

                                return (
                                    <Tooltip key={spec} content={rule?.description || autoDesc || spec}>
                                        <Badge
                                            variant={isHigh ? "default" : "outline"}
                                            className={cn(
                                                isHigh && "bg-violet-500 text-white hover:bg-violet-600",
                                                isLow && "border-rose-500 text-rose-500",
                                                !isHigh && !isLow && "text-emerald-500 border-emerald-500/50"
                                            )}
                                        >
                                            {spec}
                                        </Badge>
                                    </Tooltip>
                                );
                            })}

                            {/* Fallback if none */}
                            {earnedSpecialties.length === 0 && stats.matchesAttended < 5 && (
                                <span className="text-slate-500 text-sm italic">Juega más partidos para desbloquear especialidades.</span>
                            )}
                        </div>
                    </div>

                    {/* Manual Traits */}
                    <div>
                        <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                            <span className="bg-slate-700 p-1 rounded text-white"><Pencil size={12} /></span>
                            Rasgos
                            {isAdmin && (
                                <button
                                    onClick={() => setShowRulesEditor('trait')}
                                    className="ml-1 p-1 text-slate-500 hover:text-amber-400 transition-colors"
                                    title="Editar reglas de rasgos"
                                >
                                    <Pencil size={12} />
                                </button>
                            )}
                        </h4>
                        <div className={cn("space-y-2", !isEditing && "flex flex-wrap gap-2 space-y-0")}>
                            {/* Combine manual traits with dynamic traits */}
                            {isEditing ? (
                                traitRules.map(rule => {
                                    const trait = rule.name;
                                    const hasTrait = userTraits.includes(trait);
                                    return (
                                        <Tooltip key={trait} content={hasTrait ? "Rasgo Activo" : "Seleccionar rasgo"}>
                                            <label className={cn(
                                                "flex items-center gap-3 p-2 rounded-lg border transition-all cursor-pointer bg-slate-800/20",
                                                hasTrait ? "bg-slate-800 border-indigo-500/50" : "border-slate-800 hover:bg-slate-800/50"
                                            )}>
                                                <input
                                                    type="checkbox"
                                                    checked={hasTrait}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setUserTraits([...userTraits, trait]);
                                                        } else {
                                                            setUserTraits(userTraits.filter(t => t !== trait));
                                                        }
                                                    }}
                                                    className="w-4 h-4 rounded border-slate-600 text-indigo-600 focus:ring-indigo-500 bg-slate-900"
                                                />
                                                <span className="text-slate-200 text-sm">{trait}</span>
                                            </label>
                                        </Tooltip>
                                    );
                                })
                            ) : (
                                <>
                                    {/* Manual Traits from user selection */}
                                    {userTraits.map(trait => (
                                        <Badge key={trait} variant="outline" className="bg-slate-800 text-slate-300 border-slate-700">
                                            {trait}
                                        </Badge>
                                    ))}
                                    {/* Rule-based earned traits */}
                                    {earnedTraits.filter(t => !userTraits.includes(t)).map(trait => (
                                        <Badge key={trait} variant="default" className="bg-amber-600/10 text-amber-500 border-amber-500/20">
                                            {trait} (Auto)
                                        </Badge>
                                    ))}
                                    {userTraits.length === 0 && earnedTraits.length === 0 && (
                                        <p className="text-xs text-slate-500 italic">Sin rasgos definidos.</p>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <Modal
                isOpen={showGuide}
                onClose={() => setShowGuide(false)}
                title="Guía de Especialidades"
            >
                <SpecialtiesGuide specialtyRules={specialtyRules} />
            </Modal>

            <RulesEditorModal
                isOpen={showRulesEditor !== null}
                onClose={() => setShowRulesEditor(null)}
                rules={showRulesEditor === 'specialty' ? specialtyRules : traitRules}
                type={showRulesEditor === 'specialty' ? 'specialty' : 'trait'}
                title={showRulesEditor === 'specialty' ? 'Reglas de Especialidades' : 'Reglas de Rasgos'}
            />
        </div >
    );
}
