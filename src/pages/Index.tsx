import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import TopNav from "@/components/TopNav";
import Hero from "@/components/Hero";
import ActiveJackpots from "@/components/ActiveJackpots";
import HowItWorks from "@/components/HowItWorks";
import RecentWinners from "@/components/RecentWinners";
import Leaderboard from "@/components/Leaderboard";
import Footer from "@/components/Footer";
import ReceiptModal from "@/components/ReceiptModal";
import TicketPurchaseDialog from "@/components/TicketPurchaseDialog";
import WinCelebrationModal from "@/components/WinCelebrationModal";
import { useWinNotification } from "@/hooks/useWinNotification";
import { ImageSlider } from "@/components/ImageSlider";

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [ticketDialogOpen, setTicketDialogOpen] = useState(false);
  const [selectedJackpot, setSelectedJackpot] = useState<any>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const { winData, showWinModal, setShowWinModal } = useWinNotification();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
      
      if (session) {
        // Fetch wallet balance
        const { data: wallet } = await supabase
          .from("wallets")
          .select("balance")
          .eq("user_id", session.user.id)
          .single();
        
        if (wallet) setWalletBalance(Number(wallet.balance));

        // Set up real-time subscription for jackpots
        const channel = supabase
          .channel('jackpot-updates')
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'jackpots',
            },
            (payload) => {
              console.log('Jackpot updated:', payload);
              // Refresh the active jackpots display
              window.location.reload();
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      }
    };
    
    checkAuth();

    const receipt = searchParams.get("receipt");
    const reference = searchParams.get("reference");
    const amount = searchParams.get("amount");

    if (receipt === "true" && reference && amount) {
      setReceiptData({
        amount: parseFloat(amount),
        reference,
        created_at: new Date().toISOString(),
        type: "deposit",
      });
      setReceiptOpen(true);
      
      // Clean up URL params
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  const handleBuyTicket = (jackpot: any) => {
    setSelectedJackpot(jackpot);
    setTicketDialogOpen(true);
  };

  const handleTicketPurchaseSuccess = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data: wallet } = await supabase
        .from("wallets")
        .select("balance")
        .eq("user_id", session.user.id)
        .single();
      
      if (wallet) setWalletBalance(Number(wallet.balance));
    }
  };

  return (
    <div className="min-h-screen">
      <TopNav />
      <ImageSlider />
      {isLoggedIn ? (
        <>
          <ActiveJackpots onBuyTicket={handleBuyTicket} />
          <Hero />
          <HowItWorks />
          <Leaderboard />
          <RecentWinners />
        </>
      ) : (
        <>
          <Hero />
          <HowItWorks />
          <ActiveJackpots />
          <Leaderboard />
          <RecentWinners />
        </>
      )}
      <Footer />
      
      <ReceiptModal
        open={receiptOpen}
        onOpenChange={setReceiptOpen}
        transaction={receiptData}
      />
      
      {selectedJackpot && (
        <TicketPurchaseDialog
          open={ticketDialogOpen}
          onOpenChange={setTicketDialogOpen}
          jackpot={selectedJackpot}
          walletBalance={walletBalance}
          onSuccess={handleTicketPurchaseSuccess}
        />
      )}
      
      {winData && (
        <WinCelebrationModal
          open={showWinModal}
          onOpenChange={setShowWinModal}
          prizeAmount={winData.prizeAmount}
          jackpotName={winData.jackpotName}
        />
      )}
    </div>
  );
};

export default Index;
