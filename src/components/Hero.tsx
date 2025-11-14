import { Button } from "@/components/ui/button";
import { Sparkles, Trophy, LayoutDashboard } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import heroImage from "@/assets/hero-jackpot.jpg";
import { ImageSlider } from "@/components/ImageSlider";

const Hero = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const { settings } = useSiteSettings();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);
  
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

        {/* Image Slider */}
        <ImageSlider />

        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
          {[
            { label: "Active Players", value: "100K+" },
            { label: "Total Prizes", value: "₦50M+" },
            { label: "Winners Today", value: "1,250" },
            { label: "Success Rate", value: "99.9%" },
          ].map((stat, i) => (
            <div key={i} className="p-4 rounded-lg bg-card border border-border">
              <div className="text-3xl font-bold text-primary mb-1">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Hero;
