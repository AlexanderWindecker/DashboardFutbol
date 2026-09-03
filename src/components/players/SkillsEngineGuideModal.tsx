'use client';

import { Modal } from '@/components/ui/Modal';
import { HelpCircle } from 'lucide-react';
import { useState } from 'react';

export function SkillsEngineGuideModal() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="p-1.5 rounded-full bg-slate-800 text-sky-400 hover:bg-slate-700 transition flex items-center justify-center shrink-0"
                title="Ver Reglas del Motor RPG"
            >
                <HelpCircle size={16} />
            </button>

            <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="⚽ REGLAS: Motor de Evolución (RPG)">
                <div className="space-y-4 text-sm text-slate-300">
                    <p>
                        Tu plantilla evoluciona como si fuera el **Modo Carrera**. Cada partido jugado recalcula de forma automática las habilidades ocultas de los jugadores basándose en su rendimiento estadístico real:
                    </p>

                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                        <h4 className="font-bold text-emerald-400">📈 Subidas (Positivas)</h4>
                        <ul className="list-disc pl-5 space-y-1">
                            <li><strong>Asistencia al Partido:</strong> <span className="text-emerald-400">+0.2 Ritmo</span>, <span className="text-emerald-400">+0.1 Pases</span>, <span className="text-emerald-400">+0.1 Regates</span>.</li>
                            <li><strong>Experiencia de Defensor:</strong> Jugar como defensor suma <span className="text-emerald-400">+0.1 Tiros</span> por partido, para mejorar gradualmente sin exigir goles.</li>
                            <li><strong>Victoria del Equipo:</strong> Jugar bien y ganar da <span className="text-emerald-400">+0.2 Pases/Regates</span> extra a todos.</li>
                            <li><strong>Goles (Dinámico):</strong> En F9 (<span className="text-emerald-400">+0.5 Tiros</span>), F7 (<span className="text-emerald-400">+0.3</span>), y F5/F6 (<span className="text-emerald-400">+0.2</span>). ¡Evita la inflación de medias en canchas chicas!</li>
                            <li><strong>Ser Goleador del partido:</strong> <span className="text-emerald-400">+1.0 Tiros</span>, y suma Ritmo/Velocidad extra.</li>
                            <li><strong>Premio MVP:</strong> Quien salga MVP se lleva ¡<span className="text-emerald-400">+0.5 en TODAS</span> las stats!</li>
                            <li><strong>Diferencia amplia de goles:</strong> Una goleada a favor de 10+ suma <span className="text-emerald-400">+0.5 Tiros</span>; una derrota por 10+ resta <span className="text-rose-500">-0.5 Tiros</span>.</li>
                        </ul>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                        <h4 className="font-bold text-amber-400">🔥 Rachas (Consecutivas)</h4>
                        <ul className="list-disc pl-5 space-y-1 text-slate-400">
                            <li><strong>3 y 5 Victorias seguidas:</strong> <span className="text-amber-400">+0.5 y +0.75 Global respectivamente</span>.</li>
                            <li><strong>3 Partidos seguidos jugados:</strong> <span className="text-amber-400">+0.5</span> Ritmo/Regate.</li>
                            <li><strong>5 Partidos seguidos jugados:</strong> <span className="text-amber-400">+0.75</span> a todas las habilidades.</li>
                            <li><strong>10 y 15 Partidos seguidos jugados:</strong> Saltos finales de <span className="text-amber-400">+1.0 y +1.5 Globales</span>.</li>
                        </ul>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                        <h4 className="font-bold text-rose-500">📉 Bajadas o Castigos</h4>
                        <ul className="list-disc pl-5 space-y-1 text-slate-400">
                            <li><strong>Derrota del Equipo:</strong> Perder el partido baja minimamente <span className="text-rose-500">-0.1 en todo</span>, afectando la moral.</li>
                            <li><strong>Sequía Goleadora (Pólvora Mojada):</strong> Acumular 3 partidos seguidos jugados sin meter ningún gol resta <span className="text-rose-500">-0.5 en Tiros</span> a jugadores de campo; los arqueros no reciben esta penalización.</li>
                            <li><strong>Inactividad / No convocado:</strong> Quien no figure en el partido sufre <span className="text-rose-500">-0.2 en todo</span> por pérdida de rodaje.</li>
                            <li><strong>Avisar Ausencia (Declined):</strong> Cancelar con buen aviso resta apenas <span className="text-rose-500">-0.1 en todo</span>.</li>
                            <li><strong>Falta sin aviso / Cancelar Tarde:</strong> Castigo severo de <span className="text-rose-500">-0.5 en TODAS</span> las habilidades y quiebra las rachas.</li>
                            <li><strong>Lesión (Injured):</strong> Baja fortísima de <span className="text-rose-500">-1.0 en todo</span>.</li>
                            <li><strong>Vacaciones:</strong> Reduce <span className="text-rose-500">-0.5 Ritmo/Velocidad</span>, sin castigar las demás habilidades.</li>
                        </ul>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                        <h4 className="font-bold text-cyan-400">🧤 Arqueros (Reglas Especiales)</h4>
                        <p className="text-xs text-slate-400">Estas reglas se aplican cuando el jugador figura como <strong>Arquero</strong> en el partido; si tiene Arquero como segunda posición pero juega de campo, se usan las reglas de su rol de ese partido.</p>
                        <ul className="list-disc pl-5 space-y-1 text-slate-400">
                            <li><strong>Asistencia Básica:</strong> <span className="text-emerald-400">+0.2</span> en Reflejos, Posicionamiento, Estirada y Seguridad, y <span className="text-emerald-400">+0.1</span> en Saque.</li>
                            <li><strong>Práctica de Tiros:</strong> Cada partido jugado suma <span className="text-emerald-400">+0.1 Tiros</span> al arquero, sin exigirle marcar goles.</li>
                            <li><strong>0 Goles Recibidos:</strong> <span className="text-emerald-400">+1.0 Valla Invicta</span>, con grandes bonus de stat (<span className="text-emerald-400">+1.0 Seguridad</span>, <span className="text-emerald-400">+0.8 Reflejos/Estirada</span>).</li>
                            <li><strong>1 Gol Recibido (Casi Invicta):</strong> <span className="text-emerald-400">+0.5 Valla Invicta</span>, con bonus moderados (<span className="text-emerald-400">+0.5 Seguridad</span>, <span className="text-emerald-400">+0.4 Reflejos/Estirada</span>).</li>
                            <li><strong>2 Goles Recibidos:</strong> Pequeño bonus de práctica (<span className="text-emerald-400">+0.1 Seguridad</span>).</li>
                            <li><strong>Mejor Arquero de la Fecha:</strong> Súper boost de <span className="text-emerald-400">+1.2</span> en Reflejos/Estirada y <span className="text-emerald-400">+1.0</span> en Seguridad/Posicionamiento.</li>
                            <li><strong>Victoria del Equipo:</strong> <span className="text-emerald-400">+0.3</span> en Seguridad/Posicionamiento.</li>
                            <li><strong>Goleadas recibidas (5+ goles):</strong> Castigo de <span className="text-rose-500">-0.5 Seguridad</span> y <span className="text-rose-500">-0.3 Posicionamiento</span>.</li>
                        </ul>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                        <h4 className="font-bold text-sky-400">🛡️ Tope de Habilidad (Soft-Cap 85)</h4>
                        <p className="text-slate-400">
                            Para mantener el realismo, cuando una habilidad supera los <strong>85 puntos</strong>, su crecimiento se hace un <span className="text-sky-400 font-bold">50% más lento</span>.
                        </p>
                        <p className="text-slate-500 text-xs italic">
                            Ejemplo: Si tenes 85+ en Tiros y haces un Gol (+0.5), el motor ahora solo te otorgará la mitad (+0.25).
                        </p>
                    </div>

                    <p className="text-xs italic text-slate-500 mt-4 text-center">
                        * Todos los valores se acumulan decimal a decimal y se redondean únicamente en los gráficos visuales para una lectura limpia (Ej: 53.6 = 54).
                    </p>
                </div>
            </Modal>
        </>
    );
}
