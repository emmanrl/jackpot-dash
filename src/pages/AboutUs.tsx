import MainLayout from "@/components/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const AboutUs = () => {
  const { settings } = useSiteSettings();

  return (
    <MainLayout>
      <div className="space-y-6">
        <h1 className="text-4xl font-bold mb-8">About {settings.site_name}</h1>
        <Card>
          <CardHeader>
            <CardTitle>Our Mission</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>Welcome to {settings.site_name}, Nigeria's most transparent and fair jackpot lottery platform.</p>
            <p>We believe in providing everyone with an equal opportunity to win life-changing prizes through our innovative lottery system.</p>
            <p>Our platform features multiple draw frequencies - from 5-minute rapid draws to monthly mega jackpots, ensuring there's always an opportunity to win.</p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default AboutUs;
