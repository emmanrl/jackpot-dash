import { Button } from "./ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

const CTASection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-12 sm:py-16 md:py-20 px-3 sm:px-4 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 relative overflow-hidden scroll-smooth">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-10 left-10 w-48 h-48 sm:w-72 sm:h-72 bg-primary rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-64 h-64 sm:w-96 sm:h-96 bg-secondary rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>
      
      <div className="container mx-auto relative z-10 max-w-7xl">
        <div className="max-w-3xl mx-auto text-center opacity-0 animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-primary/20 px-3 py-2 sm:px-4 sm:py-2 rounded-full mb-4 sm:mb-6 animate-scale-in">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-primary animate-pulse" />
            <span className="text-xs sm:text-sm font-semibold text-primary">Join Thousands of Winners</span>
          </div>
          
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent px-4">
            Your Next Big Win Starts Here
          </h2>
          
          <p className="text-sm sm:text-base md:text-xl text-muted-foreground mb-6 sm:mb-8 leading-relaxed max-w-2xl mx-auto px-4">
            Don't just dream about winning—make it happen! Sign up now and get instant access to all our jackpots. 
            Your fortune awaits! 🎉
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center px-4">
            <Button 
              size="lg" 
              className="text-sm sm:text-base px-6 py-5 sm:px-8 sm:py-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group w-full sm:w-auto"
              onClick={() => navigate('/auth')}
            >
              Get Started Now
              <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            
            <Button 
              size="lg" 
              variant="outline"
              className="text-sm sm:text-base px-6 py-5 sm:px-8 sm:py-6 border-2 hover:border-primary transition-all duration-300 w-full sm:w-auto"
              onClick={() => navigate('/how-it-works')}
            >
              Learn How It Works
            </Button>
          </div>
          
          <div className="mt-6 sm:mt-8 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs sm:text-sm text-muted-foreground px-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span>Instant Payouts</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span>24/7 Support</span>
            </div>
            <div className="flex items-center gap-2">
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