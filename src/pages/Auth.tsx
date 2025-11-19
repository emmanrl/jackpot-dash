import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { Sparkles, LogIn, UserPlus, Loader2, ArrowRight, Trophy } from "lucide-react";
import { ReferralSignupField } from "@/components/ReferralSignupField";

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
  // Signup flow states
  const [signupStep, setSignupStep] = useState<'email' | 'password'>('email');
  const [emailChecking, setEmailChecking] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });

    // Handle email verification callback
    const tokenHash = searchParams.get('token_hash');
    const type = searchParams.get('type');
    
    if (tokenHash && type === 'signup') {
      handleEmailVerification(tokenHash);
    }
  }, [navigate, searchParams]);

  const handleEmailVerification = async (tokenHash: string) => {
    try {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: 'signup'
      });

      if (error) throw error;

      // Redirect to complete profile
      navigate('/complete-profile');
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.message || "Failed to verify email",
        variant: "destructive",
      });
    }
  };

  const checkEmailAvailability = async () => {
    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setEmailChecking(true);

    try {
      // Check if email exists by trying to sign in with a dummy password
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: 'dummy-check-password-12345',
      });

      // If we get "Invalid login credentials", email doesn't exist
      // If we get "Email not confirmed", email exists
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          // Email doesn't exist, proceed to password step
          setSignupStep('password');
        } else {
          // Email exists or other error
          toast({
            title: "Email Already Registered",
            description: "This email is already taken. Please use a different email or log in.",
            variant: "destructive",
          });
        }
      } else {
        // Successfully logged in, which means email exists
        toast({
          title: "Email Already Registered",
          description: "This email is already taken. Please use a different email or log in.",
          variant: "destructive",
        });
        // Sign out immediately
        await supabase.auth.signOut();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to check email availability",
        variant: "destructive",
      });
    } finally {
      setEmailChecking(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!agreedToTerms) {
      toast({
        title: "Agreement Required",
        description: "Please agree to the Terms and Privacy Policy to continue",
        variant: "destructive",
      });
      return;
    }

    if (!password || password.length < 6) {
      toast({
        title: "Invalid Password",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth`,
          data: {
            referral_code: referralCode,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        // Navigate to the "check your email" page
        navigate('/verify-email', { state: { email } });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to sign up",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast({
            title: "Account Not Found",
            description: "No account found with this email. Please sign up first.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
        return;
      }

      if (data.session) {
        toast({
          title: "Welcome back!",
          description: "Successfully logged in",
        });
        navigate("/dashboard");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to log in",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Column - Animation/Graphics */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary/90 to-primary/80 items-center justify-center p-12">
        <div className="max-w-md text-center space-y-6">
          <div className="flex items-center justify-center mb-8">
            <Trophy className="h-16 w-16 text-primary-foreground animate-pulse" />
          </div>
          <h1 className="text-4xl font-bold text-primary-foreground">
            Welcome to LuckyWin
          </h1>
          <p className="text-xl text-primary-foreground/90">
            Your chance to win big starts here! Join thousands of winners today.
          </p>
          <div className="flex items-center justify-center gap-2 pt-4">
            <Sparkles className="h-5 w-5 text-yellow-300 animate-pulse" />
            <span className="text-primary-foreground/80">Trusted by thousands of players</span>
            <Sparkles className="h-5 w-5 text-yellow-300 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Right Column - Form */}
      <div className="flex items-center justify-center p-6 bg-background">
        <Card className="w-full max-w-md border-0 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center">LuckyWin</CardTitle>
            <CardDescription className="text-center">
              Sign in or create an account to get started
            </CardDescription>
          </CardHeader>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login" className="flex items-center gap-2">
                <LogIn className="w-4 h-4" />
                Log In
              </TabsTrigger>
              <TabsTrigger value="signup" className="flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                Sign Up
              </TabsTrigger>
            </TabsList>

            {/* Login Tab */}
            <TabsContent value="login">
              <CardHeader>
                <CardTitle>Welcome Back</CardTitle>
                <CardDescription>
                  Enter your credentials to access your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Logging in...
                      </>
                    ) : (
                      "Log In"
                    )}
                  </Button>
                </form>
              </CardContent>
            </TabsContent>

            {/* Signup Tab */}
            <TabsContent value="signup">
              <CardHeader>
                <CardTitle>Create Account</CardTitle>
                <CardDescription>
                  {signupStep === 'email' 
                    ? 'Enter your email to get started' 
                    : 'Complete your registration'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {signupStep === 'email' ? (
                  <form onSubmit={(e) => { e.preventDefault(); checkEmailAvailability(); }} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={emailChecking}
                        autoFocus
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={emailChecking}>
                      {emailChecking ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Checking...
                        </>
                      ) : (
                        <>
                          Continue
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-email-display">Email</Label>
                      <Input
                        id="signup-email-display"
                        type="email"
                        value={email}
                        disabled
                        className="bg-muted"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSignupStep('email');
                          setPassword('');
                        }}
                        className="text-xs"
                      >
                        Change email
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="At least 6 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                        autoFocus
                      />
                    </div>
                    <ReferralSignupField
                      value={referralCode}
                      onChange={setReferralCode}
                    />
                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="terms"
                        checked={agreedToTerms}
                        onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                        disabled={loading}
                      />
                      <label
                        htmlFor="terms"
                        className="text-sm text-muted-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        I agree to the{" "}
                        <a href="/terms-of-service" className="text-primary hover:underline">
                          Terms of Service
                        </a>{" "}
                        and{" "}
                        <a href="/privacy-policy" className="text-primary hover:underline">
                          Privacy Policy
                        </a>
                      </label>
                    </div>
                    <Button type="submit" className="w-full" disabled={loading || !agreedToTerms}>
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating account...
                        </>
                      ) : (
                        "Sign Up"
                      )}
                    </Button>
                  </form>
                )}
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
