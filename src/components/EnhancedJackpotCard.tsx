import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CountdownTimer } from "@/components/CountdownTimer";
import { Flame, TrendingUp, Users, Ticket } from "lucide-react";
import { cn } from "@/lib/utils";

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

  useEffect(() => {
    fetchCardData();
    const channel = supabase
      .channel(`jackpot-${jackpotId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "jackpots",
          filter: `id=eq.${jackpotId}`,
        },
        (payload) => {
          if (payload.new.prize_pool) {
            setCurrentPrize(`₦${Number(payload.new.prize_pool).toLocaleString()}`);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [jackpotId]);

  const fetchCardData = async () => {
    const { data: tickets } = await supabase
      .from("tickets")
      .select("user_id")
      .eq("jackpot_id", jackpotId);

    if (tickets) {
      setTicketCount(tickets.length);
      const uniqueUsers = new Set(tickets.map((t) => t.user_id)).size;
      setParticipantCount(uniqueUsers);
      setPoolGrowth(tickets.length * 10);
      
      // Determine if "hot" (>20 tickets or >10 participants)
      setIsHot(tickets.length > 20 || uniqueUsers > 10);
    }

    // Check if ending soon (less than 1 hour)
    const timeUntilEnd = endTime.getTime() - Date.now();
    setIsEndingSoon(timeUntilEnd < 3600000 && timeUntilEnd > 0);
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
          <Badge variant="outline" className={cn("text-xs sm:text-sm font-bold border-2", config.badge)}>
            {category.toUpperCase()}
          </Badge>
          <div className="flex gap-2">
            {isHot && (
              <Badge variant="outline" className="bg-red-500/20 text-red-300 border-red-500/30 text-xs sm:text-sm animate-pulse">
                <Flame className="w-3 h-3 mr-1" />
                HOT
              </Badge>
            )}
            {isEndingSoon && (
              <Badge variant="outline" className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30 text-xs sm:text-sm animate-pulse">
                ENDING SOON
              </Badge>
            )}
          </div>
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

        {/* Progress Bar - Enhanced for Mobile */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            <span>Tickets Sold</span>
            <span className="font-medium text-foreground">{ticketCount}/100</span>
          </div>
          <div className="relative">
            <div className="h-3 sm:h-3.5 bg-secondary/50 rounded-full overflow-hidden backdrop-blur">
              <div 
                className="h-full bg-gradient-to-r from-primary via-accent to-primary transition-all duration-700 rounded-full shadow-inner"
                style={{ width: `${ticketProgress}%` }}
              />
            </div>
          </div>
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
