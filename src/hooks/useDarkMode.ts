import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useDarkMode = () => {
  const [isDark, setIsDark] = useState(true);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          setUserId(user.id);
          // Fetch user's dark mode preference
          const { data: profile } = await supabase
            .from('profiles')
            .select('dark_mode')
            .eq('id', user.id)
            .single();

          if (profile) {
            const darkMode = (profile as any).dark_mode ?? true;
            setIsDark(darkMode);
            applyTheme(darkMode);
          }
        } else {
          // Check localStorage for non-authenticated users
          const savedTheme = localStorage.getItem('theme');
          const darkMode = savedTheme === 'dark' || !savedTheme;
          setIsDark(darkMode);
          applyTheme(darkMode);
        }
      } catch (error) {
        console.error('Error loading theme preference:', error);
        // Default to dark mode
        applyTheme(true);
      } finally {
        setLoading(false);
      }
    };

    loadThemePreference();
  }, []);

  const applyTheme = (dark: boolean) => {
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const toggleTheme = async () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    applyTheme(newIsDark);

    // Save to localStorage
    localStorage.setItem('theme', newIsDark ? 'dark' : 'light');

    // Save to database if user is logged in
    if (userId) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ dark_mode: newIsDark } as any)
          .eq('id', userId);

        if (error) throw error;
        toast.success(`Switched to ${newIsDark ? 'dark' : 'light'} mode`);
      } catch (error: any) {
        console.error('Failed to save theme preference:', error);
        toast.error('Theme changed but failed to save preference');
      }
    }
  };

  return { isDark, loading, toggleTheme, theme: isDark ? 'dark' : 'light' };
};
