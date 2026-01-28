'use client';

import { useState } from 'react';
import { Player, PlayerStats } from '@/types';
import { addPlayerToMatchAction } from '@/actions/matches';
import { Button } from '@/components/ui/Button';
import { Plus, UserPlus, Search } from 'lucide-react';
import { createPlayerAction } from '@/actions/players'; // Need this action

export function AddPlayerToMatch({ matchId, availablePlayers, currentParticipations }: {
    matchId: string;
    availablePlayers: Player[];
    currentParticipations: PlayerStats[];
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const participatingIds = new Set(currentParticipations.map(p => p.playerId));
    const nonParticipatingPlayers = availablePlayers.filter(p => !participatingIds.has(p.id) && (p.isActive ?? true));

    const filteredPlayers = nonParticipatingPlayers.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    async function handleAddExisting(playerId: string) {
        await addPlayerToMatchAction(matchId, playerId);
        setIsOpen(false);
        setSearchQuery('');
    }

    async function handleCreateNew(formData: FormData) {
        const name = formData.get('name') as string;
        if (name) {
            // Logic handled by createPlayerAction
        }
    }

    return (
        <div className="relative">
            <Button size="sm" onClick={() => setIsOpen(!isOpen)}>
                <UserPlus size={16} className="mr-2" />
                Agregar Jugador
            </Button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-slate-900 border border-slate-800 rounded-xl shadow-xl z-50 p-4">
                    <h3 className="text-sm font-medium text-white mb-3">Jugadores Disponibles</h3>

                    {/* Search Bar */}
                    <div className="relative mb-3">
                        <input
                            type="text"
                            placeholder="Buscar jugador..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full text-xs bg-slate-950 border border-slate-800 rounded-lg px-8 py-2 text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                            autoFocus
                        />
                        <div className="absolute left-2.5 top-2.5 text-slate-500">
                            <Search size={14} />
                        </div>
                    </div>

                    <div className="max-h-48 overflow-y-auto space-y-1 mb-4 custom-scrollbar">
                        {filteredPlayers.map(p => (
                            <button
                                key={p.id}
                                onClick={() => handleAddExisting(p.id)}
                                className="w-full text-left px-2 py-1.5 hover:bg-slate-800 rounded text-sm text-slate-300 hover:text-white transition-colors"
                            >
                                {p.name}
                            </button>
                        ))}
                        {filteredPlayers.length === 0 && (
                            <p className="text-xs text-slate-500 p-2 text-center">
                                {searchQuery ? 'No se encontraron resultados' : 'Todos los jugadores están agregados.'}
                            </p>
                        )}
                    </div>

                    <div className="border-t border-slate-800 pt-3">
                        <form action={createPlayerAction} className="flex gap-2">
                            <input
                                type="hidden"
                                name="matchId"
                                value={matchId}
                            />
                            <input
                                name="name"
                                placeholder="Nuevo jug..."
                                className="flex-1 text-xs bg-slate-950 border border-slate-800 rounded px-2"
                                required
                            />
                            <Button type="submit" size="sm" variant="secondary" className="px-2">
                                <Plus size={14} />
                            </Button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
