import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import TopNav from "@/components/TopNav";
import { Loader2, ArrowDown, Plus } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

interface WithdrawalAccount {
  id: string;
  bank_name: string;
  account_number: string;
  account_name: string;
  is_default: boolean;
}

interface WithdrawalTransaction {
  id: string;
  amount: number;
  status: string;
  reference: string | null;
  created_at: string;
  admin_note: string | null;
}

export default function Withdrawal() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState("");
  const [accounts, setAccounts] = useState<WithdrawalAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [withdrawals, setWithdrawals] = useState<WithdrawalTransaction[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);

  useEffect(() => {
    fetchWalletBalance();
    fetchAccounts();
    fetchWithdrawals();
  }, []);

  const fetchWalletBalance = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("wallets")
        .select("balance")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      setBalance(data?.balance || 0);
    } catch (error: any) {
      console.error("Failed to fetch balance:", error);
    }
  };

  const fetchAccounts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("withdrawal_accounts")
        .select("*")
        .eq("user_id", user.id)
        .order("is_default", { ascending: false });

      if (error) throw error;
      setAccounts(data || []);
      
      const defaultAccount = data?.find(a => a.is_default);
      if (defaultAccount) {
        setSelectedAccount(defaultAccount.id);
      }
    } catch (error: any) {
      console.error("Failed to fetch accounts:", error);
    } finally {
      setLoadingAccounts(false);
    }
  };

  const fetchWithdrawals = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .eq("type", "withdrawal")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setWithdrawals(data || []);
    } catch (error: any) {
      console.error("Failed to fetch withdrawals:", error);
    }
  };

  const handleWithdrawal = async () => {
    try {
      // Check email and phone verification
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser?.email_confirmed_at) {
        toast.error("Please verify your email before withdrawing. Go to Settings to verify.");
        return;
      }

      if (!currentUser?.phone_confirmed_at) {
        toast.error("Please verify your phone number before withdrawing. Go to Settings to verify.");
        return;
      }

      const withdrawalAmount = parseFloat(amount);
      if (isNaN(withdrawalAmount) || withdrawalAmount <= 0) {
        toast.error("Please enter a valid amount");
        return;
      }

      if (withdrawalAmount > balance) {
        toast.error("Insufficient balance");
        return;
      }

      if (accounts.length === 0) {
        toast.error("Please add a withdrawal account first");
        navigate("/settings");
        return;
      }

      if (!selectedAccount) {
        toast.error("Please select a withdrawal account");
        return;
      }

      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please log in to continue");
        return;
      }

      const account = accounts.find(a => a.id === selectedAccount);
      if (!account) {
        toast.error("Invalid account selected");
        return;
      }

      // Check ticket purchase requirement (50% of deposit)
      const { data: deposits } = await supabase
        .from("transactions")
        .select("amount")
        .eq("user_id", user.id)
        .eq("type", "deposit")
        .eq("status", "completed");

      const { data: tickets } = await supabase
        .from("tickets")
        .select("purchase_price")
        .eq("user_id", user.id);

      const totalDeposits = deposits?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;
      const totalTickets = tickets?.reduce((sum, t) => sum + Number(t.purchase_price), 0) || 0;
      const requiredTickets = totalDeposits * 0.5;

      if (totalTickets < requiredTickets) {
        toast.error(`You must purchase tickets worth at least 50% of your deposits (₦${requiredTickets.toFixed(2)}) before withdrawing`);
        setLoading(false);
        return;
      }

      // Create withdrawal transaction
      const { error: insertError } = await supabase
        .from("transactions")
        .insert({
          user_id: user.id,
          type: "withdrawal",
          amount: withdrawalAmount,
          status: "pending",
          reference: `WD-${Date.now()}`,
          admin_note: JSON.stringify({
            bank_name: account.bank_name,
            account_number: account.account_number,
            account_name: account.account_name,
          }),
        });

      if (insertError) throw insertError;

      toast.success("Withdrawal request submitted successfully");
      setAmount("");
      fetchWithdrawals();
      fetchWalletBalance();
    } catch (error: any) {
      console.error("Withdrawal error:", error);
      toast.error("Failed to submit withdrawal request");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-green-500";
      case "pending": return "bg-yellow-500";
      case "rejected": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <TopNav />
      
      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Withdrawal Form */}
          <Card>
            <CardHeader>
              <CardTitle>Request Withdrawal</CardTitle>
              <CardDescription>
                Withdraw funds from your wallet to your bank account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Balance Display */}
              <div className="bg-gradient-to-r from-primary/20 to-accent/20 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Available Balance</p>
                <p className="text-3xl font-bold text-foreground">₦{balance.toFixed(2)}</p>
              </div>

              {/* Amount Input */}
              <div className="space-y-2">
                <Label htmlFor="amount">Withdrawal Amount (₦)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={loading}
                />
              </div>

              {/* Account Selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Select Account</Label>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => navigate("/settings")}
                    className="h-auto p-0"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Account
                  </Button>
                </div>
                
                {loadingAccounts ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                ) : accounts.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    No withdrawal accounts added yet
                  </div>
                ) : (
                  <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.bank_name} - {account.account_number}
                          {account.is_default && " (Default)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Info */}
              <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground space-y-1">
                <p>• Withdrawals are processed within 24-48 hours</p>
                <p>• Minimum withdrawal: ₦1,000</p>
                <p>• You'll be notified once approved</p>
              </div>

              {/* Submit Button */}
              <Button
                onClick={handleWithdrawal}
                disabled={loading || accounts.length === 0 || !selectedAccount}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <ArrowDown className="w-4 h-4 mr-2" />
                    Request Withdrawal
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Withdrawal History */}
          <Card>
            <CardHeader>
              <CardTitle>Withdrawal History</CardTitle>
              <CardDescription>Track your withdrawal requests</CardDescription>
            </CardHeader>
            <CardContent>
              {withdrawals.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ArrowDown className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No withdrawal requests yet</p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {withdrawals.map((withdrawal) => (
                        <TableRow key={withdrawal.id}>
                          <TableCell className="text-sm">
                            {format(new Date(withdrawal.created_at), "MMM dd, yyyy")}
                          </TableCell>
                          <TableCell className="font-bold">
                            ₦{withdrawal.amount.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Badge className={`${getStatusColor(withdrawal.status)} capitalize`}>
                              {withdrawal.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}