import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sparkles, Moon, Sun, Plus, Trash2, CheckCircle2, Award, Mail, Phone } from "lucide-react";
import { toast } from "sonner";
import TopNav from "@/components/TopNav";
import Footer from "@/components/Footer";
import NotificationSettings from "@/components/NotificationSettings";
import { ThemeSelector } from "@/components/ThemeSelector";
import { AchievementBadge } from "@/components/AchievementBadge";
import { PhoneVerification } from "@/components/PhoneVerification";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface WithdrawalAccount {
  id: string;
  bank_name: string;
  account_number: string;
  account_name: string;
  is_default: boolean;
}

interface Bank {
  id: number;
  name: string;
  code: string;
  slug: string;
}

const Settings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [accounts, setAccounts] = useState<WithdrawalAccount[]>([]);
  const [addAccountOpen, setAddAccountOpen] = useState(false);
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [selectedBankCode, setSelectedBankCode] = useState("");
  const [verifyingAccount, setVerifyingAccount] = useState(false);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [sendingVerification, setSendingVerification] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUserId(session.user.id);
      setUserEmail(session.user.email || "");
      setEmailVerified(session.user.email_confirmed_at !== null);
      setPhoneVerified(session.user.phone_confirmed_at !== null);
      
      // Fetch user's dark mode preference from database
      const { data: profile } = await supabase
        .from('profiles')
        .select('dark_mode')
        .eq('id', session.user.id)
        .single();
      
      if (profile) {
        const userTheme = (profile as any).dark_mode ? 'dark' : 'light';
        setTheme(userTheme);
        
        // Apply theme
        if (userTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
      
      await fetchWithdrawalAccounts(session.user.id);
      await fetchBanks();
      await fetchAchievements(session.user.id);
      setLoading(false);
    };
    checkUser();
  }, [navigate]);

  const fetchBanks = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-banks');
      
      if (error) throw error;
      
      if (data?.banks) {
        setBanks(data.banks);
      }
    } catch (error: any) {
      console.error("Failed to fetch banks:", error);
      toast.error("Failed to load banks list");
    }
  };

  const fetchWithdrawalAccounts = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from("withdrawal_accounts")
        .select("*")
        .eq("user_id", uid)
        .order("is_default", { ascending: false });

      if (error) throw error;
      setAccounts(data || []);
    } catch (error: any) {
      console.error("Failed to fetch accounts:", error);
    }
  };

  const fetchAchievements = async (uid: string) => {
    try {
      // Fetch achievements
      const { data: achievementsData, error: achievementsError } = await supabase
        .from('achievements' as any)
        .select('*')
        .eq("user_id", uid)
        .order("achieved_at", { ascending: false });

      if (achievementsError) throw achievementsError;
      setAchievements(achievementsData || []);
    } catch (error: any) {
      console.error("Failed to fetch achievements:", error);
    }
  };

  const handleAddAccount = async () => {
    if (!userId) return;
    
    try {
      if (!selectedBankCode || !accountNumber) {
        toast.error("Please select a bank and enter account number");
        return;
      }

      setVerifyingAccount(true);

      // Verify account before adding
      const { data, error: verifyError } = await supabase.functions.invoke('verify-bank-account', {
        body: {
          accountNumber,
          bankCode: selectedBankCode,
        }
      });

      setVerifyingAccount(false);

      if (verifyError || !data?.success) {
        toast.error(data?.error || "Failed to verify bank account");
        return;
      }

      // Use verified account name and bank name
      const selectedBank = banks.find(b => b.code === selectedBankCode);
      const verifiedAccountName = data.accountName;

      const { error } = await supabase
        .from("withdrawal_accounts")
        .insert({
          user_id: userId,
          bank_name: selectedBank?.name || bankName,
          account_number: accountNumber,
          account_name: verifiedAccountName,
          is_default: accounts.length === 0
        });

      if (error) throw error;

      toast.success(`Account verified: ${verifiedAccountName}`);
      setBankName("");
      setAccountNumber("");
      setAccountName("");
      setSelectedBankCode("");
      setAddAccountOpen(false);
      await fetchWithdrawalAccounts(userId);
    } catch (error: any) {
      toast.error(error.message || "Failed to add account");
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    if (!userId) return;
    
    try {
      const { error } = await supabase
        .from("withdrawal_accounts")
        .delete()
        .eq("id", accountId);

      if (error) throw error;

      toast.success("Account deleted");
      await fetchWithdrawalAccounts(userId);
    } catch (error: any) {
      toast.error(error.message || "Failed to delete account");
    }
  };

  const handleSetDefault = async (accountId: string) => {
    if (!userId) return;
    
    try {
      // Unset all defaults
      await supabase
        .from("withdrawal_accounts")
        .update({ is_default: false })
        .eq("user_id", userId);

      // Set new default
      const { error } = await supabase
        .from("withdrawal_accounts")
        .update({ is_default: true })
        .eq("id", accountId);

      if (error) throw error;

      toast.success("Default account updated");
      await fetchWithdrawalAccounts(userId);
    } catch (error: any) {
      toast.error(error.message || "Failed to update default");
    }
  };

  const handleThemeToggle = async () => {
    if (!userId) return;
    
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    
    // Save to localStorage for immediate persistence
    localStorage.setItem("theme", newTheme);
    
    // Save to database for cross-device persistence
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ dark_mode: newTheme === 'dark' } as any)
        .eq('id', userId);
      
      if (error) throw error;
      
      toast.success(`Switched to ${newTheme} mode`);
    } catch (error: any) {
      console.error('Failed to save theme preference:', error);
      toast.error('Theme changed but failed to save preference');
    }
  };

  const sendEmailVerification = async () => {
    setSendingVerification(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: userEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/settings`
        }
      });

      if (error) throw error;

      toast.success("Verification email sent! Please check your inbox.");
    } catch (error: any) {
      toast.error(error.message || "Failed to send verification email");
    } finally {
      setSendingVerification(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Sparkles className="w-12 h-12 text-primary animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Theme Selector */}
        <ThemeSelector userId={userId || undefined} />

        {/* Achievements */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              <CardTitle>Achievements</CardTitle>
            </div>
            <CardDescription>
              Complete milestones to unlock achievements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {['tickets_10', 'tickets_50', 'tickets_100', 'first_win', 'wins_5', 'xp_100', 'xp_500'].map((type) => {
                const achievement = achievements.find(a => a.achievement_type === type);
                return (
                  <AchievementBadge
                    key={type}
                    type={type}
                    achieved={!!achievement}
                    achievedAt={achievement?.achieved_at}
                    metadata={achievement?.metadata}
                  />
                );
              })}
            </div>
          </CardContent>
        </Card>

        <NotificationSettings />
        
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl">Settings</CardTitle>
            <CardDescription>Manage your account preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="theme-toggle" className="text-base">Theme</Label>
                <p className="text-sm text-muted-foreground">
                  Switch between light and dark mode
                </p>
              </div>
              <div className="flex items-center gap-3">
                {theme === "dark" ? (
                  <Moon className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <Sun className="w-5 h-5 text-primary" />
                )}
                <Switch
                  id="theme-toggle"
                  checked={theme === "light"}
                  onCheckedChange={handleThemeToggle}
                />
              </div>
            </div>

            {/* Email Verification Section */}
            <div className="border-t pt-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="w-5 h-5 text-primary" />
                <Label className="text-base">Email Verification</Label>
              </div>
              {emailVerified ? (
                <Alert>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <AlertDescription className="text-green-700">
                    Your email is verified ✓
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-3">
                  <Alert>
                    <AlertDescription className="text-amber-700">
                      Please verify your email to withdraw winnings
                    </AlertDescription>
                  </Alert>
                  <Button 
                    onClick={sendEmailVerification}
                    disabled={sendingVerification}
                    variant="outline"
                    className="w-full"
                  >
                    {sendingVerification ? "Sending..." : "Send Verification Email"}
                  </Button>
                </div>
              )}
            </div>

            {/* Phone Verification Section */}
            <div className="border-t pt-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Phone className="w-5 h-5 text-primary" />
                <Label className="text-base">Phone Verification</Label>
              </div>
              {phoneVerified ? (
                <Alert>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <AlertDescription className="text-green-700">
                    Your phone number is verified ✓
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-3">
                  <Alert>
                    <AlertDescription className="text-amber-700">
                      Please verify your phone number to withdraw winnings
                    </AlertDescription>
                  </Alert>
                  {userId && <PhoneVerification userId={userId} />}
                </div>
              )}
            </div>

            <div className="border-t pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base">Withdrawal Accounts</Label>
                <Dialog open={addAccountOpen} onOpenChange={setAddAccountOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Account
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Withdrawal Account</DialogTitle>
                      <DialogDescription>
                        Add a bank account for withdrawals
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Bank</Label>
                        <Select value={selectedBankCode} onValueChange={(value) => {
                          setSelectedBankCode(value);
                          const bank = banks.find(b => b.code === value);
                          if (bank) setBankName(bank.name);
                        }}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your bank" />
                          </SelectTrigger>
                          <SelectContent>
                            {banks.map((bank) => (
                              <SelectItem key={bank.code} value={bank.code}>
                                {bank.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Account Number</Label>
                        <Input
                          value={accountNumber}
                          onChange={(e) => setAccountNumber(e.target.value)}
                          placeholder="Enter 10-digit account number"
                          maxLength={10}
                        />
                      </div>
                      {accountName && (
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                          <Label className="text-sm text-green-800 dark:text-green-200">
                            Verified Account Name
                          </Label>
                          <p className="font-semibold text-green-900 dark:text-green-100">{accountName}</p>
                        </div>
                      )}
                    </div>
                    <DialogFooter>
                      <Button onClick={handleAddAccount} disabled={verifyingAccount}>
                        {verifyingAccount ? "Verifying..." : "Verify & Add Account"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {accounts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No withdrawal accounts added yet</p>
              ) : (
                <div className="space-y-2">
                  {accounts.map((account) => (
                    <div
                      key={account.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{account.bank_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {account.account_number} - {account.account_name}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {account.is_default ? (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Default
                          </span>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSetDefault(account.id)}
                          >
                            Set Default
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteAccount(account.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t pt-6 space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate("/profile")}
              >
                View Profile Details
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate("/edit-profile")}
              >
                Edit Profile
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate("/change-password")}
              >
                Change Password
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default Settings;
