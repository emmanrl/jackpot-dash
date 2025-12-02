import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Ticket, Users, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { CountdownTimer } from "@/components/CountdownTimer";

interface DashboardJackpotCardProps {
    jackpotId: string;
    title: string;
    prize: number;
    ticketPrice: number;
    endTime: string;
    subtitle: string;
    icon: React.ReactNode;
    color: string;
    bgIcon: string;
    featured: boolean;
    glowColor: string;
    borderColor: string;
    category: string;
    ticketsSold: number;
    participants: number;
    poolGrowth: number;
    onBuyClick: () => void;
    index: number;
    compact?: boolean;
}

export const DashboardJackpotCard = ({
    title,
    prize,
    ticketPrice,
    endTime,
    subtitle,
    icon,
    color,
    bgIcon,
    featured,
    glowColor,
    borderColor,
    category,
    ticketsSold,
    participants,
    poolGrowth,
    onBuyClick,
    index,
    compact = false,
}: DashboardJackpotCardProps) => {
    const isBigWin = prize > 500000;

    return (
        <div className={`bg-card rounded-2xl border border-border overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${glowColor} ${borderColor} group relative flex flex-col h-full`}>
            {featured && !compact && (
                <div className="absolute top-0 right-0 z-10">
                    <div className="bg-yellow-500 text-black text-[10px] font-bold px-3 py-1 rounded-bl-xl shadow-lg">
                        FEATURED
                    </div>
                </div>
            )}

            <div className={`${compact ? 'p-3' : 'p-5'} border-b border-border flex justify-between items-center bg-muted/30`}>
                <span className={`text-[10px] font-bold text-foreground px-2.5 py-1 rounded-lg bg-muted uppercase tracking-wider border border-border`}>
                    {subtitle}
                </span>
                <div className={`p-2 rounded-lg ${bgIcon} ${color}`}>
                    {icon}
                </div>
            </div>

            <div className={`${compact ? 'p-4' : 'p-6'} text-center bg-gradient-to-b from-card to-muted/10 flex-1 flex flex-col`}>
                <h3 className={`text-muted-foreground font-bold ${compact ? 'text-xs' : 'text-sm'} mb-1`}>{title}</h3>
                {!compact && <div className="text-muted-foreground text-[10px] uppercase font-bold tracking-widest mb-4">Prize Pool</div>}
                <div className={`${compact ? 'text-2xl mb-3' : 'text-3xl mb-6'} font-black text-foreground tracking-tight`}>
                    ₦{prize.toLocaleString()}
                </div>

                <div className={`grid grid-cols-2 gap-3 ${compact ? 'mb-3' : 'mb-6'}`}>
                    <div className="bg-muted/50 rounded-lg py-2.5 px-3 border border-border">
                        <div className="flex items-center justify-center gap-1.5 text-muted-foreground text-[10px] uppercase font-bold mb-1">
                            <Clock size={10} /> Time
                        </div>
                        <div className="text-yellow-500 font-mono font-bold text-lg items-center">
                            <CountdownTimer targetDate={new Date(endTime)} className={`font-bold text-foreground ${compact ? 'text-xs' : 'text-sm'}`} />
                        </div>
                    </div>
                    <div className="bg-muted/50 rounded-lg py-2.5 px-3 border border-border">
                        <div className="flex items-center justify-center gap-1.5 text-muted-foreground text-[10px] uppercase font-bold mb-1">
                            <Ticket size={10} /> Ticket
                        </div>
                        <div className={`text-foreground font-bold ${compact ? 'text-xs' : 'text-sm'}`}>₦{ticketPrice}</div>
                    </div>
                </div>

                <Button
                    onClick={onBuyClick}
                    className={`w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold ${compact ? 'py-2 text-sm' : 'py-3'} rounded-xl transition-all shadow-lg shadow-yellow-500/10 active:scale-[0.98] mt-auto`}
                >
                    Buy Tickets
                </Button>
            </div>
        </div>
    );
};
