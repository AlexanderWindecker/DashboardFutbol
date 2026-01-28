import { Player, CustomRule, SkillKey, RuleOperator } from '@/types';

export function evaluateRule(player: Player, rule: CustomRule, stats?: any): boolean {
    if (!rule.conditions || rule.conditions.length === 0) return false;
    if (!player.skills && rule.conditions.some(c => !['matchesAttended', 'mvpCount'].includes(c.skill))) return false;

    const skills = player.skills || { ritmo: 0, tiros: 0, regates: 0, velocidad: 0, pases: 0 };
    const average = Math.round(
        (skills.ritmo + skills.tiros + skills.regates + skills.velocidad + skills.pases) / 5
    );

    return rule.conditions.every(condition => {
        let skillValue: number;

        if (condition.skill === 'average') {
            skillValue = average;
        } else if (condition.skill === 'matchesAttended' || condition.skill === 'mvpCount') {
            skillValue = stats ? stats[condition.skill] : 0;
        } else {
            skillValue = skills[condition.skill as keyof typeof skills] || 0;
        }

        switch (condition.operator) {
            case '>': return skillValue > condition.value;
            case '>=': return skillValue >= condition.value;
            case '<': return skillValue < condition.value;
            case '<=': return skillValue <= condition.value;
            case '==': return skillValue === condition.value;
            default: return false;
        }
    });
}

export function getPlayerSpecialties(player: Player, rules: CustomRule[], stats?: any): string[] {
    return rules
        .filter(rule => rule.type === 'specialty' && evaluateRule(player, rule, stats))
        .map(rule => rule.name);
}

export function getPlayerTraits(player: Player, rules: CustomRule[], stats?: any): string[] {
    // Merge manual traits with rule-based traits if needed, 
    // but for now let's just return the ones from rules that match.
    return rules
        .filter(rule => rule.type === 'trait' && evaluateRule(player, rule, stats))
        .map(rule => rule.name);
}
