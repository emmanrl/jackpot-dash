import { Trophy, Ticket, Timer, CreditCard } from "lucide-react";
import { Card } from "./ui/card";
import { Skeleton } from "./ui/skeleton";

interface StatsSectionProps {
  stats: {
    totalPrizePool: number;
    totalWinners: number;
    activeJackpots: number;
    todayDraws: number;
    activePlayers?: number;
    totalPaidOut?: number;
  };
  loading?: boolean;
}

const StatsSection = ({ stats, loading = false }: StatsSectionProps) => {

  const formatCurrency = (val: number) => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M+`;
    if (val >= 1000) return `$${(val / 1000).toFixed(1)}K+`;
    return `$${val}`;
  };

  const formatNumber = (val: number) => {
    return val.toLocaleString();
  };

  const statCards = [
    {
      icon: Trophy,
      value: formatCurrency(stats.totalPaidOut || 0),
      label: "TOTAL PAID OUT",
    },
    {
      icon: Ticket,
      value: formatNumber(stats.activePlayers || 0),
      label: "ACTIVE PLAYERS",
    },
    {
      icon: Timer,
      value: formatNumber(stats.todayDraws || 0),
      label: "LIVE DRAWS",
    },
    {
      icon: CreditCard,
      value: formatCurrency(stats.totalPrizePool || 0),
      label: "JACKPOT POOL",
    }
  ];

  return (
    <section className="py-8 px-4">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, index) => (
            <Card
              key={index}
              className="bg-[#1a2c38] border-none p-6 flex items-center gap-4 hover:bg-[#233b4a] transition-colors duration-300 group"
            >
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <stat.icon className="w-6 h-6 text-gray-400 group-hover:text-white transition-colors" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  {stat.label}
                </div>
                <div className="text-2xl font-black text-white">
                  {loading ? (
                    <Skeleton className="h-8 w-24 bg-white/10" />
                  ) : (
                    stat.value
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;