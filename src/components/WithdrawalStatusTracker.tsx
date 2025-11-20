import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { format } from "date-fns";

interface Transaction {
  id: string;
  amount: number;
  status: string;
  processing_stage: string;
  error_message: string | null;
  created_at: string;
  reference: string | null;
}

interface WithdrawalStatusTrackerProps {
  userId: string;
}

export const WithdrawalStatusTracker = ({ userId }: WithdrawalStatusTrackerProps) => {
  const [pendingWithdrawals, setPendingWithdrawals] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingWithdrawals();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('withdrawal-status-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('Transaction update:', payload);
          fetchPendingWithdrawals();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const fetchPendingWithdrawals = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .eq('type', 'withdrawal')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setPendingWithdrawals(data || []);
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStageStatus = (currentStage: string, stage: string) => {
    const stages = ['initiated', 'verifying', 'transferring', 'completed'];
    const currentIndex = stages.indexOf(currentStage);
    const stageIndex = stages.indexOf(stage);

    if (currentStage === 'failed') return 'error';
    if (stageIndex < currentIndex) return 'completed';
    if (stageIndex === currentIndex) return 'active';
    return 'pending';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'active':
        return <Clock className="h-4 w-4 text-primary animate-pulse" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-muted" />;
    }
  };

  if (loading) return null;
  if (pendingWithdrawals.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Pending Withdrawals
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {pendingWithdrawals.map((withdrawal) => (
          <div key={withdrawal.id} className="space-y-3 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">₦{withdrawal.amount.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(withdrawal.created_at), 'MMM dd, yyyy HH:mm')}
                </p>
              </div>
              <Badge variant="secondary" className="gap-1">
                <Clock className="h-3 w-3" />
                Awaiting Admin Approval
              </Badge>
            </div>

            <p className="text-xs text-muted-foreground">
              Your withdrawal request is awaiting admin approval. You will be notified once processed.
            </p>

            {withdrawal.reference && (
              <p className="text-xs text-muted-foreground">
                Ref: {withdrawal.reference}
              </p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
