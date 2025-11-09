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
import { Loader2 } from "lucide-react";

export default function Admin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [jackpots, setJackpots] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [processing, setProcessing] = useState<string | null>(null);

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
      await Promise.all([fetchJackpots(), fetchTransactions(), fetchUsers()]);
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
      .select('*, profiles(email)')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to fetch transactions');
      return;
    }
    setTransactions(data || []);
  };

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*, wallets(balance), user_roles(role)')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to fetch users');
      return;
    }
    setUsers(data || []);
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
      await fetchTransactions();
    } catch (error: any) {
      toast.error(`Failed to ${action} transaction: ${error.message}`);
    } finally {
      setProcessing(null);
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
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Admin Dashboard</h1>
          <Button onClick={() => navigate('/dashboard')} variant="outline">
            Back to Dashboard
          </Button>
        </div>

        <Tabs defaultValue="jackpots" className="space-y-6">
          <TabsList>
            <TabsTrigger value="jackpots">Jackpots</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
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
                        <TableCell>${jackpot.ticket_price}</TableCell>
                        <TableCell>${jackpot.prize_pool}</TableCell>
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
                      <TableRow key={tx.id}>
                        <TableCell>{tx.profiles?.email}</TableCell>
                        <TableCell className="capitalize">{tx.type}</TableCell>
                        <TableCell>${tx.amount}</TableCell>
                        <TableCell>
                          <Badge>{tx.status}</Badge>
                        </TableCell>
                        <TableCell>{new Date(tx.created_at).toLocaleString()}</TableCell>
                        <TableCell className="space-x-2">
                          <Button
                            size="sm"
                            onClick={() => approveTransaction(tx.id, 'approve')}
                            disabled={processing === tx.id}
                          >
                            {processing === tx.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Approve'}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => approveTransaction(tx.id, 'reject')}
                            disabled={processing === tx.id}
                          >
                            Reject
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
                <CardTitle>All Users</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.full_name || 'N/A'}</TableCell>
                        <TableCell>${user.wallets?.[0]?.balance || 0}</TableCell>
                        <TableCell>
                          <Badge variant={user.user_roles?.[0]?.role === 'admin' ? 'default' : 'secondary'}>
                            {user.user_roles?.[0]?.role || 'user'}
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
        </Tabs>
      </div>
    </div>
  );
}
