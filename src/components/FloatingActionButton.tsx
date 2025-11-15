import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUp, Wallet, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const FloatingActionButton = () => {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 items-end">
      {expanded && (
        <div className="flex flex-col gap-2 animate-fade-in">
          <Button
            size="icon"
            className="h-12 w-12 rounded-full shadow-lg hover:scale-110 transition-transform"
            onClick={() => navigate("/dashboard")}
            title="Deposit Funds"
          >
            <Wallet className="h-5 w-5" />
          </Button>
          <Button
            size="icon"
            variant="secondary"
            className="h-12 w-12 rounded-full shadow-lg hover:scale-110 transition-transform"
            onClick={() => navigate("/dashboard")}
            title="Notifications"
          >
            <Bell className="h-5 w-5" />
          </Button>
        </div>
      )}
      <Button
        size="icon"
        className="h-14 w-14 rounded-full shadow-lg hover:scale-110 transition-all"
        onClick={() => {
          if (expanded) {
            scrollToTop();
          }
          setExpanded(!expanded);
        }}
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
      >
        <ArrowUp className="h-6 w-6" />
      </Button>
    </div>
  );
};
