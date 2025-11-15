import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Wallet, 
  Ticket, 
  Trophy, 
  Bell, 
  ArrowRight,
  CheckCircle,
  Sparkles
} from "lucide-react";

const tutorialSteps = [
  {
    icon: Wallet,
    title: "Fund Your Wallet",
    description: "Start by depositing funds into your wallet. You can use various payment methods available on the platform.",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10"
  },
  {
    icon: Ticket,
    title: "Purchase Tickets",
    description: "Browse active jackpots and purchase tickets. Buy bundles for discounts - 5+ tickets get 10% off, 10+ get 15% off, and 20+ get 20% off!",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10"
  },
  {
    icon: Trophy,
    title: "Win Prizes",
    description: "Wait for the draw! Winners are selected randomly and prizes are automatically credited to your wallet. You'll get notified of your wins.",
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10"
  },
  {
    icon: Bell,
    title: "Stay Updated",
    description: "Enable notifications to get alerts about upcoming draws, your favorite jackpots, and when you win! Check the leaderboard to see your rank.",
    color: "text-green-500",
    bgColor: "bg-green-500/10"
  }
];

export default function Tutorial() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      navigate("/dashboard");
    }
  };

  const handleSkip = () => {
    navigate("/dashboard");
  };

  const step = tutorialSteps[currentStep];
  const Icon = step.icon;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-background via-primary/5 to-background">
      {/* Animated background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-primary/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-float" />
        <div className="absolute -bottom-8 -right-4 w-96 h-96 bg-accent/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-float" style={{ animationDelay: '2s' }} />
      </div>

      <Card className="w-full max-w-2xl relative z-10 border-2 border-primary/20 bg-card/95 backdrop-blur-xl shadow-2xl">
        <CardHeader className="text-center space-y-4 pb-6">
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-primary/20 via-primary/10 to-accent/20 border-2 border-primary/30 shadow-lg">
              <Sparkles className="w-5 h-5 text-primary animate-pulse" />
              <span className="text-base font-bold text-primary">Welcome to JackpotWin!</span>
            </div>
          </div>
          <CardTitle className="text-3xl">How It Works</CardTitle>
          <CardDescription>
            Learn how to start winning big prizes
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Progress indicators */}
          <div className="flex justify-center gap-2 mb-8">
            {tutorialSteps.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all ${
                  index === currentStep
                    ? "w-8 bg-primary"
                    : index < currentStep
                    ? "w-2 bg-primary/60"
                    : "w-2 bg-muted"
                }`}
              />
            ))}
          </div>

          {/* Current step */}
          <div className="text-center space-y-6 py-8">
            <div className="flex justify-center">
              <div className={`p-6 rounded-full ${step.bgColor}`}>
                <Icon className={`w-16 h-16 ${step.color}`} />
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-2xl font-bold">{step.title}</h3>
              <p className="text-muted-foreground text-lg max-w-md mx-auto">
                {step.description}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-6">
            <Button
              variant="outline"
              onClick={handleSkip}
              className="flex-1"
            >
              Skip Tutorial
            </Button>
            <Button
              onClick={handleNext}
              className="flex-1 gap-2"
            >
              {currentStep === tutorialSteps.length - 1 ? (
                <>
                  Get Started
                  <CheckCircle className="w-4 h-4" />
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>

          {/* Step counter */}
          <p className="text-center text-sm text-muted-foreground">
            Step {currentStep + 1} of {tutorialSteps.length}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
