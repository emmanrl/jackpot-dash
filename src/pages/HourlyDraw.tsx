import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Zap, Trophy, ArrowLeft, Loader2 } from "lucide-react";
import MainLayout from "@/components/MainLayout";
import { SEOHead } from "@/components/SEOHead";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardJackpotCard } from "@/components/DashboardJackpotCard";

const HourlyDraw = () => {
    const navigate = useNavigate();
    const [jackpots, setJackpots] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchJackpots();
    }, []);

    const fetchJackpots = async () => {
        try {
            const { data, error } = await supabase
                .from('jackpots')
                .select('*')
                .eq('status', 'active')
                .eq('frequency', 'hourly') // Filter for hourly jackpots
                .order('next_draw', { ascending: true });

            if (error) throw error;
            setJackpots(data || []);
        } catch (error) {
            console.error("Error fetching hourly jackpots:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <MainLayout>
            <SEOHead
                title="Hourly Draw | LuckyWin"
                description="Participate in hourly jackpot draws with instant results. Win big every hour!"
                url="https://luckywin.name.ng/hourly"
            />

            <div className="space-y-6 container mx-auto px-4 py-8">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(-1)}
                        className="text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                            <Clock className="w-8 h-8 text-blue-400" />
                            Hourly Draws
                        </h1>
                        <p className="text-muted-foreground mt-1">Fast-paced hourly jackpots with instant results</p>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <Loader2 className="w-12 h-12 text-primary animate-spin" />
                    </div>
                ) : jackpots.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {jackpots.map((jackpot, index) => (
                            <DashboardJackpotCard
                                key={jackpot.id}
                                index={index}
                                jackpotId={jackpot.id}
                                title={jackpot.name}
                                prize={jackpot.prize_pool}
                                ticketPrice={jackpot.ticket_price}
                                endTime={jackpot.next_draw}
                                subtitle="HOURLY"
                                icon={<Clock size={16} className="text-white" />}
                                color="text-blue-400"
                                bgIcon="bg-blue-500"
                                featured={false}
                                glowColor="shadow-[0_0_20px_rgba(59,130,246,0.1)]"
                                borderColor="border-blue-500/20"
                                category="hourly"
                                ticketsSold={0} // Fetch real stats if available
                                participants={0}
                                poolGrowth={0}
                                onBuyClick={() => navigate('/')} // Redirect to lobby or handle purchase logic
                            />
                        ))}
                    </div>
                ) : (
                    <Card className="bg-card border-border">
                        <CardHeader>
                            <CardTitle className="text-foreground">No Active Draws</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">
                                There are no active hourly draws at the moment. Please check back later!
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </MainLayout>
    );
};

export default HourlyDraw;
