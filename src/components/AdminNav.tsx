import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LuckyWinLogo } from "@/components/LuckyWinLogo";
import { 
  LayoutDashboard, 
  Settings, 
  Users, 
  Image, 
  Mail, 
  CreditCard, 
  Wallet,
  LogOut,
  Menu,
  X
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { NavLink } from "@/components/NavLink";

export const AdminNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [balance, setBalance] = useState<number>(0);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchAdminData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const { data: wallet } = await supabase
          .from("wallets")
          .select("balance")
          .eq("user_id", user.id)
          .single();
        
        if (wallet) setBalance(wallet.balance);
      }
    };
    
    fetchAdminData();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const menuItems = [
    { to: "/admin", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/admin/site-settings", icon: Settings, label: "Site Settings" },
    { to: "/admin/user-management", icon: Users, label: "Users" },
    { to: "/admin/slider-management", icon: Image, label: "Slider" },
    { to: "/admin/email-sender", icon: Mail, label: "Email" },
    { to: "/admin/payments", icon: CreditCard, label: "Payments" },
    { to: "/admin/withdrawals", icon: Wallet, label: "Withdrawals" },
  ];

  const MenuContent = () => (
    <>
      {menuItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === "/admin"}
          className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-accent transition-colors"
          activeClassName="bg-primary text-primary-foreground hover:bg-primary"
          onClick={() => setMobileMenuOpen(false)}
        >
          <item.icon className="h-5 w-5" />
          <span className="font-medium">{item.label}</span>
        </NavLink>
      ))}
      <Button
        variant="ghost"
        className="flex items-center gap-3 w-full justify-start px-4 py-2.5 text-destructive hover:text-destructive hover:bg-destructive/10"
        onClick={handleSignOut}
      >
        <LogOut className="h-5 w-5" />
        <span className="font-medium">Sign Out</span>
      </Button>
    </>
  );

  return (
    <nav className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/admin")}>
            <LuckyWinLogo />
          </div>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center gap-2 flex-1 justify-center max-w-4xl mx-4">
            {menuItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/admin"}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent transition-colors text-sm"
                activeClassName="bg-primary text-primary-foreground hover:bg-primary"
              >
                <item.icon className="h-4 w-4" />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            ))}
          </div>

          {/* Balance & Desktop Sign Out */}
          <div className="hidden lg:flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 border border-primary/20">
              <Wallet className="h-4 w-4 text-primary" />
              <span className="font-semibold text-primary">₦{balance.toLocaleString()}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>

          {/* Mobile Menu Trigger */}
          <div className="flex items-center gap-3 lg:hidden">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
              <Wallet className="h-3.5 w-3.5 text-primary" />
              <span className="text-sm font-semibold text-primary">₦{balance.toLocaleString()}</span>
            </div>
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 pt-12">
                <div className="flex flex-col gap-2">
                  <MenuContent />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};
