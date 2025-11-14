import TopNav from "@/components/TopNav";
import Footer from "@/components/Footer";

const FairPlayPolicy = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <TopNav />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">Fair Play Policy</h1>
        <div className="space-y-6">
          <section>
            <h2 className="text-2xl font-bold mb-4">Our Commitment to Fairness</h2>
            <p>We are committed to providing a transparent and fair lottery system for all participants.</p>
          </section>
          <section>
            <h2 className="text-2xl font-bold mb-4">Random Selection</h2>
            <p>All winners are selected using cryptographically secure random number generation.</p>
          </section>
          <section>
            <h2 className="text-2xl font-bold mb-4">Transparency</h2>
            <p>All draws and winners are publicly displayed and verifiable.</p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default FairPlayPolicy;
