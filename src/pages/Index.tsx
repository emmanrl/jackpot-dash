import TopNav from "@/components/TopNav";
import Hero from "@/components/Hero";
import ActiveJackpots from "@/components/ActiveJackpots";
import HowItWorks from "@/components/HowItWorks";
import RecentWinners from "@/components/RecentWinners";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <TopNav />
      <Hero />
      <ActiveJackpots />
      <HowItWorks />
      <RecentWinners />
      <Footer />
    </div>
  );
};

export default Index;
