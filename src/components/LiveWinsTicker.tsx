import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface WinData {
    user: string;
    game: string;
    amount: string;
    avatar: string | null;
}

const LiveWinsTicker = () => {
    const [wins, setWins] = useState<WinData[]>([]);

    useEffect(() => {
        fetchRecentWins();

        // Subscribe to new wins
        const channel = supabase
            .channel('live-wins')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'winners'
            }, () => {
                fetchRecentWins();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchRecentWins = async () => {
        try {
            const { data, error } = await supabase
                .from('winners')
                .select(`
                    prize_amount,
                    claimed_at,
                    profiles!winners_user_id_fkey (
                        username,
                        full_name,
                        avatar_url
                    ),
                    jackpots (
                        name
                    )
                `)
                .order('claimed_at', { ascending: false })
                .limit(10);

            if (error) throw error;

            if (data) {
                const formattedWins: WinData[] = data.map((win: any) => ({
                    user: win.profiles?.username || win.profiles?.full_name || 'Anonymous',
                    game: win.jackpots?.name || 'Jackpot',
                    amount: `+₦${Number(win.prize_amount).toLocaleString()}`,
                    avatar: win.profiles?.avatar_url || null
                }));

                setWins(formattedWins);
            }
        } catch (error) {
            console.error('Error fetching recent wins:', error);
            // Fallback to placeholder data if fetch fails
            setWins([
                { user: "Player", game: "Daily...", amount: "+₦42,900", avatar: null },
                { user: "Player", game: "Afternoon...", amount: "+₦8,200", avatar: null },
                { user: "Player", game: "Noon Special", amount: "+₦1,800", avatar: null },
                { user: "Player", game: "Evening Quick", amount: "+₦10,000", avatar: null },
                { user: "Player", game: "Evening Special", amount: "+₦35,420", avatar: null },
                { user: "Player", game: "🌟 Triple Hour Special", amount: "+₦12,900", avatar: null },
                { user: "Player", game: "🔥 3-Hour Blaze", amount: "+₦1,800", avatar: null },
                { user: "Player", game: "Evening Grand", amount: "+₦10,000", avatar: null },
                { user: "Player", game: "Evening Grand", amount: "+₦35,420", avatar: null },
            ]);
        }
    };

    // If no wins yet, show a placeholder
    const displayWins = wins.length > 0 ? wins : [
        { user: "Waiting for wins...", game: "Play now!", amount: "+₦0", avatar: null }
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 h-16 flex items-center lg:pl-64">
            <div className="px-4 font-bold text-xs text-muted-foreground uppercase tracking-wider whitespace-nowrap border-r border-border h-full flex items-center">
                Live Wins
            </div>

            <div className="flex-1 overflow-hidden relative">
                <div className="flex items-center gap-8 animate-scroll whitespace-nowrap px-4">
                    {[...displayWins, ...displayWins, ...displayWins].map((win, index) => (
                        <div key={index} className="flex items-center gap-3 bg-muted/50 rounded-full px-4 py-1.5 border border-border min-w-[200px]">
                            <Avatar className="w-6 h-6 border border-border">
                                {win.avatar ? (
                                    <AvatarImage src={win.avatar} alt={win.user} />
                                ) : null}
                                <AvatarFallback className="bg-muted text-[10px] text-foreground">
                                    {win.user[0]?.toUpperCase()}
                                </AvatarFallback>
                            </Avatar>

                            <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-foreground">{win.user}</span>
                                    <span className="text-[10px] text-muted-foreground">Won {win.game}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="text-xs font-bold text-green-500">{win.amount}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-card to-transparent pointer-events-none" />
        </div>
    );
};

export default LiveWinsTicker;
