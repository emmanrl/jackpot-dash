import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useDarkMode = () => {
  const [isDark, setIsDark] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
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

  return { isDark, loading };
};
