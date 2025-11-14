import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useDailyLogin = (userId: string | undefined) => {
  const [loginReward, setLoginReward] = useState<number | null>(null);
  const [streak, setStreak] = useState<number>(0);

  useEffect(() => {
    if (!userId) return;

    const recordLogin = async () => {
      try {
        // Call the record_daily_login function
        const { data, error } = await supabase.rpc('record_daily_login', {
          p_user_id: userId,
        });

        if (error) {
          console.error('Error recording daily login:', error);
          return;
        }

        // If data is 0, user already logged in today
        if (data === 0) return;

        // Fetch current streak
        const { data: loginData } = await supabase
          .from('daily_login_rewards' as any)
          .select('streak_days')
          .eq('user_id', userId)
          .order('login_date', { ascending: false })
          .limit(1)
          .single();

        const currentStreak = (loginData as any)?.streak_days || 1;
        setStreak(currentStreak);
        setLoginReward(data);

        // Show reward notification
        toast.success(
          `Daily login reward! +${data} XP`,
          {
            description: `🔥 ${currentStreak} day streak!`,
            duration: 5000,
          }
        );
      } catch (error) {
        console.error('Error in daily login:', error);
      }
    };

    recordLogin();
  }, [userId]);

  return { loginReward, streak };
};
