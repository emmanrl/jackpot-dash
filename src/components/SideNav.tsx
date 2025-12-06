import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    LayoutGrid,
    Clock,
    Clover,
    Home,
    Trophy,
    Zap,
    Ticket,
    Gift,
    Crown,
    Users,
    ShieldCheck,
    MessageSquare,
    User,
    History,
    BarChart3,
    Settings,
    Lock,
    Edit,
    ChevronDown
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { LuckyWinLogo } from "@/components/LuckyWinLogo";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SideNavProps {
    isMobile?: boolean;
}

const SideNav = ({ isMobile = false }: SideNavProps) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [megaJackpot, setMegaJackpot] = useState<number>(0);
    const [user, setUser] = useState<any>(null);
    const [nextDrawTime, setNextDrawTime] = useState<string>("");
    const [drawTimeDisplay, setDrawTimeDisplay] = useState<string>("Loading...");
    const [accountExpanded, setAccountExpanded] = useState(false);

    useEffect(() => {
        fetchMegaJackpot();

        // Subscribe to jackpot changes
        const channel = supabase
            .channel('mega-jackpot-changes')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'jackpots'
            }, () => {
                fetchMegaJackpot();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);


    const fetchMegaJackpot = async () => {
        try {
            const { data } = await supabase
                .from('jackpots')
                .select('prize_pool, next_draw')
                .eq('status', 'active')
                .order('prize_pool', { ascending: false })
                .limit(1)
                .single();

            if (data) {
                setMegaJackpot(data.prize_pool);
                setNextDrawTime(data.next_draw);
            }
        } catch (error) {
            console.error('Error fetching mega jackpot:', error);
        }
    };

    useEffect(() => {
        const fetchUser = async () => {
            const { data: user } = await supabase.auth.getUser();
            setUser(user?.user);
        };
        fetchUser();
    }, []);

    // Update countdown display every second
    useEffect(() => {
        if (!nextDrawTime) return;

        const updateCountdown = () => {
            const now = new Date().getTime();
            const drawTime = new Date(nextDrawTime).getTime();
            const distance = drawTime - now;

            if (distance < 0) {
                setDrawTimeDisplay("Draw ended");
                return;
            }

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            if (days > 0) {
                setDrawTimeDisplay(`${days}d ${hours}h`);
            } else if (hours > 0) {
                setDrawTimeDisplay(`${hours}h ${minutes}m`);
            } else if (minutes > 0) {
                setDrawTimeDisplay(`${minutes}m ${seconds}s`);
            } else {
                setDrawTimeDisplay(`${seconds}s`);
            }
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);

        return () => clearInterval(interval);
    }, [nextDrawTime]);



    const menuItems = [
        { icon: LayoutGrid, label: "Lobby", path: "/" },
        ...(user?.role === "admin" ? [{ icon: ShieldCheck, label: "Admin Panel", path: "/admin" }] : []),
        ...(user ? [{ icon: Home, label: "Dashboard", path: "/dashboard" }] : []), // Hide Dashboard for guests
        { icon: Clock, label: "Hourly Draw", path: "/hourly", badge: "LIVE", badgeColor: "bg-yellow-500 text-black" },
        { icon: Trophy, label: "Daily Jackpot", path: "/daily" },
        { icon: Zap, label: "Instant Win", path: "/instant" },
        { icon: Ticket, label: "Scratchcards", path: "/scratchcards" },
    ];

    const accountItems = [
        { icon: User, label: "Public Profile", path: "/profile" },
        { icon: History, label: "Transaction History", path: "/transactions" },
        { icon: BarChart3, label: "Leaderboard", path: "/leaderboard" },
    ];

    const accountSubItems = [
        { icon: User, label: "Profile Details", path: "/profile" },
        { icon: Edit, label: "Edit Profile", path: "/edit-profile" },
        { icon: Lock, label: "Change Password", path: "/change-password" },
        { icon: Settings, label: "Settings", path: "/settings" },
    ];

    const rewardItems = [
        { icon: Gift, label: "Promotions", path: "/promotions" },
        ...(user ? [
            { icon: Crown, label: "VIP Club", path: "/vip", badge: "PRO", badgeColor: "bg-yellow-500 text-black" },
            { icon: Users, label: "Referral", path: "/referral" }
        ] : []),
    ];

    const supportItems = [
        { icon: ShieldCheck, label: "Fairness", path: "/fairness" },
        { icon: MessageSquare, label: "Live Chat", path: "/support" },
    ];

    const NavItem = ({ item }: { item: any }) => {
        const isActive = location.pathname === item.path;
        return (
            <Button
                variant="ghost"
                className={`w-full justify-start gap-3 mb-1 font-medium text-muted-foreground hover:text-foreground hover:bg-accent/10 ${isActive ? "bg-accent/10 text-primary border-l-2 border-primary rounded-l-none" : ""
                    }`}
                onClick={() => navigate(item.path)}
            >
                <item.icon className={`w-5 h-5 ${isActive ? "text-yellow-500" : ""}`} />
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${item.badgeColor}`}>
                        {item.badge}
                    </span>
                )}
            </Button>
        );
    };

    return (
        <div className={`w-64 h-screen bg-sidebar-background border-r border-sidebar-border flex flex-col ${isMobile ? '' : 'fixed left-0 top-0 z-40 hidden lg:flex'}`}>
            <div className="p-6">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
                    <Clover className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center transform group-hover:rotate-12 transition-transform shadow-[0_0_15px_rgba(255,184,0,0.4)] p-1 text-brand-dark fill-brand-dark" size={20} />
                    <LuckyWinLogo size="md" />
                </div>
            </div>

            <ScrollArea className="flex-1 px-4">
                <div className="mb-6">
                    {menuItems.map((item, index) => (
                        <NavItem key={index} item={item} />
                    ))}
                </div>

                {user && (
                    <div className="mb-6">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-4">Account</h3>
                        {accountItems.map((item, index) => (
                            <NavItem key={index} item={item} />
                        ))}

                        {/* Collapsible Account Settings */}
                        <Button
                            variant="ghost"
                            className="w-full justify-start gap-3 mb-1 font-medium text-muted-foreground hover:text-foreground hover:bg-accent/10"
                            onClick={() => setAccountExpanded(!accountExpanded)}
                        >
                            <Settings className="w-5 h-5" />
                            <span className="flex-1 text-left">Account Settings</span>
                            <ChevronDown className={`w-4 h-4 transition-transform ${accountExpanded ? 'rotate-180' : ''}`} />
                        </Button>

                        {accountExpanded && (
                            <div className="ml-4 border-l-2 border-white/5 pl-2 mt-1">
                                {accountSubItems.map((item, index) => (
                                    <NavItem key={index} item={item} />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Rewards */}
                <div className="mb-6">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-4">Rewards</h3>
                    {rewardItems.map((item, index) => (
                        <NavItem key={index} item={item} />
                    ))}
                </div>


                <div className="mb-6">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-4">Support</h3>
                    {supportItems.map((item, index) => (
                        <NavItem key={index} item={item} />
                    ))}
                </div>

                <div className="p-4 mx-2 mb-4">
                    <div className="bg-gradient-to-b from-sidebar-accent to-background rounded-xl p-4 border border-sidebar-border text-center relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Crown size={64} className="text-foreground" />
                        </div>
                        <div className="text-primary flex justify-center mb-2">
                            <Crown size={24} fill="currentColor" />
                        </div>
                        <div className="text-xs text-muted-foreground font-medium mb-1">MEGA JACKPOT</div>
                        <div className="text-xl font-bold text-foreground mb-2">{megaJackpot == 0 ? "₦1,250,892" : "₦" + megaJackpot.toLocaleString()}</div>
                        <div className="text-[10px] text-muted-foreground">Drawing in {drawTimeDisplay}</div>
                        <div className="w-full h-1 bg-muted rounded-full mt-3 overflow-hidden">
                            <div className="w-3/4 h-full bg-primary rounded-full"></div>
                        </div>
                    </div>
                </div>


            </ScrollArea>
        </div>
    );

};

export default SideNav;
