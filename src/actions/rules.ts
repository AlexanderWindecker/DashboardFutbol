'use server';

import { deleteRule, saveSpecialtyRule, saveTraitRule } from '@/lib/data';
import { CustomRule } from '@/types';
import { revalidatePath } from 'next/cache';

export async function saveSpecialtyRuleAction(rule: CustomRule) {
    await saveSpecialtyRule(rule);
    revalidatePath('/players');
    // Ideally we revalidate all player pages if they are static, 
    // but usually /players used in client components will catch up.
}

export async function saveTraitRuleAction(rule: CustomRule) {
    await saveTraitRule(rule);
    revalidatePath('/players');
}

export async function deleteRuleAction(id: string, type: 'specialty' | 'trait') {
    await deleteRule(id, type);
    revalidatePath('/players');
}
