import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, ArrowLeft, Loader2 } from "lucide-react";
import MainLayout from "@/components/MainLayout";
import { SEOHead } from "@/components/SEOHead";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardJackpotCard } from "@/components/DashboardJackpotCard";

const DailyJackpot = () => {
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
                .eq('frequency', 'daily') // Filter for daily jackpots
                .order('next_draw', { ascending: true });

            if (error) throw error;
            setJackpots(data || []);
        } catch (error) {
            console.error("Error fetching daily jackpots:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <MainLayout>
            <SEOHead
                title="Daily Jackpot | LuckyWin"
                description="Play daily jackpot draws and win amazing prizes every day!"
                url="https://luckywin.name.ng/daily"
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
                            <Trophy className="w-8 h-8 text-yellow-500" />
                            Daily Jackpots
                        </h1>
                        <p className="text-muted-foreground mt-1">Win big with our daily jackpot draws</p>
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
                                subtitle="DAILY"
                                icon={<Trophy size={16} className="text-white" />}
                                color="text-yellow-500"
                                bgIcon="bg-yellow-500"
                                featured={true}
                                glowColor="shadow-[0_0_20px_rgba(234,179,8,0.1)]"
                                borderColor="border-yellow-500/20"
                                category="daily"
                                ticketsSold={0}
                                participants={0}
                                poolGrowth={0}
                                onBuyClick={() => navigate('/')}
                            />
                        ))}
                    </div>
                ) : (
                    <Card className="bg-card border-border">
                        <CardHeader>
                            <CardTitle className="text-foreground">No Active Daily Draws</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">
                                There are no active daily draws at the moment. Please check back later!
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </MainLayout>
    );
};

export default DailyJackpot;
