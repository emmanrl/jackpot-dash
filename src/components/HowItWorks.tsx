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
    <section className="py-20 px-4 bg-muted/30">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">How It Works</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join our jackpot system in 4 simple steps
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <Card 
                key={index}
                className="relative overflow-hidden border-2 border-border hover:border-primary/50 transition-all duration-300 hover:shadow-xl group"
              >
                {/* Step number background */}
                <div className="absolute -right-4 -top-4 text-9xl font-bold text-primary/5 group-hover:text-primary/10 transition-colors">
                  {step.step}
                </div>

                <CardHeader>
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-8 h-8 text-primary animate-float" />
                  </div>
                  <CardTitle className="text-xl">{step.title}</CardTitle>
                </CardHeader>

                <CardContent>
                  <p className="text-muted-foreground">{step.description}</p>
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
