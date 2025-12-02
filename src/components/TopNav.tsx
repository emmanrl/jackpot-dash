import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Menu, LogIn, Bell, ChevronDown, Wallet, LogOut, LayoutDashboard, Clover, Shield, User as UserIcon, Settings, Key } from "lucide-react";
import NotificationBell from "@/components/NotificationBell";
import { useRealtimeAvatar } from "@/hooks/useRealtimeAvatar";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { LuckyWinLogo } from "@/components/LuckyWinLogo";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import SideNav from "./SideNav";

const TopNav = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [balance, setBalance] = useState<number>(0);
  const [totalJackpotPool, setTotalJackpotPool] = useState<number>(0);
  const realtimeAvatarUrl = useRealtimeAvatar(user?.id);
  const { settings } = useSiteSettings();

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
        checkAdminStatus(session.user.id);
        fetchBalance(session.user.id);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
        checkAdminStatus(session.user.id);
        fetchBalance(session.user.id);
      } else {
        setProfile(null);
        setIsAdmin(false);
        setBalance(0);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    fetchTotalJackpotPool();

    const jackpotChannel = supabase
      .channel('total-jackpot-pool')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'jackpots'
      }, () => {
        fetchTotalJackpotPool();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(jackpotChannel);
    };
  }, []);

  const fetchTotalJackpotPool = async () => {
    try {
      const { data } = await supabase
        .from('jackpots')
        .select('prize_pool')
        .eq('status', 'active');

      if (data) {
        const total = data.reduce((sum, jackpot) => sum + Number(jackpot.prize_pool), 0);
        setTotalJackpotPool(total);
      }
    } catch (error) {
      console.error('Error fetching total jackpot pool:', error);
    }
  };

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("full_name, email, avatar_url")
      .eq("id", userId)
      .single();

    setProfile(data);
  };

  const checkAdminStatus = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    setIsAdmin(!!data);
  };

  const fetchBalance = async (userId: string) => {
    const { data } = await supabase
      .from("wallets")
      .select("balance")
      .eq("user_id", userId)
      .single();

    if (data) {
      setBalance(data.balance);
    }

    // Subscribe to wallet changes
    const subscription = supabase
      .channel(`wallet-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'wallets',
          filter: `user_id=eq.${userId}`,
        },
        (payload: any) => {
          if (payload.new?.balance !== undefined) {
            setBalance(payload.new.balance);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name.charAt(0).toUpperCase();
    }
    if (profile?.email) {
      return profile.email.charAt(0).toUpperCase();
    }
    return "U";
  };

  return (

    <nav className="fixed top-0 left-0 right-0 h-16 bg-background/95 backdrop-blur-xl border-b border-border z-50 px-4 justify-between shadow-lg lg:pl-6 transition-all duration-300">

      <div className="h-full flex items-center justify-between gap-4">
        {/* Mobile Menu & Logo */}
        <div className="flex items-center gap-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white lg:hidden">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64 border-r border-border bg-sidebar-background">
              <SideNav isMobile={true} />
            </SheetContent>
          </Sheet>

          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center transform group-hover:rotate-12 transition-transform shadow-[0_0_15px_rgba(255,184,0,0.4)]">
            <Clover className="text-brand-dark fill-brand-dark" size={20} />
          </div>

          <div onClick={() => navigate("/")} className="cursor-pointer">
            <LuckyWinLogo size="sm" />
          </div>
        </div>
        {/* Search Bar */}
        <div className="hidden md:flex flex-1 max-w-xl relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search jackpots, lotteries..."
            className="bg-muted/50 border-none text-foreground placeholder:text-muted-foreground pl-10 h-10 rounded-lg focus-visible:ring-1 focus-visible:ring-primary"
          />
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3 ml-auto">
          <div className="hidden lg:flex flex-col items-end mr-4">
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Jackpot Pool</span>
            <span className="text-sm font-bold text-primary">{totalJackpotPool === 0 ? "₦12,505,050" : '₦' + totalJackpotPool.toLocaleString()}</span>
          </div>

          {user ? (
            <>
              <div className="hidden sm:flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-1.5 border border-border">
                <Wallet className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold text-foreground">
                  ₦{balance.toLocaleString()}
                </span>
              </div>

              <Button
                size="sm"
                className="bg-primary text-primary-foreground font-bold hover:bg-primary/90 shadow-[0_0_10px_rgba(250,204,21,0.2)] hidden sm:flex"
                onClick={() => navigate("/dashboard")}
              >
                Deposit
              </Button>

              <NotificationBell />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 h-auto p-1 hover:bg-accent/10 rounded-full">
                    <Avatar className="h-8 w-8 border border-border">
                      {(realtimeAvatarUrl || profile?.avatar_url) ? (
                        <AvatarImage src={realtimeAvatarUrl || profile.avatar_url} alt={profile?.full_name || user?.email || "User"} />
                      ) : null}
                      <AvatarFallback className="bg-primary text-primary-foreground font-bold text-xs">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-popover border-border text-popover-foreground">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{profile?.full_name || "User"}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-border" />
                  <DropdownMenuItem onClick={() => navigate("/dashboard")} className="cursor-pointer hover:bg-accent focus:bg-accent focus:text-accent-foreground">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate(`/profile/${user.id}`)} className="cursor-pointer hover:bg-accent focus:bg-accent focus:text-accent-foreground">
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Public Profile</span>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => navigate("/admin")} className="cursor-pointer hover:bg-accent focus:bg-accent focus:text-accent-foreground">
                      <Shield className="mr-2 h-4 w-4" />
                      <span>Admin Panel</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator className="bg-border" />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive hover:bg-destructive/10 focus:bg-destructive/10">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold border-none shadow-[0_0_15px_rgba(234,179,8,0.3)]"
                onClick={() => navigate("/auth")}
              >
                <LogIn className="w-4 h-4" />
                Log In
              </Button>
            </>
          )}
        </div >
      </div >
    </nav >
  );
};

export default TopNav;