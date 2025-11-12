import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface WinData {
  prizeAmount: number;
  jackpotName: string;
}

export const useWinNotification = () => {
  const [winData, setWinData] = useState<WinData | null>(null);
  const [showWinModal, setShowWinModal] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Subscribe to new wins
      const channel = supabase
        .channel('win-notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'winners',
            filter: `user_id=eq.${session.user.id}`,
          },
          async (payload: any) => {
            console.log('New win detected:', payload);
            
            // Fetch jackpot details
            const { data: jackpot } = await supabase
              .from('jackpots')
              .select('name')
              .eq('id', payload.new.jackpot_id)
              .single();

            if (jackpot) {
              setWinData({
                prizeAmount: parseFloat(payload.new.prize_amount),
                jackpotName: jackpot.name,
              });
              setShowWinModal(true);
              
              // Create notification for the win
              await supabase.from('notifications').insert({
                user_id: session.user.id,
                type: 'win',
                title: '🎉 Congratulations! You Won!',
                message: `You won ₦${parseFloat(payload.new.prize_amount).toLocaleString()} in ${jackpot.name}!`,
                is_read: false,
              });
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    checkUser();
  }, []);

  return { winData, showWinModal, setShowWinModal };
};
