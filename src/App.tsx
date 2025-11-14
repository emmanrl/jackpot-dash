import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import PushNotificationPrompt from "@/components/PushNotificationPrompt";
import { useDailyLogin } from "@/hooks/useDailyLogin";
import { useAchievementNotifications } from "@/hooks/useAchievementNotifications";
import { useDarkMode } from "@/hooks/useDarkMode";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import Leaderboard from "./pages/Leaderboard";
import LeaderboardPage from "./pages/LeaderboardPage";
import Statistics from "./pages/Statistics";
import TransactionHistory from "./pages/TransactionHistory";
import NotFound from "./pages/NotFound";
import PaymentCallback from "./pages/PaymentCallback";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import ChangePassword from "./pages/ChangePassword";
import Withdrawal from "./pages/Withdrawal";
import SiteSettings from "./pages/SiteSettings";
import UserManagement from "./pages/UserManagement";
import UserProfile from "./pages/UserProfile";

const queryClient = new QueryClient();

const ProtectedStatistics = () => {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setIsAdmin(false);
      return;
    }

    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    setIsAdmin(!!data);
  };

  if (isAdmin === null) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  return <Statistics />;
};

// Main App wrapper to handle authentication hooks
const AppContent = () => {
  const [userId, setUserId] = useState<string | undefined>();

  // Load dark mode preference
  useDarkMode();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id);
    };
    getUser();

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange((_, session) => {
      setUserId(session?.user?.id);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Use hooks for daily login and achievement notifications
  useDailyLogin(userId);
  useAchievementNotifications(userId);

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/payment/callback" element={<PaymentCallback />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/site-settings" element={<SiteSettings />} />
      <Route path="/user-management" element={<UserManagement />} />
      <Route path="/statistics" element={<ProtectedStatistics />} />
      <Route path="/leaderboard" element={<Leaderboard />} />
      <Route path="/leaderboard-xp" element={<LeaderboardPage />} />
      <Route path="/transactions" element={<TransactionHistory />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/profile/:userId" element={<UserProfile />} />
      <Route path="/edit-profile" element={<EditProfile />} />
      <Route path="/change-password" element={<ChangePassword />} />
      <Route path="/withdrawal" element={<Withdrawal />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <PushNotificationPrompt />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
