import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, TrendingUp, Ticket } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface JackpotCardProps {
  jackpotId: string;
  title: string;
  prize: string;
  ticketPrice: string;
  endTime: Date;
  category: "hourly" | "daily" | "weekly" | "monthly";
  onBuyClick?: () => void;
  backgroundImageUrl?: string | null;
  createdAt?: Date;
  status?: string;
}

const JackpotCard = ({ jackpotId, title, prize, ticketPrice, endTime, category, onBuyClick, backgroundImageUrl, createdAt, status }: JackpotCardProps) => {
  const [timeLeft, setTimeLeft] = useState("");
  const [poolGrowth, setPoolGrowth] = useState(0);
  const [specialBadge, setSpecialBadge] = useState<string | null>(null);
  const [isEnded, setIsEnded] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = endTime.getTime() - now;

      if (distance < 0 || status === 'completed') {
        setTimeLeft("ENDED");
        setIsEnded(true);
        return;
      }

      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime, status]);

  useEffect(() => {
    const fetchPoolGrowthAndBadge = async () => {
      try {
        const { count } = await supabase
          .from('tickets')
          .select('*', { count: 'exact', head: true })
          .eq('jackpot_id', jackpotId);

        if (count && count > 0) {
          const growthPercentage = Math.min(Math.floor(count * 2.5), 50);
          setPoolGrowth(growthPercentage);
        } else {
          setPoolGrowth(0);
        }

        // Fetch all jackpots stats for badges
        const { data: allJackpots } = await supabase
          .from('jackpots')
          .select('id, prize_pool')
          .eq('status', 'active');

        const { data: allTickets } = await supabase
          .from('tickets')
          .select('jackpot_id, user_id');

        // Find jackpot with highest prize pool
        const maxPrizeJackpot = allJackpots?.reduce((max, j) => 
          Number(j.prize_pool) > Number(max.prize_pool) ? j : max
        , allJackpots[0]);

        // Find most bought jackpot (most tickets)
        const ticketCounts = allTickets?.reduce((acc, t) => {
          acc[t.jackpot_id] = (acc[t.jackpot_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        const mostBoughtId = Object.keys(ticketCounts || {}).reduce((a, b) => 
          (ticketCounts?.[a] || 0) > (ticketCounts?.[b] || 0) ? a : b
        , '');

        // Find jackpot where one user bought most tickets
        const userTicketCounts: Record<string, Record<string, number>> = {};
        allTickets?.forEach(t => {
          if (!userTicketCounts[t.jackpot_id]) userTicketCounts[t.jackpot_id] = {};
          userTicketCounts[t.jackpot_id][t.user_id] = (userTicketCounts[t.jackpot_id][t.user_id] || 0) + 1;
        });
        let maxUserTickets = 0;
        let bigLotsJackpotId = '';
        Object.keys(userTicketCounts).forEach(jId => {
          const maxForJackpot = Math.max(...Object.values(userTicketCounts[jId]));
          if (maxForJackpot > maxUserTickets) {
            maxUserTickets = maxForJackpot;
            bigLotsJackpotId = jId;
          }
        });

        // Set badge
        if (maxPrizeJackpot?.id === jackpotId) {
          setSpecialBadge('BIG WIN!!!');
        } else if (mostBoughtId === jackpotId) {
          setSpecialBadge('HOT');
        } else if (bigLotsJackpotId === jackpotId && maxUserTickets >= 5) {
          setSpecialBadge('BIG LOTS');
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
        setPoolGrowth(0);
      }
    };

    fetchPoolGrowthAndBadge();
  }, [jackpotId]);

  const categoryColors: Record<string, string> = {
    hourly: "from-amber-500/50 to-orange-500/50",
    daily: "from-blue-500/50 to-cyan-500/50",
    weekly: "from-purple-500/50 to-pink-500/50",
    monthly: "from-emerald-500/50 to-green-500/50",
    "3hours": "from-rose-500/50 to-red-500/50",
    "1hour": "from-yellow-500/50 to-amber-500/50",
    quick: "from-fuchsia-500/50 to-purple-500/50",
    long: "from-teal-500/50 to-cyan-500/50",
  };

  // Calculate if 75% of duration has passed
  const getDrawEndsSoonStatus = () => {
    if (!createdAt) return "Draw ends soon";
    const now = new Date().getTime();
    const created = createdAt.getTime();
    const end = endTime.getTime();
    const totalDuration = end - created;
    const elapsed = now - created;
    const percentElapsed = (elapsed / totalDuration) * 100;
    return percentElapsed >= 75 ? "Draw ends soon" : "";
  };

  return (
    <Card className={`relative overflow-hidden border-2 border-border hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/20 group ${specialBadge === 'HOT' ? 'animate-pulse' : ''}`}>
      {/* Background image */}
      {backgroundImageUrl && (
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${backgroundImageUrl})` }}
        />
      )}
      
      {/* Gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${categoryColors[category] || categoryColors.hourly} opacity-70 group-hover:opacity-90 transition-opacity`} />
      
      {/* Shimmer effect */}
      <div className="absolute inset-0 shimmer opacity-0 group-hover:opacity-100 transition-opacity" />

      <CardHeader className="relative">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary px-2 py-1 rounded-full bg-primary/10 border border-primary/20">
            {category}
          </span>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <TrendingUp className="w-3 h-3" />
            <span>{poolGrowth > 0 ? `+${poolGrowth}% pool` : 'New pool'}</span>
          </div>
        </div>
        {specialBadge && (
          <div className={`mb-2 text-center ${specialBadge === 'HOT' ? 'animate-pulse' : ''}`}>
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${
              specialBadge === 'HOT' ? 'bg-red-500 text-white shadow-lg shadow-red-500/50' :
              specialBadge === 'BIG WIN!!!' ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/50' :
              'bg-purple-500 text-white shadow-lg shadow-purple-500/50'
            }`}>
              {specialBadge}
            </span>
          </div>
        )}
        <CardTitle className="text-2xl font-bold">{title}</CardTitle>
        <CardDescription>{getDrawEndsSoonStatus()}</CardDescription>
      </CardHeader>

      <CardContent className="relative space-y-4">
        <div className="text-center p-4 rounded-lg bg-primary/5 border border-primary/10">
          <div className="text-sm text-muted-foreground mb-1">Prize Pool</div>
          <div className="text-4xl font-bold text-primary gold-glow">{prize}</div>
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-sm font-medium">Time Left</span>
          </div>
          <span className="text-lg font-bold text-primary">{timeLeft}</span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Ticket Price</span>
          <span className="font-bold text-foreground">{ticketPrice}</span>
        </div>
      </CardContent>

      <CardFooter className="relative">
        <Button 
          variant="prize" 
          className="w-full" 
          size="lg" 
          onClick={onBuyClick}
          disabled={isEnded}
        >
          <Ticket className="w-4 h-4" />
          {isEnded ? "Draw Ended" : "Buy Tickets"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default JackpotCard;
