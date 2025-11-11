import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Download, X } from "lucide-react";
import { format } from "date-fns";

interface ReceiptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: {
    amount: number;
    reference: string;
    created_at: string;
    type: string;
  } | null;
}

export default function ReceiptModal({ open, onOpenChange, transaction }: ReceiptModalProps) {
  if (!transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Payment Receipt</span>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Success Icon */}
          <div className="flex flex-col items-center justify-center py-4">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
            <h3 className="text-2xl font-bold text-foreground">Payment Successful!</h3>
            <p className="text-muted-foreground text-sm mt-2">Your deposit has been processed</p>
          </div>

          {/* Receipt Details */}
          <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Amount</span>
              <span className="text-2xl font-bold text-green-600">₦{transaction.amount.toFixed(2)}</span>
            </div>
            
            <div className="h-px bg-border" />
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Reference</span>
              <span className="text-sm font-mono">{transaction.reference}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Type</span>
              <span className="text-sm font-medium capitalize">{transaction.type.replace('_', ' ')}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Date</span>
              <span className="text-sm">{format(new Date(transaction.created_at), 'MMM dd, yyyy HH:mm')}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Status</span>
              <span className="text-sm font-medium text-green-600">Completed</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={handlePrint}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button className="flex-1" onClick={() => onOpenChange(false)}>
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}