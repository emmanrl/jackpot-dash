import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";

const Footer = () => {
  const navigate = useNavigate();

  return (
    <footer className="py-12 px-4 border-t border-border">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
              <Sparkles className="w-6 h-6 text-primary" />
              <span className="text-xl font-bold">JackpotWin</span>
            </div>
            <p className="text-sm text-muted-foreground">
              The most trusted and transparent jackpot system. Win big, win fair.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Jackpots</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="hover:text-primary transition-colors cursor-pointer" onClick={() => navigate("/")}>
                Hourly Draws
              </li>
              <li className="hover:text-primary transition-colors cursor-pointer" onClick={() => navigate("/")}>
                Daily Draws
              </li>
              <li className="hover:text-primary transition-colors cursor-pointer" onClick={() => navigate("/")}>
                Weekly Draws
              </li>
              <li className="hover:text-primary transition-colors cursor-pointer" onClick={() => navigate("/")}>
                Monthly Draws
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="hover:text-primary transition-colors cursor-pointer" onClick={() => navigate("/")}>
                About Us
              </li>
              <li className="hover:text-primary transition-colors cursor-pointer" onClick={() => navigate("/")}>
                How It Works
              </li>
              <li className="hover:text-primary transition-colors cursor-pointer" onClick={() => navigate("/")}>
                Winners
              </li>
              <li className="hover:text-primary transition-colors cursor-pointer" onClick={() => navigate("/")}>
                FAQ
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="hover:text-primary transition-colors cursor-pointer" onClick={() => navigate("/")}>
                Terms of Service
              </li>
              <li className="hover:text-primary transition-colors cursor-pointer" onClick={() => navigate("/")}>
                Privacy Policy
              </li>
              <li className="hover:text-primary transition-colors cursor-pointer" onClick={() => navigate("/")}>
                Fair Play
              </li>
              <li className="hover:text-primary transition-colors cursor-pointer" onClick={() => navigate("/")}>
                Contact
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-border text-center text-sm text-muted-foreground">
          <p>&copy; 2025 JackpotWin. All rights reserved. Play responsibly.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
