import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Ticket, ArrowLeft, Loader2 } from "lucide-react";
import MainLayout from "@/components/MainLayout";
import { SEOHead } from "@/components/SEOHead";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardJackpotCard } from "@/components/DashboardJackpotCard";

const Scratchcards = () => {
    const navigate = useNavigate();
    const [games, setGames] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchGames();
    }, []);

    const fetchGames = async () => {
        try {
            const { data, error } = await supabase
                .from('jackpots')
                .select('*')
                .eq('status', 'active')
                // Assuming 'scratch' or 'scratchcard' logic, or maybe category
                // For now, let's try 'scratch' frequency or filter by type if column existed
                // Using 'scratchcard' as frequency placeholder
                .eq('frequency', 'scratchcard')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setGames(data || []);
        } catch (error) {
            console.error("Error fetching scratchcards:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <MainLayout>
            <SEOHead
                title="Scratchcards | LuckyWin"
                description="Scratch and win with our exciting digital scratchcard games!"
                url="https://luckywin.name.ng/scratchcards"
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
                            <Ticket className="w-8 h-8 text-purple-500" />
                            Scratchcards
                        </h1>
                        <p className="text-muted-foreground mt-1">Scratch to reveal your prizes</p>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <Loader2 className="w-12 h-12 text-primary animate-spin" />
                    </div>
                ) : games.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {games.map((game, index) => (
                            <DashboardJackpotCard
                                key={game.id}
                                index={index}
                                jackpotId={game.id}
                                title={game.name}
                                prize={game.prize_pool}
                                ticketPrice={game.ticket_price}
                                endTime={new Date(Date.now() + 86400000).toISOString()}
                                subtitle="SCRATCH"
                                icon={<Ticket size={16} className="text-white" />}
                                color="text-purple-400"
                                bgIcon="bg-purple-500"
                                featured={false}
                                glowColor="shadow-[0_0_20px_rgba(168,85,247,0.1)]"
                                borderColor="border-purple-500/20"
                                category="scratch"
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
                            <CardTitle className="text-foreground">No Active Scratchcards</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">
                                There are no active scratchcards at the moment. New cards coming soon!
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </MainLayout>
    );
};

export default Scratchcards;
