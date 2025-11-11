import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Trophy, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Confetti from "react-confetti";

interface WinCelebrationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prizeAmount: number;
  jackpotName: string;
}

export default function WinCelebrationModal({
  open,
  onOpenChange,
  prizeAmount,
  jackpotName,
}: WinCelebrationModalProps) {
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
          recycle={true}
          numberOfPieces={300}
        />
      )}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md border-primary/50">
          <div className="text-center space-y-6 py-6">
            {/* Trophy Icon */}
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-primary/20 blur-3xl animate-pulse" />
              <div className="relative p-6 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full border-4 border-primary/30 animate-bounce">
                <Trophy className="w-20 h-20 text-primary" />
              </div>
            </div>

            {/* Congratulations Text */}
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <Sparkles className="w-6 h-6 text-primary animate-pulse" />
                <h2 className="text-3xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                  Congratulations!
                </h2>
                <Sparkles className="w-6 h-6 text-primary animate-pulse" />
              </div>
              <p className="text-lg text-muted-foreground">You're a Winner!</p>
            </div>

            {/* Prize Amount */}
            <div className="bg-gradient-to-br from-primary/10 via-accent/10 to-primary/10 rounded-lg p-8 border-2 border-primary/20">
              <p className="text-sm text-muted-foreground mb-2">You Won</p>
              <p className="text-5xl font-bold text-primary gold-glow mb-2">
                ₦{prizeAmount.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">{jackpotName}</p>
            </div>

            {/* Message */}
            <p className="text-sm text-muted-foreground px-4">
              Your prize has been automatically added to your wallet balance. Share your win with friends!
            </p>

            {/* Close Button */}
            <Button
              onClick={() => onOpenChange(false)}
              size="lg"
              className="w-full"
              variant="hero"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Claim Prize
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
