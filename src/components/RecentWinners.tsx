import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Winner {
  id: string;
  prize_amount: number;
  claimed_at: string;
  profiles: {
    full_name: string | null;
    email: string;
  };
  jackpots: {
    name: string;
  };
}

const RecentWinners = () => {
  const [winners, setWinners] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentWinners();
  }, []);

  const fetchRecentWinners = async () => {
    try {
      const { data, error } = await supabase
        .from("winners")
        .select(`
          id,
          prize_amount,
          claimed_at,
          user_id,
          jackpots (name)
        `)
        .order("claimed_at", { ascending: false })
        .limit(6);

      if (error) throw error;

      // Fetch profiles separately
      if (data && data.length > 0) {
        const userIds = data.map(w => w.user_id);
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", userIds);

        const profileMap = new Map(profilesData?.map(p => [p.id, p]));
        
        const winnersWithProfiles = data.map(winner => ({
          ...winner,
          profiles: profileMap.get(winner.user_id) || { full_name: null, email: "" }
        }));

        setWinners(winnersWithProfiles as Winner[]);
      }
    } catch (error) {
      console.error("Error fetching winners:", error);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (winner: Winner) => {
    if (winner.profiles?.full_name) {
      return winner.profiles.full_name
        .split(" ")
        .map(n => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (winner.profiles?.email) {
      return winner.profiles.email.charAt(0).toUpperCase();
    }
    return "W";
  };

  const getDisplayName = (winner: Winner) => {
    if (winner.profiles?.full_name) {
      return winner.profiles.full_name;
    }
    // Show email if no full name
    const email = winner.profiles?.email || "";
    return email.split("@")[0];
  };

  return (
    <section className="py-20 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Trophy className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Live Results</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Recent Winners</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join our community of winners. Your turn could be next!
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading winners...</p>
          </div>
        ) : winners.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No winners yet. Be the first!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
            {winners.map((winner) => (
              <Card 
                key={winner.id}
                className="border-2 border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg group overflow-hidden"
              >
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-start gap-3 md:gap-4">
                    <Avatar className="w-12 h-12 md:w-14 md:h-14 ring-2 ring-primary/20">
                      <AvatarFallback className="bg-gradient-to-br from-primary to-primary/50 text-primary-foreground font-bold text-sm md:text-base">
                        {getInitials(winner)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-base md:text-lg truncate">{getDisplayName(winner)}</h3>
                        <Trophy className="w-4 h-4 md:w-5 md:h-5 text-primary flex-shrink-0" />
                      </div>
                      <p className="text-xs md:text-sm text-muted-foreground mb-2 truncate">
                        {winner.jackpots?.name || "Unknown Jackpot"}
                      </p>
                      <div className="flex items-center justify-between gap-2">
                        <div className="bg-primary/10 px-2 md:px-3 py-1 rounded-full">
                          <p className="text-base md:text-lg font-bold text-primary">
                            ₦{winner.prize_amount.toLocaleString()}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(new Date(winner.claimed_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="text-center mt-8">
          <p className="text-muted-foreground">
            Showing latest winners from recent draws
          </p>
        </div>
      </div>
    </section>
  );
};

export default RecentWinners;
