import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Wallet, Ticket, Trophy, LogOut } from "lucide-react";
import { toast } from "sonner";
import Footer from "@/components/Footer";
import DepositDialog from "@/components/DepositDialog";
import TicketPurchaseDialog from "@/components/TicketPurchaseDialog";
import DrawDetailsModal from "@/components/DrawDetailsModal";
import TicketCard from "@/components/TicketCard";

interface WalletData {
  balance: number;
}

interface TicketData {
  id: string;
  ticket_number: string;
  purchase_price: number;
  purchased_at: string;
  jackpots: {
    name: string;
  };
}

interface WinnerData {
  id: string;
  prize_amount: number;
  claimed_at: string;
  total_participants: number;
  total_pool_amount: number;
  ticket_id?: string;
  jackpots: {
    name: string;
  };
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [wins, setWins] = useState<WinnerData[]>([]);
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [depositDialogOpen, setDepositDialogOpen] = useState(false);
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [ticketDialogOpen, setTicketDialogOpen] = useState(false);
  const [selectedJackpot, setSelectedJackpot] = useState<any>(null);
  const [activeJackpots, setActiveJackpots] = useState<any[]>([]);
  const [selectedWin, setSelectedWin] = useState<WinnerData | null>(null);
  const [drawDetailsOpen, setDrawDetailsOpen] = useState(false);

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
      // Fetch wallet balance
      const { data: walletData, error: walletError } = await supabase
        .from("wallets")
        .select("balance")
        .eq("user_id", userId)
        .single();

      if (walletError) throw walletError;
      setWallet(walletData);

      // Fetch tickets
      const { data: ticketsData, error: ticketsError } = await supabase
        .from("tickets")
        .select(`
          id,
          ticket_number,
          purchase_price,
          purchased_at,
          jackpots (name)
        `)
        .eq("user_id", userId)
        .order("purchased_at", { ascending: false })
        .limit(10);

      if (ticketsError) throw ticketsError;
      setTickets(ticketsData || []);

      // Fetch win history
      const { data: winsData, error: winsError } = await supabase
        .from("winners")
        .select(`
          id,
          prize_amount,
          claimed_at,
          total_participants,
          total_pool_amount,
          ticket_id,
          jackpots (name)
        `)
        .eq("user_id", userId)
        .order("claimed_at", { ascending: false });

      if (winsError) throw winsError;
      setWins(winsData || []);
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch user data");
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

