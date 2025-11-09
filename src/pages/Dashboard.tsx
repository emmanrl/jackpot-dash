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

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      setUser(session.user);
      await fetchUserData(session.user.id);
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
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <Sparkles className="w-6 h-6 text-primary" />
            <span className="text-xl font-bold">JackpotWin</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Welcome back</p>
              <p className="font-medium">{user?.email}</p>
            </div>
            <Button variant="outline" size="icon" onClick={handleSignOut}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Wallet Balance */}
        <Card className="mb-8 border-border bg-gradient-to-br from-card to-card/80">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-primary" />
              <CardTitle>Wallet Balance</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-primary gold-glow">
              ₦{wallet?.balance?.toFixed(2) || "0.00"}
            </div>
            <div className="flex gap-4 mt-4">
              <Dialog open={depositDialogOpen} onOpenChange={setDepositDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="hero" size="sm">
                    Deposit Funds
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Deposit Funds</DialogTitle>
                    <DialogDescription>
                      Submit a deposit request. Admin approval required.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="deposit-amount">Amount</Label>
                      <Input
                        id="deposit-amount"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleDeposit}>Submit Request</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              
              <Dialog open={withdrawDialogOpen} onOpenChange={setWithdrawDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
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

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-lg">Total Tickets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{tickets.length}</div>
            </CardContent>
          </Card>
          
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-lg">Total Wins</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{wins.length}</div>
            </CardContent>
          </Card>
          
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-lg">Total Won</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                ₦{wins.reduce((sum, win) => sum + Number(win.prize_amount), 0).toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tickets Section */}
        <Card className="mb-8 border-border">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Ticket className="w-5 h-5 text-primary" />
              <CardTitle>My Tickets</CardTitle>
            </div>
            <CardDescription>Your recent ticket purchases</CardDescription>
          </CardHeader>
          <CardContent>
            {tickets.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No tickets purchased yet</p>
            ) : (
              <div className="space-y-4">
                {tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="flex justify-between items-center p-4 rounded-lg bg-muted/50 border border-border"
                  >
                    <div>
                      <p className="font-medium text-primary">#{ticket.ticket_number}</p>
                      <p className="text-sm text-muted-foreground">{ticket.jackpots.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">₦{Number(ticket.purchase_price).toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(ticket.purchased_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Win History */}
        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              <CardTitle>Win History</CardTitle>
            </div>
            <CardDescription>Your winning tickets</CardDescription>
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
                    <div>
                      <p className="font-medium text-primary">{win.jackpots.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Won on {new Date(win.claimed_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">
                        ₦{Number(win.prize_amount).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;
