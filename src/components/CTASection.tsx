import { Button } from "./ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

const CTASection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-20 px-4 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-10 left-10 w-72 h-72 bg-primary rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-secondary rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>
      
      <div className="container mx-auto relative z-10">
        <div className="max-w-3xl mx-auto text-center opacity-0 animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-primary/20 px-4 py-2 rounded-full mb-6 animate-scale-in">
            <Sparkles className="w-5 h-5 text-primary animate-pulse" />
            <span className="text-sm font-semibold text-primary">Join Thousands of Winners</span>
          </div>
          
          <h2 className="text-3xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Your Next Big Win Starts Here
          </h2>
          
          <p className="text-base md:text-xl text-muted-foreground mb-8 leading-relaxed max-w-2xl mx-auto">
            Don't just dream about winning—make it happen! Sign up now and get instant access to all our jackpots. 
            Your fortune awaits! 🎉
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              className="text-base px-8 py-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group"
              onClick={() => navigate('/auth')}
            >
              Get Started Now
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            
            <Button 
              size="lg" 
              variant="outline"
              className="text-base px-8 py-6 border-2 hover:border-primary transition-all duration-300"
              onClick={() => navigate('/how-it-works')}
            >
              Learn How It Works
            </Button>
          </div>
          
          <div className="mt-8 flex items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span>Instant Payouts</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span>24/7 Support</span>
            </div>
            <div className="flex items-center gap-2 hidden sm:flex">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span>100% Secure</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;