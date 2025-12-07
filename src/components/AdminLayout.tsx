import React, { useState } from 'react';
import {
    LayoutDashboard,
    Users,
    Settings,
    CreditCard,
    Wallet,
    Undo2,
    Image,
    Mail,
    Gamepad2,
    Home,
    LogOut,
    Menu,
    X,
    ShieldCheck
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AdminLayoutProps {
    children: React.ReactNode;
}

const MENU_ITEMS = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
    {/* Normal Home */ icon: Home, label: 'Home', path: '/dashboard' },
    { icon: Users, label: 'User Management', path: '/admin/user-management' },
    { icon: Settings, label: 'Site Settings', path: '/admin/site-settings' },
    { icon: CreditCard, label: 'Payments', path: '/admin/payments' },
    { icon: Wallet, label: 'Withdrawals', path: '/admin/withdrawals' },
    { icon: Undo2, label: 'Withdrawal Config', path: '/admin/withdrawal-settings' },
    { icon: Gamepad2, label: 'Scratchcards', path: '/admin/scratch-settings' },
    { icon: Image, label: 'Sliders', path: '/admin/slider-management' },
    { icon: Mail, label: 'Email Sender', path: '/admin/email-sender' },
];

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/auth');
        toast.success('Logged out successfully');
    };

    return (
        <div className="dark min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30">
            {/* Mobile Header */}
            <div className="lg:hidden flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800">
                <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
                    <ShieldCheck className="text-indigo-500" />
                    <span>Lucky<span className="text-indigo-500">Panel</span></span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                    {isMobileMenuOpen ? <X /> : <Menu />}
                </Button>
            </div>

            <div className="flex h-screen overflow-hidden">
                {/* Sidebar */}
                <aside className={cn(
                    "fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 transform transition-transform duration-300 lg:relative lg:translate-x-0 flex flex-col",
                    isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
                )}>
                    {/* Sidebar Header */}
                    <div className="p-6 border-b border-slate-800 flex items-center gap-2 font-bold text-xl tracking-tight">
                        <ShieldCheck className="text-indigo-500 h-8 w-8" />
                        <div>
                            Lucky<span className="text-indigo-500">Panel</span>
                            <div className="text-[10px] text-slate-500 font-normal uppercase tracking-wider">Super Admin</div>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                        {MENU_ITEMS.map((item) => {
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={cn(
                                        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                                        isActive
                                            ? "bg-indigo-600/10 text-indigo-400 font-medium border border-indigo-600/20 shadow-lg shadow-indigo-900/20"
                                            : "text-slate-400 hover:text-white hover:bg-slate-800"
                                    )}
                                >
                                    <item.icon size={20} className={cn(
                                        "transition-colors",
                                        isActive ? "text-indigo-400" : "text-slate-500 group-hover:text-white"
                                    )} />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Sidebar Footer */}
                    <div className="p-4 border-t border-slate-800">
                        <Button
                            variant="ghost"
                            className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-950/30 gap-3"
                            onClick={handleLogout}
                        >
                            <LogOut size={20} />
                            Log Out
                        </Button>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto relative bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed">
                    {/* Overlay to dim bg pattern */}
                    <div className="absolute inset-0 bg-slate-950/90 pointer-events-none fixed"></div>

                    <div className="relative z-10 p-4 lg:p-8 max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>

                {/* Mobile Overlay */}
                {isMobileMenuOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />
                )}
            </div>
        </div>
    );
};

export default AdminLayout;
