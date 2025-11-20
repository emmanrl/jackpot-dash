import { TrendingUp, Users, Trophy, Zap } from "lucide-react";
import { Card } from "./ui/card";

interface StatsSectionProps {
  stats: {
    totalPrizePool: number;
    totalWinners: number;
    activeJackpots: number;
    todayDraws: number;
  };
}

const StatsSection = ({ stats }: StatsSectionProps) => {
  const statCards = [
    {
      icon: Trophy,
      value: `₦${stats.totalPrizePool.toLocaleString()}`,
      label: "Total Prize Pool",
      color: "text-primary",
      bgColor: "bg-primary/10"
    },
    {
      icon: Users,
      value: stats.totalWinners.toLocaleString(),
      label: "Total Winners",
      color: "text-secondary",
      bgColor: "bg-secondary/10"
    },
    {
      icon: TrendingUp,
      value: stats.activeJackpots.toLocaleString(),
      label: "Active Jackpots",
      color: "text-accent",
      bgColor: "bg-accent/10"
    },
    {
      icon: Zap,
      value: stats.todayDraws.toLocaleString(),
      label: "Today's Draws",
      color: "text-primary",
      bgColor: "bg-primary/10"
    }
  ];

  return (
    <section className="py-8 sm:py-12 md:py-16 px-3 sm:px-4 bg-gradient-to-b from-background to-muted/20 scroll-smooth">
      <div className="container mx-auto max-w-7xl">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {statCards.map((stat, index) => (
            <Card 
              key={index}
              className="p-3 sm:p-4 md:p-6 text-center hover:shadow-lg transition-all duration-300 hover:scale-105 opacity-0 animate-fade-in border-2 hover:border-primary/30"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`${stat.bgColor} w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 md:mb-4 transition-transform group-hover:scale-110`}>
                <stat.icon className={`w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 ${stat.color}`} />
              </div>
              <div className={`text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold ${stat.color} mb-1 sm:mb-1 md:mb-2`}>
                {stat.value}
              </div>
              <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground font-medium leading-tight">
                {stat.label}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;