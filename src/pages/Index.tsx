import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import TopNav from "@/components/TopNav";
import Hero from "@/components/Hero";
import ActiveJackpots from "@/components/ActiveJackpots";
import HowItWorks from "@/components/HowItWorks";
import RecentWinners from "@/components/RecentWinners";
import Footer from "@/components/Footer";
import ReceiptModal from "@/components/ReceiptModal";

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);

  useEffect(() => {
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

  return (
    <div className="min-h-screen">
      <TopNav />
      <Hero />
      <ActiveJackpots />
      <HowItWorks />
      <RecentWinners />
      <Footer />
      
      <ReceiptModal
        open={receiptOpen}
        onOpenChange={setReceiptOpen}
        transaction={receiptData}
      />
    </div>
  );
};

export default Index;
