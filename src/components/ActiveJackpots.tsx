import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import JackpotCard from "./JackpotCard";

interface Jackpot {
  id: string;
  name: string;
  prize_pool: number;
  ticket_price: number;
  next_draw: string | null;
  frequency: string;
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

  const getCategoryFromFrequency = (frequency: string): "hourly" | "daily" | "weekly" | "monthly" => {
    if (frequency.toLowerCase().includes("hour")) return "hourly";
    if (frequency.toLowerCase().includes("day")) return "daily";
    if (frequency.toLowerCase().includes("week")) return "weekly";
    return "monthly";
  };

  return (
    <section className="py-20 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Active Jackpots
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
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
                title={jackpot.name}
                prize={formatPrize(jackpot.prize_pool)}
                ticketPrice={formatTicketPrice(jackpot.ticket_price)}
                endTime={jackpot.next_draw ? new Date(jackpot.next_draw) : new Date(Date.now() + 24 * 60 * 60 * 1000)}
                category={getCategoryFromFrequency(jackpot.frequency)}
                onBuyClick={onBuyTicket ? () => onBuyTicket(jackpot) : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default ActiveJackpots;
