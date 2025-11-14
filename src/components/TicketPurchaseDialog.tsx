import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Ticket } from "lucide-react";

interface TicketPurchaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jackpot: {
    id: string;
    name: string;
    ticket_price: number;
  } | null;
  walletBalance: number;
  onSuccess: () => void;
}

export default function TicketPurchaseDialog({ 
  open, 
  onOpenChange, 
  jackpot, 
  walletBalance,
  onSuccess 
}: TicketPurchaseDialogProps) {
  const [quantity, setQuantity] = useState("1");
  const [loading, setLoading] = useState(false);

  if (!jackpot) {
    return null;
  }

  const ticketPrice = Number(jackpot.ticket_price);
  const quantityNum = parseInt(quantity) || 1;
  const totalCost = ticketPrice * quantityNum;
  const canAfford = walletBalance >= totalCost;

  const handlePurchase = async () => {
    try {
      if (!canAfford) {
        toast.error("Insufficient balance");
        return;
      }

      if (quantityNum < 1 || quantityNum > 100) {
        toast.error("Please enter a valid quantity (1-100)");
        return;
      }

      setLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please log in to continue");
        return;
      }

      // Call edge function to purchase tickets
      const { data, error } = await supabase.functions.invoke('purchase-ticket', {
        body: {
          jackpotId: jackpot.id,
          quantity: quantityNum
        }
      });

      if (error) throw error;

      toast.success(`Successfully purchased ${quantityNum} ticket(s)!`);
      onOpenChange(false);
      onSuccess();
      setQuantity("1");

    } catch (error: any) {
      console.error('Purchase error:', error);
      toast.error(error.message || "Failed to purchase tickets");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-primary" />
            Purchase Tickets
          </DialogTitle>
          <DialogDescription>
            {jackpot.name} - ₦{ticketPrice.toFixed(2)} per ticket
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="quantity">Number of Tickets</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              max="100"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              disabled={loading}
            />
            <p className="text-sm text-muted-foreground">
              Maximum 100 tickets per purchase
            </p>
          </div>

          {/* Total Amount - Prominent Display */}
          <div className="rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 border-2 border-primary/40 p-6 text-center">
            <p className="text-sm text-muted-foreground mb-2">Total Amount</p>
            <p className="text-5xl font-bold text-primary gold-glow">
              ₦{totalCost.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {quantityNum} ticket{quantityNum > 1 ? 's' : ''} × ₦{ticketPrice.toFixed(2)}
            </p>
          </div>

          <div className="rounded-lg bg-muted/30 p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Your Balance:</span>
              <span className={walletBalance < totalCost ? "text-destructive font-bold" : "text-primary font-medium"}>
                ₦{walletBalance.toFixed(2)}
              </span>
            </div>
            {walletBalance >= totalCost && (
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Balance After:</span>
                <span>₦{(walletBalance - totalCost).toFixed(2)}</span>
              </div>
            )}
          </div>

          {!canAfford && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              Insufficient balance. Please deposit funds to continue.
            </div>
          )}

          <div className="rounded-lg bg-primary/10 border border-primary/20 p-3 text-sm text-muted-foreground">
            <p>• Each ticket gives you a chance to win the jackpot</p>
            <p>• More tickets = Higher chance of winning</p>
            <p>• Tickets are non-refundable</p>
          </div>
        </div>

        <DialogFooter>
          <Button 
            onClick={handlePurchase} 
            disabled={loading || !canAfford}
            className="w-full"
            variant="hero"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              `Buy ${quantityNum} Ticket${quantityNum > 1 ? 's' : ''} for ₦${totalCost.toFixed(2)}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
