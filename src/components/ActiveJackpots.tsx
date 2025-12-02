import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import JackpotCard from "./JackpotCard";
import heroImage from "@/assets/hero-jackpot.jpg";

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

interface ActiveJackpotsProps {
  onBuyTicket?: (jackpot: Jackpot) => void;
}

const ActiveJackpots = ({ onBuyTicket }: ActiveJackpotsProps = {}) => {
  const [jackpots, setJackpots] = useState<Jackpot[]>([]);
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
        .order("created_at", { ascending: false });

      if (error) throw error;
      setJackpots(data || []);
    } catch (error) {
      console.error("Error fetching jackpots:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrize = (amount: number) => `₦${amount.toLocaleString()}`;
  const formatTicketPrice = (price: number) => `₦${price.toFixed(2)}`;

  return (
    <section className="py-20 px-4">
      <div className="absolute inset-0 bg-[#0f1923]">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20 mix-blend-overlay"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0f1923] via-[#0f1923]/95 to-[#0f1923]/40" />

        {/* Animated Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-yellow-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] animate-pulse delay-1000" />
      </div>

      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-black mb-4 text-white">
            Active
            <span className="text-yellow-500 ml-2">Jackpots</span>
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Choose your jackpot and start winning. New draws every hour!
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading jackpots...</p>
          </div>
        ) : jackpots.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No active jackpots at the moment. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {jackpots.map((jackpot) => (
              <JackpotCard
                key={jackpot.id}
                jackpotId={jackpot.id}
                title={jackpot.name}
                prize={formatPrize(jackpot.prize_pool)}
                ticketPrice={formatTicketPrice(jackpot.ticket_price)}
                endTime={jackpot.next_draw ? new Date(jackpot.next_draw) : new Date(Date.now() + 24 * 60 * 60 * 1000)}
                category={(jackpot.category || 'hourly') as "hourly" | "daily" | "weekly" | "monthly"}
                onBuyClick={onBuyTicket ? () => onBuyTicket(jackpot) : undefined}
                backgroundImageUrl={jackpot.background_image_url}
                createdAt={new Date(jackpot.created_at)}
                status={jackpot.status}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default ActiveJackpots;
