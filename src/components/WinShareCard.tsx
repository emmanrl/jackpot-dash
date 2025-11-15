import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Share2, Trophy, Download, X } from "lucide-react";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import { useRef } from "react";

interface WinShareCardProps {
  jackpotName: string;
  prizeAmount: number;
  winDate: string;
  ticketNumber: string;
  open?: boolean;
  onClose?: () => void;
}

export default function WinShareCard({ 
  jackpotName, 
  prizeAmount, 
  winDate, 
  ticketNumber,
  open = true,
  onClose
}: WinShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleShare = async (platform: 'twitter' | 'facebook' | 'whatsapp') => {
    const text = `🎉 I just won ₦${prizeAmount.toLocaleString()} in ${jackpotName}! 🎊`;
    const url = 'https://luckywin.name.ng';

    const shareUrls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`,
    };

    window.open(shareUrls[platform], '_blank', 'width=600,height=400');
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;

    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#1a1a2e',
        scale: 2,
      });
      
      const link = document.createElement('a');
      link.download = `win-${ticketNumber}.png`;
      link.href = canvas.toDataURL();
      link.click();
      
      toast.success("Win card downloaded!");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download card");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <div className="space-y-4">
          <Card 
            ref={cardRef}
            className="relative overflow-hidden bg-gradient-to-br from-yellow-500 via-amber-500 to-orange-500 p-8 text-white"
          >
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12" />
            
            <div className="relative space-y-6 text-center">
              {/* Trophy Icon */}
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Trophy className="w-12 h-12 text-white" />
                </div>
              </div>

              {/* Winner Text */}
              <div>
                <h2 className="text-4xl font-bold mb-2">🎉 WINNER! 🎉</h2>
                <p className="text-lg opacity-90">Congratulations!</p>
              </div>

              {/* Prize Amount */}
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-6">
                <p className="text-sm opacity-90 mb-2">Prize Won</p>
                <p className="text-5xl font-bold">₦{prizeAmount.toLocaleString()}</p>
              </div>

              {/* Details */}
              <div className="space-y-2 text-sm opacity-90">
                <p className="font-semibold text-lg">{jackpotName}</p>
                <p>Ticket #{ticketNumber}</p>
                <p>{new Date(winDate).toLocaleDateString('en-US', { 
                  month: 'long', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}</p>
              </div>
            </div>
          </Card>

          {/* Share Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={handleDownload} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button onClick={() => handleShare('twitter')} className="bg-[#1DA1F2] hover:bg-[#1DA1F2]/90">
              <Share2 className="w-4 h-4 mr-2" />
              Twitter
            </Button>
            <Button onClick={() => handleShare('facebook')} className="bg-[#4267B2] hover:bg-[#4267B2]/90">
              <Share2 className="w-4 h-4 mr-2" />
              Facebook
            </Button>
            <Button onClick={() => handleShare('whatsapp')} className="bg-[#25D366] hover:bg-[#25D366]/90">
              <Share2 className="w-4 h-4 mr-2" />
              WhatsApp
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}