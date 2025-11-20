import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { AdminNav } from "@/components/AdminNav";
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
import { Loader2, Sparkles, Settings, Users, Shield, Image, Mail, CreditCard, Wallet, ArrowDown, Activity } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import AdminPayments from "./AdminPayments";
import AdminWithdrawals from "./AdminWithdrawals";
import AdminSliderManagement from "./AdminSliderManagement";
import AdminEmailSender from "./AdminEmailSender";
import TransactionDetailDrawer from "@/components/TransactionDetailDrawer";
import { BonusSettingsPanel } from "@/components/BonusSettingsPanel";
import { AdminActivityLog } from "@/components/AdminActivityLog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SEOHead } from "@/components/SEOHead";

export default function Admin() {
  const location = useLocation();
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
  const [hideFromLeaderboard, setHideFromLeaderboard] = useState(false);
  const [updatingLeaderboardVisibility, setUpdatingLeaderboardVisibility] = useState(false);

  // Jackpot form state
  const [jackpotForm, setJackpotForm] = useState({
    name: "",
    description: "",
    ticket_price: "",
    frequency: "1hour",
    next_draw: "",
    expires_at: "",
    category: "hourly",
    winners_count: "1",
    admin_commission_percentage: "10",
    initial_prize_pool: "",
    background_image: null as File | null
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);

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
      
      // Fetch admin's profile settings
      const { data: profileData } = await supabase
        .from('profiles')
        .select('hide_from_leaderboard')
        .eq('id', user.id)
        .single();
      
      if (profileData) {
        setHideFromLeaderboard(profileData.hide_from_leaderboard || false);
      }
      
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
      
      let backgroundImageUrl = null;

      // Upload background image if provided
      if (jackpotForm.background_image) {
        const fileExt = jackpotForm.background_image.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('jackpot-images')
          .upload(filePath, jackpotForm.background_image, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('jackpot-images')
          .getPublicUrl(filePath);

        backgroundImageUrl = publicUrl;
      }

      // Calculate next draw time from frequency if not provided
      let nextDrawTime = jackpotForm.next_draw;
      if (!nextDrawTime && jackpotForm.frequency) {
        const now = new Date();
        if (jackpotForm.frequency === '3min') {
          now.setMinutes(now.getMinutes() + 3);
        } else if (jackpotForm.frequency === '5minutes') {
          now.setMinutes(now.getMinutes() + 5);
        } else if (jackpotForm.frequency === '10minutes') {
          now.setMinutes(now.getMinutes() + 10);
        } else if (jackpotForm.frequency === '30minutes') {
          now.setMinutes(now.getMinutes() + 30);
        } else if (jackpotForm.frequency === 'hourly') {
          now.setHours(now.getHours() + 1);
        } else if (jackpotForm.frequency === '12hours') {
          now.setHours(now.getHours() + 12);
        } else if (jackpotForm.frequency === 'daily') {
          now.setDate(now.getDate() + 1);
        } else if (jackpotForm.frequency === 'weekly') {
          now.setDate(now.getDate() + 7);
        } else if (jackpotForm.frequency === 'monthly') {
          now.setMonth(now.getMonth() + 1);
        }
        nextDrawTime = now.toISOString().slice(0, 16);
      }

      // For recurring jackpots like 3min, set expires_at to null
      const expiresAt = jackpotForm.frequency === '3min' ? null : (jackpotForm.expires_at || null);
      const initialPrizePool = jackpotForm.initial_prize_pool ? parseFloat(jackpotForm.initial_prize_pool) : 0;

      const { error } = await supabase
        .from('jackpots')
        .insert({
          name: jackpotForm.name,
          description: jackpotForm.description,
          ticket_price: parseFloat(jackpotForm.ticket_price),
          frequency: jackpotForm.frequency,
          next_draw: nextDrawTime,
          expires_at: expiresAt,
          status: 'active',
          prize_pool: initialPrizePool,
          initial_prize_pool: initialPrizePool,
          category: jackpotForm.category,
          winners_count: parseInt(jackpotForm.winners_count),
          admin_commission_percentage: parseFloat(jackpotForm.admin_commission_percentage),
          background_image_url: backgroundImageUrl
        });

      if (error) throw error;

      // Log the jackpot creation
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('admin_activity_log').insert({
          admin_id: user.id,
          action_type: 'jackpot_created',
          action_description: `Created jackpot: ${jackpotForm.name} (₦${jackpotForm.ticket_price}/ticket, ${jackpotForm.frequency})`,
          metadata: {
            jackpot_name: jackpotForm.name,
            ticket_price: parseFloat(jackpotForm.ticket_price),
            frequency: jackpotForm.frequency,
            category: jackpotForm.category
          }
        });
      }

      toast.success('Jackpot created successfully');
      setJackpotForm({ 
        name: "", 
        description: "", 
        ticket_price: "", 
        frequency: "1hour", 
        next_draw: "", 
        expires_at: "", 
        category: "hourly", 
        winners_count: "1", 
        admin_commission_percentage: "10",
        initial_prize_pool: "",
        background_image: null 
      });
      setImagePreview(null);
      await fetchJackpots();
    } catch (error: any) {
      toast.error(`Failed to create jackpot: ${error.message}`);
    } finally {
      setProcessing(null);
    }
  };

  const deleteJackpot = async (jackpotId: string) => {
    try {
      setProcessing(`delete-${jackpotId}`);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke('delete-jackpot', {
        body: { jackpotId },
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });

      if (response.error) throw response.error;

      const result = response.data;
      
      // Log the jackpot deletion
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('admin_activity_log').insert({
          admin_id: user.id,
          action_type: 'jackpot_deleted',
          action_description: `Deleted jackpot. Refunded ${result.refundedUsers} users with total ₦${result.totalRefunded.toFixed(2)}`,
          target_id: jackpotId,
          target_type: 'jackpot',
          metadata: {
            refunded_users: result.refundedUsers,
            total_refunded: result.totalRefunded
          }
        });
      }
      
      toast.success(`Jackpot deleted. Refunded ${result.refundedUsers} users with total ₦${result.totalRefunded.toFixed(2)}`);
      await fetchJackpots();
    } catch (error: any) {
      toast.error(`Failed to delete jackpot: ${error.message}`);
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

      // Log the transaction approval/rejection
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('admin_activity_log').insert({
          admin_id: user.id,
          action_type: action === 'approve' ? 'transaction_approved' : 'transaction_rejected',
          action_description: `${action === 'approve' ? 'Approved' : 'Rejected'} transaction${adminNote ? `: ${adminNote}` : ''}`,
          target_id: transactionId,
          target_type: 'transaction',
          metadata: { action, admin_note: adminNote }
        });
      }

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

      // Calculate next draw time based on frequency - Fixed to proper time intervals
      const nextDraw = new Date();
      if (jackpot.frequency === '5mins') {
        nextDraw.setMinutes(nextDraw.getMinutes() + 5);
      } else if (jackpot.frequency === '20mins') {
        nextDraw.setMinutes(nextDraw.getMinutes() + 20);
      } else if (jackpot.frequency === '30mins') {
        nextDraw.setMinutes(nextDraw.getMinutes() + 30);
      } else if (jackpot.frequency === '1hour') {
        nextDraw.setHours(nextDraw.getHours() + 1);
      } else if (jackpot.frequency === '2hours') {
        nextDraw.setHours(nextDraw.getHours() + 2);
      } else if (jackpot.frequency === '4hours') {
        nextDraw.setHours(nextDraw.getHours() + 4);
      } else if (jackpot.frequency === '12hours') {
        nextDraw.setHours(nextDraw.getHours() + 12);
      } else if (jackpot.frequency === '24hours' || jackpot.frequency === '1day') {
        nextDraw.setDate(nextDraw.getDate() + 1);
      } else if (jackpot.frequency === '3days') {
        nextDraw.setDate(nextDraw.getDate() + 3);
      } else if (jackpot.frequency === '1week') {
        nextDraw.setDate(nextDraw.getDate() + 7);
      } else if (jackpot.frequency === '1month') {
        nextDraw.setMonth(nextDraw.getMonth() + 1);
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
    <div className="min-h-screen animated-bg-alt">
      <SEOHead
        title="Admin Dashboard - LuckyWin"
        description="LuckyWin admin panel for managing jackpots, users, transactions, and platform settings."
        url="https://luckywin.name.ng/admin"
        type="website"
        noIndex={true}
        noFollow={true}
      />
      <AdminNav />

      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-xl border border-primary/20">
              <Shield className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Admin Dashboard
              </h1>
              <p className="text-muted-foreground text-sm mt-0.5">Manage your platform efficiently</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/site-settings">
              <Button variant="outline" size="sm" className="gap-2">
                <Settings className="w-4 h-4" />
                Settings
              </Button>
            </Link>
            <Link to="/user-management">
              <Button variant="outline" size="sm" className="gap-2">
                <Users className="w-4 h-4" />
                Users
              </Button>
            </Link>
            <Button onClick={() => setAutomationDialogOpen(true)} size="sm" className="gap-2">
              <Sparkles className="w-4 h-4" />
              Auto Jackpot
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="border-border/50 bg-card hover:shadow-md transition-shadow">
            <CardHeader className="pb-3 space-y-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Earnings</CardTitle>
                <Wallet className="w-4 h-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">₦{adminBalance.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Total platform earnings</p>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card hover:shadow-md transition-shadow">
            <CardHeader className="pb-3 space-y-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Users</CardTitle>
                <Users className="w-4 h-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{activeUserCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Last 30 days activity</p>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card hover:shadow-md transition-shadow">
            <CardHeader className="pb-3 space-y-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
                <Users className="w-4 h-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{users.length}</div>
              <p className="text-xs text-muted-foreground mt-1">All registered users</p>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card hover:shadow-md transition-shadow">
            <CardHeader className="pb-3 space-y-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Jackpots</CardTitle>
                <Sparkles className="w-4 h-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {jackpots.filter(j => j.status === 'active').length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Currently running draws</p>
            </CardContent>
          </Card>
        </div>

        {/* Admin Wallet Withdrawal */}
        <Card className="mb-6 border-border/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-primary" />
              <div>
                <CardTitle>Admin Wallet</CardTitle>
                <CardDescription>Withdraw platform earnings</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 items-end max-w-md">
              <div className="flex-1 space-y-2">
                <Label htmlFor="withdrawal-amount">Amount (₦)</Label>
                <Input
                  id="withdrawal-amount"
                  type="number"
                  placeholder="Enter amount"
                  value={withdrawalAmount}
                  onChange={(e) => setWithdrawalAmount(e.target.value)}
                  disabled={withdrawalLoading}
                />
              </div>
              <Button
                onClick={handleAdminWithdrawal}
                disabled={withdrawalLoading || !withdrawalAmount || parseFloat(withdrawalAmount) <= 0}
                className="gap-2"
              >
                {withdrawalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><ArrowDown className="w-4 h-4" />Withdraw</>}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Main Tabs */}
        <Tabs defaultValue="jackpots" className="space-y-6">
          <div className="border-b border-border">
            <ScrollArea className="w-full">
              <TabsList className="inline-flex w-full min-w-max h-auto p-0 bg-transparent rounded-none">
                <TabsTrigger value="jackpots" className="gap-2 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-3 px-4">
                  <Sparkles className="w-4 h-4" />
                  <span className="hidden sm:inline">Jackpots</span>
                </TabsTrigger>
                <TabsTrigger value="transactions" className="gap-2 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-3 px-4">
                  <CreditCard className="w-4 h-4" />
                  <span className="hidden sm:inline">Transactions</span>
                </TabsTrigger>
                <TabsTrigger value="withdrawals" className="gap-2 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-3 px-4">
                  <Wallet className="w-4 h-4" />
                  <span className="hidden sm:inline">Withdrawals</span>
                </TabsTrigger>
                <TabsTrigger value="users" className="gap-2 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-3 px-4">
                  <Users className="w-4 h-4" />
                  <span className="hidden sm:inline">Users</span>
                </TabsTrigger>
                <TabsTrigger value="slider" className="gap-2 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-3 px-4">
                  <Image className="w-4 h-4" />
                  <span className="hidden sm:inline">Slider</span>
                </TabsTrigger>
                <TabsTrigger value="email" className="gap-2 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-3 px-4">
                  <Mail className="w-4 h-4" />
                  <span className="hidden sm:inline">Email</span>
                </TabsTrigger>
                <TabsTrigger value="payments" className="gap-2 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-3 px-4">
                  <Settings className="w-4 h-4" />
                  <span className="hidden sm:inline">Payment Settings</span>
                </TabsTrigger>
                <TabsTrigger value="bonus" className="gap-2 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-3 px-4">
                  <Sparkles className="w-4 h-4" />
                  <span className="hidden sm:inline">Bonus</span>
                </TabsTrigger>
                <TabsTrigger value="admin-settings" className="gap-2 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-3 px-4">
                  <Shield className="w-4 h-4" />
                  <span className="hidden sm:inline">Admin Settings</span>
                </TabsTrigger>
                <TabsTrigger value="activity-log" className="gap-2 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-3 px-4">
                  <Activity className="w-4 h-4" />
                  <span className="hidden sm:inline">Activity Log</span>
                </TabsTrigger>
              </TabsList>
            </ScrollArea>
          </div>

          <TabsContent value="jackpots" className="space-y-6">
            {/* Preset Buttons */}
            <Card className="bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Quick Create Presets
                </CardTitle>
                <CardDescription>Start with a proven jackpot configuration</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button
                    variant="outline"
                    className="h-auto flex-col items-start p-4 border-2 hover:border-primary hover:bg-primary/5 transition-all"
                    onClick={() => setJackpotForm({
                      name: "3-Minute Express",
                      description: "Lightning-fast draws every 3 minutes! Perfect for quick wins and instant excitement.",
                      ticket_price: "10",
                      frequency: "3min",
                      next_draw: "",
                      expires_at: "",
                      category: "quick",
                      winners_count: "1",
                      admin_commission_percentage: "15",
                      initial_prize_pool: "5000",
                      background_image: null
                    })}
                  >
                    <div className="text-2xl mb-2">⚡</div>
                    <div className="font-bold text-base">3-Minute Express</div>
                    <div className="text-xs text-muted-foreground text-left mt-1">
                      Fast & Furious • ₦10/ticket • ₦5K pool
                    </div>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="h-auto flex-col items-start p-4 border-2 hover:border-primary hover:bg-primary/5 transition-all"
                    onClick={() => setJackpotForm({
                      name: "Hourly Classic",
                      description: "Regular hourly draws with great prizes! Join the winning circle every hour.",
                      ticket_price: "50",
                      frequency: "hourly",
                      next_draw: "",
                      expires_at: "",
                      category: "hourly",
                      winners_count: "3",
                      admin_commission_percentage: "10",
                      initial_prize_pool: "10000",
                      background_image: null
                    })}
                  >
                    <div className="text-2xl mb-2">⏰</div>
                    <div className="font-bold text-base">Hourly Classic</div>
                    <div className="text-xs text-muted-foreground text-left mt-1">
                      Popular Choice • ₦50/ticket • ₦10K pool
                    </div>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="h-auto flex-col items-start p-4 border-2 hover:border-primary hover:bg-primary/5 transition-all"
                    onClick={() => setJackpotForm({
                      name: "Daily Mega",
                      description: "Massive daily jackpot with life-changing prizes! One chance, one winner, big dreams.",
                      ticket_price: "100",
                      frequency: "daily",
                      next_draw: "",
                      expires_at: "",
                      category: "daily",
                      winners_count: "5",
                      admin_commission_percentage: "10",
                      initial_prize_pool: "50000",
                      background_image: null
                    })}
                  >
                    <div className="text-2xl mb-2">💎</div>
                    <div className="font-bold text-base">Daily Mega</div>
                    <div className="text-xs text-muted-foreground text-left mt-1">
                      Big Prizes • ₦100/ticket • ₦50K pool
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Create New Jackpot</CardTitle>
                <CardDescription>Customize your jackpot settings or use a preset above</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Basic Info Section */}
                <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                    <h3 className="font-semibold">Basic Information</h3>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Jackpot Name</Label>
                    <Input
                      id="name"
                      value={jackpotForm.name}
                      onChange={(e) => setJackpotForm({ ...jackpotForm, name: e.target.value })}
                      placeholder="e.g., Weekend Mega Draw"
                      className="text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={jackpotForm.description}
                      onChange={(e) => setJackpotForm({ ...jackpotForm, description: e.target.value })}
                      placeholder="Describe what makes this jackpot special..."
                      className="min-h-[80px]"
                    />
                  </div>
                </div>

                {/* Pricing & Schedule Section */}
                <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-secondary"></div>
                    <h3 className="font-semibold">Pricing & Schedule</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="ticket_price">Ticket Price (₦)</Label>
                      <Input
                        id="ticket_price"
                        type="number"
                        step="0.01"
                        value={jackpotForm.ticket_price}
                        onChange={(e) => setJackpotForm({ ...jackpotForm, ticket_price: e.target.value })}
                        placeholder="100.00"
                        className="text-base"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="initial_prize_pool">Initial Prize Pool (₦)</Label>
                      <Input
                        id="initial_prize_pool"
                        type="number"
                        min="0"
                        step="0.01"
                        value={jackpotForm.initial_prize_pool}
                        onChange={(e) => setJackpotForm({ ...jackpotForm, initial_prize_pool: e.target.value })}
                        placeholder="0.00"
                        className="text-base"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="frequency">Draw Frequency</Label>
                      <Select
                        value={jackpotForm.frequency}
                        onValueChange={(value) => setJackpotForm({ ...jackpotForm, frequency: value })}
                      >
                        <SelectTrigger className="text-base">
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3min">⚡ 3 Minutes (Fast Repeat)</SelectItem>
                          <SelectItem value="5minutes">🔥 5 Minutes</SelectItem>
                          <SelectItem value="10minutes">⏱️ 10 Minutes</SelectItem>
                          <SelectItem value="30minutes">⏰ 30 Minutes</SelectItem>
                          <SelectItem value="hourly">🕐 1 Hour</SelectItem>
                          <SelectItem value="12hours">🌓 12 Hours</SelectItem>
                          <SelectItem value="daily">📅 1 Day</SelectItem>
                          <SelectItem value="weekly">📆 1 Week</SelectItem>
                          <SelectItem value="monthly">🗓️ 1 Month</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select
                        value={jackpotForm.category}
                        onValueChange={(value) => setJackpotForm({ ...jackpotForm, category: value })}
                      >
                        <SelectTrigger className="text-base">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="quick">⚡ Quick</SelectItem>
                          <SelectItem value="hourly">⏰ Hourly</SelectItem>
                          <SelectItem value="daily">📅 Daily</SelectItem>
                          <SelectItem value="weekly">📆 Weekly</SelectItem>
                          <SelectItem value="monthly">🗓️ Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="next_draw">Custom Draw Time (Optional)</Label>
                    <Input
                      id="next_draw"
                      type="datetime-local"
                      value={jackpotForm.next_draw}
                      onChange={(e) => setJackpotForm({ ...jackpotForm, next_draw: e.target.value })}
                      className="text-base"
                    />
                    <p className="text-xs text-muted-foreground">Leave empty to auto-calculate from frequency</p>
                  </div>
                </div>

                {/* Prize Distribution Section */}
                <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-accent"></div>
                    <h3 className="font-semibold">Prize Distribution</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="winners_count">Number of Winners</Label>
                      <Input
                        id="winners_count"
                        type="number"
                        min="1"
                        max="10"
                        value={jackpotForm.winners_count}
                        onChange={(e) => setJackpotForm({ ...jackpotForm, winners_count: e.target.value })}
                        placeholder="1"
                        className="text-base"
                      />
                      <p className="text-xs text-muted-foreground">1st: 60% | 2nd-4th: 25% | 5th-10th: 15%</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="admin_commission">Admin Commission (%)</Label>
                      <Input
                        id="admin_commission"
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={jackpotForm.admin_commission_percentage}
                        onChange={(e) => setJackpotForm({ ...jackpotForm, admin_commission_percentage: e.target.value })}
                        placeholder="10"
                        className="text-base"
                      />
                      <p className="text-xs text-muted-foreground">Percentage of pool for admin</p>
                    </div>
                  </div>
                </div>

                {/* Visual Customization Section */}
                <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                    <h3 className="font-semibold">Visual Customization</h3>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="background_image">Background Image (Optional)</Label>
                    <Input
                      id="background_image"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setJackpotForm({ ...jackpotForm, background_image: file });
                        
                        // Create preview
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setImagePreview(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        } else {
                          setImagePreview(null);
                        }
                      }}
                    />
                    <p className="text-xs text-muted-foreground">Upload an image to display as the jackpot card background</p>
                    
                    {imagePreview && (
                      <div className="mt-4 relative">
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          className="w-full h-48 object-cover rounded-lg border-2 border-border"
                        />
                        <Button
                          size="sm"
                          variant="destructive"
                          className="absolute top-2 right-2"
                          onClick={() => {
                            setImagePreview(null);
                            setJackpotForm({ ...jackpotForm, background_image: null });
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="expires_at">Expiration Date/Time (Optional)</Label>
                    <Input
                      id="expires_at"
                      type="datetime-local"
                      value={jackpotForm.expires_at}
                      onChange={(e) => setJackpotForm({ ...jackpotForm, expires_at: e.target.value })}
                      className="text-base"
                    />
                    <p className="text-xs text-muted-foreground">If set, jackpot will automatically expire and close at this time</p>
                  </div>
                </div>

                <Button
                  onClick={createJackpot}
                  disabled={processing === 'create-jackpot'}
                  className="w-full py-6 text-base"
                >
                  {processing === 'create-jackpot' ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Create Jackpot'}
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
                              category: jackpot.category || "hourly",
                              winners_count: (jackpot.winners_count || 1).toString(),
                              admin_commission_percentage: (jackpot.admin_commission_percentage || 10).toString(),
                              initial_prize_pool: (jackpot.initial_prize_pool || 0).toString(),
                              background_image: null
                            });
                              setImagePreview(null);
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
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="destructive"
                              >
                                Delete
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Delete Jackpot</DialogTitle>
                                <DialogDescription>
                                  Are you sure you want to delete this jackpot? All users who purchased tickets will be refunded and notified.
                                </DialogDescription>
                              </DialogHeader>
                              <DialogFooter>
                                <Button variant="outline" onClick={(e) => {
                                  e.stopPropagation();
                                  const dialog = (e.target as HTMLElement).closest('[role="dialog"]');
                                  dialog?.querySelector('[data-state="open"]')?.dispatchEvent(new Event('click'));
                                }}>
                                  Cancel
                                </Button>
                                <Button 
                                  variant="destructive"
                                  onClick={() => deleteJackpot(jackpot.id)}
                                  disabled={processing === `delete-${jackpot.id}`}
                                >
                                  {processing === `delete-${jackpot.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete & Refund'}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
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

          <TabsContent value="withdrawals">
            <AdminWithdrawals />
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

          <TabsContent value="bonuses">
            <BonusSettingsPanel />
          </TabsContent>

          <TabsContent value="slider">
            <AdminSliderManagement />
          </TabsContent>

          <TabsContent value="email">
            <AdminEmailSender />
          </TabsContent>

          <TabsContent value="admin-settings">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Admin Settings
                </CardTitle>
                <CardDescription>Manage your admin profile and visibility settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                    <h3 className="font-semibold">Leaderboard Visibility</h3>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="hide-leaderboard" className="text-base font-medium">
                        Hide from Public Leaderboards
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        When enabled, your wins will not appear on public leaderboards. This setting helps maintain your privacy as an admin.
                      </p>
                    </div>
                    <Switch
                      id="hide-leaderboard"
                      checked={hideFromLeaderboard}
                      onCheckedChange={async (checked) => {
                        try {
                          setUpdatingLeaderboardVisibility(true);
                          const { data: { user } } = await supabase.auth.getUser();
                          
                          if (!user) {
                            toast.error('Not authenticated');
                            return;
                          }

                          const { error } = await supabase
                            .from('profiles')
                            .update({ hide_from_leaderboard: checked })
                            .eq('id', user.id);

                          if (error) throw error;

                          // Log the leaderboard visibility change
                          await supabase.from('admin_activity_log').insert({
                            admin_id: user.id,
                            action_type: 'settings_updated',
                            action_description: `${checked ? 'Hidden from' : 'Made visible on'} public leaderboards`,
                            metadata: { hide_from_leaderboard: checked }
                          });

                          setHideFromLeaderboard(checked);
                          toast.success(
                            checked 
                              ? 'You are now hidden from public leaderboards' 
                              : 'You are now visible on public leaderboards'
                          );
                        } catch (error: any) {
                          toast.error(`Failed to update setting: ${error.message}`);
                        } finally {
                          setUpdatingLeaderboardVisibility(false);
                        }
                      }}
                      disabled={updatingLeaderboardVisibility}
                    />
                  </div>
                  {updatingLeaderboardVisibility && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Updating...</span>
                    </div>
                  )}
                </div>

                <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-secondary"></div>
                    <h3 className="font-semibold">Information</h3>
                  </div>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>• When hidden, your winnings will not be displayed on any public-facing leaderboards</p>
                    <p>• This setting only affects your public visibility - your wins are still tracked internally</p>
                    <p>• Other admins can still see your activity in the admin dashboard</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bonus">
            <BonusSettingsPanel />
          </TabsContent>

          <TabsContent value="activity-log">
            <AdminActivityLog />
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
