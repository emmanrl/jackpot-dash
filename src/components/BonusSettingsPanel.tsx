import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const BonusSettingsPanel = () => {
  const [loading, setLoading] = useState(false);
  const [bonusSettings, setBonusSettings] = useState<any[]>([]);
  const [newBonus, setNewBonus] = useState({
    bonus_type: '',
    is_active: false,
    percentage: '',
    fixed_amount: '',
    description: '',
  });

  useEffect(() => {
    fetchBonusSettings();
  }, []);

  const fetchBonusSettings = async () => {
    const { data } = await supabase.from('bonus_settings' as any).select('*');
    setBonusSettings(data || []);
  };

  const createSignupBonus = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.from('bonus_settings' as any).insert({
        bonus_type: 'signup',
        is_active: newBonus.is_active,
        fixed_amount: 50,
        description: 'New user signup bonus - ₦50'
      });
      if (error) throw error;
      toast.success('Signup bonus created');
      fetchBonusSettings();
      setNewBonus({ bonus_type: '', is_active: false, percentage: '', fixed_amount: '', description: '' });
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const createDepositBonus = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.from('bonus_settings' as any).insert({
        bonus_type: 'first_deposit',
        is_active: newBonus.is_active,
        percentage: 5,
        description: 'First deposit bonus - 5%'
      });
      if (error) throw error;
      toast.success('Deposit bonus created');
      fetchBonusSettings();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleBonus = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase.from('bonus_settings' as any).update({ is_active: !isActive }).eq('id', id);
      if (error) throw error;
      toast.success('Bonus updated');
      fetchBonusSettings();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bonus Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={createSignupBonus} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create ₦50 Signup Bonus'}
          </Button>
          <Button onClick={createDepositBonus} disabled={loading} variant="outline">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create 5% First Deposit Bonus'}
          </Button>
        </div>

        <div className="space-y-2">
          {bonusSettings.map((bonus) => (
            <div key={bonus.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">{bonus.description}</p>
                <p className="text-sm text-muted-foreground">{bonus.bonus_type}</p>
              </div>
              <Switch checked={bonus.is_active} onCheckedChange={() => toggleBonus(bonus.id, bonus.is_active)} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
