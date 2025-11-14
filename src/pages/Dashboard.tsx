import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Wallet, Ticket, Trophy, LogOut, Star, TrendingUp, Zap, Settings, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import Footer from "@/components/Footer";
import DepositDialog from "@/components/DepositDialog";
import TicketPurchaseDialog from "@/components/TicketPurchaseDialog";
import DrawDetailsModal from "@/components/DrawDetailsModal";
import TicketCard from "@/components/TicketCard";
import WinCelebrationModal from "@/components/WinCelebrationModal";
import JackpotCard from "@/components/JackpotCard";
import { useDrawNotifications } from "@/hooks/useDrawNotifications";
import { useWinNotification } from "@/hooks/useWinNotification";
import { useTheme } from "@/hooks/useTheme";
import NotificationBell from "@/components/NotificationBell";
import { useRealtimeAvatar } from "@/hooks/useRealtimeAvatar";
import { PublicProfileCard } from "@/components/PublicProfileCard";

interface WalletData {
  balance: number;
}

interface TicketData {
  id: string;
  ticket_number: string;
  purchase_price: number;
  purchased_at: string;
  jackpot_id: string;
  jackpots: {
    name: string;
  };
  isWinner?: boolean;
}

interface WinnerData {
  id: string;
  prize_amount: number;
  claimed_at: string;
  total_participants: number;
  total_pool_amount: number;
  ticket_id?: string;
  jackpot_id: string;
  jackpots: {
    name: string;
  };
}

interface WithdrawalAccount {
  id: string;
  bank_name: string;
  account_number: string;
  account_name: string;
  is_default: boolean;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [wins, setWins] = useState<WinnerData[]>([]);
  const [withdrawalAccount, setWithdrawalAccount] = useState<WithdrawalAccount | null>(null);
  
  useDrawNotifications();
  const { winData, showWinModal, setShowWinModal } = useWinNotification();
  const realtimeAvatarUrl = useRealtimeAvatar(user?.id);
  const { currentTheme, xp, updateTheme, unlockedThemes, themes } = useTheme(user?.id);
  
  useEffect(() => {
    if (winData && showWinModal) {
      setCelebrationWin({
        prizeAmount: winData.prizeAmount,
        jackpotName: winData.jackpotName,
      });
      setShowWinModal(false);
    }
  }, [winData, showWinModal, setShowWinModal]);
  
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [depositDialogOpen, setDepositDialogOpen] = useState(false);
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [ticketDialogOpen, setTicketDialogOpen] = useState(false);
  const [selectedJackpot, setSelectedJackpot] = useState<any>(null);
  const [activeJackpots, setActiveJackpots] = useState<any[]>([]);
  const [selectedWin, setSelectedWin] = useState<WinnerData | null>(null);
  const [drawDetailsOpen, setDrawDetailsOpen] = useState(false);
  const [celebrationWin, setCelebrationWin] = useState<{
    prizeAmount: number;
    jackpotName: string;
  } | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      setUser(session.user);
      await fetchUserData(session.user.id);
      await fetchActiveJackpots();
      await fetchWithdrawalAccount(session.user.id);
      setLoading(false);
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchUserData = async (userId: string) => {
    try {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name, email, avatar_url, experience_points, theme")
        .eq("id", userId)
        .single();
      
      if (profileData) {
        setProfile(profileData as any);
      }

      const { data: walletData, error: walletError } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', userId)
        .single();

      if (walletError) throw walletError;
      setWallet(walletData);

      const { data: ticketsData, error: ticketsError } = await supabase
        .from('tickets')
        .select(`
          *,
          jackpots(name)
        `)
        .eq('user_id', userId)
        .order('purchased_at', { ascending: false })
        .limit(10);

      if (ticketsError) throw ticketsError;

      const { data: winnerRecords } = await supabase
        .from('winners')
        .select('ticket_id')
        .eq('user_id', userId);

      const winningTicketIds = new Set(winnerRecords?.map(w => w.ticket_id));
      const ticketsWithStatus = ticketsData?.map(ticket => ({
        ...ticket,
        isWinner: winningTicketIds.has(ticket.id)
      })) || [];

      setTickets(ticketsWithStatus);

      const { data: winsData, error: winsError } = await supabase
        .from('winners')
        .select(`
          *,
          jackpots(name)
        `)
        .eq('user_id', userId)
        .order('claimed_at', { ascending: false });

      if (winsError) throw winsError;
      setWins(winsData || []);
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch user data");
    }
  };

  const fetchWithdrawalAccount = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('withdrawal_accounts')
        .select('*')
        .eq('user_id', userId)
        .eq('is_default', true)
        .single();

