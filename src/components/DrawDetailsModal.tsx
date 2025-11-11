import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trophy, Users, DollarSign, Share2 } from "lucide-react";
import { toast } from "sonner";
import WinShareCard from "./WinShareCard";
import { useState } from "react";

interface DrawDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  win: {
    id: string;
    prize_amount: number;
    claimed_at: string;
    total_participants: number;
    total_pool_amount: number;
    ticket_id?: string;
    jackpots: {
      name: string;
    };
  };
}

export default function DrawDetailsModal({ open, onOpenChange, win }: DrawDetailsModalProps) {
  const [showShareCard, setShowShareCard] = useState(false);

  const handleShare = () => {
    setShowShareCard(true);
  };

  const winnerShare = (win.prize_amount / win.total_pool_amount) * 100;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Trophy className="w-6 h-6 text-primary" />
              Draw Details
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Jackpot Name */}
            <div className="text-center pb-4 border-b border-border">
              <h3 className="text-xl font-bold text-primary">{win.jackpots.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Won on {new Date(win.claimed_at).toLocaleDateString()}
              </p>
            </div>

            {/* Prize Amount */}
            <div className="bg-primary/10 rounded-lg p-6 text-center border border-primary/20">
              <p className="text-sm text-muted-foreground mb-2">Your Prize</p>
              <p className="text-4xl font-bold text-primary">
                ₦{Number(win.prize_amount).toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {winnerShare.toFixed(0)}% of total pool
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-primary" />
                  <p className="text-sm font-medium">Participants</p>
                </div>
                <p className="text-2xl font-bold text-primary">{win.total_participants}</p>
              </div>

              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-primary" />
                  <p className="text-sm font-medium">Total Pool</p>
                </div>
                <p className="text-2xl font-bold text-primary">
                  ₦{Number(win.total_pool_amount).toFixed(0)}
                </p>
              </div>
            </div>

            {/* Distribution Info */}
            <div className="bg-muted/50 rounded-lg p-4 text-sm">
              <p className="font-medium mb-2">Prize Distribution:</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Winner receives 80% of total pool</li>
                <li>• Platform receives 20% of total pool</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button 
                onClick={handleShare}
                className="flex-1"
                variant="hero"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share Win
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {showShareCard && (
        <WinShareCard
          jackpotName={win.jackpots.name}
          prizeAmount={Number(win.prize_amount)}
          winDate={win.claimed_at}
          ticketNumber={win.ticket_id || win.id.substring(0, 8)}
          open={showShareCard}
          onClose={() => setShowShareCard(false)}
        />
      )}
    </>
  );
}
