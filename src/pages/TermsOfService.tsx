import TopNav from "@/components/TopNav";
import Footer from "@/components/Footer";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const TermsOfService = () => {
  const { settings } = useSiteSettings();

  return (
    <div className="min-h-screen flex flex-col">
      <TopNav />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
        <div className="prose prose-sm max-w-none space-y-4">
          {settings.terms_of_service ? (
            <div dangerouslySetInnerHTML={{ __html: settings.terms_of_service }} />
          ) : (
            <p>Terms of Service will be updated soon.</p>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TermsOfService;