  const handleDeposit = async () => {
    try {
      const amount = parseFloat(depositAmount);
      if (isNaN(amount) || amount <= 0) {
        toast.error("Please enter a valid amount");
        return;
      }

      const { error } = await supabase
        .from('transactions')
        .insert({
          user_id: user?.id,
          type: 'deposit',
          amount: amount,
          status: 'pending',
          reference: `Deposit request - ${new Date().toISOString()}`
        });

      if (error) throw error;

      toast.success("Deposit request submitted. Awaiting admin approval.");
      setDepositAmount("");
      setDepositDialogOpen(false);
    } catch (error: any) {
      toast.error(`Failed to submit deposit: ${error.message}`);
    }
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

      const { error } = await supabase
        .from('transactions')
        .insert({
          user_id: user?.id,
          type: 'withdrawal',
          amount: amount,
          status: 'pending',
          reference: `Withdrawal request - ${new Date().toISOString()}`
        });

      if (error) throw error;

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-12 h-12 text-primary animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
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
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full"
              onClick={() => navigate("/settings")}
            >
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-bold text-primary">
                  {user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Wallet Balance - Enhanced */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Wallet className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">Wallet Balance</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">Your available funds</p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-5xl font-bold text-primary gold-glow">
              ₦{wallet?.balance?.toFixed(2) || "0.00"}
            </div>
            <div className="flex gap-3">
              <Button 
                variant="default" 
                size="lg"
                className="flex-1"
                onClick={() => setDepositDialogOpen(true)}
              >
                <Wallet className="w-4 h-4 mr-2" />
                Deposit Funds
              </Button>
              
              <Dialog open={withdrawDialogOpen} onOpenChange={setWithdrawDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="lg" className="flex-1">
                    <LogOut className="w-4 h-4 mr-2" />
                    Withdraw
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Withdraw Funds</DialogTitle>
                    <DialogDescription>
                      Submit a withdrawal request. Admin approval required.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="withdraw-amount">Amount</Label>
                      <Input
                        id="withdraw-amount"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Available balance: ₦{wallet?.balance?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleWithdraw}>Submit Request</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid - Enhanced */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="border-border hover:border-primary/50 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Ticket className="w-5 h-5 text-primary" />
                <CardTitle className="text-base">Total Tickets</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-primary">{tickets.length}</div>
              <p className="text-sm text-muted-foreground mt-2">Tickets purchased</p>
            </CardContent>
          </Card>
          
          <Card className="border-border hover:border-primary/50 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" />
                <CardTitle className="text-base">Total Wins</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-primary">{wins.length}</div>
              <p className="text-sm text-muted-foreground mt-2">Jackpots won</p>
            </CardContent>
          </Card>
          
          <Card className="border-border hover:border-primary/50 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <CardTitle className="text-base">Total Won</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-primary">
                ₦{wins.reduce((sum, win) => sum + Number(win.prize_amount), 0).toFixed(2)}
              </div>
              <p className="text-sm text-muted-foreground mt-2">Prize money earned</p>
            </CardContent>
          </Card>
        </div>

        {/* Tickets Section - Enhanced with Grouping */}
        <Card className="border-border shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Ticket className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle>My Tickets</CardTitle>
                <CardDescription>Your tickets grouped by jackpot</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {tickets.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No tickets purchased yet</p>
            ) : (
              <div className="space-y-8">
                {Object.entries(
                  tickets.reduce((acc, ticket) => {
                    const jackpotName = ticket.jackpots.name;
                    if (!acc[jackpotName]) {
                      acc[jackpotName] = [];
                    }
                    acc[jackpotName].push(ticket);
                    return acc;
                  }, {} as Record<string, TicketData[]>)
                ).map(([jackpotName, jackpotTickets]) => (
                  <div key={jackpotName} className="space-y-3">
                    <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
                      <Trophy className="w-5 h-5" />
                      {jackpotName}
                      <span className="text-sm text-muted-foreground font-normal">
                        ({jackpotTickets.length} ticket{jackpotTickets.length !== 1 ? 's' : ''})
                      </span>
                    </h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {jackpotTickets.map((ticket) => (
                        <TicketCard
                          key={ticket.id}
                          ticketId={ticket.id}
                          ticketNumber={ticket.ticket_number}
                          purchasePrice={Number(ticket.purchase_price)}
                          purchasedAt={ticket.purchased_at}
                          jackpotName={ticket.jackpots.name}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Jackpots - Enhanced */}
        {activeJackpots.length > 0 && (
          <Card className="border-border shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Active Jackpots</CardTitle>
                  <CardDescription>Buy tickets and win big prizes!</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {activeJackpots.map((jackpot) => (
                  <div
                    key={jackpot.id}
                    className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20"
                  >
                    <h3 className="font-bold text-lg text-primary">{jackpot.name}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{jackpot.description}</p>
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span>Prize Pool:</span>
                        <span className="font-bold text-primary">₦{Number(jackpot.prize_pool).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Ticket Price:</span>
                        <span className="font-medium">₦{Number(jackpot.ticket_price).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Next Draw:</span>
                        <span className="font-medium">
                          {new Date(jackpot.next_draw).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <Button 
                      variant="hero" 
                      size="sm" 
                      className="w-full"
                      onClick={() => handleBuyTicket(jackpot)}
                    >
                      Buy Tickets
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Win History - Enhanced */}
        <Card className="border-border shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Trophy className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle>Win History</CardTitle>
                <CardDescription>Your winning tickets and prizes</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {wins.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No wins yet - keep playing!</p>
            ) : (
              <div className="space-y-4">
                {wins.map((win) => (
                  <div
                    key={win.id}
                    className="flex justify-between items-center p-4 rounded-lg bg-primary/10 border border-primary/20"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-primary">{win.jackpots.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Won on {new Date(win.claimed_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">
                          ₦{Number(win.prize_amount).toFixed(2)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedWin(win);
                            setDrawDetailsOpen(true);
                          }}
                        >
                          View
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <Footer />

      {/* Dialogs */}
      <DepositDialog
        open={depositDialogOpen}
        onOpenChange={setDepositDialogOpen}
        userEmail={user?.email || ''}
      />

      {selectedJackpot && (
        <TicketPurchaseDialog
          open={ticketDialogOpen}
          onOpenChange={setTicketDialogOpen}
          jackpot={selectedJackpot}
          walletBalance={wallet?.balance || 0}
          onSuccess={handleTicketPurchaseSuccess}
        />
      )}

      {selectedWin && (
        <DrawDetailsModal
          open={drawDetailsOpen}
          onOpenChange={setDrawDetailsOpen}
          win={selectedWin}
        />
      )}
    </div>
  );
};

export default Dashboard;
