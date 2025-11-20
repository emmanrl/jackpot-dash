import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { RefreshCw, Wallet, AlertCircle, TrendingUp, TrendingDown, Activity, CheckCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";

interface PaymentProvider {
  id: string;
  provider: string;
  is_enabled: boolean;
  is_withdrawal_enabled: boolean;
  balance?: number;
  transactions?: ProviderTransaction[];
}

interface ProviderTransaction {
  id: string | number;
  reference: string;
  amount: number;
  status: string;
  type: string;
  created_at: string;
  customer_email?: string;
  account_number?: string;
  bank_name?: string;
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
      // Fetch ALL payment providers (not just withdrawal-enabled)
      const { data: providersData, error: providersError } = await supabase
        .from('payment_settings')
        .select('*')
        .in('provider', ['paystack', 'flutterwave', 'remita'])
        .order('provider', { ascending: true });

      if (providersError) throw providersError;

      // Fetch provider balances and transactions
      const providersWithData = await Promise.all(
        (providersData || []).map(async (provider) => {
          try {
            const { data, error } = await supabase.functions.invoke('get-provider-balance', {
              body: { provider: provider.provider }
            });
            
            if (error) throw error;
            return { 
              ...provider, 
              balance: data?.balance,
              transactions: data?.transactions || []
            };
          } catch (error) {
            console.error(`Error fetching data for ${provider.provider}:`, error);
            return { 
              ...provider, 
              balance: undefined,
              transactions: []
            };
          }
        })
      );

      setProviders(providersWithData);

      // Fetch failed withdrawals
      const { data: failedData, error: failedError } = await supabase
        .from('transactions')
        .select('id, amount, error_message, created_at, user_id')
        .eq('type', 'withdrawal')
        .eq('processing_stage', 'failed')
        .order('created_at', { ascending: false })
        .limit(10);

      if (failedError) throw failedError;

      // Fetch user emails separately
      const userIds = (failedData || []).map(t => t.user_id);
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, email')
        .in('id', userIds);

      const profileMap = new Map(profilesData?.map(p => [p.id, p.email]) || []);

      const formattedFailures = (failedData || []).map((item: any) => ({
        id: item.id,
        amount: item.amount,
        error_message: item.error_message,
        created_at: item.created_at,
        user_email: profileMap.get(item.user_id) || 'Unknown',
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
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Withdrawal Management</h2>
          <p className="text-muted-foreground mt-1">Monitor provider balances and transaction activity</p>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing} size="sm">
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Provider Overview Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {providers.map((provider) => {
          const deposits = provider.transactions?.filter(t => t.type === 'deposit' || t.type === 'successful') || [];
          const withdrawals = provider.transactions?.filter(t => t.type === 'withdrawal') || [];
          const totalDeposits = deposits.reduce((sum, t) => sum + t.amount, 0);
          const totalWithdrawals = withdrawals.reduce((sum, t) => sum + t.amount, 0);

          return (
            <Card key={provider.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-primary" />
                    {provider.provider.toUpperCase()}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Badge variant={provider.is_enabled ? "default" : "secondary"} className="text-xs">
                      {provider.is_enabled ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
                <CardDescription>
                  Withdrawals: {provider.is_withdrawal_enabled ? 'Enabled' : 'Disabled'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {provider.balance !== undefined ? (
                  <div className="space-y-2">
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm text-muted-foreground">Available Balance</span>
                      <span className="text-2xl font-bold">₦{provider.balance.toLocaleString()}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3 text-green-500" />
                        <div>
                          <p className="text-xs text-muted-foreground">Deposits</p>
                          <p className="text-sm font-semibold">₦{totalDeposits.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingDown className="h-3 w-3 text-orange-500" />
                        <div>
                          <p className="text-xs text-muted-foreground">Withdrawals</p>
                          <p className="text-sm font-semibold">₦{totalWithdrawals.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">Balance unavailable</span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Provider Transactions */}
      <Tabs defaultValue={providers[0]?.provider || 'paystack'} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          {providers.map((provider) => (
            <TabsTrigger key={provider.provider} value={provider.provider} className="gap-2">
              <Activity className="h-4 w-4" />
              {provider.provider.toUpperCase()}
            </TabsTrigger>
          ))}
        </TabsList>

        {providers.map((provider) => (
          <TabsContent key={provider.provider} value={provider.provider} className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions - {provider.provider.toUpperCase()}</CardTitle>
                <CardDescription>
                  Latest {provider.transactions?.length || 0} transactions from {provider.provider}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!provider.transactions || provider.transactions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No transactions available
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Reference</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Customer/Account</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {provider.transactions.map((txn) => (
                          <TableRow key={`${txn.id}-${txn.reference}`}>
                            <TableCell className="font-mono text-xs">{txn.reference}</TableCell>
                            <TableCell>
                              <Badge variant={txn.type === 'withdrawal' ? 'destructive' : 'default'} className="text-xs">
                                {txn.type}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-semibold">₦{txn.amount.toLocaleString()}</TableCell>
                            <TableCell>
                              <Badge 
                                variant={
                                  txn.status === 'success' || txn.status === 'successful' 
                                    ? 'default' 
                                    : txn.status === 'failed' 
                                    ? 'destructive' 
                                    : 'secondary'
                                }
                                className="text-xs"
                              >
                                {txn.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs">
                              {txn.customer_email || txn.bank_name || '—'}
                              {txn.account_number && <div className="text-muted-foreground">{txn.account_number}</div>}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {format(new Date(txn.created_at), 'MMM dd, yyyy HH:mm')}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Failed Withdrawals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Recent Failed Withdrawals
          </CardTitle>
          <CardDescription>System withdrawals that encountered errors</CardDescription>
        </CardHeader>
        <CardContent>
          {failedWithdrawals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
              <p>No failed withdrawals found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {failedWithdrawals.map((withdrawal) => (
                <div key={withdrawal.id} className="p-4 bg-destructive/5 border border-destructive/20 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-lg">₦{withdrawal.amount.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">{withdrawal.user_email}</p>
                    </div>
                    <Badge variant="destructive">Failed</Badge>
                  </div>
                  <div className="bg-destructive/10 text-destructive text-sm p-3 rounded border border-destructive/20">
                    <p className="font-semibold mb-1">Error Details:</p>
                    <p>{withdrawal.error_message}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(withdrawal.created_at), 'MMM dd, yyyy HH:mm')}
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
