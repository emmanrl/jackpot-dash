import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { RefreshCw, Wallet, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface PaymentProvider {
  id: string;
  provider: string;
  is_enabled: boolean;
  is_withdrawal_enabled: boolean;
  balance?: number;
}

interface FailedWithdrawal {
  id: string;
  amount: number;
  error_message: string;
  created_at: string;
  user_email: string;
}

const AdminWithdrawalSettings = () => {
  const [providers, setProviders] = useState<PaymentProvider[]>([]);
  const [failedWithdrawals, setFailedWithdrawals] = useState<FailedWithdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch payment providers
      const { data: providersData, error: providersError } = await supabase
        .from('payment_settings')
        .select('*')
        .eq('is_withdrawal_enabled', true);

      if (providersError) throw providersError;

      // Fetch provider balances
      const providersWithBalances = await Promise.all(
        (providersData || []).map(async (provider) => {
          try {
            const { data, error } = await supabase.functions.invoke('get-provider-balance', {
              body: { provider: provider.provider }
            });
            
            if (error) throw error;
            return { ...provider, balance: data?.balance };
          } catch (error) {
            console.error(`Error fetching balance for ${provider.provider}:`, error);
            return { ...provider, balance: undefined };
          }
        })
      );

      setProviders(providersWithBalances);

      // Fetch failed withdrawals
      const { data: failedData, error: failedError } = await supabase
        .from('transactions')
        .select(`
          id,
          amount,
          error_message,
          created_at,
          profiles!inner(email)
        `)
        .eq('type', 'withdrawal')
        .eq('processing_stage', 'failed')
        .order('created_at', { ascending: false })
        .limit(10);

      if (failedError) throw failedError;

      const formattedFailures = (failedData || []).map((item: any) => ({
        id: item.id,
        amount: item.amount,
        error_message: item.error_message,
        created_at: item.created_at,
        user_email: item.profiles.email,
      }));

      setFailedWithdrawals(formattedFailures);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load withdrawal settings');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
    toast.success('Data refreshed');
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Withdrawal Settings</h2>
        <Button onClick={handleRefresh} disabled={refreshing} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Provider Balances */}
      <div className="grid gap-4 md:grid-cols-2">
        {providers.map((provider) => (
          <Card key={provider.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                {provider.provider.toUpperCase()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge variant={provider.is_enabled ? "default" : "secondary"}>
                    {provider.is_enabled ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Withdrawals</span>
                  <Badge variant={provider.is_withdrawal_enabled ? "default" : "secondary"}>
                    {provider.is_withdrawal_enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                {provider.balance !== undefined ? (
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="font-semibold">Available Balance</span>
                    <span className="text-xl font-bold">₦{provider.balance.toLocaleString()}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 pt-2 border-t text-muted-foreground">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">Balance unavailable</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Failed Withdrawals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Recent Failed Withdrawals
          </CardTitle>
        </CardHeader>
        <CardContent>
          {failedWithdrawals.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No failed withdrawals found
            </p>
          ) : (
            <div className="space-y-3">
              {failedWithdrawals.map((withdrawal) => (
                <div key={withdrawal.id} className="p-4 bg-muted/50 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">₦{withdrawal.amount.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">{withdrawal.user_email}</p>
                    </div>
                    <Badge variant="destructive">Failed</Badge>
                  </div>
                  <div className="bg-destructive/10 text-destructive text-sm p-2 rounded">
                    <p className="font-semibold">Error:</p>
                    <p>{withdrawal.error_message}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(withdrawal.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminWithdrawalSettings;
