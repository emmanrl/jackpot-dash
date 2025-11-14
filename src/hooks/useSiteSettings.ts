import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SiteSettings {
  site_name: string;
  site_logo_url: string | null;
  contact_email: string | null;
  support_email: string | null;
  contact_phone: string | null;
  terms_of_service: string | null;
  privacy_policy: string | null;
}

const defaultSettings: SiteSettings = {
  site_name: 'JackpotWin',
  site_logo_url: null,
  contact_email: null,
  support_email: null,
  contact_phone: null,
  terms_of_service: null,
  privacy_policy: null,
};

export const useSiteSettings = () => {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .limit(1)
        .single();

      if (!error && data) {
        setSettings(data as SiteSettings);
      }
    } catch (err) {
      console.error('Error fetching site settings:', err);
    } finally {
      setLoading(false);
    }
  };

  return { settings, loading, refresh: fetchSettings };
};
