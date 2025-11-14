import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Trophy } from 'lucide-react';

const achievementTitles: Record<string, string> = {
  tickets_10: '🎟️ Ticket Starter',
  tickets_50: '🎫 Ticket Enthusiast',
  tickets_100: '🎪 Ticket Master',
  first_win: '🏆 First Victory',
  wins_5: '✨ Lucky Streak',
  xp_100: '⭐ Rising Star',
  xp_500: '⚡ Experience Master',
};

export const useAchievementNotifications = (userId: string | undefined) => {
  useEffect(() => {
    if (!userId) return;

    // Subscribe to new achievements
    const subscription = supabase
      .channel('achievement-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'achievements',
          filter: `user_id=eq.${userId}`,
        },
        (payload: any) => {
          const achievement = payload.new;
          const title = achievementTitles[achievement.achievement_type] || '🎉 Achievement Unlocked!';
          
          toast.success(title, {
            description: 'Check your profile to see your new badge!',
            duration: 6000,
          });
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId]);
};
