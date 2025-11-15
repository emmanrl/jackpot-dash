import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CountdownTimer } from "@/components/CountdownTimer";
import { Flame, TrendingUp, Users, Ticket, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFavoriteJackpots } from "@/hooks/useFavoriteJackpots";

interface EnhancedJackpotCardProps {
  jackpotId: string;
  title: string;
  prize: string;
  ticketPrice: string;
  endTime: Date;
  category: "hourly" | "daily" | "weekly" | "monthly";
  onBuyClick?: () => void;
  backgroundImageUrl?: string | null;
  status: string;
}

const EnhancedJackpotCard = ({
  jackpotId,
  title,
  prize,
  ticketPrice,
  endTime,
  category,
  onBuyClick,
  backgroundImageUrl,
  status,
}: EnhancedJackpotCardProps) => {
  const [ticketCount, setTicketCount] = useState(0);
  const [participantCount, setParticipantCount] = useState(0);
  const [poolGrowth, setPoolGrowth] = useState(0);
  const [currentPrize, setCurrentPrize] = useState(prize);
  const [isHot, setIsHot] = useState(false);
  const [isEndingSoon, setIsEndingSoon] = useState(false);
  
  // Get user session for favorites
  const [userId, setUserId] = useState<string | undefined>();
  const { isFavorite, toggleFavorite } = useFavoriteJackpots(userId);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id);
    });
  }, []);

  useEffect(() => {
    fetchCardData();

    // Listen for real-time updates to prize pool
    const jackpotChannel = supabase
      .channel(`jackpot-${jackpotId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "jackpots",
          filter: `id=eq.${jackpotId}`,
        },
        (payload: any) => {
          console.log("Jackpot updated:", payload);
          const newPrize = `₦${Number(payload.new.prize_pool).toLocaleString()}`;
          setCurrentPrize(newPrize);

          // Refresh card data to get latest stats
          fetchCardData();
        }
      )
      .subscribe();

    // Listen for real-time ticket purchases
    const ticketChannel = supabase
      .channel(`tickets-${jackpotId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "tickets",
          filter: `jackpot_id=eq.${jackpotId}`,
        },
        () => {
          console.log("New ticket purchased for jackpot:", jackpotId);
          // Refresh card data to get latest stats
          fetchCardData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(jackpotChannel);
      supabase.removeChannel(ticketChannel);
    };
  }, [jackpotId, prize]);

  const fetchCardData = async () => {
    const { data: tickets } = await supabase
      .from("tickets")
      .select("user_id")
      .eq("jackpot_id", jackpotId);

    if (tickets) {
      setTicketCount(tickets.length);
      const uniqueUsers = new Set(tickets.map((t) => t.user_id)).size;
      setParticipantCount(uniqueUsers);
      
      // Determine if "hot" (>20 tickets or >10 participants)
      setIsHot(tickets.length > 20 || uniqueUsers > 10);
    }

    // Check if ending soon (less than 1 hour)
    const timeUntilEnd = endTime.getTime() - Date.now();
    setIsEndingSoon(timeUntilEnd < 3600000 && timeUntilEnd > 0);
    
    // Calculate actual pool growth from initial prize pool
    const { data: jackpotData } = await supabase
      .from("jackpots")
      .select("initial_prize_pool, prize_pool")
      .eq("id", jackpotId)
      .single();

    if (jackpotData) {
      const initialPool = Number(jackpotData.initial_prize_pool || 0);
      const currentPool = Number(jackpotData.prize_pool || 0);
      const growth = initialPool > 0 ? Math.round(((currentPool - initialPool) / initialPool) * 100) : 0;
      setPoolGrowth(growth);
    }
  };

  const categoryConfig = {
    hourly: {
      gradient: "from-orange-500/20 via-amber-500/10 to-orange-500/20",
      border: "border-orange-500/30",
      badge: "bg-orange-500/20 text-orange-300 border-orange-500/30",
      text: "text-orange-400",
    },
    daily: {
      gradient: "from-blue-500/20 via-cyan-500/10 to-blue-500/20",
      border: "border-blue-500/30",
      badge: "bg-blue-500/20 text-blue-300 border-blue-500/30",
      text: "text-blue-400",
    },
    weekly: {
      gradient: "from-purple-500/20 via-pink-500/10 to-purple-500/20",
      border: "border-purple-500/30",
      badge: "bg-purple-500/20 text-purple-300 border-purple-500/30",
      text: "text-purple-400",
    },
    monthly: {
      gradient: "from-green-500/20 via-emerald-500/10 to-green-500/20",
      border: "border-green-500/30",
      badge: "bg-green-500/20 text-green-300 border-green-500/30",
      text: "text-green-400",
    },
  };

  const config = categoryConfig[category];
  const ticketProgress = Math.min((ticketCount / 100) * 100, 100);

  return (
    <div
      className={cn(
        "group relative h-full w-full min-h-[420px] rounded-2xl overflow-hidden transition-all duration-500",
        "bg-card/50 backdrop-blur-sm border-2",
        config.border,
        isEndingSoon && "animate-pulse-border",
        "hover:scale-[1.02] hover:shadow-2xl hover:shadow-primary/20"
      )}
    >
      {/* Background Image with Gradient Overlay */}
      {backgroundImageUrl && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20 transition-opacity duration-500 group-hover:opacity-30"
          style={{ backgroundImage: `url(${backgroundImageUrl})` }}
        />
      )}
      <div className={cn("absolute inset-0 bg-gradient-to-br", config.gradient)} />
      
      {/* Shimmer Effect */}
      <div className="absolute inset-0 shimmer opacity-50" />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex gap-2">
            <Badge variant="outline" className={cn("text-xs sm:text-sm font-bold border-2", config.badge)}>
              {category.toUpperCase()}
            </Badge>
            {isHot && (
              <Badge variant="outline" className="bg-red-500/20 text-red-300 border-red-500/30 text-xs sm:text-sm animate-pulse">
                <Flame className="w-3 h-3 mr-1" />
                HOT
              </Badge>
            )}
            {isEndingSoon && (
              <Badge variant="outline" className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30 text-xs sm:text-sm animate-pulse">
                ⏰ Soon
              </Badge>
            )}
          </div>
          
          {/* Favorite Button */}
          <Button
            size="sm"
            variant="ghost"
            className={cn(
              "h-8 w-8 rounded-full p-0 backdrop-blur-sm shadow-lg transition-all",
              isFavorite(jackpotId) 
                ? "bg-red-500/90 hover:bg-red-600/90 text-white" 
                : "bg-background/80 hover:bg-background/90"
            )}
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(jackpotId);
            }}
          >
            <Heart 
              className={cn(
                "w-4 h-4",
                isFavorite(jackpotId) && "fill-current"
              )} 
            />
          </Button>
        </div>

        {/* Title */}
        <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-2 text-foreground line-clamp-2">
          {title}
        </h3>

        {/* Pool Growth Indicator */}
        {poolGrowth > 0 && (
          <div className="flex items-center gap-1 mb-3">
            <TrendingUp className={cn("w-4 h-4", config.text)} />
            <span className={cn("text-xs sm:text-sm font-semibold", config.text)}>
              +{poolGrowth}% today
            </span>
          </div>
        )}

        {/* Prize Pool */}
        <div className="mb-4">
          <p className="text-xs sm:text-sm text-muted-foreground mb-1">Prize Pool</p>
          <p className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-shimmer bg-[length:200%_100%]">
            {currentPrize}
          </p>
        </div>

        {/* Countdown Timer */}
        <div className="mb-4">
          <p className="text-xs sm:text-sm text-muted-foreground mb-2">Draw Ends In</p>
          <CountdownTimer
            targetDate={endTime}
            className="text-lg sm:text-xl md:text-2xl font-bold"
            showIcon={true}
          />
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs sm:text-sm text-muted-foreground mb-2">
            <span>Tickets Sold</span>
            <span className="font-medium">{ticketCount}/100</span>
          </div>
          <Progress value={ticketProgress} className="h-2.5 sm:h-2" />
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <Users className="w-4 h-4 text-primary" />
            <span className="text-muted-foreground">
              <span className="font-bold text-foreground">{participantCount}</span> Players
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <Ticket className="w-4 h-4 text-primary" />
            <span className="text-muted-foreground">
              <span className="font-bold text-foreground">{ticketCount}</span> Tickets
            </span>
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Footer */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="text-muted-foreground">Ticket Price</span>
            <span className="font-bold text-primary text-sm sm:text-base">{ticketPrice}</span>
          </div>
          
          {status === "active" ? (
            <Button
              onClick={onBuyClick}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm sm:text-base py-4 sm:py-6 rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/50"
            >
              Buy Tickets Now
            </Button>
          ) : (
            <Button disabled className="w-full text-sm sm:text-base py-4 sm:py-6 rounded-xl">
              Draw Completed
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedJackpotCard;
