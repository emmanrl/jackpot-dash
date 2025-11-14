import TopNav from "@/components/TopNav";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const ContactSupport = () => {
  const { settings } = useSiteSettings();

  return (
    <div className="min-h-screen flex flex-col">
      <TopNav />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-4xl font-bold mb-8">Contact Support</h1>
        <Card>
          <CardHeader>
            <CardTitle>Get in Touch</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {settings.support_email && (
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-primary" />
                <a href={`mailto:${settings.support_email}`} className="text-primary hover:underline">
                  {settings.support_email}
                </a>
              </div>
            )}
            {settings.contact_phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-primary" />
                <a href={`tel:${settings.contact_phone}`} className="text-primary hover:underline">
                  {settings.contact_phone}
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default ContactSupport;
