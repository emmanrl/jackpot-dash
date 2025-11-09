import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, Users, DollarSign, Trophy, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";

interface StatsData {
  totalPrizePool: number;
  totalTickets: number;
  totalParticipants: number;
  totalWinners: number;
  jackpotStats: Array<{
    name: string;
    tickets: number;
    prizePool: number;
  }>;
  recentWins: Array<{
    date: string;
    amount: number;
  }>;
}

const Statistics = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StatsData>({
    totalPrizePool: 0,
    totalTickets: 0,
    totalParticipants: 0,
    totalWinners: 0,
    jackpotStats: [],
    recentWins: []
  });

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      await fetchStatistics();
      setLoading(false);
    };

    checkAuthAndFetch();
  }, [navigate]);

  const fetchStatistics = async () => {
    try {
      // Fetch jackpots with prize pools
      const { data: jackpots } = await supabase
        .from('jackpots')
        .select('id, name, prize_pool');

      // Fetch total tickets count
      const { count: totalTickets } = await supabase
        .from('tickets')
        .select('*', { count: 'exact', head: true });

      // Fetch unique participants
      const { data: uniqueUsers } = await supabase
        .from('tickets')
        .select('user_id', { count: 'exact' });

      // Fetch winners
      const { count: totalWinners } = await supabase
        .from('winners')
        .select('*', { count: 'exact', head: true });

      // Fetch recent wins for chart
      const { data: recentWins } = await supabase
        .from('winners')
        .select('prize_amount, claimed_at')
        .order('claimed_at', { ascending: false })
        .limit(10);

      // Calculate jackpot statistics
      const jackpotStats = await Promise.all(
        (jackpots || []).map(async (jackpot) => {
          const { count } = await supabase
            .from('tickets')
            .select('*', { count: 'exact', head: true })
            .eq('jackpot_id', jackpot.id);

          return {
            name: jackpot.name,
            tickets: count || 0,
            prizePool: Number(jackpot.prize_pool)
          };
        })
      );

      // Process wins by date
      const winsGrouped = (recentWins || []).reduce((acc, win) => {
        const date = new Date(win.claimed_at).toLocaleDateString();
        const existing = acc.find(item => item.date === date);
        if (existing) {
          existing.amount += Number(win.prize_amount);
        } else {
          acc.push({ date, amount: Number(win.prize_amount) });
        }
        return acc;
      }, [] as Array<{ date: string; amount: number }>);

      const uniqueParticipants = new Set(uniqueUsers?.map(u => u.user_id)).size;
      const totalPrizePool = (jackpots || []).reduce((sum, j) => sum + Number(j.prize_pool), 0);

      setStats({
        totalPrizePool,
        totalTickets: totalTickets || 0,
        totalParticipants: uniqueParticipants,
        totalWinners: totalWinners || 0,
        jackpotStats,
        recentWins: winsGrouped.reverse()
      });

    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const COLORS = ['#e3a008', '#1a73e8', '#34a853', '#ea4335', '#fbbc04'];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading statistics...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-2xl font-bold">Jackpot Statistics</h1>
          <div className="w-24" />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Key Metrics */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="border-border bg-gradient-to-br from-card to-card/80">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Total Prize Pool
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary gold-glow">
                ₦{stats.totalPrizePool.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Total Tickets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {stats.totalTickets}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="w-4 h-4" />
                Participants
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {stats.totalParticipants}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                Total Winners
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {stats.totalWinners}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Jackpot Participation */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Jackpot Participation</CardTitle>
              <CardDescription>Tickets sold per jackpot</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.jackpotStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--foreground))" />
                  <YAxis stroke="hsl(var(--foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      borderColor: 'hsl(var(--border))' 
                    }}
                  />
                  <Bar dataKey="tickets" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Prize Pool Distribution */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Prize Pool Distribution</CardTitle>
              <CardDescription>Prize pools by jackpot</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.jackpotStats}
                    dataKey="prizePool"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={(entry) => `₦${entry.value.toFixed(0)}`}
                  >
                    {stats.jackpotStats.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      borderColor: 'hsl(var(--border))' 
                    }}
                    formatter={(value: number) => `₦${value.toFixed(2)}`}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Winning Trends */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Recent Winning Trends</CardTitle>
            <CardDescription>Prize money distributed over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.recentWins}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--foreground))" />
                <YAxis stroke="hsl(var(--foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    borderColor: 'hsl(var(--border))' 
                  }}
                  formatter={(value: number) => `₦${value.toFixed(2)}`}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  name="Prize Amount"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default Statistics;
