import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type ThemeType = 'default' | 'neon' | 'silver' | 'bronze' | 'gold' | 'wood';

interface ThemeConfig {
  name: string;
  minXP: number;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

export const themes: Record<ThemeType, ThemeConfig> = {
  default: {
    name: 'Default',
    minXP: 0,
    colors: {
      primary: 'hsl(var(--primary))',
      secondary: 'hsl(var(--secondary))',
      accent: 'hsl(var(--accent))',
    },
  },
  wood: {
    name: 'Wood',
    minXP: 10,
    colors: {
      primary: '25 60% 45%',
      secondary: '30 40% 60%',
      accent: '35 55% 50%',
    },
  },
  bronze: {
    name: 'Bronze',
    minXP: 50,
    colors: {
      primary: '30 70% 50%',
      secondary: '25 60% 45%',
      accent: '35 75% 55%',
    },
  },
  silver: {
    name: 'Silver',
    minXP: 150,
    colors: {
      primary: '240 5% 65%',
      secondary: '240 5% 75%',
      accent: '240 5% 85%',
    },
  },
  gold: {
    name: 'Gold',
    minXP: 300,
    colors: {
      primary: '45 100% 51%',
      secondary: '48 95% 58%',
      accent: '43 100% 65%',
    },
  },
  neon: {
    name: 'Neon',
    minXP: 500,
    colors: {
      primary: '280 100% 50%',
      secondary: '320 100% 50%',
      accent: '180 100% 50%',
    },
  },
};

export const getThemeFromXP = (xp: number): ThemeType => {
  if (xp >= 500) return 'neon';
  if (xp >= 300) return 'gold';
  if (xp >= 150) return 'silver';
  if (xp >= 50) return 'bronze';
  if (xp >= 10) return 'wood';
  return 'default';
};

export const useTheme = (userId: string | undefined) => {
  const [currentTheme, setCurrentTheme] = useState<ThemeType>('default');
  const [xp, setXP] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      setCurrentTheme('default');
      applyTheme('default');
      return;
    }

    const fetchUserTheme = async () => {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('experience_points, theme')
          .eq('id', userId)
          .single();

        if (profile) {
          const xpValue = (profile as any).experience_points || 0;
          const themeValue = (profile as any).theme;
          
          // Use user-selected theme if available, otherwise keep default for new users
          const finalTheme = themeValue || 'default';
          
          setXP(xpValue);
          setCurrentTheme(finalTheme as ThemeType);
          applyTheme(finalTheme as ThemeType);
        } else {
          // New user - use default theme
          setCurrentTheme('default');
          applyTheme('default');
        }
      } catch (error) {
        console.error('Error fetching theme:', error);
        setCurrentTheme('default');
        applyTheme('default');
      } finally {
        setLoading(false);
      }
    };

    fetchUserTheme();

    // Subscribe to profile changes for realtime XP updates
    const subscription = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`,
        },
      (payload: any) => {
        // Check for theme changes first (manual selection takes priority)
        if (payload.new.theme !== undefined && payload.new.theme !== payload.old.theme) {
          setCurrentTheme(payload.new.theme);
          applyTheme(payload.new.theme);
        }
        
        // Update XP
        if (payload.new.experience_points !== undefined) {
          setXP(payload.new.experience_points);
        }
      }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId]);

  const applyTheme = (theme: ThemeType) => {
    const root = document.documentElement;
    const config = themes[theme];
    
    // Don't override CSS variables for default theme - let index.css handle it
    if (theme === 'default') {
      root.style.removeProperty('--primary');
      root.style.removeProperty('--secondary');
      root.style.removeProperty('--accent');
      return;
    }
    
    // For custom themes, apply colors but respect light/dark mode context
    root.style.setProperty('--primary', config.colors.primary);
    root.style.setProperty('--secondary', config.colors.secondary);
    root.style.setProperty('--accent', config.colors.accent);
  };

  const updateTheme = async (theme: ThemeType) => {
    if (!userId) return;

    try {
      await supabase
        .from('profiles')
        .update({ theme } as any)
        .eq('id', userId);

      setCurrentTheme(theme);
      applyTheme(theme);
    } catch (error) {
      console.error('Error updating theme:', error);
    }
  };

  const unlockedThemes = Object.entries(themes)
    .filter(([_, config]) => xp >= config.minXP)
    .map(([key]) => key as ThemeType);

  return {
    currentTheme,
    xp,
    loading,
    updateTheme,
    unlockedThemes,
    themes,
  };
};
