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
import Lobby from "./pages/Lobby";
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
import UserProfile from "./pages/UserProfile";
import AboutUs from "./pages/AboutUs";
import HowItWorksPage from "./pages/HowItWorksPage";
import WinnersGallery from "./pages/WinnersGallery";
import FAQ from "./pages/FAQ";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import FairPlayPolicy from "./pages/FairPlayPolicy";
import ContactSupport from "./pages/ContactSupport";
import AdminSliderManagementPage from "./pages/admin/AdminSliderManagementPage";
import AdminEmailSenderPage from "./pages/admin/AdminEmailSenderPage";
import AdminPaymentsPage from "./pages/admin/AdminPaymentsPage";
import AdminWithdrawalsPage from "./pages/admin/AdminWithdrawalsPage";
import AdminWithdrawalSettingsPage from "./pages/admin/AdminWithdrawalSettingsPage";
import SiteSettingsPage from "./pages/admin/SiteSettingsPage";
import UserManagementPage from "./pages/admin/UserManagementPage";
import Tutorial from "./pages/Tutorial";
import VerifyEmail from "./pages/VerifyEmail";
import CompleteProfile from "./pages/CompleteProfile";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import HourlyDraw from "./pages/HourlyDraw";
import DailyJackpot from "./pages/DailyJackpot";
import InstantWin from "./pages/InstantWin";
import Scratchcards from "./pages/Scratchcards";
import Rewards from "./pages/Rewards";
import Promotions from "./pages/Promotions";
import VIPClub from "./pages/VIPClub";
import Referral from "./pages/Referral";
import Support from "./pages/Support";
import AdminScratchSettings from "./pages/admin/ScratchSettings";
import Fairness from "./pages/Fairness";

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
      <Route path="/" element={<Lobby />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/complete-profile" element={<CompleteProfile />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/tutorial" element={<Tutorial />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/payment/callback" element={<PaymentCallback />} />
      <Route path="/payment-callback" element={<PaymentCallback />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/admin/site-settings" element={<SiteSettingsPage />} />
      <Route path="/admin/user-management" element={<UserManagementPage />} />
      <Route path="/admin/slider-management" element={<AdminSliderManagementPage />} />
      <Route path="/admin/email-sender" element={<AdminEmailSenderPage />} />
      <Route path="/admin/payments" element={<AdminPaymentsPage />} />
      <Route path="/admin/withdrawals" element={<AdminWithdrawalsPage />} />
      <Route path="/admin/withdrawal-settings" element={<AdminWithdrawalSettingsPage />} />
      <Route path="/statistics" element={<ProtectedStatistics />} />
      <Route path="/leaderboard" element={<Leaderboard />} />
      <Route path="/leaderboard-xp" element={<LeaderboardPage />} />
      <Route path="/transactions" element={<TransactionHistory />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/profile/:userId" element={<UserProfile />} />
      <Route path="/user/:userId" element={<UserProfile />} />
      <Route path="/edit-profile" element={<EditProfile />} />
      <Route path="/change-password" element={<ChangePassword />} />
      <Route path="/withdrawal" element={<Withdrawal />} />
      <Route path="/about" element={<AboutUs />} />
      <Route path="/how-it-works" element={<HowItWorksPage />} />
      <Route path="/winners" element={<WinnersGallery />} />
      <Route path="/faq" element={<FAQ />} />
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/fair-play" element={<FairPlayPolicy />} />
      <Route path="/contact" element={<ContactSupport />} />
      <Route path="/hourly" element={<HourlyDraw />} />
      <Route path="/daily" element={<DailyJackpot />} />
      <Route path="/instant" element={<InstantWin />} />
      <Route path="/scratchcards" element={<Scratchcards />} />
      <Route path="/rewards" element={<Rewards />} />
      <Route path="/promotions" element={<Promotions />} />
      <Route path="/vip" element={<VIPClub />} />
      <Route path="/referral" element={<Referral />} />
      <Route path="/support" element={<Support />} />
      <Route path="/admin/scratch-settings" element={<AdminScratchSettings />} />
      <Route path="/fairness" element={<Fairness />} />
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
