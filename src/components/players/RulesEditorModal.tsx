'use client';

import { useState } from 'react';
import { CustomRule, RuleCondition, SkillKey, RuleOperator } from '@/types';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Plus, Trash2, X, Save, AlertCircle } from 'lucide-react';
import { saveSpecialtyRuleAction, saveTraitRuleAction, deleteRuleAction } from '@/actions/rules';
import { cn } from '@/lib/utils';

interface RulesEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    rules: CustomRule[];
    type: 'specialty' | 'trait';
    title: string;
}

export const SKILLS: { key: SkillKey; label: string }[] = [
    { key: 'ritmo', label: 'Ritmo' },
    { key: 'tiros', label: 'Tiros' },
    { key: 'regates', label: 'Regates' },
    { key: 'velocidad', label: 'Velocidad' },
    { key: 'pases', label: 'Pases' },
    { key: 'average', label: 'Promedio General' },
    { key: 'matchesAttended', label: 'Partidos Jugados' },
    { key: 'mvpCount', label: 'MVPs Ganados' },
];

const OPERATORS: { key: RuleOperator; label: string }[] = [
    { key: '>', label: '>' },
    { key: '>=', label: '≥' },
    { key: '<', label: '<' },
    { key: '<=', label: '≤' },
    { key: '==', label: '==' },
];

export function RulesEditorModal({ isOpen, onClose, rules, type, title }: RulesEditorModalProps) {
    const [isAdding, setIsAdding] = useState(false);
    const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
    const [newRule, setNewRule] = useState<Partial<CustomRule>>({
        name: '',
        conditions: [{ skill: 'pases', operator: '>=', value: 80 }],
        type: type,
        category: 'playstyle'
    });

    const resetNewRule = () => {
        setNewRule({
            name: '',
            conditions: [{ skill: 'pases', operator: '>=', value: 80 }],
            type: type,
            category: 'playstyle'
        });
        setIsAdding(false);
        setEditingRuleId(null);
    };

    const handleAddCondition = () => {
        setNewRule(prev => ({
            ...prev,
            conditions: [...(prev.conditions || []), { skill: 'pases', operator: '>=', value: 80 }]
        }));
    };

    const handleRemoveCondition = (index: number) => {
        setNewRule(prev => ({
            ...prev,
            conditions: (prev.conditions || []).filter((_, i) => i !== index)
        }));
    };

    const handleSave = async () => {
        if (!newRule.name || !newRule.conditions?.length) return;

        const ruleToSave: CustomRule = {
            id: editingRuleId || crypto.randomUUID(),
            name: newRule.name,
            conditions: newRule.conditions as RuleCondition[],
            type: type,
            category: newRule.category as any,
            description: newRule.description
        };

        if (type === 'specialty') {
            await saveSpecialtyRuleAction(ruleToSave);
        } else {
            await saveTraitRuleAction(ruleToSave);
        }

        resetNewRule();
    };

    const handleDelete = async (id: string) => {
        if (confirm('¿Estás seguro de que quieres eliminar esta regla?')) {
            await deleteRuleAction(id, type);
        }
    };

    const handleEdit = (rule: CustomRule) => {
        setNewRule(rule);
        setEditingRuleId(rule.id);
        setIsAdding(true);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
                {!isAdding ? (
                    <div className="space-y-4">
                        <Button onClick={() => setIsAdding(true)} className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700">
                            <Plus size={18} /> Nueva Regla
                        </Button>
                        <div className="grid gap-3">
                            {rules.map(rule => (
                                <div key={rule.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between group">
                                    <div>
                                        <h4 className="font-bold text-white mb-1">{rule.name}</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {rule.conditions.length > 0 ? (
                                                rule.conditions.map((c, i) => (
                                                    <span key={i} className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                                                        {SKILLS.find(s => s.key === c.skill)?.label} {c.operator} {c.value}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-xs text-slate-500 italic">Sin condiciones de habilidad</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="sm" onClick={() => handleEdit(rule)} className="h-8 w-8 p-0">
                                            <Plus size={16} className="rotate-45" /> {/* Use rotate-45 for edit or a different icon if available */}
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => handleDelete(rule.id)} className="h-8 w-8 p-0 text-red-400 hover:text-red-300">
                                            <Trash2 size={16} />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4 bg-slate-900 border border-slate-800 p-6 rounded-xl animate-in fade-in slide-in-from-top-2">
                        <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Nombre de la Habilidad</label>
                            <input
                                type="text"
                                value={newRule.name}
                                onChange={e => setNewRule({ ...newRule, name: e.target.value })}
                                placeholder="Ej: Francotirador, Muro, etc."
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="block text-xs font-semibold text-slate-400 uppercase">Reglas y Parámetros</label>
                            {newRule.conditions?.map((condition, index) => (
                                <div key={index} className="flex gap-2 items-center">
                                    <select
                                        value={condition.skill}
                                        onChange={e => {
                                            const conditions = [...(newRule.conditions || [])];
                                            conditions[index].skill = e.target.value as SkillKey;
                                            setNewRule({ ...newRule, conditions });
                                        }}
                                        className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2 py-2 text-white text-sm"
                                    >
                                        {SKILLS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                                    </select>
                                    <select
                                        value={condition.operator}
                                        onChange={e => {
                                            const conditions = [...(newRule.conditions || [])];
                                            conditions[index].operator = e.target.value as RuleOperator;
                                            setNewRule({ ...newRule, conditions });
                                        }}
                                        className="w-20 bg-slate-950 border border-slate-700 rounded-lg px-2 py-2 text-white text-sm"
                                    >
                                        {OPERATORS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
                                    </select>
                                    <input
                                        type="number"
                                        value={condition.value}
                                        onChange={e => {
                                            const conditions = [...(newRule.conditions || [])];
                                            conditions[index].value = parseInt(e.target.value);
                                            setNewRule({ ...newRule, conditions });
                                        }}
                                        className="w-20 bg-slate-950 border border-slate-700 rounded-lg px-2 py-2 text-white text-sm"
                                    />
                                    {index > 0 && (
                                        <button onClick={() => handleRemoveCondition(index)} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg">
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            ))}
                            <Button variant="ghost" size="sm" onClick={handleAddCondition} className="text-indigo-400 hover:text-indigo-300 font-medium py-1 h-auto">
                                <Plus size={14} className="mr-1" /> Agregar otra condición
                            </Button>
                        </div>

                        {type === 'specialty' && (
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Categoría</label>
                                <select
                                    value={newRule.category}
                                    onChange={e => setNewRule({ ...newRule, category: e.target.value as any })}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white"
                                >
                                    <option value="high">Elite & Habilidades</option>
                                    <option value="playstyle">Estilo de Juego</option>
                                    <option value="low">Inferior / Divertida</option>
                                </select>
                            </div>
                        )}

                        <div className="flex gap-3 pt-4 border-t border-slate-800">
                            <Button onClick={handleSave} className="flex-1 bg-emerald-600 hover:bg-emerald-700 gap-2">
                                <Save size={18} /> {editingRuleId ? 'Actualizar' : 'Crear Regla'}
                            </Button>
                            <Button variant="ghost" onClick={resetNewRule} className="text-slate-400">
                                Cancelar
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
}
