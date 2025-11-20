import { Wallet, Ticket, Trophy, Rocket } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const HowItWorks = () => {
  const steps = [
    {
      icon: Wallet,
      title: "Create & Fund Wallet",
      description: "Sign up in seconds and add funds securely to your wallet",
      step: "01",
    },
    {
      icon: Ticket,
      title: "Buy Tickets",
      description: "Choose your jackpot and purchase tickets instantly",
      step: "02",
    },
    {
      icon: Trophy,
      title: "Win Prizes",
      description: "Automated draws pick winners fairly every time",
      step: "03",
    },
    {
      icon: Rocket,
      title: "Instant Payout",
      description: "Winnings credited to your wallet immediately",
      step: "04",
    },
  ];

  return (
    <section className="py-12 sm:py-16 md:py-20 px-3 sm:px-4 bg-muted/30 scroll-smooth">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-8 sm:mb-12 opacity-0 animate-fade-in">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4">How It Works</h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
            Join our jackpot system in 4 simple steps
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <Card 
                key={index}
                className="relative overflow-hidden border-2 border-border hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:scale-105 opacity-0 animate-fade-in group"
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                {/* Step number background */}
                <div className="absolute -right-4 -top-4 text-9xl font-bold text-primary/5 group-hover:text-primary/10 transition-colors">
                  {step.step}
                </div>

                <CardHeader>
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-primary/10 flex items-center justify-center mb-3 sm:mb-4 group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
                  </div>
                  <CardTitle className="text-base sm:text-lg md:text-xl">{step.title}</CardTitle>
                </CardHeader>

                <CardContent>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{step.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
