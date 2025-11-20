import { useLocation } from "react-router-dom";
import TopNav from "@/components/TopNav";
import Footer from "@/components/Footer";
import RecentWinners from "@/components/RecentWinners";
import { SEOHead } from "@/components/SEOHead";
import { BreadcrumbSchema, generateBreadcrumbs } from "@/components/BreadcrumbSchema";

const WinnersGallery = () => {
  const location = useLocation();
  
  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead
        title="Winners Gallery - LuckyWin Success Stories"
        description="Meet our lucky winners! Browse through LuckyWin's hall of fame featuring real winners, their amazing prizes, and inspiring success stories. You could be next!"
        url="https://luckywin.name.ng/winners"
        type="website"
      />
      <BreadcrumbSchema items={generateBreadcrumbs(location.pathname)} />
      <TopNav />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Winners Gallery</h1>
        <RecentWinners />
      </main>
      <Footer />
    </div>
  );
};

export default WinnersGallery;
