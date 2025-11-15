import { Button } from "@/components/ui/button";
import { Sparkles, Trophy, LayoutDashboard, TrendingUp, Users, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import heroImage from "@/assets/hero-jackpot.jpg";
import { Card } from "@/components/ui/card";

const Hero = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const { settings } = useSiteSettings();
  const [stats, setStats] = useState({
    totalPrizeToday: 0,
    winnersThisWeek: 0,
    activeJackpots: 0,
    nextDrawIn: "Loading...",
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    fetchStats();

    return () => subscription.unsubscribe();
  }, []);

  const fetchStats = async () => {
    // Fetch total prize pool today
    const { data: jackpots } = await supabase
      .from("jackpots")
      .select("prize_pool")
      .eq("status", "active");
    
    const totalPrize = jackpots?.reduce((sum, j) => sum + Number(j.prize_pool), 0) || 0;

    // Fetch winners this week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const { count: winnersCount } = await supabase
      .from("winners")
      .select("*", { count: "exact", head: true })
      .gte("claimed_at", weekAgo.toISOString());

    // Fetch active jackpots count
    const { count: jackpotsCount } = await supabase
      .from("jackpots")
      .select("*", { count: "exact", head: true })
      .eq("status", "active");

    // Get next draw time
    const { data: nextJackpot } = await supabase
      .from("jackpots")
      .select("next_draw")
      .eq("status", "active")
      .order("next_draw", { ascending: true })
      .limit(1)
      .single();

    let nextDrawText = "Soon";
    if (nextJackpot?.next_draw) {
      const timeDiff = new Date(nextJackpot.next_draw).getTime() - Date.now();
      const minutes = Math.floor(timeDiff / 60000);
      if (minutes < 60) {
        nextDrawText = `${minutes}m`;
      } else {
        const hours = Math.floor(minutes / 60);
        nextDrawText = `${hours}h`;
      }
    }

    setStats({
      totalPrizeToday: totalPrize,
      winnersThisWeek: winnersCount || 0,
      activeJackpots: jackpotsCount || 0,
      nextDrawIn: nextDrawText,
    });
  };
  
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background image with overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-20"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
      
      {/* Floating particles effect */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-primary/20"
            style={{
              width: Math.random() * 4 + 2 + "px",
              height: Math.random() * 4 + 2 + "px",
              left: Math.random() * 100 + "%",
              top: Math.random() * 100 + "%",
              animation: `float ${Math.random() * 3 + 2}s ease-in-out infinite`,
              animationDelay: Math.random() * 2 + "s",
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="container relative z-10 mx-auto px-4 text-center">
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-sm font-medium text-primary">Trusted by 100,000+ Winners</span>
          </div>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold mb-6 gold-glow">
          Win Life-Changing
          <span className="block bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-shimmer bg-[length:200%_100%]">
            Jackpots Every Hour
          </span>
        </h1>

        <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
          Join thousands of winners in our transparent, fair lottery system.
          Hourly, daily, weekly draws with prizes up to <span className="text-primary font-bold">₦1,000,000</span>
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
          {user ? (
            <Button 
              variant="hero" 
              size="lg" 
              className="text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 h-auto w-full sm:w-auto"
              onClick={() => navigate("/dashboard")}
            >
              <LayoutDashboard className="w-4 h-4 sm:w-5 sm:h-5" />
              Go to Dashboard
            </Button>
          ) : (
            <>
              <Button 
                variant="hero" 
                size="lg" 
                className="text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 h-auto w-full sm:w-auto"
                onClick={() => navigate("/auth")}
              >
                <Trophy className="w-4 h-4 sm:w-5 sm:h-5" />
                Get Started
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 h-auto border-primary/30 hover:border-primary w-full sm:w-auto"
                onClick={() => navigate("/auth")}
              >
                Sign In
              </Button>
            </>
          )}
        </div>

        {/* Enhanced Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-5xl mx-auto">
          <Card className="bg-card/50 backdrop-blur-sm p-3 sm:p-4 border-2 border-primary/20 hover:border-primary/40 transition-all duration-300 hover:scale-105 group">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-primary mb-1 animate-count-up">
              ₦{(stats.totalPrizeToday / 1000000).toFixed(1)}M
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground">Prize Pool Today</p>
          </Card>
          
          <Card className="bg-card/50 backdrop-blur-sm p-3 sm:p-4 border-2 border-accent/20 hover:border-accent/40 transition-all duration-300 hover:scale-105 group">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-accent/10 group-hover:bg-accent/20 transition-colors">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-accent mb-1 animate-count-up">
              {stats.winnersThisWeek}+
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground">Winners This Week</p>
          </Card>
          
          <Card className="bg-card/50 backdrop-blur-sm p-3 sm:p-4 border-2 border-secondary/20 hover:border-secondary/40 transition-all duration-300 hover:scale-105 group">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-secondary/10 group-hover:bg-secondary/20 transition-colors">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-secondary" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-secondary mb-1 animate-count-up">
              {stats.activeJackpots}
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground">Active Jackpots</p>
          </Card>
          
          <Card className="bg-card/50 backdrop-blur-sm p-3 sm:p-4 border-2 border-primary/20 hover:border-primary/40 transition-all duration-300 hover:scale-105 group">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-primary animate-pulse" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-primary mb-1">
              {stats.nextDrawIn}
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground">Next Draw In</p>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default Hero;
