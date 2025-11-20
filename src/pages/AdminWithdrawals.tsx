import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface WithdrawalTransaction {
  id: string;
  user_id: string;
  amount: number;
  status: string;
  processing_stage: string | null;
  error_message: string | null;
  reference: string | null;
  created_at: string;
  processed_at: string | null;
  admin_note: string | null;
}

export default function AdminWithdrawals() {
  const [withdrawals, setWithdrawals] = useState<WithdrawalTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmailMap, setUserEmailMap] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchWithdrawals();
    
    // Set up real-time subscription for withdrawal updates
    const channel = supabase
      .channel('admin-withdrawals')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: 'type=eq.withdrawal'
        },
        () => {
          fetchWithdrawals();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchWithdrawals = async () => {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("type", "withdrawal")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      // Fetch user emails
      const userIds = Array.from(new Set((data || []).map(t => t.user_id)));
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, email")
        .in("id", userIds);

      const emailMap: Record<string, string> = {};
      (profiles || []).forEach(p => {
        emailMap[p.id] = p.email;
      });

      setUserEmailMap(emailMap);
      setWithdrawals(data || []);
    } catch (error: any) {
      console.error("Failed to fetch withdrawals:", error);
      toast.error("Failed to load withdrawal requests");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string, processingStage: string | null) => {
    if (processingStage === 'failed') {
      return <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" />Failed</Badge>;
    }
    
    if (processingStage === 'completed' || status === 'approved') {
      return <Badge variant="default" className="gap-1 bg-green-600"><CheckCircle className="w-3 h-3" />Completed</Badge>;
    }
    
    if (processingStage === 'transferring') {
      return <Badge variant="secondary" className="gap-1"><Loader2 className="w-3 h-3 animate-spin" />Transferring</Badge>;
    }
    
    if (processingStage === 'verifying') {
      return <Badge variant="secondary" className="gap-1"><Loader2 className="w-3 h-3 animate-spin" />Verifying</Badge>;
    }
    
    if (status === 'pending') {
      return <Badge variant="secondary" className="gap-1"><Loader2 className="w-3 h-3 animate-spin" />Processing</Badge>;
    }
    
    if (status === 'rejected') {
      return <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" />Rejected</Badge>;
    }
    
    return <Badge variant="secondary">{status}</Badge>;
  };

  const parseBankDetails = (adminNote: string | null) => {
    if (!adminNote) return null;
    try {
      return JSON.parse(adminNote);
    } catch {
      return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const pendingWithdrawals = withdrawals.filter(w => 
    w.status === 'pending' || 
    (w.processing_stage && !['completed', 'failed'].includes(w.processing_stage))
  );
  const completedWithdrawals = withdrawals.filter(w => 
    w.processing_stage === 'completed' || w.status === 'approved'
  );
  const failedWithdrawals = withdrawals.filter(w => 
    w.processing_stage === 'failed' || w.status === 'rejected'
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Withdrawal Management</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Review and approve or reject withdrawal requests from users.
          </p>
        </div>
        <Button onClick={fetchWithdrawals} variant="outline" size="sm" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{pendingWithdrawals.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting admin approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedWithdrawals.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Successfully transferred</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{failedWithdrawals.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Need attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Withdrawal Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All ({withdrawals.length})</TabsTrigger>
          <TabsTrigger value="processing">Processing ({pendingWithdrawals.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedWithdrawals.length})</TabsTrigger>
          <TabsTrigger value="failed">Failed ({failedWithdrawals.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>All Withdrawals</CardTitle>
              <CardDescription>Complete withdrawal history</CardDescription>
            </CardHeader>
            <CardContent>
              <WithdrawalTable 
                withdrawals={withdrawals} 
                userEmailMap={userEmailMap}
                getStatusBadge={getStatusBadge}
                parseBankDetails={parseBankDetails}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="processing" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Processing Withdrawals</CardTitle>
              <CardDescription>Withdrawals currently being processed automatically</CardDescription>
            </CardHeader>
            <CardContent>
              <WithdrawalTable 
                withdrawals={pendingWithdrawals} 
                userEmailMap={userEmailMap}
                getStatusBadge={getStatusBadge}
                parseBankDetails={parseBankDetails}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Completed Withdrawals</CardTitle>
              <CardDescription>Successfully processed withdrawals</CardDescription>
            </CardHeader>
            <CardContent>
              <WithdrawalTable 
                withdrawals={completedWithdrawals} 
                userEmailMap={userEmailMap}
                getStatusBadge={getStatusBadge}
                parseBankDetails={parseBankDetails}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="failed" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Failed Withdrawals</CardTitle>
              <CardDescription>Withdrawals that failed and need attention</CardDescription>
            </CardHeader>
            <CardContent>
              <WithdrawalTable 
                withdrawals={failedWithdrawals} 
                userEmailMap={userEmailMap}
                getStatusBadge={getStatusBadge}
                parseBankDetails={parseBankDetails}
                showErrors
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface WithdrawalTableProps {
  withdrawals: WithdrawalTransaction[];
  userEmailMap: Record<string, string>;
  getStatusBadge: (status: string, processingStage: string | null) => JSX.Element;
  parseBankDetails: (adminNote: string | null) => any;
  showErrors?: boolean;
}

function WithdrawalTable({ 
  withdrawals, 
  userEmailMap, 
  getStatusBadge, 
  parseBankDetails,
  showErrors = false 
}: WithdrawalTableProps) {
  if (withdrawals.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No withdrawals found
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Bank Details</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Reference</TableHead>
            <TableHead>Date</TableHead>
            {showErrors && <TableHead>Error</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {withdrawals.map((withdrawal) => {
            const bankDetails = parseBankDetails(withdrawal.admin_note);
            return (
              <TableRow key={withdrawal.id}>
                <TableCell className="font-medium">
                  {userEmailMap[withdrawal.user_id] || 'Unknown'}
                </TableCell>
                <TableCell className="font-semibold">
                  ₦{withdrawal.amount.toLocaleString()}
                </TableCell>
                <TableCell>
                  {bankDetails ? (
                    <div className="text-xs">
                      <div className="font-medium">{bankDetails.account_name}</div>
                      <div className="text-muted-foreground">{bankDetails.bank_name}</div>
                      <div className="text-muted-foreground">{bankDetails.account_number}</div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {getStatusBadge(withdrawal.status, withdrawal.processing_stage)}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {withdrawal.reference || '—'}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {format(new Date(withdrawal.created_at), 'MMM dd, yyyy HH:mm')}
                </TableCell>
                {showErrors && (
                  <TableCell>
                    {withdrawal.error_message ? (
                      <div className="text-xs text-destructive max-w-xs">
                        <AlertCircle className="w-3 h-3 inline mr-1" />
                        {withdrawal.error_message}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
