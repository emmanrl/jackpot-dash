import { Shield, Lock, Zap, CheckCircle2, Users, Award } from "lucide-react";
import { Card } from "./ui/card";

const TrustBadgesSection = () => {
  const badges = [
    {
      icon: Shield,
      title: "100% Secure",
      description: "Bank-grade encryption protects your data",
      color: "text-primary"
    },
    {
      icon: Lock,
      title: "Licensed & Legal",
      description: "Fully compliant with Nigerian regulations",
      color: "text-secondary"
    },
    {
      icon: Zap,
      title: "Instant Payouts",
      description: "Winnings credited immediately to wallet",
      color: "text-accent"
    },
    {
      icon: CheckCircle2,
      title: "Fair & Transparent",
      description: "Provably fair random draws verified",
      color: "text-primary"
    },
    {
      icon: Users,
      title: "100K+ Users",
      description: "Trusted by thousands daily",
      color: "text-secondary"
    },
    {
      icon: Award,
      title: "Top Rated",
      description: "4.9/5 stars from real winners",
      color: "text-accent"
    }
  ];

  return (
    <section className="py-12 sm:py-16 md:py-20 px-3 sm:px-4 bg-muted/30 scroll-smooth">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-8 sm:mb-12 opacity-0 animate-fade-in">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4">
            Why Choose LuckyWin?
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
            Nigeria's most trusted jackpot platform with proven security and fairness
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {badges.map((badge, index) => (
            <Card
              key={index}
              className="p-4 sm:p-6 text-center hover:shadow-lg transition-all duration-300 hover:scale-105 opacity-0 animate-fade-in border-2 hover:border-primary/30"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex justify-center mb-3 sm:mb-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <badge.icon className={`w-6 h-6 sm:w-8 sm:h-8 ${badge.color}`} />
                </div>
              </div>
              <h3 className="font-bold text-sm sm:text-base md:text-lg mb-1 sm:mb-2">{badge.title}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-tight">
                {badge.description}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustBadgesSection;
