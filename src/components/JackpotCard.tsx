import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, Ticket, Users, Play } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CountdownTimer } from "./CountdownTimer";
import DrawDetailsModal from "./DrawDetailsModal";

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
  const [poolGrowth, setPoolGrowth] = useState(0);
  const [specialBadge, setSpecialBadge] = useState<string | null>(null);
  const [isEnded, setIsEnded] = useState(status === 'completed');
  const [currentPrize, setCurrentPrize] = useState(prize);
  const [participantCount, setParticipantCount] = useState(0);
  const [ticketCount, setTicketCount] = useState(0);
  const [showDrawDetails, setShowDrawDetails] = useState(false);
  const [winnerData, setWinnerData] = useState<any>(null);

  useEffect(() => {
    const fetchPoolGrowthAndBadge = async () => {
      try {
        // Fetch ticket count and participant count
        const { data: tickets } = await supabase
          .from('tickets')
          .select('user_id')
          .eq('jackpot_id', jackpotId);

        if (tickets && tickets.length > 0) {
          const growthPercentage = Math.min(Math.floor(tickets.length * 2.5), 50);
          setPoolGrowth(growthPercentage);
          setTicketCount(tickets.length);

          // Count unique participants
          const uniqueUsers = new Set(tickets.map(t => t.user_id));
          setParticipantCount(uniqueUsers.size);
        } else {
          setPoolGrowth(0);
          setTicketCount(0);
          setParticipantCount(0);
        }

        // Fetch current jackpot for real prize pool
        const { data: jackpot } = await supabase
          .from('jackpots')
          .select('prize_pool')
          .eq('id', jackpotId)
          .single();

        if (jackpot) {
          setCurrentPrize(`₦${Number(jackpot.prize_pool).toLocaleString()}`);
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

    // Subscribe to realtime updates for prize pool
    const channel = supabase
      .channel(`jackpot-${jackpotId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'jackpots',
          filter: `id=eq.${jackpotId}`
        },
        (payload) => {
          if (payload.new.prize_pool !== undefined) {
            setCurrentPrize(`₦${Number(payload.new.prize_pool).toLocaleString()}`);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
    <Card className={`relative overflow-hidden border border-white/10 bg-[#1a2c38]/90 backdrop-blur-md hover:border-white/20 transition-all duration-500 hover:shadow-2xl group ${specialBadge === 'HOT' ? 'animate-pulse' : ''} md:h-auto h-[280px] hover:-translate-y-2 rounded-2xl`}>
      {/* Background image */}
      {backgroundImageUrl && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20 transition-transform duration-700 group-hover:scale-110"
          style={{ backgroundImage: `url(${backgroundImageUrl})` }}
        />
      )}

      {/* Gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${categoryColors[category] || categoryColors.hourly} opacity-40 group-hover:opacity-60 transition-opacity duration-500`} />

      {/* Hover Overlay with Quick Play Button */}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 flex items-center justify-center backdrop-blur-[2px]">
        <Button
          size="lg"
          className="transform scale-90 group-hover:scale-100 transition-transform duration-300 bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-lg px-8 py-6 rounded-xl shadow-[0_0_20px_rgba(234,179,8,0.3)]"
          onClick={() => {
            if (isEnded && status === 'completed') {
              // Logic for ended draw
            } else if (onBuyClick) {
              onBuyClick();
            }
          }}
        >
          <Play className="w-6 h-6 mr-2 fill-current" />
          Quick Play
        </Button>
      </div>

      {/* Shimmer effect */}
      <div className="absolute inset-0 shimmer opacity-0 group-hover:opacity-100 transition-opacity" />

      <CardHeader className="relative p-3 md:p-6 z-10 group-hover:blur-[2px] transition-all duration-300">
        <div className="flex items-center justify-between mb-1 md:mb-2">
          <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-primary px-2 py-1 rounded-full bg-black/40 border border-primary/20 backdrop-blur-md">
            {category}
          </span>
          <div className="flex items-center gap-1 text-[10px] md:text-xs text-gray-300 font-medium bg-black/20 px-2 py-1 rounded-full">
            <TrendingUp className="w-3 h-3 text-green-400" />
            <span className="hidden md:inline">{poolGrowth > 0 ? `+${poolGrowth}% pool` : 'New'}</span>
            <span className="md:hidden">+{poolGrowth}%</span>
          </div>
        </div>
        {specialBadge && (
          <div className={`mb-1 md:mb-2 text-center ${specialBadge === 'HOT' ? 'animate-pulse' : ''}`}>
            <span className={`text-[9px] md:text-xs font-bold px-3 py-1 rounded-full shadow-lg ${specialBadge === 'HOT' ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white' :
              specialBadge === 'BIG WIN!!!' ? 'bg-gradient-to-r from-yellow-400 to-amber-600 text-black' :
                'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
              }`}>
              {specialBadge}
            </span>
          </div>
        )}
        <CardTitle className="text-base md:text-2xl font-bold truncate text-white drop-shadow-md">{title}</CardTitle>
        <CardDescription className="text-[10px] md:text-sm truncate text-gray-300">{getDrawEndsSoonStatus()}</CardDescription>
      </CardHeader>

      <CardContent className="relative space-y-2 md:space-y-4 p-3 md:p-6 z-10 group-hover:blur-[2px] transition-all duration-300">
        <div className="text-center p-3 md:p-4 rounded-xl bg-black/20 border border-white/5 backdrop-blur-md">
          <div className="text-[10px] md:text-xs text-gray-400 mb-1 uppercase tracking-wider font-medium">Prize Pool</div>
          <div className="text-xl md:text-3xl font-bold text-white">{currentPrize}</div>
        </div>

        <div className="flex items-center justify-between p-2 md:p-3 rounded-lg bg-black/20 text-[10px] md:text-sm border border-white/5">
          <span className="font-medium text-gray-300">Time Left</span>
          <CountdownTimer
            targetDate={endTime}
            onExpire={() => setIsEnded(true)}
            showIcon={false}
            className="text-xs md:text-lg font-mono text-white"
          />
        </div>

        <div className="space-y-1 md:space-y-2">
          <div className="flex items-center justify-between text-[10px] md:text-sm px-1">
            <span className="text-gray-400">Ticket Price</span>
            <span className="font-bold text-yellow-400">{ticketPrice}</span>
          </div>

          {(participantCount > 0 || ticketCount > 0) && (
            <div className="flex items-center justify-between text-[9px] md:text-xs p-1.5 md:p-2 rounded-md bg-white/5 border border-white/5">
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3 text-blue-400" />
                <span className="text-gray-400">Players</span>
              </div>
              <span className="font-semibold text-white">{participantCount}</span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="relative p-3 md:p-6 z-10 group-hover:blur-[2px] transition-all duration-300">
        <Button
          variant="prize"
          className="w-full text-xs md:text-base h-8 md:h-12 font-bold shadow-lg"
          size="sm"
          onClick={async () => {
            if (isEnded && status === 'completed') {
              // Fetch winner data for this jackpot
              const { data: winners } = await supabase
                .from('winners')
                .select(`
                  *,
                  jackpots (name, id),
                  profiles (full_name, email)
                `)
                .eq('jackpot_id', jackpotId)
                .order('winner_rank', { ascending: true });

              if (winners && winners.length > 0) {
                setWinnerData(winners[0]); // Show first winner in modal
                setShowDrawDetails(true);
              }
            } else if (onBuyClick) {
              onBuyClick();
            }
          }}
          disabled={isEnded && status !== 'completed'}
        >
          <Ticket className="w-4 h-4 mr-2" />
          {isEnded ? (status === 'completed' ? "View Winners" : "Draw Ended") : "Buy Tickets"}
        </Button>
      </CardFooter>

      {winnerData && (
        <DrawDetailsModal
          open={showDrawDetails}
          onOpenChange={setShowDrawDetails}
          win={winnerData}
        />
      )}
    </Card>
  );
};

export default JackpotCard;
