'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Match, AppSettings } from '@/types';
import { Send, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { triggerNotificationAction } from '@/actions/settings';
import clsx from 'clsx';

interface NotifyTelegramProps {
    match: Match;
    settings: AppSettings;
}

export function NotifyTelegram({ match, settings }: NotifyTelegramProps) {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

    const handleNotify = async () => {
        if (!settings.telegramWebhookUrl) {
            alert('Por favor, configura la URL del Webhook de Telegram en Ajustes primero.');
            return;
        }

        setStatus('loading');
        try {
            const date = parseISO(match.date);
            const formattedDate = format(date, "EEEE d 'de' MMMM", { locale: es });

            const payload = {
                type: 'MATCH_NOTIFICATION_TELEGRAM',
                matchId: match.id,
                date: formattedDate,
                location: match.location || 'Sin ubicación',
                mode: match.mode,
                groupName: settings.telegramGroupName || '',
                message: `⚽ ¡Nueva convocatoria! \n🏟️ Lugar: ${match.location || 'Sin ubicación'}\n📅 Fecha: ${formattedDate}\n🏆 Modo: ${match.mode}\n\n¡Confirma tu asistencia en la web! 🚀\n\nResponde con números:\n1) Voy 👍\n2) No asisto, lo siento 👎`
            };

            const result = await triggerNotificationAction(settings.telegramWebhookUrl, payload);

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
            console.error('Error triggering n8n Telegram:', error);
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
                status === 'success' && "border-sky-500 text-sky-500 bg-sky-500/5",
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
                <Send size={18} className="text-sky-500" />
            )}
            {status === 'loading' ? 'Enviando...' : status === 'success' ? 'Notificado!' : status === 'error' ? 'Error' : 'Notificar Telegram'}
        </Button>
    );
}
