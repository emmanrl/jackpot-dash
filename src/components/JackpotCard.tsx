import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, TrendingUp, Ticket } from "lucide-react";
import { useEffect, useState } from "react";

interface JackpotCardProps {
  title: string;
  prize: string;
  ticketPrice: string;
  endTime: Date;
  category: "hourly" | "daily" | "weekly" | "monthly";
}

const JackpotCard = ({ title, prize, ticketPrice, endTime, category }: JackpotCardProps) => {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = endTime.getTime() - now;

      if (distance < 0) {
        setTimeLeft("ENDED");
        return;
      }

      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime]);

  const categoryColors = {
    hourly: "from-amber-500/20 to-orange-500/20",
    daily: "from-blue-500/20 to-cyan-500/20",
    weekly: "from-purple-500/20 to-pink-500/20",
    monthly: "from-emerald-500/20 to-green-500/20",
  };

  return (
    <Card className={`relative overflow-hidden border-2 border-border hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/20 group`}>
      {/* Gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${categoryColors[category]} opacity-50 group-hover:opacity-70 transition-opacity`} />
      
      {/* Shimmer effect */}
      <div className="absolute inset-0 shimmer opacity-0 group-hover:opacity-100 transition-opacity" />

      <CardHeader className="relative">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary px-2 py-1 rounded-full bg-primary/10 border border-primary/20">
            {category}
          </span>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <TrendingUp className="w-3 h-3" />
            <span>+12% pool</span>
          </div>
        </div>
        <CardTitle className="text-2xl font-bold">{title}</CardTitle>
        <CardDescription>Draw ends soon</CardDescription>
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
        <Button variant="prize" className="w-full" size="lg">
          <Ticket className="w-4 h-4" />
          Buy Tickets
        </Button>
      </CardFooter>
    </Card>
  );
};

export default JackpotCard;
