import { Badge } from '@/components/ui/Badge';
import { Tooltip } from '@/components/ui/Tooltip';
import { CustomRule } from '@/types';

interface SpecialtiesGuideProps {
    specialtyRules: CustomRule[];
}

const CATEGORIES = {
    stats: { label: 'Desempeño', color: 'text-sky-400' },
    team: { label: 'Afinidad de Equipo', color: 'text-indigo-400' },
    high: { label: 'Elite & Habilidades', color: 'text-amber-400' },
    playstyle: { label: 'Estilo de Juego', color: 'text-emerald-400' },
    low: { label: 'Especialidades Especiales', color: 'text-rose-400' },
};

export function SpecialtiesGuide({ specialtyRules }: SpecialtiesGuideProps) {
    const rulesByCategory = (catKey: string) => specialtyRules.filter(r => (r.category || 'playstyle') === catKey);

    return (
        <div className="space-y-8">
            <p className="text-slate-400 text-sm leading-relaxed">
                Las especialidades se asignan automáticamente basándose en las estadísticas de partidos y las habilidades actuales del jugador.
            </p>

            {(Object.keys(CATEGORIES) as Array<keyof typeof CATEGORIES>).map(catKey => {
                const category = CATEGORIES[catKey];
                const items = rulesByCategory(catKey);

                if (items.length === 0) return null;

                return (
                    <div key={catKey} className="space-y-3">
                        <h4 className={`text-sm font-bold uppercase tracking-wider ${category.color}`}>
                            {category.label}
                        </h4>
                        <div className="grid grid-cols-1 gap-2">
                            {items.map(item => (
                                <div
                                    key={item.id}
                                    className="flex items-center justify-between p-3 rounded-lg bg-slate-950/50 border border-slate-800/50 group hover:border-slate-700 transition-colors"
                                >
                                    <span className="text-white font-medium">{item.name}</span>
                                    <span className="text-xs text-slate-500 group-hover:text-slate-400 transition-colors">
                                        {item.description || item.conditions.map(c => `${c.skill} ${c.operator} ${c.value}`).join(', ')}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
