import { Ticket } from "lucide-react";

interface TicketCardProps {
  ticketId: string;
  ticketNumber: string;
  purchasePrice: number;
  purchasedAt: string;
  jackpotName: string;
}

const TicketCard = ({ ticketId, ticketNumber, purchasePrice, purchasedAt, jackpotName }: TicketCardProps) => {
  return (
    <div className="relative bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-lg p-4 border-2 border-dashed border-primary/40 shadow-lg hover:shadow-xl transition-all w-full">
      {/* Ticket Notches */}
      <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-background border-2 border-primary/40"></div>
      <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-background border-2 border-primary/40"></div>
      
      {/* Ticket Content */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-primary/10 rounded">
            <Ticket className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-lg font-bold text-primary truncate">#{ticketNumber}</p>
            <p className="text-xs text-muted-foreground truncate">{jackpotName}</p>
          </div>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-dashed border-primary/20">
          <div>
            <p className="text-xs text-muted-foreground">Amount</p>
            <p className="text-lg font-bold text-foreground">₦{purchasePrice.toFixed(2)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Date</p>
            <p className="text-xs font-medium">
              {new Date(purchasedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground/70">ID: {ticketId.slice(0, 8)}</p>
      </div>
      
      {/* Barcode Effect */}
      <div className="mt-2 flex gap-0.5 opacity-20">
        {Array.from({ length: 25 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 bg-foreground"
            style={{
              height: Math.random() > 0.5 ? '12px' : '8px',
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default TicketCard;
