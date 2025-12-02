import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Wallet, Ticket, Trophy, Star, TrendingUp, Zap, ArrowDown, ArrowUpRight, Clock } from "lucide-react";
import { toast } from "sonner";
import DepositDialog from "@/components/DepositDialog";
import TicketPurchaseDialog from "@/components/TicketPurchaseDialog";
import DrawDetailsModal from "@/components/DrawDetailsModal";
import TicketCard from "@/components/TicketCard";
import WinCelebrationModal from "@/components/WinCelebrationModal";
import { DashboardJackpotCard } from "@/components/DashboardJackpotCard";
import { JackpotCardSkeleton } from "@/components/JackpotCardSkeleton";
import { useDrawNotifications } from "@/hooks/useDrawNotifications";
import { useWinNotification } from "@/hooks/useWinNotification";
import { useTheme } from "@/hooks/useTheme";
import { useRealtimeAvatar } from "@/hooks/useRealtimeAvatar";
import { PublicProfileCard } from "@/components/PublicProfileCard";
import { ReferralCard } from "@/components/ReferralCard";
import { WithdrawalStatusTracker } from "@/components/WithdrawalStatusTracker";
import { SEOHead } from "@/components/SEOHead";
import MainLayout from "@/components/MainLayout";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

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
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [wins, setWins] = useState<WinnerData[]>([]);
  const [withdrawalAccount, setWithdrawalAccount] = useState<WithdrawalAccount | null>(null);

  useDrawNotifications();
  const {
    winData,
    showWinModal,
    setShowWinModal
  } = useWinNotification();
  const realtimeAvatarUrl = useRealtimeAvatar(user?.id);
  const {
    currentTheme,
    xp,
    themes
  } = useTheme(user?.id);
  useEffect(() => {
    if (winData && showWinModal) {
      setCelebrationWin({
        prizeAmount: winData.prizeAmount,
        jackpotName: winData.jackpotName
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
  const [filteredJackpots, setFilteredJackpots] = useState<any[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("prize");
  const [currentPage, setCurrentPage] = useState(1);
  const jackpotsPerPage = 7;
  const [jackpotStats, setJackpotStats] = useState<Record<string, {
    ticketsSold: number;
    participants: number;
    poolGrowth: number;
  }>>({});
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [selectedWin, setSelectedWin] = useState<WinnerData | null>(null);
  const [drawDetailsOpen, setDrawDetailsOpen] = useState(false);
  const [celebrationWin, setCelebrationWin] = useState<{
    prizeAmount: number;
    jackpotName: string;
  } | null>(null);
  useEffect(() => {
    const checkUser = async () => {
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      await Promise.all([
        fetchUserData(session.user.id),
        fetchActiveJackpots(),
        fetchWithdrawalAccount(session.user.id)
      ]);
      setLoading(false);
    };
    checkUser();
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  // Filter and sort jackpots when they change
  useEffect(() => {
    let filtered = [...activeJackpots];

    // Apply category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter(j => j.category === categoryFilter || j.frequency === categoryFilter);
    }

    // Apply sorting
    if (sortBy === "prize") {
      filtered.sort((a, b) => b.prize_pool - a.prize_pool);
    } else if (sortBy === "endTime") {
      filtered.sort((a, b) => new Date(a.next_draw).getTime() - new Date(b.next_draw).getTime());
    } else if (sortBy === "popularity") {
      filtered.sort((a, b) => (jackpotStats[b.id]?.ticketsSold || 0) - (jackpotStats[a.id]?.ticketsSold || 0));
    }
    setFilteredJackpots(filtered);
    setCurrentPage(1);
  }, [activeJackpots, categoryFilter, sortBy, jackpotStats]);

  // Real-time updates for ticket purchases
  useEffect(() => {
    if (!user || activeJackpots.length === 0) return;
    const channel = supabase.channel('ticket-purchases').on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'tickets'
    }, async payload => {
      console.log('New ticket purchased:', payload);
      // Refresh stats when a new ticket is purchased
      const jackpotIds = activeJackpots.map(j => j.id);
      await fetchJackpotStats(jackpotIds);

      // Also refresh jackpots to get updated prize pools
      await fetchActiveJackpots();
    }).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, activeJackpots]);
  const fetchUserData = async (userId: string) => {
    try {
      const {
        data: profileData
      } = await supabase.from("profiles").select("full_name, email, avatar_url, experience_points, theme, username").eq("id", userId).single();
      if (profileData) {
        setProfile(profileData as any);
      }
      const {
        data: walletData,
        error: walletError
      } = await supabase.from('wallets').select('balance').eq('user_id', userId).single();
      if (walletError) throw walletError;
      setWallet(walletData);
      const {
        data: ticketsData,
        error: ticketsError
      } = await supabase.from('tickets').select(`
          *,
          jackpots(name, status)
        `).eq('user_id', userId).order('purchased_at', {
        ascending: false
      }).limit(10);
      if (ticketsError) throw ticketsError;
      const {
        data: winnerRecords
      } = await supabase.from('winners').select('ticket_id').eq('user_id', userId);
      const winningTicketIds = new Set(winnerRecords?.map(w => w.ticket_id));
      const ticketsWithStatus = ticketsData?.map(ticket => {
        const jackpotCompleted = ticket.jackpots.status === 'completed';
        const isWinner = winningTicketIds.has(ticket.id);
        return {
          ...ticket,
          isWinner: jackpotCompleted ? isWinner : undefined
        };
      }) || [];
      setTickets(ticketsWithStatus);
      const {
        data: winsData,
        error: winsError
      } = await supabase.from('winners').select(`
          *,
          jackpots(name)
        `).eq('user_id', userId).order('claimed_at', {
        ascending: false
      });
      if (winsError) throw winsError;
      setWins(winsData || []);
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch user data");
    }
  };
  const fetchWithdrawalAccount = async (userId: string) => {
    try {
      const {
        data,
        error
      } = await supabase.from('withdrawal_accounts').select('*').eq('user_id', userId).eq('is_default', true).single();
      if (!error && data) {
        setWithdrawalAccount(data);
      }
    } catch (error: any) {
      console.error('Error fetching withdrawal account:', error);
    }
  };
  const fetchActiveJackpots = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('jackpots').select('*').eq('status', 'active').order('created_at', {
        ascending: false
      });
      if (error) throw error;
      setActiveJackpots(data || []);

      // Fetch statistics for each jackpot
      if (data && data.length > 0) {
        await fetchJackpotStats(data.map(j => j.id));
      }
    } catch (error: any) {
      console.error('Error fetching jackpots:', error);
    }
  };
  const fetchJackpotStats = async (jackpotIds: string[]) => {
    try {
      setIsLoadingStats(true);
      const stats: Record<string, {
        ticketsSold: number;
        participants: number;
        poolGrowth: number;
      }> = {};
      for (const id of jackpotIds) {
        const {
          data,
          error
        } = await supabase.from('tickets').select('user_id').eq('jackpot_id', id);

        // Get jackpot data to calculate pool growth
        const jackpot = activeJackpots.find(j => j.id === id);
        const initialPool = Number(jackpot?.initial_prize_pool || 0);
        const currentPool = Number(jackpot?.prize_pool || 0);
        const poolGrowth = initialPool > 0 ? Math.round((currentPool - initialPool) / initialPool * 100) : 0;
        if (!error && data) {
          const uniqueUsers = new Set(data.map(t => t.user_id));
          stats[id] = {
            ticketsSold: data.length,
            participants: uniqueUsers.size,
            poolGrowth
          };
        } else {
          stats[id] = {
            ticketsSold: 0,
            participants: 0,
            poolGrowth
          };
        }
      }
      setJackpotStats(stats);
      setIsLoadingStats(false);
    } catch (error) {
      console.error("Error fetching jackpot stats:", error);
      setIsLoadingStats(false);
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
      const {
        error
      } = await supabase.from('transactions').insert({
        user_id: user?.id,
        type: 'withdrawal',
        amount: amount,
        status: 'pending',
        reference: `Withdrawal request - ${new Date().toISOString()}`,
        admin_note: JSON.stringify({
          bank_name: withdrawalAccount.bank_name,
          account_number: withdrawalAccount.account_number,
          account_name: withdrawalAccount.account_name
        })
      });
      if (error) throw error;
      await supabase.from('notifications').insert({
        user_id: user?.id,
        type: 'withdrawal_placed',
        title: '📤 Withdrawal Processing',
        message: `Your withdrawal of ₦${amount.toFixed(2)} is being processed automatically. You'll be notified once completed.`,
        is_read: false
      });
      toast.success("Withdrawal is being processed automatically.");
      setWithdrawAmount("");
      setWithdrawDialogOpen(false);
    } catch (error: any) {
      toast.error(`Failed to submit withdrawal: ${error.message}`);
    }
  };

  const getXPProgress = () => {
    const themeKeys = Object.keys(themes);
    const currentIndex = themeKeys.findIndex(key => themes[key as keyof typeof themes].minXP <= xp && (themeKeys[themeKeys.indexOf(key) + 1] ? themes[themeKeys[themeKeys.indexOf(key) + 1] as keyof typeof themes].minXP > xp : true));
    const nextThemeKey = themeKeys[currentIndex + 1];
    if (!nextThemeKey) return {
      current: xp,
      max: xp,
      percentage: 100
    };
    const currentThemeXP = themes[themeKeys[currentIndex] as keyof typeof themes].minXP;
    const nextThemeXP = themes[nextThemeKey as keyof typeof themes].minXP;
    const progress = (xp - currentThemeXP) / (nextThemeXP - currentThemeXP) * 100;
    return {
      current: xp,
      max: nextThemeXP,
      percentage: Math.min(progress, 100)
    };
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Sparkles className="w-12 h-12 text-primary animate-pulse mx-auto mb-4" />
        <p className="text-muted-foreground">Loading your dashboard...</p>
      </div>
    </div>;
  }
  const xpProgress = getXPProgress();
  return (
    <MainLayout>
      <SEOHead
        title={`Dashboard - ${profile?.full_name || user?.email} | LuckyWin`}
        description="Manage your LuckyWin account, buy lottery tickets, check your wallet balance, track your wins, and participate in exciting jackpot draws."
        url="https://luckywin.name.ng/dashboard"
        type="profile"
        noIndex={true}
      />

      <div className="space-y-6 md:space-y-8 animate-fade-in">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left Main Column */}
          <div className="xl:col-span-2 space-y-6">
            {/* Wallet Card */}
            <Card className="bg-card border-border relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardContent className="p-8 relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Wallet className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-bold text-muted-foreground tracking-wider uppercase">Current Balance</span>
                    </div>
                    <div className="text-5xl md:text-6xl font-bold text-foreground mb-1 tracking-tight">
                      ₦{wallet?.balance?.toFixed(2) || "0.00"}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <div className="text-right">
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">Total Winnings</span>
                      <span className="text-xl font-bold text-green-500 flex items-center gap-1">
                        + ₦{wins.reduce((acc, win) => acc + Number(win.prize_amount), 0).toFixed(2)}
                        <ArrowUpRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 mt-8">
                  <Button
                    size="lg"
                    className="bg-primary text-black font-bold hover:bg-primary/90 px-8 rounded-xl shadow-[0_0_20px_rgba(250,204,21,0.2)]"
                    onClick={() => setDepositDialogOpen(true)}
                  >
                    <ArrowDown className="w-4 h-4 mr-2" />
                    Deposit
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="bg-muted/50 border-border text-foreground hover:bg-muted px-8 rounded-xl"
                    onClick={() => setWithdrawDialogOpen(true)}
                  >
                    <ArrowUpRight className="w-4 h-4 mr-2" />
                    Withdraw
                  </Button>
                </div>
              </CardContent>

              {/* Background decoration */}
              <Wallet className="absolute -bottom-8 -right-8 w-64 h-64 text-muted/10 rotate-[-15deg]" />
            </Card>

            {/* Active Jackpots */}
            <section id="jackpots-section" className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-6 h-6 text-primary" />
                  <h2 className="text-2xl font-bold text-foreground">Active Jackpots</h2>
                </div>

                <div className="flex gap-2">
                  <select
                    value={categoryFilter}
                    onChange={e => setCategoryFilter(e.target.value)}
                    className="bg-card border border-border text-sm rounded-lg px-3 py-2 text-foreground focus:ring-1 focus:ring-primary outline-none"
                  >
                    <option value="all">All Categories</option>
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {isLoadingStats ? (
                  [1, 2, 3, 4].map(i => <JackpotCardSkeleton key={i} />)
                ) : (
                  <>
                    {filteredJackpots.slice((currentPage - 1) * jackpotsPerPage, currentPage * jackpotsPerPage).map((jackpot, index) => {
                      const isFeatured = index === 0 || index === 1;
                      const getCategoryStyles = (cat: string) => {
                        switch (cat?.toLowerCase()) {
                          case 'hourly': return { icon: <Clock className="w-5 h-5 text-blue-400" />, color: "text-blue-400", bgIcon: "bg-blue-400/10", glow: "hover:shadow-blue-500/20", border: "hover:border-blue-500/50" };
                          case 'daily': return { icon: <Zap className="w-5 h-5 text-yellow-500" />, color: "text-yellow-500", bgIcon: "bg-yellow-500/10", glow: "hover:shadow-yellow-500/20", border: "hover:border-yellow-500/50" };
                          case 'weekly': return { icon: <Trophy className="w-5 h-5 text-purple-500" />, color: "text-purple-500", bgIcon: "bg-purple-500/10", glow: "hover:shadow-purple-500/20", border: "hover:border-purple-500/50" };
                          default: return { icon: <Star className="w-5 h-5 text-green-500" />, color: "text-green-500", bgIcon: "bg-green-500/10", glow: "hover:shadow-green-500/20", border: "hover:border-green-500/50" };
                        }
                      };
                      const styles = getCategoryStyles(jackpot.category);

                      return (
                        <DashboardJackpotCard
                          key={jackpot.id}
                          index={index}
                          jackpotId={jackpot.id}
                          title={jackpot.name}
                          prize={jackpot.prize_pool}
                          ticketPrice={jackpot.ticket_price}
                          endTime={jackpot.next_draw}
                          category={jackpot.category || 'daily'}
                          subtitle={jackpot.category ? `${jackpot.category} Draw` : 'Daily Draw'}
                          icon={styles.icon}
                          color={styles.color}
                          bgIcon={styles.bgIcon}
                          featured={isFeatured}
                          glowColor={styles.glow}
                          borderColor={styles.border}
                          ticketsSold={jackpotStats[jackpot.id]?.ticketsSold || 0}
                          participants={jackpotStats[jackpot.id]?.participants || 0}
                          poolGrowth={jackpotStats[jackpot.id]?.poolGrowth || 0}
                          onBuyClick={() => handleBuyTicket(jackpot)}
                        />
                      );
                    })}

                    {/* Add placeholder card if odd number of jackpots */}
                    {filteredJackpots.slice((currentPage - 1) * jackpotsPerPage, currentPage * jackpotsPerPage).length % 2 !== 0 && (
                      <div className="bg-muted/30 rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center p-8 hover:bg-muted/50 hover:border-primary/50 transition-all cursor-pointer group h-full min-h-[220px]">
                        <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center text-muted-foreground group-hover:text-yellow-500 group-hover:bg-muted/80 group-hover:scale-110 transition-all mb-4">
                          <ArrowUpRight size={28} />
                        </div>
                        <span className="text-muted-foreground font-medium group-hover:text-foreground transition-colors">View All Available Draws</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </section>

            {/* Recent Activity */}
            <div className="columns-1 lg:columns-2 gap-6 space-y-6">
              <Card className="bg-card border-border break-inside-avoid mb-6">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Ticket className="w-5 h-5 text-primary" />
                    <CardTitle className="text-foreground">Recent Tickets</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  {tickets.length > 0 ? (
                    <div className="space-y-2">
                      {tickets.slice(0, 5).map(ticket => (
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

              <Card className="bg-card border-border">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-primary" />
                    <CardTitle className="text-foreground">Recent Wins</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  {wins.length > 0 ? (
                    <div className="space-y-3">
                      {wins.slice(0, 5).map(win => (
                        <div
                          key={win.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/10 hover:bg-primary/10 transition-colors cursor-pointer"
                          onClick={() => {
                            setSelectedWin(win);
                            setDrawDetailsOpen(true);
                          }}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-foreground truncate">{win.jackpots.name}</p>
                            <p className="text-xs text-muted-foreground">{new Date(win.claimed_at).toLocaleDateString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-primary">₦{win.prize_amount.toLocaleString()}</p>
                            <p className="text-[10px] text-green-500 uppercase font-bold">Paid</p>
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
          </div>

          {/* Right Sidebar Column */}
          <div className="space-y-6">
            {/* XP / VIP Card */}
            <Card className="bg-card border-border relative overflow-hidden">
              <CardContent className="p-8 flex flex-col justify-center h-full relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-purple-500/20 rounded-xl">
                      <Trophy className="w-6 h-6 text-purple-500" />
                    </div>
                    <div>
                      <div className="text-lg font-bold text-foreground">VIP Level</div>
                      <div className="text-xs text-purple-400 font-medium uppercase tracking-wider">Bronze Member</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-foreground">{xp.toLocaleString()}</div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Total XP</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    <span>Progress to Silver</span>
                    <span>{Math.round(xpProgress.percentage)}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-600 to-purple-400 transition-all duration-1000 ease-out"
                      style={{ width: `${xpProgress.percentage}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-1 text-xs text-yellow-500 mt-2">
                    <Star className="w-3 h-3 fill-yellow-500" />
                    <span>{xpProgress.max - xp} XP remaining to unlock next tier.</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <PublicProfileCard
              profile={profile}
              avatarUrl={realtimeAvatarUrl || profile?.avatar_url}
              stats={{
                xp: xp,
                totalWins: wins.length,
                totalTickets: tickets.length
              }}
            />

            <ReferralCard userId={user?.id || ''} />
          </div>
        </div>


      </div>

      {/* Dialogs */}
      <DepositDialog open={depositDialogOpen} onOpenChange={setDepositDialogOpen} userEmail={user?.email || ''} />
      <TicketPurchaseDialog
        open={ticketDialogOpen}
        onOpenChange={setTicketDialogOpen}
        jackpot={selectedJackpot}
        walletBalance={wallet?.balance || 0}
        onSuccess={handleTicketPurchaseSuccess}
      />

      <Dialog open={withdrawDialogOpen} onOpenChange={setWithdrawDialogOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border text-card-foreground">
          <DialogHeader>
            <DialogTitle>Withdraw Funds</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Enter the amount you wish to withdraw to your default account.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-foreground">Amount (₦)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="bg-muted/20 border-border text-foreground placeholder:text-muted-foreground"
              />
              <p className="text-xs text-muted-foreground">
                Available Balance: <span className="text-primary font-bold">₦{wallet?.balance?.toFixed(2) || "0.00"}</span>
              </p>
            </div>
            {withdrawalAccount ? (
              <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                <p className="text-xs font-bold text-primary mb-1">Receiving Account</p>
                <p className="text-sm font-medium text-foreground">{withdrawalAccount.bank_name}</p>
                <p className="text-xs text-muted-foreground">{withdrawalAccount.account_number} • {withdrawalAccount.account_name}</p>
              </div>
            ) : (
              <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20 text-red-400 text-sm">
                No default withdrawal account found. Please add one in Settings.
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWithdrawDialogOpen(false)} className="border-border text-muted-foreground hover:bg-muted hover:text-foreground">Cancel</Button>
            <Button onClick={handleWithdraw} className="bg-primary text-black hover:bg-primary/90 font-bold">Confirm Withdrawal</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedWin && (
        <DrawDetailsModal
          open={drawDetailsOpen}
          onOpenChange={setDrawDetailsOpen}
          win={selectedWin}
          userTickets={tickets.filter(t => t.jackpot_id === selectedWin.jackpot_id)}
        />
      )}

      {celebrationWin && (
        <WinCelebrationModal
          open={!!celebrationWin}
          onOpenChange={() => setCelebrationWin(null)}
          prizeAmount={celebrationWin.prizeAmount}
          jackpotName={celebrationWin.jackpotName}
        />
      )}
    </MainLayout>
  );
};

export default Dashboard;