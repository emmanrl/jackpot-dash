import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Star, TrendingUp, Crown, Medal } from "lucide-react";
import TopNav from "@/components/TopNav";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface LeaderboardEntry {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string;
  experience_points: number;
  total_winnings: number;
  win_count: number;
}

const LeaderboardPage = () => {
  const [xpLeaders, setXpLeaders] = useState<LeaderboardEntry[]>([]);
  const [winLeaders, setWinLeaders] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboards();
  }, []);

  const fetchLeaderboards = async () => {
    try {
      // Fetch XP leaderboard with proper typing
      const { data: xpData, error: xpError } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url, experience_points')
        .order('experience_points', { ascending: false })
        .limit(50);

      if (xpError) throw xpError;

      // Fetch winners data for each profile with proper typing
      const profilesWithWinnings = await Promise.all(
        (xpData || []).map(async (profile: any) => {
          const { data: winData } = await supabase
            .from('winners')
            .select('prize_amount')
            .eq('user_id', profile.id);

          const totalWinnings = winData?.reduce((sum: number, win: any) => sum + Number(win.prize_amount), 0) || 0;
          const winCount = winData?.length || 0;

          return {
            id: profile.id,
            full_name: profile.full_name,
            email: profile.email,
            avatar_url: profile.avatar_url,
            experience_points: profile.experience_points || 0,
            total_winnings: totalWinnings,
            win_count: winCount,
          };
        })
      );

      setXpLeaders(profilesWithWinnings);

      // Sort by total winnings for win leaderboard
      const sortedByWinnings = [...profilesWithWinnings].sort((a, b) => b.total_winnings - a.total_winnings);
      setWinLeaders(sortedByWinnings);

      setLoading(false);
    } catch (error: any) {
      console.error('Error fetching leaderboards:', error);
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>;
  };

  const getInitials = (name: string, email: string) => {
    if (name) return name.charAt(0).toUpperCase();
    if (email) return email.charAt(0).toUpperCase();
    return "U";
  };

  const renderLeaderboard = (leaders: LeaderboardEntry[], type: 'xp' | 'winnings') => {
    if (loading) {
      return (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 bg-muted/50 rounded-lg animate-pulse" />
          ))}
        </div>
      );
    }

    if (leaders.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No players yet. Be the first!</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {leaders.map((leader, index) => {
          const rank = index + 1;
          const isTopThree = rank <= 3;

          return (
            <Card
              key={leader.id}
              className={`transition-all ${
                isTopThree
                  ? 'border-primary/30 shadow-md bg-gradient-to-r from-primary/5 to-transparent'
                  : 'border-border'
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* Rank */}
                  <div className="flex items-center justify-center w-12">
                    {getRankIcon(rank)}
                  </div>

                  {/* Avatar */}
                  <Avatar className="h-12 w-12 border-2 border-primary/20">
                    {leader.avatar_url ? (
                      <AvatarImage src={leader.avatar_url} alt={leader.full_name || leader.email} />
                    ) : null}
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {getInitials(leader.full_name, leader.email)}
                    </AvatarFallback>
                  </Avatar>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">
                      {leader.full_name || leader.email}
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        {leader.experience_points} XP
                      </span>
                      <span className="flex items-center gap-1">
                        <Trophy className="w-3 h-3" />
                        {leader.win_count} wins
                      </span>
                    </div>
                  </div>

                  {/* Primary Stat */}
                  <div className="text-right">
                    {type === 'xp' ? (
                      <div>
                        <div className="text-2xl font-bold text-primary">
                          {leader.experience_points}
                        </div>
                        <div className="text-xs text-muted-foreground">XP</div>
                      </div>
                    ) : (
                      <div>
                        <div className="text-2xl font-bold text-primary">
                          ₦{leader.total_winnings.toFixed(2)}
                        </div>
                        <div className="text-xs text-muted-foreground">Total Winnings</div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <TopNav />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-8 h-8 text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold">Leaderboard</h1>
          </div>
          <p className="text-muted-foreground">
            See how you rank against other players
          </p>
        </div>

        <Tabs defaultValue="xp" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="xp" className="gap-2">
              <Star className="w-4 h-4" />
              Top by XP
            </TabsTrigger>
            <TabsTrigger value="winnings" className="gap-2">
              <Trophy className="w-4 h-4" />
              Top Winners
            </TabsTrigger>
          </TabsList>

          <TabsContent value="xp">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-primary" />
                  Experience Points Leaderboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderLeaderboard(xpLeaders, 'xp')}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="winnings">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-primary" />
                  Total Winnings Leaderboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderLeaderboard(winLeaders, 'winnings')}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default LeaderboardPage;
