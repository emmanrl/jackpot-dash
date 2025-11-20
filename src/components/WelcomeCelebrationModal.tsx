import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Sparkles, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";
import Confetti from "react-confetti";

interface WelcomeCelebrationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName?: string;
}

export default function WelcomeCelebrationModal({
  open,
  onOpenChange,
  userName,
}: WelcomeCelebrationModalProps) {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      {open && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={500}
          gravity={0.3}
        />
      )}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md border-primary/50">
          <div className="text-center space-y-6 py-6">
            {/* Party Icon */}
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-primary/20 blur-3xl animate-pulse" />
              <div className="relative p-6 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full border-4 border-primary/30 animate-bounce">
                <PartyPopper className="w-20 h-20 text-primary" />
              </div>
            </div>

            {/* Welcome Text */}
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <Sparkles className="w-6 h-6 text-primary animate-pulse" />
                <h2 className="text-3xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                  Welcome{userName ? `, ${userName}` : ""}!
                </h2>
                <Sparkles className="w-6 h-6 text-primary animate-pulse" />
              </div>
              <p className="text-lg text-muted-foreground">
                Your email has been verified successfully!
              </p>
            </div>

            {/* Success Message */}
            <div className="bg-gradient-to-br from-primary/10 via-accent/10 to-primary/10 rounded-lg p-6 border-2 border-primary/20">
              <p className="text-foreground font-medium mb-2">
                🎉 You're all set to start winning!
              </p>
              <p className="text-sm text-muted-foreground">
                Let's walk you through how to get started with your first jackpot.
              </p>
            </div>

            {/* Start Button */}
            <Button
              onClick={() => onOpenChange(false)}
              size="lg"
              className="w-full"
              variant="hero"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Let's Go!
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
