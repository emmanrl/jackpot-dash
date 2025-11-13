import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";
import TopNav from "@/components/TopNav";

interface SiteSettings {
  id: string;
  site_name: string;
  site_logo_url: string | null;
  terms_of_service: string | null;
  privacy_policy: string | null;
  faq: any;
  contact_email: string | null;
  contact_phone: string | null;
  support_email: string | null;
}

const SiteSettings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    checkAdminAndFetchSettings();
  }, []);

  const checkAdminAndFetchSettings = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);

      const isAdmin = roles?.some(r => r.role === "admin");
      if (!isAdmin) {
        navigate("/");
        return;
      }

      // Fetch site settings
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings(data as SiteSettings);
      } else {
        setSettings({
          id: '',
          site_name: 'Jackpot Platform',
          site_logo_url: null,
          terms_of_service: null,
          privacy_policy: null,
          faq: [],
          contact_email: null,
          contact_phone: null,
          support_email: null
        });
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error("Please select an image file");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB");
        return;
      }
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");

      let logoUrl = settings.site_logo_url;

      // Upload logo if a new one was selected
      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop();
        const fileName = `site-logo-${Date.now()}.${fileExt}`;
        const { error: uploadError, data } = await supabase.storage
          .from('avatars')
          .upload(fileName, logoFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);

        logoUrl = publicUrl;
      }

      // Update or insert settings
      const { error } = await supabase
        .from('site_settings')
        .upsert({
          id: settings.id || undefined,
          site_name: settings.site_name,
          site_logo_url: logoUrl,
          terms_of_service: settings.terms_of_service,
          privacy_policy: settings.privacy_policy,
          faq: settings.faq,
          contact_email: settings.contact_email,
          contact_phone: settings.contact_phone,
          support_email: settings.support_email,
        });

      if (error) throw error;

      toast.success("Settings saved successfully");
      setLogoFile(null);
      setLogoPreview(null);
      checkAdminAndFetchSettings();
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <TopNav />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="min-h-screen">
      <TopNav />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Site Settings</h1>
          <p className="text-muted-foreground">Manage your site configuration</p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="p-6 space-y-6">
            <div>
              <Label htmlFor="site_name">Site Name</Label>
              <Input
                id="site_name"
                value={settings.site_name}
                onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="logo">Site Logo</Label>
              {(logoPreview || settings.site_logo_url) && (
                <div className="mb-2">
                  <img
                    src={logoPreview || settings.site_logo_url || ''}
                    alt="Site logo preview"
                    className="h-16 w-auto object-contain border rounded p-2"
                  />
                </div>
              )}
              <div className="flex items-center gap-2">
                <Input
                  id="logo"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('logo')?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Logo
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="contact_email">Contact Email</Label>
              <Input
                id="contact_email"
                type="email"
                value={settings.contact_email || ''}
                onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="contact_phone">Contact Phone</Label>
              <Input
                id="contact_phone"
                type="tel"
                value={settings.contact_phone || ''}
                onChange={(e) => setSettings({ ...settings, contact_phone: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="support_email">Support Email</Label>
              <Input
                id="support_email"
                type="email"
                value={settings.support_email || ''}
                onChange={(e) => setSettings({ ...settings, support_email: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="terms_of_service">Terms of Service</Label>
              <Textarea
                id="terms_of_service"
                value={settings.terms_of_service || ''}
                onChange={(e) => setSettings({ ...settings, terms_of_service: e.target.value })}
                rows={6}
                placeholder="Enter terms of service..."
              />
            </div>

            <div>
              <Label htmlFor="privacy_policy">Privacy Policy</Label>
              <Textarea
                id="privacy_policy"
                value={settings.privacy_policy || ''}
                onChange={(e) => setSettings({ ...settings, privacy_policy: e.target.value })}
                rows={6}
                placeholder="Enter privacy policy..."
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => navigate("/admin")}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Settings
              </Button>
            </div>
          </Card>
        </form>
      </div>
    </div>
  );
};

export default SiteSettings;
