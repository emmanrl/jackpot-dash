import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useDrawNotifications = () => {
  useEffect(() => {
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const checkUpcomingDraws = async () => {
      try {
        const { data: jackpots } = await supabase
          .from('jackpots')
          .select('*')
          .eq('status', 'active')
          .not('next_draw', 'is', null);

        if (!jackpots) return;

        const now = new Date();
        
        jackpots.forEach((jackpot) => {
          if (!jackpot.next_draw) return;
          
          const drawTime = new Date(jackpot.next_draw);
          const minutesUntilDraw = Math.floor((drawTime.getTime() - now.getTime()) / (1000 * 60));

          // Show notifications at 15, 5, and 1 minute marks
          if (minutesUntilDraw === 15 || minutesUntilDraw === 5 || minutesUntilDraw === 1) {
            const message = `${jackpot.name} draw in ${minutesUntilDraw} minute${minutesUntilDraw > 1 ? 's' : ''}!`;
            
            // Browser notification
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('🎰 Jackpot Draw Alert', {
                body: message,
                icon: '/favicon.ico',
                badge: '/favicon.ico',
                tag: `draw-${jackpot.id}-${minutesUntilDraw}`,
              });
            }

            // In-app toast
            toast.info(message, {
              duration: 5000,
              action: {
                label: 'View',
                onClick: () => window.location.href = '/',
              },
            });
          }
        });
      } catch (error) {
        console.error('Error checking upcoming draws:', error);
      }
    };

    // Check every minute
    const interval = setInterval(checkUpcomingDraws, 60000);
    checkUpcomingDraws(); // Initial check

    return () => clearInterval(interval);
  }, []);
};
