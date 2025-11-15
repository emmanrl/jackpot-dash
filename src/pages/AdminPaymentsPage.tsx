import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AdminNav } from "@/components/AdminNav";
import AdminPayments from "./AdminPayments";

export default function AdminPaymentsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [paymentSettings, setPaymentSettings] = useState<any[]>([]);

  useEffect(() => {
    checkAdminAndFetchData();
  }, []);

  const checkAdminAndFetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();

      if (!roleData) {
        toast.error('Unauthorized access');
        navigate('/dashboard');
        return;
      }

      await fetchPaymentSettings();
    } catch (error) {
      console.error('Error checking admin status:', error);
      toast.error('Failed to verify admin status');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentSettings = async () => {
    const { data, error } = await supabase
      .from('payment_settings')
      .select('*')
      .order('provider');
    
    if (!error && data) {
      setPaymentSettings(data);
    }
  };

  const updatePaymentSetting = async (id: string, updates: any) => {
    const { error } = await supabase
      .from('payment_settings')
      .update(updates)
      .eq('id', id);

    if (error) {
      throw error;
    }

    await fetchPaymentSettings();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminNav />
      <main className="container mx-auto px-4 py-8">
        <AdminPayments 
          paymentSettings={paymentSettings}
          onUpdate={updatePaymentSetting}
        />
      </main>
    </div>
  );
}
