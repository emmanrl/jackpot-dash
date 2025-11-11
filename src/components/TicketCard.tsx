import { Ticket } from "lucide-react";

interface TicketCardProps {
  ticketNumber: string;
  purchasePrice: number;
  purchasedAt: string;
  jackpotName: string;
}

const TicketCard = ({ ticketNumber, purchasePrice, purchasedAt, jackpotName }: TicketCardProps) => {
  return (
    <div className="relative bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-lg p-6 border-2 border-dashed border-primary/40 shadow-lg hover:shadow-xl transition-all">
      {/* Ticket Notches */}
      <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-background border-2 border-primary/40"></div>
      <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-background border-2 border-primary/40"></div>
      
      {/* Ticket Content */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Ticket className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold text-primary">#{ticketNumber}</p>
            <p className="text-sm text-muted-foreground mt-1">{jackpotName}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-foreground">₦{purchasePrice.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {new Date(purchasedAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        </div>
      </div>
      
      {/* Barcode Effect */}
      <div className="mt-4 flex gap-1 opacity-30">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 bg-foreground"
            style={{
              height: Math.random() > 0.5 ? '20px' : '10px',
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default TicketCard;
