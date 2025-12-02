import MainLayout from "@/components/MainLayout";
import Hero from "@/components/Hero";
import { Card } from "@/components/ui/card";
import { Trophy, TrendingUp, Zap, Users, ArrowRight, Clock, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { DashboardJackpotCard } from "@/components/DashboardJackpotCard";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { JackpotCardSkeleton } from "@/components/JackpotCardSkeleton";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";

const Lobby = () => {
    const navigate = useNavigate();
    const [activeJackpots, setActiveJackpots] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchActiveJackpots();
    }, []);

    const fetchActiveJackpots = async () => {
        try {
            const { data, error } = await supabase
                .from('jackpots')
                .select('*')
                .eq('status', 'active')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setActiveJackpots(data || []);
        } catch (error) {
            console.error('Error fetching jackpots:', error);
        } finally {
            setLoading(false);
        }
    };

    const getCategoryStyles = (cat: string) => {
        switch (cat?.toLowerCase()) {
            case 'hourly': return { icon: <Clock className="w-5 h-5 text-blue-400" />, color: "text-blue-400", bgIcon: "bg-blue-400/10", glow: "hover:shadow-blue-500/20", border: "hover:border-blue-500/50" };
            case 'daily': return { icon: <Zap className="w-5 h-5 text-yellow-500" />, color: "text-yellow-500", bgIcon: "bg-yellow-500/10", glow: "hover:shadow-yellow-500/20", border: "hover:border-yellow-500/50" };
            case 'weekly': return { icon: <Trophy className="w-5 h-5 text-purple-500" />, color: "text-purple-500", bgIcon: "bg-purple-500/10", glow: "hover:shadow-purple-500/20", border: "hover:border-purple-500/50" };
            default: return { icon: <Star className="w-5 h-5 text-green-500" />, color: "text-green-500", bgIcon: "bg-green-500/10", glow: "hover:shadow-green-500/20", border: "hover:border-green-500/50" };
        }
    };

    return (
        <MainLayout>
            <div className="space-y-8 animate-fade-in">
                {/* Hero Section */}
                <div className="rounded-3xl overflow-hidden border border-border shadow-2xl relative">
                    <Hero />
                </div>

                {/* Stats Section */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="p-4 bg-card/50 backdrop-blur-sm border-border hover:border-primary/20 transition-all duration-300 group">
                        <div className="flex flex-col space-y-2">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Trophy className="w-4 h-4 text-primary" />
                                </div>
                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Paid</span>
                            </div>
                            <div className="text-xl md:text-2xl font-black text-foreground">
                                $12,500,000+
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4 bg-card/50 backdrop-blur-sm border-border hover:border-green-500/20 transition-all duration-300 group">
                        <div className="flex flex-col space-y-2">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Users className="w-4 h-4 text-green-500" />
                                </div>
                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Winners</span>
                            </div>
                            <div className="text-xl md:text-2xl font-black text-foreground">
                                100,063
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4 bg-card/50 backdrop-blur-sm border-border hover:border-purple-500/20 transition-all duration-300 group">
                        <div className="flex flex-col space-y-2">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Zap className="w-4 h-4 text-purple-500" />
                                </div>
                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Live Draws</span>
                            </div>
                            <div className="text-xl md:text-2xl font-black text-foreground">
                                24 Active
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4 bg-card/50 backdrop-blur-sm border-border hover:border-blue-500/20 transition-all duration-300 group">
                        <div className="flex flex-col space-y-2">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <TrendingUp className="w-4 h-4 text-blue-500" />
                                </div>
                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Avg. Win</span>
                            </div>
                            <div className="text-xl md:text-2xl font-black text-foreground">
                                $1,250
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Featured Jackpots */}
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Trophy className="w-5 h-5 text-primary" />
                            </div>
                            <h2 className="text-2xl font-bold text-foreground">Featured Jackpots</h2>
                        </div>
                        <Button variant="ghost" className="text-muted-foreground hover:text-foreground" onClick={() => navigate('/dashboard')}>
                            View All <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[1, 2, 3, 4].map((i) => <JackpotCardSkeleton key={i} />)}
                        </div>
                    ) : (
                        <Carousel
                            opts={{
                                align: "start",
                                loop: true,
                            }}
                            className="w-full"
                        >
                            <CarouselContent className="-ml-4">
                                {activeJackpots.map((jackpot, index) => {
                                    const styles = getCategoryStyles(jackpot.category);
                                    return (
                                        <CarouselItem key={jackpot.id} className="pl-4 md:basis-1/2 lg:basis-1/4">
                                            <div className="h-full">
                                                <DashboardJackpotCard
                                                    index={index}
                                                    jackpotId={jackpot.id}
                                                    title={jackpot.name}
                                                    prize={jackpot.prize_pool}
                                                    ticketPrice={jackpot.ticket_price}
                                                    endTime={jackpot.next_draw}
                                                    category={jackpot.category || 'daily'}
                                                    subtitle={jackpot.category ? `${jackpot.category} Draw` : 'Daily Draw'}
                                                    icon={styles.icon}
                                                    color={styles.color}
                                                    bgIcon={styles.bgIcon}
                                                    featured={index === 0}
                                                    glowColor={styles.glow}
                                                    borderColor={styles.border}
                                                    ticketsSold={0}
                                                    participants={0}
                                                    poolGrowth={0}
                                                    onBuyClick={() => navigate('/dashboard')}
                                                    compact={true}
                                                />
                                            </div>
                                        </CarouselItem>
                                    );
                                })}
                            </CarouselContent>
                            <div className="hidden md:block">
                                <CarouselPrevious className="-left-4" />
                                <CarouselNext className="-right-4" />
                            </div>
                        </Carousel>
                    )}
                </section>
            </div>
        </MainLayout>
    );
};

export default Lobby;
