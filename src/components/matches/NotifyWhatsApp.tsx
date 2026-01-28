'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Match, AppSettings } from '@/types';
import { MessageSquare, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

import { triggerNotificationAction } from '@/actions/settings';

interface NotifyWhatsAppProps {
    match: Match;
    settings: AppSettings;
}

export function NotifyWhatsApp({ match, settings }: NotifyWhatsAppProps) {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

    const handleNotify = async () => {
        if (!settings.n8nWebhookUrl) {
            alert('Por favor, configura la URL del Webhook en Ajustes primero.');
            return;
        }

        setStatus('loading');
        try {
            const date = parseISO(match.date);
            const formattedDate = format(date, "EEEE d 'de' MMMM", { locale: es });

            const payload = {
                type: 'MATCH_NOTIFICATION',
                matchId: match.id,
                date: formattedDate,
                location: match.location || 'Sin ubicación',
                mode: match.mode,
                groupName: settings.whatsappGroupName || '',
                message: `⚽ ¡Nueva convocatoria! \n🏟️ Lugar: ${match.location || 'Sin ubicación'}\n📅 Fecha: ${formattedDate}\n🏆 Modo: ${match.mode}\n\n¡Confirma tu asistencia en la web! 🚀\n\nRespuesta con numeros\n1) Voy👍\n2) No asisto, lo siento 👎`
            };

            const result = await triggerNotificationAction(settings.n8nWebhookUrl, payload);

            if (result.success) {
                setStatus('success');
                setTimeout(() => setStatus('idle'), 3000);
            } else {
                const errorMsg = result.status ? `Error: ${result.status}` : result.error || 'Failed to send';
                console.error('Notification failed:', result);
                alert(`No se pudo enviar la notificación. ${errorMsg}`);
                throw new Error(errorMsg);
            }
        } catch (error) {
            console.error('Error triggering n8n:', error);
            setStatus('error');
            setTimeout(() => setStatus('idle'), 3000);
        }
    };

    return (
        <Button
            onClick={handleNotify}
            disabled={status === 'loading'}
            variant="outline"
            className={clsx(
                "gap-2 transition-all duration-300",
                status === 'success' && "border-emerald-500 text-emerald-500 bg-emerald-500/5",
                status === 'error' && "border-rose-500 text-rose-500 bg-rose-500/5"
            )}
        >
            {status === 'loading' ? (
                <Loader2 className="animate-spin" size={18} />
            ) : status === 'success' ? (
                <CheckCircle2 size={18} />
            ) : status === 'error' ? (
                <AlertCircle size={18} />
            ) : (
                <MessageSquare size={18} className="text-emerald-500" />
            )}
            {status === 'loading' ? 'Enviando...' : status === 'success' ? 'Notificado!' : status === 'error' ? 'Error' : 'Notificar WhatsApp'}
        </Button>
    );
}

// Client components need to import clsx if used
import clsx from 'clsx';
