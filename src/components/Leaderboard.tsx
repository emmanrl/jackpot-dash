import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Trophy, Award, Medal } from "lucide-react";

interface LeaderboardUser {
  user_id: string;
  total_winnings: number;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
}

const Leaderboard = () => {
  const [topWinners, setTopWinners] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopWinners = async () => {
      try {
        const { data, error } = await supabase
          .from('winners')
          .select(`
            user_id,
            prize_amount,
            profiles:user_id (
              full_name,
              email,
              avatar_url
            )
          `);

        if (error) throw error;

        // Aggregate winnings by user
        const userWinnings = new Map<string, LeaderboardUser>();
        
        data?.forEach((winner: any) => {
          const userId = winner.user_id;
          const amount = Number(winner.prize_amount);
          
          if (userWinnings.has(userId)) {
            userWinnings.get(userId)!.total_winnings += amount;
          } else {
            userWinnings.set(userId, {
              user_id: userId,
              total_winnings: amount,
              full_name: winner.profiles?.full_name,
              email: winner.profiles?.email || '',
              avatar_url: winner.profiles?.avatar_url
            });
          }
        });

        // Convert to array and sort by total winnings
        const sortedWinners = Array.from(userWinnings.values())
          .sort((a, b) => b.total_winnings - a.total_winnings)
          .slice(0, 5);

        setTopWinners(sortedWinners);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopWinners();
  }, []);

  const getPositionIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="w-6 h-6 text-primary" />;
      case 1:
        return <Award className="w-6 h-6 text-secondary" />;
      case 2:
        return <Medal className="w-6 h-6 text-accent" />;
      default:
        return <div className="w-6 h-6 flex items-center justify-center text-muted-foreground font-bold">{index + 1}</div>;
    }
  };

  if (loading) {
    return (
      <section className="py-16 px-4 opacity-0 animate-fade-in">
        <div className="container mx-auto">
          <Card className="p-8">
            <div className="text-center text-muted-foreground">Loading leaderboard...</div>
          </Card>
        </div>
      </section>
    );
  }

  if (topWinners.length === 0) {
    return null;
  }

  return (
    <section className="py-16 px-4 opacity-0 animate-fade-in" style={{ animationDelay: '0.2s' }}>
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Top Winners
          </h2>
          <p className="text-muted-foreground text-lg">
            Celebrating our biggest winners
          </p>
        </div>

        <Card className="p-8 bg-card/50 backdrop-blur border-2">
          <div className="space-y-4">
            {topWinners.map((winner, index) => (
              <div
                key={winner.user_id}
                className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-all hover:scale-[1.02]"
                style={{ 
                  animationDelay: `${0.3 + index * 0.1}s`,
                  opacity: 0,
                  animation: 'fade-in 0.5s ease-out forwards'
                }}
              >
                <div className="flex-shrink-0">
                  {getPositionIcon(index)}
                </div>
                
                <div className="flex-grow">
                  <div className="font-semibold text-foreground">
                    {winner.full_name || winner.email.split('@')[0]}
                  </div>
                  {winner.full_name && (
                    <div className="text-sm text-muted-foreground">
                      {winner.email}
                    </div>
                  )}
                </div>

                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">
                    ₦{Math.round(winner.total_winnings).toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total Winnings
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </section>
  );
};

export default Leaderboard;