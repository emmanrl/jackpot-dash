import TopNav from "./TopNav";
import SideNav from "./SideNav";
import LiveWinsTicker from "@/components/LiveWinsTicker";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
    children: React.ReactNode;
    className?: string;
}

const MainLayout = ({ children, className }: MainLayoutProps) => {
    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-yellow-500/30">
            <TopNav />
            <SideNav />
            <main className={cn("pt-20 pb-20 lg:pl-64 min-h-screen transition-all duration-300", className)}>
                <div className="p-4 lg:p-6 max-w-[1600px] mx-auto">
                    {children}
                </div>
            </main>
            <LiveWinsTicker />
        </div>
    );
};

export default MainLayout;
