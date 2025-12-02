import MainLayout from "@/components/MainLayout";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const TermsOfService = () => {
  const { settings } = useSiteSettings();

  return (
    <MainLayout>
      <div className="space-y-6 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
        <div className="prose prose-sm max-w-none space-y-4">
          {settings.terms_of_service ? (
            <div dangerouslySetInnerHTML={{ __html: settings.terms_of_service }} />
          ) : (
            <p>Terms of Service will be updated soon.</p>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default TermsOfService;
