import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

  // Jackpot form state
  const [jackpotForm, setJackpotForm] = useState({
    name: "",
    description: "",
    ticket_price: "",
    frequency: "weekly",
    next_draw: ""
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
      await Promise.all([fetchJackpots(), fetchTransactions(), fetchUsers(), fetchPaymentSettings()]);
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

    if (ids.length) {
      const [{ data: wallets }, { data: roles }] = await Promise.all([
        supabase.from('wallets').select('user_id, balance').in('user_id', ids),
        supabase.from('user_roles').select('user_id, role').in('user_id', ids),
      ]);
      (wallets || []).forEach((w: any) => { walletMap[w.user_id] = Number(w.balance) || 0; });
      (roles || []).forEach((r: any) => { roleMap[r.user_id] = r.role; });

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
      const { error } = await supabase
        .from('jackpots')
        .insert({
          name: jackpotForm.name,
          description: jackpotForm.description,
          ticket_price: parseFloat(jackpotForm.ticket_price),
          frequency: jackpotForm.frequency,
          next_draw: jackpotForm.next_draw,
          status: 'active',
          prize_pool: 0
        });

      if (error) throw error;

      toast.success('Jackpot created successfully');
      setJackpotForm({ name: "", description: "", ticket_price: "", frequency: "weekly", next_draw: "" });
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
      await fetchJackpots();
    } catch (error: any) {
      toast.error(`Failed to process draw: ${error.message}`);
    } finally {
      setProcessing(null);
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
      <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Admin Dashboard
                </h1>
                <p className="text-sm text-muted-foreground">Manage your jackpot platform</p>
              </div>
            </div>
            <Button onClick={() => navigate('/dashboard')} variant="outline">
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">

        <Tabs defaultValue="jackpots" className="space-y-6">
          <TabsList>
            <TabsTrigger value="jackpots">Jackpots</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="payments">Payment Settings</TabsTrigger>
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
                    <Label htmlFor="frequency">Frequency</Label>
                    <Input
                      id="frequency"
                      value={jackpotForm.frequency}
                      onChange={(e) => setJackpotForm({ ...jackpotForm, frequency: e.target.value })}
                      placeholder="daily, weekly, monthly"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="next_draw">Next Draw Date/Time</Label>
                    <Input
                      id="next_draw"
                      type="datetime-local"
                      value={jackpotForm.next_draw}
                      onChange={(e) => setJackpotForm({ ...jackpotForm, next_draw: e.target.value })}
                    />
                  </div>
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
                      <TableHead>Actions</TableHead>
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
                        <TableCell>
                          <Button
                            size="sm"
                            onClick={() => processDraw(jackpot.id)}
                            disabled={processing === jackpot.id || jackpot.status !== 'active'}
                          >
                            {processing === jackpot.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Process Draw'}
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
    </div>
  );
}
