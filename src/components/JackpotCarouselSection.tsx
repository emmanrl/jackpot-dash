import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import EnhancedJackpotCard from "./EnhancedJackpotCard";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface Jackpot {
  id: string;
  name: string;
  prize_pool: number;
  ticket_price: number;
  next_draw: string | null;
  frequency: string;
  category: string;
  background_image_url?: string | null;
  created_at: string;
  status: string;
}

interface GroupedJackpots {
  hourly: Jackpot[];
  daily: Jackpot[];
  weekly: Jackpot[];
  monthly: Jackpot[];
}

interface JackpotCarouselSectionProps {
  onBuyTicket?: (jackpot: Jackpot) => void;
}

const JackpotCarouselSection = ({ onBuyTicket }: JackpotCarouselSectionProps) => {
  const [jackpots, setJackpots] = useState<GroupedJackpots>({
    hourly: [],
    daily: [],
    weekly: [],
    monthly: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActiveJackpots();
  }, []);

  const fetchActiveJackpots = async () => {
    try {
      const { data, error } = await supabase
        .from("jackpots")
        .select("*")
        .eq("status", "active")
        .order("prize_pool", { ascending: false });

      if (error) throw error;

      const grouped: GroupedJackpots = {
        hourly: [],
        daily: [],
        weekly: [],
        monthly: [],
      };

      data?.forEach((jackpot) => {
        const category = (jackpot.category || "hourly") as keyof GroupedJackpots;
        if (grouped[category]) {
          grouped[category].push(jackpot);
        }
      });

      setJackpots(grouped);
    } catch (error) {
      console.error("Error fetching jackpots:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrize = (amount: number) => `₦${amount.toLocaleString()}`;
  const formatTicketPrice = (price: number) => `₦${price.toFixed(2)}`;

  const categoryLabels = {
    hourly: { title: "⚡ Hourly Jackpots", subtitle: "Win every hour!" },
    daily: { title: "🌟 Daily Jackpots", subtitle: "Daily chances to win big" },
    weekly: { title: "💎 Weekly Jackpots", subtitle: "Bigger prizes, weekly draws" },
    monthly: { title: "👑 Monthly Jackpots", subtitle: "Life-changing prizes" },
  };

  const renderCategory = (category: keyof GroupedJackpots) => {
    const categoryJackpots = jackpots[category];
    if (categoryJackpots.length === 0) return null;

    return (
      <div key={category} className="mb-16">
        {/* Category Header */}
        <div className="flex items-center justify-between mb-6 px-4">
          <div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">
              {categoryLabels[category].title}
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              {categoryLabels[category].subtitle}
            </p>
          </div>
          <Badge variant="outline" className="text-base sm:text-lg font-bold px-4 py-2">
            {categoryJackpots.length} Active
          </Badge>
        </div>

        {/* Carousel */}
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          plugins={[
            Autoplay({
              delay: 5000,
              stopOnInteraction: true,
            }),
          ]}
          className="w-full"
        >
          <CarouselContent className="-ml-2 sm:-ml-4">
            {categoryJackpots.map((jackpot) => (
              <CarouselItem
                key={jackpot.id}
                className="pl-2 sm:pl-4 basis-full sm:basis-1/2 lg:basis-1/3"
              >
                <EnhancedJackpotCard
                  jackpotId={jackpot.id}
                  title={jackpot.name}
                  prize={formatPrize(jackpot.prize_pool)}
                  ticketPrice={formatTicketPrice(jackpot.ticket_price)}
                  endTime={
                    jackpot.next_draw
                      ? new Date(jackpot.next_draw)
                      : new Date(Date.now() + 24 * 60 * 60 * 1000)
                  }
                  category={category}
                  onBuyClick={onBuyTicket ? () => onBuyTicket(jackpot) : undefined}
                  backgroundImageUrl={jackpot.background_image_url}
                  status={jackpot.status}
                />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden sm:flex -left-4 lg:-left-12" />
          <CarouselNext className="hidden sm:flex -right-4 lg:-right-12" />
        </Carousel>
      </div>
    );
  };

  if (loading) {
    return (
      <section className="py-12 sm:py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <Skeleton className="h-12 w-64 mx-auto mb-4" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[420px] rounded-2xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  const hasAnyJackpots = Object.values(jackpots).some((arr) => arr.length > 0);

  if (!hasAnyJackpots) {
    return (
      <section className="py-12 sm:py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">
              No active jackpots at the moment. Check back soon!
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 sm:py-20 px-4 bg-gradient-to-b from-background via-muted/20 to-background">
      <div className="container mx-auto">
        {/* Main Title */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Active Jackpots
            </span>
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose your jackpot and start winning. Multiple draws every day!
          </p>
        </div>

        {/* Category Carousels */}
        {(["hourly", "daily", "weekly", "monthly"] as const).map(renderCategory)}
      </div>
    </section>
  );
};

export default JackpotCarouselSection;
