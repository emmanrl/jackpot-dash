import { Button } from "@/components/ui/button";
import { Sparkles, Trophy, ArrowRight, Clock, Ticket } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import heroImage from "@/assets/hero-jackpot.jpg";
import Mascot from "@/components/Mascot";

interface HeroData {
  nextJackpot: {
    name: string;
    prize_pool: number;
    next_draw: string;
  } | null;
  totalPaidOut: number;
  recentWinners: {
    name: string;
    amount: number;
    time: string;
    avatar_color: string;
  }[];
  featuredWin: {
    amount: number;
    winner: string;
  } | null;
}

const Hero = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<HeroData>({
    nextJackpot: null,
    totalPaidOut: 0,
    recentWinners: [],
    featuredWin: null
  });
  const [timeLeft, setTimeLeft] = useState<{ h: string, m: string, s: string }>({ h: "00", m: "00", s: "00" });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    fetchHeroData();
    const interval = setInterval(fetchHeroData, 30000); // Update every 30s

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, []);

  // Countdown timer effect
  useEffect(() => {
    if (!data.nextJackpot?.next_draw) return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const target = new Date(data.nextJackpot!.next_draw).getTime();
      const distance = target - now;

      if (distance < 0) {
        setTimeLeft({ h: "00", m: "00", s: "00" });
      } else {
        const hours = Math.floor(distance / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        setTimeLeft({
          h: hours.toString().padStart(2, '0'),
          m: minutes.toString().padStart(2, '0'),
          s: seconds.toString().padStart(2, '0')
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [data.nextJackpot]);

  const fetchHeroData = async () => {
    try {
      // 1. Fetch Next Jackpot (Active and ending soonest)
      const { data: jackpots } = await supabase
        .from('jackpots')
        .select('name, prize_pool, next_draw')
        .eq('status', 'active')
        .order('next_draw', { ascending: true })
        .limit(1);

      // 2. Fetch Total Paid Out
      const { data: allWinners } = await supabase
        .from('winners')
        .select('prize_amount');

      const totalPaid = allWinners?.reduce((sum, w) => sum + Number(w.prize_amount), 0) || 0;

      // 3. Fetch Recent Winners with profiles
      const { data: recentWins } = await supabase
        .from('winners')
        .select(`
          prize_amount,
          claimed_at,
          profiles:user_id (
            full_name,
            username
          )
        `)
        .order('claimed_at', { ascending: false })
        .limit(2);

      // 4. Fetch a featured big win
      const { data: bigWin } = await supabase
        .from('winners')
        .select(`
          prize_amount,
          profiles:user_id (
            username
          )
        `)
        .order('prize_amount', { ascending: false })
        .limit(1)
        .single();

      // Process Recent Winners
      const formattedRecentWinners = recentWins?.map(win => {
        const profile = win.profiles as any;
        const name = profile?.full_name || profile?.username || 'Anonymous';
        const date = new Date(win.claimed_at);
        const timeDiff = Math.floor((new Date().getTime() - date.getTime()) / 60000); // minutes
        const timeStr = timeDiff < 60 ? `${timeDiff}m ago` : `${Math.floor(timeDiff / 60)}h ago`;

        return {
          name: name.split(' ')[0] + (name.split(' ')[1] ? ` ${name.split(' ')[1][0]}.` : ''),
          amount: Number(win.prize_amount),
          time: timeStr,
          avatar_color: 'bg-gradient-to-br from-yellow-500 to-purple-600'
        };
      }) || [];

      setData({
        nextJackpot: jackpots?.[0] || null,
        totalPaidOut: totalPaid,
        recentWinners: formattedRecentWinners,
        featuredWin: bigWin ? {
          amount: Number(bigWin.prize_amount),
          winner: (bigWin.profiles as any)?.username || 'LuckyUser'
        } : null
      });

    } catch (error) {
      console.error('Error fetching hero data:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(amount);
  };

  const formatShortCurrency = (amount: number) => {
    if (amount >= 1000000) return `₦${(amount / 1000000).toFixed(1)}M+`;
    if (amount >= 1000) return `₦${(amount / 1000).toFixed(1)}K+`;
    return `₦${amount}`;
  };

  return (
    <section className="relative min-h-[600px] flex items-center overflow-hidden py-12 lg:py-20 px-4 lg:px-12">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-background">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20 mix-blend-overlay"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background/40" />

        {/* Animated Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-yellow-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] animate-pulse delay-1000" />
      </div>

      <div className="container relative z-10 mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">

          {/* Left Content */}
          <div className="text-left max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 mb-6">
              <Sparkles className="w-3 h-3 text-yellow-500" />
              <span className="text-xs font-bold text-yellow-500 tracking-wider uppercase">Trusted by 100,000+ Winners</span>
            </div>

            <h1 className="animate-float text-5xl md:text-6xl lg:text-7xl font-black mb-6 leading-[1.1] text-foreground">
              Win Life-Changing
              <span className="block text-yellow-500">Jackpots</span>
              Every Hour
            </h1>

            <p className="text-lg text-muted-foreground mb-8 max-w-xl leading-relaxed">
              Join thousands of winners in our transparent, fair lottery system.
              Hourly, daily, and weekly draws with prizes up to
              <span className="text-yellow-500 font-bold ml-1">
                {/*data.nextJackpot ? formatCurrency(data.nextJackpot.prize_pool) : '₦1,000,000'*/}
                ₦1,500,000
              </span>.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 animate-float">
              <Button
                size="lg"
                className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-lg px-8 py-6 h-auto rounded-xl shadow-[0_0_20px_rgba(234,179,8,0.3)] hover:shadow-[0_0_30px_rgba(234,179,8,0.5)] transition-all duration-300 transform hover:-translate-y-1"
                onClick={() => navigate(user ? "/dashboard" : "/auth")}
              >
                Buy Ticket Now
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="bg-card border-border text-foreground hover:bg-muted hover:text-foreground text-lg px-8 py-6 h-auto rounded-xl"
                onClick={() => navigate("/winners")}
              >
                <Trophy className="w-5 h-5 mr-2 text-muted-foreground" />
                View Winners
              </Button>
            </div>
          </div>

          {/* Right Content - Floating Cards */}
          <div className="relative hidden lg:block h-[500px]">

            {/* Next Draw Card */}
            <motion.div
              animate={{ y: [0, -15, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-0 right-0 w-80 bg-card/90 backdrop-blur-md border border-border rounded-2xl p-6 shadow-2xl z-10"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Next Draw</div>
                  <div className="text-xl font-bold text-foreground">
                    {data.nextJackpot?.name || 'Loading...'}
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-yellow-500" />
                </div>
              </div>

              <div className="flex gap-2 mb-6">
                {[timeLeft.h, ":", timeLeft.m, ":", timeLeft.s].map((item, i) => (
                  <div key={i} className={`font-mono font-bold ${item === ":" ? "text-muted-foreground pt-1" : "bg-muted/30 px-3 py-2 rounded text-yellow-500"}`}>
                    {item}
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-end">
                <div className="text-sm text-muted-foreground">Prize Pool</div>
                <div className="text-2xl font-bold text-foreground">
                  {data.nextJackpot ? formatCurrency(data.nextJackpot.prize_pool) : '...'}
                </div>
              </div>
            </motion.div>

            {/* Total Paid Out Card */}
            <motion.div
              animate={{ y: [0, 15, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute top-32 left-0 w-72 bg-card/80 backdrop-blur-md border border-border rounded-2xl p-5 shadow-2xl z-0"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Trophy className="w-5 h-5 text-green-500" />
                </div>
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Paid Out</div>
              </div>
              <div className="text-3xl font-bold text-foreground mb-1">
                {data.totalPaidOut ? formatShortCurrency(data.totalPaidOut) : 'N1,000,000'}
              </div>
              <div className="text-xs text-green-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Live updates
              </div>
            </motion.div>

            {/* Live Winners Card */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
              className="absolute bottom-0 left-10 w-64 bg-card/90 backdrop-blur-md border border-border rounded-2xl p-4 shadow-2xl z-10"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-foreground uppercase tracking-wider">Live Winners</span>
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              </div>
              <div className="space-y-3">
                {data.recentWinners.length > 0 ? (
                  data.recentWinners.map((winner, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full ${winner.avatar_color} flex items-center justify-center text-[10px] font-bold text-white`}>
                          {winner.name[0]}
                        </div>
                        <span className="text-muted-foreground">{winner.name}</span>
                      </div>
                      <span className="text-yellow-500 font-bold">{formatCurrency(winner.amount)}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground text-center py-2">Waiting for winners...</div>
                )}
              </div>
            </motion.div>

            {/* Winning Ticket Card */}
            {data.featuredWin && (
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="absolute bottom-10 right-20 w-80 bg-yellow-500 rounded-2xl p-6 shadow-[0_0_50px_rgba(234,179,8,0.2)] z-20"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-black/10 rounded-lg">
                    <Ticket className="w-5 h-5 text-black" />
                  </div>
                  <div className="text-xs font-bold text-black/60 uppercase tracking-wider">Winning Ticket</div>
                </div>

                <div className="text-4xl font-bold text-black mb-2">
                  {formatCurrency(data.featuredWin.amount)}
                </div>
                <div className="text-sm font-medium text-black/70">
                  Paid to @{data.featuredWin.winner}
                </div>
              </motion.div>
            )}

            {/* Background Blur Element */}
            <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-purple-500/30 rounded-full blur-[80px] -z-10" />

            {/* Mascot Integration */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="absolute top-10 left-10 w-[400px] h-[400px] z-5 pointer-events-none"
            >
              <Mascot variant="hero" size="100%" className="drop-shadow-2xl" />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
