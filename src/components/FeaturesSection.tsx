import { Shield, Zap, Gift, Clock } from "lucide-react";
import { Card } from "./ui/card";

const FeaturesSection = () => {
  const features = [
    {
      icon: Zap,
      title: "Instant Draws",
      description: "Lightning-fast draws from 3 minutes to monthly. More chances to win!",
      gradient: "from-primary/20 to-primary/5"
    },
    {
      icon: Shield,
      title: "100% Secure",
      description: "Bank-grade encryption keeps your data and transactions safe.",
      gradient: "from-secondary/20 to-secondary/5"
    },
    {
      icon: Gift,
      title: "Multiple Winners",
      description: "More winners per draw means better chances for everyone!",
      gradient: "from-accent/20 to-accent/5"
    },
    {
      icon: Clock,
      title: "24/7 Access",
      description: "Play anytime, anywhere. Your luck never sleeps!",
      gradient: "from-primary/20 to-primary/5"
    }
  ];

  return (
    <section className="py-16 px-4 bg-muted/30">
      <div className="container mx-auto">
        <div className="text-center mb-12 opacity-0 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Why Choose LuckyWin?
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
            Experience the thrill of winning with Nigeria's most trusted lottery platform
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card
              key={index}
              className={`p-6 hover:shadow-xl transition-all duration-300 hover:scale-105 opacity-0 animate-fade-in bg-gradient-to-br ${feature.gradient} border-2`}
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              <div className="bg-background w-14 h-14 rounded-full flex items-center justify-center mb-4 shadow-md">
                <feature.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-foreground">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;