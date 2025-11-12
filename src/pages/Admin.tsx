import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import TopNav from "@/components/TopNav";
import JackpotAutomationDialog from "@/components/JackpotAutomationDialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import AdminPayments from "./AdminPayments";
import TransactionDetailDrawer from "@/components/TransactionDetailDrawer";

export default function Admin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [jackpots, setJackpots] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [processing, setProcessing] = useState<string | null>(null);
  const [paymentSettings, setPaymentSettings] = useState<any[]>([]);
  const [userEmailMap, setUserEmailMap] = useState<Record<string, string>>({});
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [userFilter, setUserFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [activeUserCount, setActiveUserCount] = useState(0);
  const [inactiveUserCount, setInactiveUserCount] = useState(0);
  const [adminBalance, setAdminBalance] = useState(0);
  const [withdrawalAmount, setWithdrawalAmount] = useState("");
  const [withdrawalLoading, setWithdrawalLoading] = useState(false);
  const [automationDialogOpen, setAutomationDialogOpen] = useState(false);

  // Jackpot form state
  const [jackpotForm, setJackpotForm] = useState({
    name: "",
    description: "",
    ticket_price: "",
    frequency: "1hour",
    next_draw: "",
    expires_at: "",
    category: "hourly"
  });

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

      // Check if user is admin
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

      setIsAdmin(true);
      await Promise.all([fetchJackpots(), fetchTransactions(), fetchUsers(), fetchPaymentSettings(), fetchAdminBalance()]);
    } catch (error) {
      console.error('Error checking admin status:', error);
      toast.error('Failed to verify admin status');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchJackpots = async () => {
    const { data, error } = await supabase
      .from('jackpots')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to fetch jackpots');
      return;
    }
    setJackpots(data || []);
  };

  const fetchTransactions = async () => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to fetch transactions');
      return;
    }

    setTransactions(data || []);

    // Build email map for user ids
    const userIds = Array.from(new Set((data || []).map((t: any) => t.user_id)));
    if (userIds.length) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email')
        .in('id', userIds);
      const map: Record<string, string> = {};
      (profiles || []).forEach((p: any) => { map[p.id] = p.email; });
      setUserEmailMap(map);
    } else {
      setUserEmailMap({});
    }
  };

  const fetchUsers = async () => {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to fetch users');
      return;
    }

    const ids = (profiles || []).map((p: any) => p.id);
    let walletMap: Record<string, number> = {};
    let roleMap: Record<string, string> = {};
    let authDataMap: Record<string, any> = {};
    let ticketCountMap: Record<string, number> = {};

    if (ids.length) {
      const [{ data: wallets }, { data: roles }, { data: tickets }] = await Promise.all([
        supabase.from('wallets').select('user_id, balance').in('user_id', ids),
        supabase.from('user_roles').select('user_id, role').in('user_id', ids),
        supabase.from('tickets').select('user_id').in('user_id', ids),
      ]);
      (wallets || []).forEach((w: any) => { walletMap[w.user_id] = Number(w.balance) || 0; });
      (roles || []).forEach((r: any) => { roleMap[r.user_id] = r.role; });
      
      // Count tickets per user
      (tickets || []).forEach((t: any) => {
        ticketCountMap[t.user_id] = (ticketCountMap[t.user_id] || 0) + 1;
      });

      // Fetch auth data for last_sign_in
      const { data: authUsers } = await supabase.auth.admin.listUsers();
      (authUsers?.users || []).forEach((u: any) => {
        authDataMap[u.id] = {
          last_sign_in_at: u.last_sign_in_at
        };
      });
    }

    // Fetch transactions for activity check
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const { data: recentTransactions } = await supabase
      .from('transactions')
      .select('user_id')
      .gte('created_at', thirtyDaysAgo.toISOString());

    const recentTxUserIds = new Set((recentTransactions || []).map((t: any) => t.user_id));

    // Determine active status
    let activeCount = 0;
    let inactiveCount = 0;

    const combined = (profiles || []).map((p: any) => {
      const lastSignIn = authDataMap[p.id]?.last_sign_in_at;
      const hasRecentTransaction = recentTxUserIds.has(p.id);
      
      const isActive = lastSignIn 
        ? (new Date().getTime() - new Date(lastSignIn).getTime()) < (30 * 24 * 60 * 60 * 1000)
        : hasRecentTransaction;

      if (isActive) activeCount++;
      else inactiveCount++;

      return {
        ...p,
        balance: walletMap[p.id] ?? 0,
        role: roleMap[p.id] ?? 'user',
        ticketCount: ticketCountMap[p.id] ?? 0,
        isActive,
        last_sign_in_at: lastSignIn
      };
    });

    setUsers(combined);
    setActiveUserCount(activeCount);
    setInactiveUserCount(inactiveCount);
  };

  const fetchPaymentSettings = async () => {
    const { data, error } = await supabase
      .from('payment_settings')
      .select('*')
      .order('provider', { ascending: true });

    if (error) {
      toast.error('Failed to fetch payment settings');
      return;
    }
    setPaymentSettings(data || []);
  };

  const updatePaymentSetting = async (id: string, updates: any) => {
    try {
      const { error } = await supabase
        .from('payment_settings')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast.success('Payment settings updated successfully');
      await fetchPaymentSettings();
    } catch (error: any) {
      toast.error(`Failed to update payment settings: ${error.message}`);
    }
  };

  const createJackpot = async () => {
    try {
      setProcessing('create-jackpot');
      
      // Calculate next draw time from frequency if not provided
      let nextDrawTime = jackpotForm.next_draw;
      if (!nextDrawTime && jackpotForm.frequency) {
        const now = new Date();
        if (jackpotForm.frequency === '30mins') {
          now.setMinutes(now.getMinutes() + 30);
        } else if (jackpotForm.frequency === '1hour') {
          now.setHours(now.getHours() + 1);
        } else if (jackpotForm.frequency === '2hours') {
          now.setHours(now.getHours() + 2);
        } else if (jackpotForm.frequency === '4hours') {
          now.setHours(now.getHours() + 4);
        } else if (jackpotForm.frequency === '12hours') {
          now.setHours(now.getHours() + 12);
        } else if (jackpotForm.frequency === '1day') {
          now.setDate(now.getDate() + 1);
        } else if (jackpotForm.frequency === '3days') {
          now.setDate(now.getDate() + 3);
        } else if (jackpotForm.frequency === '1week') {
          now.setDate(now.getDate() + 7);
        } else if (jackpotForm.frequency === '1month') {
          now.setMonth(now.getMonth() + 1);
        }
        nextDrawTime = now.toISOString().slice(0, 16);
      }

      const { error } = await supabase
        .from('jackpots')
        .insert({
          name: jackpotForm.name,
          description: jackpotForm.description,
          ticket_price: parseFloat(jackpotForm.ticket_price),
          frequency: jackpotForm.frequency,
          next_draw: nextDrawTime,
          expires_at: jackpotForm.expires_at || null,
          status: 'active',
          prize_pool: 0,
          category: jackpotForm.category
        });

      if (error) throw error;

      toast.success('Jackpot created successfully');
      setJackpotForm({ name: "", description: "", ticket_price: "", frequency: "1hour", next_draw: "", expires_at: "", category: "hourly" });
      await fetchJackpots();
    } catch (error: any) {
      toast.error(`Failed to create jackpot: ${error.message}`);
    } finally {
      setProcessing(null);
    }
  };

  const approveTransaction = async (transactionId: string, action: 'approve' | 'reject', adminNote?: string) => {
    try {
      setProcessing(transactionId);
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke('approve-transaction', {
        body: { transaction_id: transactionId, action, admin_note: adminNote },
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });

      if (response.error) throw response.error;

      toast.success(`Transaction ${action}d successfully`);
      setDrawerOpen(false);
      await fetchTransactions();
    } catch (error: any) {
      toast.error(`Failed to ${action} transaction: ${error.message}`);
    } finally {
      setProcessing(null);
    }
  };

  const filteredUsers = users.filter(user => {
    if (userFilter === 'active') return user.isActive;
    if (userFilter === 'inactive') return !user.isActive;
    return true;
  });

  const fetchAdminBalance = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_wallet')
        .select('balance')
        .limit(1)
        .single();

      if (error) throw error;
      setAdminBalance(Number(data?.balance || 0));
    } catch (error: any) {
      console.error('Failed to fetch admin balance:', error);
    }
  };

  const processDraw = async (jackpotId: string) => {
    try {
      setProcessing(jackpotId);
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke('process-draw', {
        body: { jackpot_id: jackpotId },
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });

      if (response.error) throw response.error;

      toast.success('Draw processed successfully!');
      await Promise.all([fetchJackpots(), fetchAdminBalance()]);
    } catch (error: any) {
      toast.error(`Failed to process draw: ${error.message}`);
    } finally {
      setProcessing(null);
    }
  };

  const rerunJackpot = async (jackpot: any) => {
    try {
      setProcessing(`rerun-${jackpot.id}`);
      
      // Get the max jackpot number
      const { data: maxJackpot } = await supabase
        .from('jackpots')
        .select('jackpot_number')
        .order('jackpot_number', { ascending: false })
        .limit(1)
        .single();

      const nextJackpotNumber = (maxJackpot?.jackpot_number || 0) + 1;

      // Calculate next draw time based on frequency
      const nextDraw = new Date();
      if (jackpot.frequency === '5mins') {
        nextDraw.setMinutes(nextDraw.getMinutes() + 72);
      } else if (jackpot.frequency === '30mins') {
        nextDraw.setHours(nextDraw.getHours() + 2);
        nextDraw.setMinutes(nextDraw.getMinutes() + 24);
      } else if (jackpot.frequency === '1hour') {
        nextDraw.setHours(nextDraw.getHours() + 4);
      } else if (jackpot.frequency === '12hours') {
        nextDraw.setHours(18, 0, 0, 0);
        if (nextDraw.getTime() <= Date.now()) {
          nextDraw.setDate(nextDraw.getDate() + 1);
        }
      } else if (jackpot.frequency === '24hours') {
        nextDraw.setHours(0, 0, 0, 0);
        nextDraw.setDate(nextDraw.getDate() + 1);
      }

      const { error } = await supabase
        .from('jackpots')
        .insert({
          name: jackpot.name,
          description: jackpot.description,
          ticket_price: jackpot.ticket_price,
          frequency: jackpot.frequency,
          next_draw: nextDraw.toISOString(),
          status: 'active',
          prize_pool: 0,
          jackpot_number: nextJackpotNumber,
          category: jackpot.category || 'hourly'
        });

      if (error) throw error;

      toast.success('Jackpot recreated successfully!');
      await fetchJackpots();
    } catch (error: any) {
      toast.error(`Failed to rerun jackpot: ${error.message}`);
    } finally {
      setProcessing(null);
    }
  };

  const handleAdminWithdrawal = async () => {
    try {
      const amount = parseFloat(withdrawalAmount);
      if (isNaN(amount) || amount <= 0) {
        toast.error('Please enter a valid amount');
        return;
      }

      if (amount > adminBalance) {
        toast.error('Insufficient balance');
        return;
      }

      setWithdrawalLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get admin wallet
      const { data: adminWallet, error: walletError } = await supabase
        .from('admin_wallet')
        .select('*')
        .limit(1)
        .single();

      if (walletError) throw walletError;

      // Update admin wallet balance
      const newBalance = Number(adminWallet.balance) - amount;
      const { error: updateError } = await supabase
        .from('admin_wallet')
        .update({ balance: newBalance })
        .eq('id', adminWallet.id);

      if (updateError) throw updateError;

      // Create transaction record
      const { error: txError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: 'withdrawal',
          amount: amount,
          status: 'approved',
          reference: `ADMIN-WD-${Date.now()}`,
          admin_note: 'Admin withdrawal'
        });

      if (txError) throw txError;

      toast.success('Withdrawal processed successfully!');
      setWithdrawalAmount('');
      await fetchAdminBalance();
    } catch (error: any) {
      toast.error(`Failed to process withdrawal: ${error.message}`);
    } finally {
      setWithdrawalLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <TopNav />

      <div className="container mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <div className="flex gap-2">
            <Button onClick={() => navigate('/statistics')} variant="outline">
              View Statistics
            </Button>
            <Button onClick={() => setAutomationDialogOpen(true)}>
              Create Automated Jackpot
            </Button>
          </div>
        </div>
        {/* Admin Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Earnings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">₦{adminBalance.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-2">From all completed draws</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{activeUserCount}</div>
              <p className="text-xs text-muted-foreground mt-2">Users active in last 30 days</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Jackpots</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {jackpots.filter(j => j.status === 'active').length}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Currently running draws</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="jackpots" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="jackpots">Jackpots</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="payments">Payment Settings</TabsTrigger>
            <TabsTrigger value="withdrawal">Withdraw</TabsTrigger>
          </TabsList>

          <TabsContent value="jackpots" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Create New Jackpot</CardTitle>
                <CardDescription>Set up a new jackpot draw</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={jackpotForm.name}
                      onChange={(e) => setJackpotForm({ ...jackpotForm, name: e.target.value })}
                      placeholder="Weekend Mega Draw"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ticket_price">Ticket Price</Label>
                    <Input
                      id="ticket_price"
                      type="number"
                      step="0.01"
                      value={jackpotForm.ticket_price}
                      onChange={(e) => setJackpotForm({ ...jackpotForm, ticket_price: e.target.value })}
                      placeholder="10.00"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={jackpotForm.description}
                    onChange={(e) => setJackpotForm({ ...jackpotForm, description: e.target.value })}
                    placeholder="Enter jackpot description"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="frequency">Draw Frequency</Label>
                    <Select
                      value={jackpotForm.frequency}
                      onValueChange={(value) => setJackpotForm({ ...jackpotForm, frequency: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30mins">30 Minutes</SelectItem>
                        <SelectItem value="1hour">1 Hour</SelectItem>
                        <SelectItem value="2hours">2 Hours</SelectItem>
                        <SelectItem value="4hours">4 Hours</SelectItem>
                        <SelectItem value="12hours">12 Hours</SelectItem>
                        <SelectItem value="1day">1 Day</SelectItem>
                        <SelectItem value="3days">3 Days</SelectItem>
                        <SelectItem value="1week">1 Week</SelectItem>
                        <SelectItem value="1month">1 Month</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="next_draw">Next Draw Date/Time (Optional if frequency set)</Label>
                    <Input
                      id="next_draw"
                      type="datetime-local"
                      value={jackpotForm.next_draw}
                      onChange={(e) => setJackpotForm({ ...jackpotForm, next_draw: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">Leave empty to auto-calculate from frequency</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={jackpotForm.category}
                    onValueChange={(value) => setJackpotForm({ ...jackpotForm, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="3hours">3 Hours</SelectItem>
                      <SelectItem value="1hour">1 Hour</SelectItem>
                      <SelectItem value="quick">Quick</SelectItem>
                      <SelectItem value="long">Long</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expires_at">Expiration Date/Time (Optional)</Label>
                  <Input
                    id="expires_at"
                    type="datetime-local"
                    value={jackpotForm.expires_at}
                    onChange={(e) => setJackpotForm({ ...jackpotForm, expires_at: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">If set, jackpot will automatically expire and close at this time</p>
                </div>
                <Button
                  onClick={createJackpot}
                  disabled={processing === 'create-jackpot'}
                  className="w-full"
                >
                  {processing === 'create-jackpot' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Jackpot'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Manage Jackpots</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ticket Price</TableHead>
                      <TableHead>Prize Pool</TableHead>
                      <TableHead>Next Draw</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jackpots.map((jackpot) => (
                      <TableRow key={jackpot.id}>
                        <TableCell>{jackpot.name}</TableCell>
                        <TableCell>
                          <Badge variant={jackpot.status === 'active' ? 'default' : 'secondary'}>
                            {jackpot.status}
                          </Badge>
                        </TableCell>
                        <TableCell>₦{jackpot.ticket_price}</TableCell>
                        <TableCell>₦{jackpot.prize_pool}</TableCell>
                        <TableCell>{jackpot.next_draw ? new Date(jackpot.next_draw).toLocaleString() : 'N/A'}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            size="sm"
                            onClick={() => processDraw(jackpot.id)}
                            disabled={processing === jackpot.id || jackpot.status !== 'active'}
                          >
                            {processing === jackpot.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Process Draw'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setJackpotForm({
                                name: jackpot.name,
                                description: jackpot.description || "",
                                ticket_price: jackpot.ticket_price.toString(),
                                frequency: jackpot.frequency,
                                next_draw: jackpot.next_draw ? new Date(jackpot.next_draw).toISOString().slice(0, 16) : "",
                                expires_at: jackpot.expires_at ? new Date(jackpot.expires_at).toISOString().slice(0, 16) : "",
                                category: jackpot.category || "hourly"
                              });
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => rerunJackpot(jackpot)}
                            disabled={processing === `rerun-${jackpot.id}`}
                          >
                            {processing === `rerun-${jackpot.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Rerun'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle>Pending Transactions</CardTitle>
                <CardDescription>Approve or reject user deposits and withdrawals</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.filter(t => t.status === 'pending').map((tx) => (
                      <TableRow 
                        key={tx.id} 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => {
                          setSelectedTransaction(tx);
                          setDrawerOpen(true);
                        }}
                      >
                        <TableCell>{userEmailMap[tx.user_id] || '—'}</TableCell>
                        <TableCell className="capitalize">{tx.type}</TableCell>
                        <TableCell>₦{tx.amount}</TableCell>
                        <TableCell>
                          <Badge>{tx.status}</Badge>
                        </TableCell>
                        <TableCell>{new Date(tx.created_at).toLocaleString()}</TableCell>
                        <TableCell className="space-x-2">
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTransaction(tx);
                              setDrawerOpen(true);
                            }}
                          >
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>All Users</CardTitle>
                    <CardDescription className="mt-2">
                      Active: {activeUserCount} | Inactive: {inactiveUserCount}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={userFilter === 'all' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setUserFilter('all')}
                    >
                      All ({users.length})
                    </Button>
                    <Button
                      variant={userFilter === 'active' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setUserFilter('active')}
                    >
                      Active ({activeUserCount})
                    </Button>
                    <Button
                      variant={userFilter === 'inactive' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setUserFilter('inactive')}
                    >
                      Inactive ({inactiveUserCount})
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Tickets</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.full_name || 'N/A'}</TableCell>
                        <TableCell>₦{user.balance}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{user.ticketCount || 0}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                            {user.role || 'user'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.isActive ? 'default' : 'secondary'}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments">
            <AdminPayments 
              paymentSettings={paymentSettings}
              onUpdate={updatePaymentSetting}
            />
          </TabsContent>

          <TabsContent value="withdrawal">
            <Card>
              <CardHeader>
                <CardTitle>Admin Withdrawal</CardTitle>
                <CardDescription>Withdraw your earnings from the admin wallet</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-gradient-to-r from-primary/20 to-accent/20 rounded-lg p-6">
                  <p className="text-sm text-muted-foreground mb-2">Available Balance</p>
                  <p className="text-4xl font-bold text-foreground">₦{adminBalance.toFixed(2)}</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="withdrawal-amount">Withdrawal Amount (₦)</Label>
                    <Input
                      id="withdrawal-amount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={withdrawalAmount}
                      onChange={(e) => setWithdrawalAmount(e.target.value)}
                      disabled={withdrawalLoading}
                    />
                  </div>

                  <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground space-y-1">
                    <p>• Withdrawals are processed instantly</p>
                    <p>• 20% from each draw is added to admin wallet</p>
                    <p>• Transaction records are created automatically</p>
                  </div>

                  <Button
                    onClick={handleAdminWithdrawal}
                    disabled={withdrawalLoading || !withdrawalAmount || parseFloat(withdrawalAmount) <= 0}
                    className="w-full"
                    size="lg"
                  >
                    {withdrawalLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Withdraw Funds'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <TransactionDetailDrawer
        transaction={selectedTransaction}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onApprove={approveTransaction}
        userEmail={selectedTransaction ? userEmailMap[selectedTransaction.user_id] : undefined}
        processing={processing === selectedTransaction?.id}
      />
      
      <JackpotAutomationDialog
        open={automationDialogOpen}
        onOpenChange={setAutomationDialogOpen}
        onSuccess={fetchJackpots}
      />
    </div>
  );
}