      if (!error && data) {
        setWithdrawalAccount(data);
      }
    } catch (error: any) {
      console.error('Error fetching withdrawal account:', error);
    }
  };

  const fetchActiveJackpots = async () => {
    try {
      const { data, error } = await supabase
        .from('jackpots')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setActiveJackpots(data || []);
    } catch (error: any) {
      console.error('Error fetching jackpots:', error);
    }
  };

  const handleBuyTicket = (jackpot: any) => {
    setSelectedJackpot(jackpot);
    setTicketDialogOpen(true);
  };

  const handleTicketPurchaseSuccess = async () => {
    await fetchUserData(user!.id);
    await fetchActiveJackpots();
  };

  const handleWithdraw = async () => {
    try {
      const amount = parseFloat(withdrawAmount);
      if (isNaN(amount) || amount <= 0) {
        toast.error("Please enter a valid amount");
        return;
      }

      if (amount > (wallet?.balance || 0)) {
        toast.error("Insufficient balance");
        return;
      }

      if (!withdrawalAccount) {
        toast.error("Please add a withdrawal account in Settings first");
        return;
      }

      const { error } = await supabase
        .from('transactions')
        .insert({
          user_id: user?.id,
          type: 'withdrawal',
          amount: amount,
          status: 'pending',
          reference: `Withdrawal request - ${new Date().toISOString()}`,
          admin_note: JSON.stringify({
            bank_name: withdrawalAccount.bank_name,
            account_number: withdrawalAccount.account_number,
            account_name: withdrawalAccount.account_name,
          }),
        });

      if (error) throw error;

      await supabase.from('notifications').insert({
        user_id: user?.id,
        type: 'withdrawal_placed',
        title: '📤 Withdrawal Request Submitted',
        message: `Your withdrawal request of ₦${amount.toFixed(2)} is being processed. You'll be notified once approved.`,
        is_read: false
      });

      toast.success("Withdrawal request submitted. Awaiting admin approval.");
      setWithdrawAmount("");
      setWithdrawDialogOpen(false);
    } catch (error: any) {
      toast.error(`Failed to submit withdrawal: ${error.message}`);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name.charAt(0).toUpperCase();
    }
    if (profile?.email) {
      return profile.email.charAt(0).toUpperCase();
    }
    return "U";
  };

  const getXPProgress = () => {
    const themeKeys = Object.keys(themes);
    const currentIndex = themeKeys.findIndex(key => themes[key as keyof typeof themes].minXP <= xp && 
      (themeKeys[themeKeys.indexOf(key) + 1] ? themes[themeKeys[themeKeys.indexOf(key) + 1] as keyof typeof themes].minXP > xp : true));
    const nextThemeKey = themeKeys[currentIndex + 1];
    
    if (!nextThemeKey) return { current: xp, max: xp, percentage: 100 };
    
    const currentThemeXP = themes[themeKeys[currentIndex] as keyof typeof themes].minXP;
    const nextThemeXP = themes[nextThemeKey as keyof typeof themes].minXP;
    const progress = ((xp - currentThemeXP) / (nextThemeXP - currentThemeXP)) * 100;
    
    return { current: xp, max: nextThemeXP, percentage: Math.min(progress, 100) };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Sparkles className="w-12 h-12 text-primary animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const xpProgress = getXPProgress();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
              <div className="p-2 bg-primary/10 rounded-lg">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                JackpotWin
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              <NotificationBell />
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 h-auto p-2">
                    <Avatar className="h-10 w-10 border-2 border-primary/20">
                      {(realtimeAvatarUrl || profile?.avatar_url) ? (
                        <AvatarImage src={realtimeAvatarUrl || profile.avatar_url} alt={profile?.full_name || user?.email || "User"} />
                      ) : null}
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden md:flex flex-col items-start">
                      <span className="text-sm font-semibold">{profile?.full_name || user?.email}</span>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-primary" />
                        <span className="text-xs text-muted-foreground">{xp} XP</span>
                      </div>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{profile?.full_name || "User"}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium">Experience</span>
                      <Badge variant="secondary" className="text-xs">
                        <Star className="w-3 h-3 mr-1" />
                        {xp} XP
                      </Badge>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-500"
                        style={{ width: `${xpProgress.percentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {xpProgress.max - xp} XP to next theme
                    </p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                    <Trophy className="w-4 h-4 mr-2" />
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/profile")}>
                    <UserIcon className="w-4 h-4 mr-2" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/settings")}>
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 md:py-8 space-y-6 md:space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card shadow-lg col-span-1 md:col-span-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Wallet className="w-5 h-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg md:text-xl">Wallet Balance</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-3xl md:text-5xl font-bold text-primary">
                ₦{wallet?.balance?.toFixed(2) || "0.00"}
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button 
                  variant="default" 
                  size="lg"
                  className="flex-1"
                  onClick={() => setDepositDialogOpen(true)}
                >
                  <Wallet className="w-4 h-4 mr-2" />
                  Deposit
                </Button>
                
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="flex-1"
                  onClick={() => setWithdrawDialogOpen(true)}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Withdraw
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Star className="w-5 h-5 text-primary" />
                </div>
                <CardTitle className="text-lg">Your Progress</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-3xl font-bold text-primary">
                {xp} XP
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Current Theme</span>
                  <span className="font-medium text-foreground capitalize">{currentTheme}</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-500"
                    style={{ width: `${xpProgress.percentage}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {xpProgress.max - xp} XP to unlock next theme
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Public Profile Card */}
        <PublicProfileCard
          profile={profile}
          avatarUrl={realtimeAvatarUrl || profile?.avatar_url}
          stats={{
            xp: xp,
            totalWins: wins.length,
            totalTickets: tickets.length,
          }}
        />

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-6 h-6 text-primary" />
              <h2 className="text-2xl md:text-3xl font-bold">Active Jackpots</h2>
            </div>
            <Badge variant="secondary" className="hidden md:inline-flex">
              <TrendingUp className="w-3 h-3 mr-1" />
              {activeJackpots.length} Live
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {activeJackpots.map((jackpot) => (
              <JackpotCard
                key={jackpot.id}
                jackpotId={jackpot.id}
                title={jackpot.name}
                prize={jackpot.prize_pool}
                ticketPrice={jackpot.ticket_price}
                endTime={jackpot.next_draw}
                category={jackpot.category}
                onBuyClick={() => handleBuyTicket(jackpot)}
              />
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Ticket className="w-5 h-5 text-primary" />
                <CardTitle>Recent Tickets</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {tickets.length > 0 ? (
                <div className="space-y-2">
                  {tickets.slice(0, 5).map((ticket) => (
                    <TicketCard 
                      key={ticket.id}
                      ticketId={ticket.id}
                      ticketNumber={ticket.ticket_number}
                      purchasePrice={ticket.purchase_price}
                      purchasedAt={ticket.purchased_at}
                      jackpotName={ticket.jackpots.name}
                      isWinner={ticket.isWinner}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No tickets yet. Buy your first ticket above!</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" />
                <CardTitle>Recent Wins</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {wins.length > 0 ? (
                <div className="space-y-3">
                  {wins.slice(0, 5).map((win) => (
                    <div 
                      key={win.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/10 hover:bg-primary/10 transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedWin(win);
                        setDrawDetailsOpen(true);
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{win.jackpots.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(win.claimed_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right ml-2">
                        <p className="font-bold text-primary">+₦{win.prize_amount.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">+10 XP</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No wins yet. Keep playing!</p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />

      <DepositDialog
        open={depositDialogOpen}
        onOpenChange={setDepositDialogOpen}
        userEmail={user?.email || ""}
      />

      <Dialog open={withdrawDialogOpen} onOpenChange={setWithdrawDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Withdraw Funds</DialogTitle>
            <DialogDescription>
              Submit a withdrawal request. Admin approval required.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {withdrawalAccount ? (
              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <p className="text-sm font-semibold mb-2">Withdrawal Account</p>
                <div className="space-y-1 text-sm">
                  <p className="text-muted-foreground">Bank: <span className="text-foreground font-medium">{withdrawalAccount.bank_name}</span></p>
                  <p className="text-muted-foreground">Account: <span className="text-foreground font-medium">{withdrawalAccount.account_number}</span></p>
                  <p className="text-muted-foreground">Name: <span className="text-foreground font-medium">{withdrawalAccount.account_name}</span></p>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-destructive">
                  No withdrawal account found. Please add one in Settings first.
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => {
                    setWithdrawDialogOpen(false);
                    navigate("/settings");
                  }}
                >
                  Go to Settings
                </Button>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="withdraw-amount">Amount</Label>
              <Input
                id="withdraw-amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                disabled={!withdrawalAccount}
              />
              <p className="text-sm text-muted-foreground">
                Available: ₦{wallet?.balance?.toFixed(2) || "0.00"}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button 
              onClick={handleWithdraw}
              disabled={!withdrawalAccount}
            >
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <TicketPurchaseDialog
        open={ticketDialogOpen}
        onOpenChange={setTicketDialogOpen}
        jackpot={selectedJackpot}
        walletBalance={wallet?.balance || 0}
        onSuccess={handleTicketPurchaseSuccess}
      />

      {selectedWin && (
        <DrawDetailsModal
          open={drawDetailsOpen}
          onOpenChange={setDrawDetailsOpen}
          win={selectedWin}
        />
      )}

      {celebrationWin && (
        <WinCelebrationModal
          open={!!celebrationWin}
          onOpenChange={(open) => !open && setCelebrationWin(null)}
          prizeAmount={celebrationWin.prizeAmount}
          jackpotName={celebrationWin.jackpotName}
        />
      )}
    </div>
  );
};

export default Dashboard;
