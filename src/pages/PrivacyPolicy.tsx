import MainLayout from "@/components/MainLayout";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const PrivacyPolicy = () => {
  const { settings } = useSiteSettings();

  return (
    <MainLayout>
      <div className="space-y-6 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        <div className="prose prose-sm max-w-none space-y-4">
          {settings.privacy_policy ? (
            <div dangerouslySetInnerHTML={{ __html: settings.privacy_policy }} />
          ) : (
            <p>Privacy Policy will be updated soon.</p>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default PrivacyPolicy;
