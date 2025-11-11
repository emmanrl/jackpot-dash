import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Trophy, Ticket, DollarSign, ArrowLeft, Medal } from "lucide-react";
import { Sparkles } from "lucide-react";
import Footer from "@/components/Footer";

interface LeaderboardEntry {
  user_id: string;
  email: string;
  full_name: string | null;
  total_wins?: number;
  total_amount?: number;
  total_tickets?: number;
  biggest_win?: number;
}

type TimePeriod = "daily" | "weekly" | "monthly" | "all";

const Leaderboard = () => {
  const navigate = useNavigate();
  const [topWinners, setTopWinners] = useState<LeaderboardEntry[]>([]);
  const [topTicketBuyers, setTopTicketBuyers] = useState<LeaderboardEntry[]>([]);
  const [biggestWins, setBiggestWins] = useState<LeaderboardEntry[]>([]);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboardData();
  }, [timePeriod]);

  const getDateFilter = () => {
    const now = new Date();
    switch (timePeriod) {
      case "daily":
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        return today.toISOString();
      case "weekly":
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return weekAgo.toISOString();
      case "monthly":
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return monthAgo.toISOString();
      default:
        return null;
    }
  };

  const fetchLeaderboardData = async () => {
    setLoading(true);
    try {
      const dateFilter = getDateFilter();

      // Top Winners (most wins)
      let winnersQuery = supabase
        .from("winners")
        .select(`
          user_id,
          prize_amount,
          claimed_at,
          profiles!inner(email, full_name)
        `);

      if (dateFilter) {
        winnersQuery = winnersQuery.gte("claimed_at", dateFilter);
      }

      const { data: winnersData, error: winnersError } = await winnersQuery;

      if (winnersError) throw winnersError;

      // Aggregate winners data
      const winnersMap = new Map<string, LeaderboardEntry>();
      winnersData?.forEach((win: any) => {
        const userId = win.user_id;
        if (!winnersMap.has(userId)) {
          winnersMap.set(userId, {
            user_id: userId,
            email: win.profiles.email,
            full_name: win.profiles.full_name,
            total_wins: 0,
            total_amount: 0,
            biggest_win: 0,
          });
        }
        const entry = winnersMap.get(userId)!;
        entry.total_wins = (entry.total_wins || 0) + 1;
        entry.total_amount = (entry.total_amount || 0) + Number(win.prize_amount);
        entry.biggest_win = Math.max(entry.biggest_win || 0, Number(win.prize_amount));
      });

      const sortedWinners = Array.from(winnersMap.values())
        .sort((a, b) => (b.total_wins || 0) - (a.total_wins || 0))
        .slice(0, 10);

      setTopWinners(sortedWinners);

      // Biggest Wins
      const sortedBiggestWins = Array.from(winnersMap.values())
        .sort((a, b) => (b.biggest_win || 0) - (a.biggest_win || 0))
        .slice(0, 10);

      setBiggestWins(sortedBiggestWins);

      // Top Ticket Buyers
      let ticketsQuery = supabase
        .from("tickets")
        .select(`
          user_id,
          purchased_at,
          profiles!inner(email, full_name)
        `);

      if (dateFilter) {
        ticketsQuery = ticketsQuery.gte("purchased_at", dateFilter);
      }

      const { data: ticketsData, error: ticketsError } = await ticketsQuery;

      if (ticketsError) throw ticketsError;

      // Aggregate tickets data
      const ticketsMap = new Map<string, LeaderboardEntry>();
      ticketsData?.forEach((ticket: any) => {
        const userId = ticket.user_id;
        if (!ticketsMap.has(userId)) {
          ticketsMap.set(userId, {
            user_id: userId,
            email: ticket.profiles.email,
            full_name: ticket.profiles.full_name,
            total_tickets: 0,
          });
        }
        const entry = ticketsMap.get(userId)!;
        entry.total_tickets = (entry.total_tickets || 0) + 1;
      });

      const sortedTicketBuyers = Array.from(ticketsMap.values())
        .sort((a, b) => (b.total_tickets || 0) - (a.total_tickets || 0))
        .slice(0, 10);

      setTopTicketBuyers(sortedTicketBuyers);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (entry: LeaderboardEntry) => {
    if (entry.full_name) {
      return entry.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return entry.email.charAt(0).toUpperCase();
  };

  const getDisplayName = (entry: LeaderboardEntry) => {
    if (entry.full_name) return entry.full_name;
    return entry.email.split("@")[0];
  };

  const getMedalIcon = (index: number) => {
    if (index === 0) return <Medal className="w-6 h-6 text-yellow-500" />;
    if (index === 1) return <Medal className="w-6 h-6 text-gray-400" />;
    if (index === 2) return <Medal className="w-6 h-6 text-amber-600" />;
    return null;
  };

  const LeaderboardTable = ({
    entries,
    type,
  }: {
    entries: LeaderboardEntry[];
    type: "winners" | "tickets" | "biggest";
  }) => (
    <div className="space-y-3">
      {entries.map((entry, index) => (
        <Card key={entry.user_id} className="border-border hover:border-primary/50 transition-all">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="text-2xl font-bold text-muted-foreground w-8 text-center">
                  {getMedalIcon(index) || `#${index + 1}`}
                </div>
                <Avatar className="w-12 h-12 border-2 border-primary/20">
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    {getInitials(entry)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-bold text-lg">{getDisplayName(entry)}</p>
                  <p className="text-sm text-muted-foreground">{entry.email}</p>
                </div>
              </div>
              <div className="text-right">
                {type === "winners" && (
                  <>
                    <p className="text-2xl font-bold text-primary">{entry.total_wins}</p>
                    <p className="text-xs text-muted-foreground">
                      ₦{(entry.total_amount || 0).toLocaleString()}
                    </p>
                  </>
                )}
                {type === "tickets" && (
                  <>
                    <p className="text-2xl font-bold text-primary">{entry.total_tickets}</p>
                    <p className="text-xs text-muted-foreground">Tickets</p>
                  </>
                )}
                {type === "biggest" && (
                  <>
                    <p className="text-2xl font-bold text-primary">
                      ₦{(entry.biggest_win || 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">Biggest Win</p>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  JackpotWin
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Trophy className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Top Players</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Leaderboard</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            See who's winning big and leading the pack
          </p>
        </div>

        {/* Time Period Filter */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex gap-2 p-1 bg-muted rounded-lg">
            {(["daily", "weekly", "monthly", "all"] as TimePeriod[]).map((period) => (
              <Button
                key={period}
                variant={timePeriod === period ? "default" : "ghost"}
                size="sm"
                onClick={() => setTimePeriod(period)}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Leaderboard Tabs */}
        <Tabs defaultValue="winners" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-2xl mx-auto">
            <TabsTrigger value="winners">
              <Trophy className="w-4 h-4 mr-2" />
              Most Wins
            </TabsTrigger>
            <TabsTrigger value="tickets">
              <Ticket className="w-4 h-4 mr-2" />
              Most Tickets
            </TabsTrigger>
            <TabsTrigger value="biggest">
              <DollarSign className="w-4 h-4 mr-2" />
              Biggest Wins
            </TabsTrigger>
          </TabsList>

          <TabsContent value="winners">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-primary" />
                  Top Winners
                </CardTitle>
                <CardDescription>Players with the most jackpot wins</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-center py-8 text-muted-foreground">Loading...</p>
                ) : topWinners.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">
                    No winners yet for this period
                  </p>
                ) : (
                  <LeaderboardTable entries={topWinners} type="winners" />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tickets">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ticket className="w-5 h-5 text-primary" />
                  Top Ticket Buyers
                </CardTitle>
                <CardDescription>Players with the most tickets purchased</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-center py-8 text-muted-foreground">Loading...</p>
                ) : topTicketBuyers.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">
                    No tickets purchased yet for this period
                  </p>
                ) : (
                  <LeaderboardTable entries={topTicketBuyers} type="tickets" />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="biggest">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-primary" />
                  Biggest Wins
                </CardTitle>
                <CardDescription>Largest single jackpot prizes won</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-center py-8 text-muted-foreground">Loading...</p>
                ) : biggestWins.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">
                    No wins recorded yet for this period
                  </p>
                ) : (
                  <LeaderboardTable entries={biggestWins} type="biggest" />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default Leaderboard;
