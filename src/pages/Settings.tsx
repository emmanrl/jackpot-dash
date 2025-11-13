import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sparkles, Moon, Sun, Plus, Trash2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import TopNav from "@/components/TopNav";
import Footer from "@/components/Footer";
import NotificationSettings from "@/components/NotificationSettings";

interface WithdrawalAccount {
  id: string;
  bank_name: string;
  account_number: string;
  account_name: string;
  is_default: boolean;
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

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUserId(session.user.id);
      await fetchWithdrawalAccounts(session.user.id);
      setLoading(false);
    };
    checkUser();

    // Check current theme
    const currentTheme = document.documentElement.classList.contains("dark") ? "dark" : "light";
    setTheme(currentTheme);
  }, [navigate]);

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

  const handleAddAccount = async () => {
    if (!userId) return;
    
    try {
      if (!bankName || !accountNumber || !accountName) {
        toast.error("Please fill all fields");
        return;
      }

      const { error } = await supabase
        .from("withdrawal_accounts")
        .insert({
          user_id: userId,
          bank_name: bankName,
          account_number: accountNumber,
          account_name: accountName,
          is_default: accounts.length === 0
        });

      if (error) throw error;

      toast.success("Withdrawal account added");
      setBankName("");
      setAccountNumber("");
      setAccountName("");
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

  const handleThemeToggle = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    
    localStorage.setItem("theme", newTheme);
    toast.success(`Switched to ${newTheme} mode`);
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
                        <Label>Bank Name</Label>
                        <Input
                          value={bankName}
                          onChange={(e) => setBankName(e.target.value)}
                          placeholder="Enter bank name"
                        />
                      </div>
                      <div>
                        <Label>Account Number</Label>
                        <Input
                          value={accountNumber}
                          onChange={(e) => setAccountNumber(e.target.value)}
                          placeholder="Enter account number"
                        />
                      </div>
                      <div>
                        <Label>Account Name</Label>
                        <Input
                          value={accountName}
                          onChange={(e) => setAccountName(e.target.value)}
                          placeholder="Enter account name"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleAddAccount}>Add Account</Button>
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
