import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Ticket, Users, Star } from "lucide-react";
import { motion } from "framer-motion";
import { CountdownTimer } from "@/components/CountdownTimer";

interface DashboardJackpotCardProps {
  jackpotId: string;
  title: string;
  prize: number;
  ticketPrice: number;
  endTime: string;
  category: string;
  ticketsSold: number;
  participants: number;
  poolGrowth: number;
  onBuyClick: () => void;
  index: number;
}

export const DashboardJackpotCard = ({
  title,
  prize,
  ticketPrice,
  endTime,
  category,
  ticketsSold,
  participants,
  poolGrowth,
  onBuyClick,
  index,
}: DashboardJackpotCardProps) => {
  const isBigWin = prize > 5000;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
      className="break-inside-avoid mb-3"
    >
      <Card
        className={`rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:scale-[1.02] ${
          isBigWin
            ? "bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 text-white"
            : "bg-card border border-border text-foreground"
        }`}
      >
        <CardContent className="p-4 space-y-3">
          <div className="flex justify-between items-center text-[10px] font-medium uppercase tracking-wide">
            <span className={isBigWin ? "bg-white/15 rounded px-2 py-1" : "bg-secondary rounded px-2 py-1"}>{category}</span>
            {poolGrowth > 0 && (
              <span className="bg-green-400 text-black rounded px-2 py-1">+{poolGrowth}% Pool</span>
            )}
          </div>

          <div className="text-center space-y-1">
            {isBigWin && (
              <div className="flex justify-center items-center gap-1 text-yellow-200 font-bold text-sm animate-pulse">
                <Star size={16} />
                <span>BIG WIN</span>
                <Star size={16} />
              </div>
            )}

            <p className="text-sm opacity-90 font-semibold line-clamp-2">{title}</p>
            <p className="text-[10px] text-yellow-400 font-medium">Draw ends soon</p>
          </div>

          <div className={`rounded-lg p-3 flex flex-col items-center space-y-1 ${isBigWin ? "bg-white/10" : "bg-secondary/20"}`}>
            <p className={`text-xs ${isBigWin ? "opacity-70" : "text-muted-foreground"}`}>Prize Pool</p>
            <p className="text-xl font-extrabold">₦{prize.toLocaleString()}</p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs mt-2">
            <div className={`flex items-center gap-1 rounded-lg p-2 ${isBigWin ? "bg-white/10" : "bg-secondary/20"}`}>
              <Clock size={16} />
              <div className="flex-1 min-w-0">
                <p className={`text-[10px] ${isBigWin ? "opacity-70" : "text-muted-foreground"}`}>Time</p>
                <div className="font-semibold text-[10px]">
                  <CountdownTimer targetDate={new Date(endTime)} className="text-[10px]" />
                </div>
              </div>
            </div>

            <div className={`flex items-center gap-1 rounded-lg p-2 ${isBigWin ? "bg-white/10" : "bg-secondary/20"}`}>
              <Ticket size={16} />
              <div>
                <p className={`text-[10px] ${isBigWin ? "opacity-70" : "text-muted-foreground"}`}>Ticket</p>
                <p className="font-semibold text-[10px]">₦{ticketPrice}</p>
              </div>
            </div>

            <div className={`flex items-center gap-1 rounded-lg p-2 ${isBigWin ? "bg-white/10" : "bg-secondary/20"}`}>
              <Users size={16} />
              <div>
                <p className={`text-[10px] ${isBigWin ? "opacity-70" : "text-muted-foreground"}`}>Players</p>
                <p className="font-semibold text-[10px]">{participants}</p>
              </div>
            </div>

            <div className={`flex items-center gap-1 rounded-lg p-2 ${isBigWin ? "bg-white/10" : "bg-secondary/20"}`}>
              <div className="w-2 h-2 bg-yellow-300 rounded-full" />
              <div>
                <p className={`text-[10px] ${isBigWin ? "opacity-70" : "text-muted-foreground"}`}>Sold</p>
                <p className="font-semibold text-[10px]">{ticketsSold}</p>
              </div>
            </div>
          </div>

          <Button 
            onClick={onBuyClick}
            className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-1.5 rounded text-sm mt-2"
          >
            Buy Tickets
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};
