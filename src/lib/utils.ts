import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

import { PlayerStats, Match } from '@/types';

export function calculateMatchScore(participations: PlayerStats[], match?: Match) {
    if (match && match.scoreCeleste !== undefined && match.scoreAzul !== undefined) {
        return { celeste: match.scoreCeleste, azul: match.scoreAzul };
    }

    let celesteGoals = 0;
    let azulGoals = 0;

    participations.forEach(p => {
        if (p.team === 'Celeste') {
            celesteGoals += (p.goals || 0);
            azulGoals += (p.ownGoals || 0); // Own goals by Celeste count for Azul
        } else if (p.team === 'Azul') {
            azulGoals += (p.goals || 0);
            celesteGoals += (p.ownGoals || 0); // Own goals by Azul count for Celeste
        }
    });

    return { celeste: celesteGoals, azul: azulGoals };
}
