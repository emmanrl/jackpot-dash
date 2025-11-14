import TopNav from "@/components/TopNav";
import Footer from "@/components/Footer";
import RecentWinners from "@/components/RecentWinners";

const WinnersGallery = () => {
  return (
    <div className="min-h-screen flex flex-col">
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
