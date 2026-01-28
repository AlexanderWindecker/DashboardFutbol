import { cn } from '@/lib/utils';
import { Team, ParticipationStatus, MatchResult } from '@/types';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    children: React.ReactNode;
    variant?: 'default' | 'outline' | 'success' | 'warning' | 'error' | Team | ParticipationStatus | MatchResult;
    className?: string;
}

export function Badge({ children, variant = 'default', className, ...props }: BadgeProps) {
    const getStyle = (v: string) => {
        switch (v) {
            case 'Celeste': return 'bg-sky-500/10 text-sky-400 border-sky-500/20 shadow-[0_0_10px_-4px_rgba(14,165,233,0.5)]';
            case 'Azul': return 'bg-blue-600/10 text-blue-400 border-blue-600/20 shadow-[0_0_10px_-4px_rgba(37,99,235,0.5)]';
            case 'Empate': return 'bg-slate-500/10 text-slate-400 border-slate-500/20';

            case 'Confirmed': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            case 'Declined': return 'bg-red-500/10 text-red-500 border-red-500/20';
            case 'Attended': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
            case 'LateCancel': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
            case 'Absent': return 'bg-red-500/10 text-red-400 border-red-500/20';

            case 'success': return 'bg-emerald-500/10 text-emerald-400';
            case 'warning': return 'bg-amber-500/10 text-amber-400';
            case 'error': return 'bg-red-500/10 text-red-400';
            case 'outline': return 'border border-slate-700 text-slate-400';
            case 'default':
            default: return 'bg-slate-700 text-slate-200';
        }
    };

    return (
        <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-medium border border-transparent', getStyle(variant || 'default'), className)} {...props}>
            {children}
        </span>
    );
}
