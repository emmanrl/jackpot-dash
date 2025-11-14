import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const Footer = () => {
  const navigate = useNavigate();
  const { settings } = useSiteSettings();

  return (
    <footer className="py-16 px-4 border-t border-border/50 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 cursor-pointer group" onClick={() => navigate("/")}>
              {settings.site_logo_url ? (
                <img src={settings.site_logo_url} alt={settings.site_name} className="h-8 w-auto" />
              ) : (
                <>
                  <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                    <Sparkles className="w-6 h-6 text-primary" />
                  </div>
                  <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    {settings.site_name}
                  </span>
                </>
              )}
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The most trusted and transparent jackpot system. Win big, win fair, win often.
            </p>
            <div className="pt-2">
              <p className="text-xs text-muted-foreground">Powered by secure technology</p>
            </div>
          </div>

          {/* Jackpots Links */}
          <div>
            <h3 className="font-semibold mb-4 text-foreground">Jackpots</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer" onClick={() => navigate("/")}>
                  5-Minute Draws
                </span>
              </li>
              <li>
                <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer" onClick={() => navigate("/")}>
                  12-Hour Draws
                </span>
              </li>
              <li>
                <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer" onClick={() => navigate("/")}>
                  24-Hour Draws
                </span>
              </li>
              <li>
                <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer" onClick={() => navigate("/")}>
                  Special Events
                </span>
              </li>
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="font-semibold mb-4 text-foreground">Company</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer" onClick={() => navigate("/about")}>
                  About Us
                </span>
              </li>
              <li>
                <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer" onClick={() => navigate("/how-it-works")}>
                  How It Works
                </span>
              </li>
              <li>
                <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer" onClick={() => navigate("/winners")}>
                  Winners Gallery
                </span>
              </li>
              <li>
                <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer" onClick={() => navigate("/faq")}>
                  FAQ
                </span>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="font-semibold mb-4 text-foreground">Legal</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer" onClick={() => navigate("/terms")}>
                  Terms of Service
                </span>
              </li>
              <li>
                <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer" onClick={() => navigate("/privacy")}>
                  Privacy Policy
                </span>
              </li>
              <li>
                <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer" onClick={() => navigate("/fair-play")}>
                  Fair Play Policy
                </span>
              </li>
              <li>
                <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer" onClick={() => navigate("/contact")}>
                  Contact Support
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border/50">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} JackpotWin. All rights reserved.
            </p>
            <p className="text-xs text-muted-foreground">
              🎲 Play responsibly • Must be 18+ to participate
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
