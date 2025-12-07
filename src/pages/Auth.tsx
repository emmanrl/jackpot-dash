import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { toast as shadcnToast } from "@/hooks/use-toast";
import { toast } from "sonner";
import { Sparkles, LogIn, UserPlus, Loader2, ArrowRight, Eye, EyeOff, Mail, Lock, User, Trophy } from "lucide-react";
import { ReferralSignupField } from "@/components/ReferralSignupField";
import { LuckyWinLogo } from "@/components/LuckyWinLogo";
import Mascot from "@/components/Mascot";

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [activeTab, setActiveTab] = useState("login");

  // Signup flow states
  const [signupStep, setSignupStep] = useState<'email' | 'details'>('email');
  const [emailChecking, setEmailChecking] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // Check if this is from Google OAuth callback
        const isOAuthCallback = window.location.hash.includes('access_token');

        if (isOAuthCallback) {
          // Check if user is new (created in last 30 seconds)
          const userCreatedAt = new Date(session.user.created_at);
          const now = new Date();
          const secondsSinceCreation = (now.getTime() - userCreatedAt.getTime()) / 1000;

          if (secondsSinceCreation < 30) {
            // New user from Google signup - redirect to tutorial
            navigate("/tutorial?verified=true");
          } else {
            // Existing user signing in with Google - show welcome back and go to dashboard
            toast.success(`Welcome back, ${session.user.user_metadata?.full_name || session.user.email}! 🎉`);
            navigate("/dashboard");
          }
        } else {
          navigate("/dashboard");
        }
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

      toast.success("Email Verified! Your account has been verified successfully.");

      // Redirect to tutorial after successful verification with verified param
      setTimeout(() => navigate('/tutorial?verified=true'), 500);
    } catch (error: any) {
      toast.error(error.message || "Failed to verify email. The link may have expired.");
      navigate('/auth');
    }
  };

  const checkEmailAvailability = async () => {
    setErrors({});

    if (!email) {
      setErrors({ email: "Email address is required" });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrors({ email: "Please enter a valid email address" });
      return;
    }

    setEmailChecking(true);

    try {
      // Call edge function to check if email exists
      const { data, error } = await supabase.functions.invoke('check-email-exists', {
        body: { email: email.toLowerCase() }
      });

      if (error) {
        throw error;
      }

      if (data?.exists) {
        // Email already exists
        setErrors({ email: "This email is already registered. Please log in instead." });
        return;
      }

      // Email doesn't exist, proceed to details step
      setSignupStep('details');
    } catch (error: any) {
      console.error('Email check error:', error);
      setErrors({ email: "Failed to check email availability. Please try again." });
    } finally {
      setEmailChecking(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate all fields
    const newErrors: { [key: string]: string } = {};

    if (!firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    if (!lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters long";
    }

    if (!agreedToTerms) {
      newErrors.terms = "You must agree to the Terms of Service and Privacy Policy";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      const redirectUrl = 'https://luckywin.name.ng/tutorial';
      const fullName = `${firstName.trim()} ${lastName.trim()}`;

      const { data, error } = await supabase.auth.signUp({
        email: email.toLowerCase(),
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
            referral_code: referralCode || null,
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        // Update profile with full name
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ full_name: fullName })
          .eq('id', data.user.id);

        if (profileError) {
          console.error('Profile update error:', profileError);
        }
      }

      toast.success("Account Created! Please check your email to verify your account.");

      // Navigate to verify email page
      navigate('/verify-email', { state: { email } });
    } catch (error: any) {
      console.error('Signup error:', error);
      let errorMessage = "Failed to create account. Please try again.";

      if (error.message?.includes('already registered')) {
        errorMessage = "This email is already registered. Please log in instead.";
      } else if (error.message?.includes('Invalid email')) {
        errorMessage = "Please enter a valid email address.";
      } else if (error.message?.includes('Password')) {
        errorMessage = error.message;
      }

      setErrors({ submit: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setErrors({
            email: "This email is not registered or the password is incorrect. Please check your credentials or sign up first."
          });
        } else if (error.message.includes('Email not confirmed')) {
          setErrors({ submit: "Please verify your email before logging in. Check your inbox for the verification link." });
        } else {
          setErrors({ submit: error.message || "Login failed. Please try again." });
        }
        setLoading(false);
        return;
      }

      toast.success("Welcome back! You have successfully logged in.");

      navigate("/dashboard");
    } catch (error: any) {
      console.error('Login error:', error);
      setErrors({ submit: "An unexpected error occurred. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth`,
        }
      });

      if (error) throw error;
    } catch (error: any) {
      console.error('Google sign in error:', error);
      toast.error(error.message || "Failed to sign in with Google. Please try again.");
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left side - Dynamic Branding */}
      <div className="hidden lg:flex flex-col relative overflow-hidden bg-zinc-900 border-r border-white/10">
        {/* Background Elements */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30 transform hover:scale-105 transition-transform duration-[20s]"
          style={{ backgroundImage: 'url("/mascot-dark.jpg")' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/90" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-yellow-500/10 via-transparent to-transparent" />

        {/* Animated Particles/Orbs */}
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-yellow-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-green-500/20 rounded-full blur-3xl animate-pulse delay-700" />

        {/* Content */}
        <div className="relative h-full flex flex-col items-center justify-center p-12 text-center max-w-xl mx-auto z-10">
          <div className="animate-fade-in space-y-6">
            <div className="flex justify-center mb-6 transform hover:scale-105 transition-transform duration-500">
              <div className="relative">
                <div className="absolute inset-0 bg-yellow-500/20 blur-3xl rounded-full" />
                <Mascot variant="hero" size={280} className="drop-shadow-2xl relative z-10" />
              </div>
            </div>

            <h1 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight tracking-tight">
              Where <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">Fortune</span> <br />
              Favors the Bold
            </h1>

            <p className="text-lg text-zinc-300 max-w-md mx-auto leading-relaxed font-medium">
              Join the most premium lottery experience. Daily jackpots, instant wins, and a community of winners waiting for you.
            </p>

            <div className="flex items-center justify-center gap-6 pt-8">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10 backdrop-blur-md shadow-xl">
                <Sparkles className="h-4 w-4 text-yellow-400 animate-pulse" />
                <span className="text-sm text-zinc-100 font-semibold">Daily Rewards</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10 backdrop-blur-md shadow-xl">
                <Trophy className="h-4 w-4 text-yellow-400" />
                <span className="text-sm text-zinc-100 font-semibold">Huge Jackpots</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative p-8 text-center z-10">
          <p className="text-xs text-zinc-500 font-medium">
            &copy; {new Date().getFullYear()} LuckyWin. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right side - Auth Forms */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 bg-background relative selection:bg-yellow-500/30 selection:text-yellow-500">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-yellow-500/5 via-transparent to-transparent" />

        <div className="w-full max-w-md space-y-6 relative z-10">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <LuckyWinLogo size="lg" />
          </div>

          <Card className="border-0 shadow-2xl bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl ring-1 ring-black/5 dark:ring-white/10">
            <CardHeader className="space-y-1 pb-6 text-center">
              <CardTitle className="text-3xl font-black tracking-tighter">
                {activeTab === 'login' ? 'Welcome Back' : 'Create Account'}
              </CardTitle>
              <CardDescription className="text-base text-zinc-500 dark:text-zinc-400">
                {activeTab === 'login'
                  ? 'Enter your details to access your account'
                  : 'Join thousands of winners today'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login" className="w-full" onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 mb-8 bg-zinc-100/50 dark:bg-zinc-800/50 p-1">
                  <TabsTrigger
                    value="login"
                    className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:shadow-sm transition-all duration-300 font-medium"
                  >
                    Login
                  </TabsTrigger>
                  <TabsTrigger
                    value="signup"
                    className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:shadow-sm transition-all duration-300 font-medium"
                  >
                    Sign Up
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="animate-fade-in focus-visible:outline-none">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <div className="relative group">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-yellow-500 transition-colors" />
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="name@example.com"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            setErrors({ ...errors, email: '' });
                          }}
                          disabled={loading}
                          required
                          className={`pl-10 transition-all duration-300 focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 ${errors.email ? "border-destructive focus:border-destructive focus:ring-destructive/20" : ""}`}
                        />
                      </div>
                      {errors.email && (
                        <p className="text-sm text-destructive animate-fade-in">{errors.email}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="login-password">Password</Label>
                        <Button
                          type="button"
                          variant="link"
                          className="px-0 h-auto text-xs font-normal text-muted-foreground hover:text-foreground"
                          onClick={() => navigate('/forgot-password')}
                        >
                          Forgot password?
                        </Button>
                      </div>
                      <div className="relative group">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-yellow-500 transition-colors" />
                        <Input
                          id="login-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            setErrors({ ...errors, password: '' });
                          }}
                          disabled={loading}
                          required
                          className={`pl-10 pr-10 transition-all duration-300 focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 ${errors.password ? "border-destructive focus:border-destructive focus:ring-destructive/20" : ""}`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3 text-muted-foreground hover:text-foreground focus:outline-none"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      {errors.password && (
                        <p className="text-sm text-destructive animate-fade-in">{errors.password}</p>
                      )}
                    </div>

                    {errors.submit && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-md text-sm text-center animate-fade-in">
                        {errors.submit}
                      </div>
                    )}

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-white border-0 shadow-lg shadow-yellow-500/20 h-10 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] font-bold"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        <>
                          <LogIn className="mr-2 h-4 w-4" />
                          Sign In
                        </>
                      )}
                    </Button>

                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-zinc-200 dark:border-zinc-800" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white/50 dark:bg-zinc-900/50 px-2 text-muted-foreground backdrop-blur-sm">
                          Or continue with
                        </span>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors font-medium"
                      onClick={handleGoogleSignIn}
                      disabled={loading}
                    >
                      <GoogleIcon />
                      <span className="ml-2">Sign in with Google</span>
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup" className="animate-fade-in focus-visible:outline-none">
                  <form onSubmit={signupStep === 'email' ? (e) => { e.preventDefault(); checkEmailAvailability(); } : handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <div className="relative group">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-yellow-500 transition-colors" />
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="name@example.com"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            setErrors({ ...errors, email: '' });
                          }}
                          disabled={loading || signupStep === 'details'}
                          required
                          className={`pl-10 transition-all duration-300 focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 ${errors.email ? "border-destructive focus:border-destructive focus:ring-destructive/20" : ""}`}
                        />
                      </div>
                      {errors.email && (
                        <p className="text-sm text-destructive animate-fade-in">{errors.email}</p>
                      )}
                    </div>

                    {signupStep === 'details' && (
                      <div className="space-y-4 animate-in slide-in-from-right-4 fade-in duration-300">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="signup-firstname">First Name</Label>
                            <div className="relative group">
                              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-yellow-500 transition-colors" />
                              <Input
                                id="signup-firstname"
                                type="text"
                                placeholder="John"
                                value={firstName}
                                onChange={(e) => {
                                  setFirstName(e.target.value);
                                  setErrors({ ...errors, firstName: '' });
                                }}
                                disabled={loading}
                                required
                                className={`pl-10 transition-all duration-300 focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 ${errors.firstName ? "border-destructive focus:border-destructive focus:ring-destructive/20" : ""}`}
                              />
                            </div>
                            {errors.firstName && (
                              <p className="text-sm text-destructive animate-fade-in">{errors.firstName}</p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="signup-lastname">Last Name</Label>
                            <Input
                              id="signup-lastname"
                              type="text"
                              placeholder="Doe"
                              value={lastName}
                              onChange={(e) => {
                                setLastName(e.target.value);
                                setErrors({ ...errors, lastName: '' });
                              }}
                              disabled={loading}
                              required
                              className={`transition-all duration-300 focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 ${errors.lastName ? "border-destructive focus:border-destructive focus:ring-destructive/20" : ""}`}
                            />
                            {errors.lastName && (
                              <p className="text-sm text-destructive animate-fade-in">{errors.lastName}</p>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="signup-password">Password</Label>
                          <div className="relative group">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-yellow-500 transition-colors" />
                            <Input
                              id="signup-password"
                              type={showPassword ? "text" : "password"}
                              placeholder="••••••••"
                              value={password}
                              onChange={(e) => {
                                setPassword(e.target.value);
                                setErrors({ ...errors, password: '' });
                              }}
                              disabled={loading}
                              required
                              className={`pl-10 pr-10 transition-all duration-300 focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 ${errors.password ? "border-destructive focus:border-destructive focus:ring-destructive/20" : ""}`}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-3 text-muted-foreground hover:text-foreground focus:outline-none"
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                          {errors.password && (
                            <p className="text-sm text-destructive animate-fade-in">{errors.password}</p>
                          )}
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <span className={password.length >= 6 ? "text-green-500" : ""}>•</span>
                            Must be at least 6 characters long
                          </p>
                        </div>

                        <ReferralSignupField
                          value={referralCode}
                          onChange={setReferralCode}
                        />

                        <div className="space-y-2">
                          <div className="flex items-start space-x-2">
                            <Checkbox
                              id="terms"
                              checked={agreedToTerms}
                              onCheckedChange={(checked) => {
                                setAgreedToTerms(checked === true);
                                setErrors({ ...errors, terms: '' });
                              }}
                              disabled={loading}
                              className={`mt-1 ${errors.terms ? "border-destructive" : ""}`}
                            />
                            <label htmlFor="terms" className="text-sm text-muted-foreground leading-normal">
                              I agree to the <a href="/terms" className="text-yellow-600 hover:underline">Terms of Service</a> and <a href="/privacy" className="text-yellow-600 hover:underline">Privacy Policy</a>
                            </label>
                          </div>
                          {errors.terms && (
                            <p className="text-sm text-destructive animate-fade-in">{errors.terms}</p>
                          )}
                        </div>

                        {errors.submit && (
                          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-md text-sm text-center animate-fade-in">
                            {errors.submit}
                          </div>
                        )}
                      </div>
                    )}

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-white border-0 shadow-lg shadow-yellow-500/20 h-10 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] font-bold"
                      disabled={loading || emailChecking}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating account...
                        </>
                      ) : emailChecking ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Checking email...
                        </>
                      ) : signupStep === 'email' ? (
                        <>
                          Continue
                          <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </>
                      ) : (
                        <>
                          <UserPlus className="mr-2 h-4 w-4" />
                          Create Account
                        </>
                      )}
                    </Button>

                    {signupStep === 'details' && (
                      <Button
                        type="button"
                        variant="ghost"
                        className="w-full text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                        onClick={() => {
                          setSignupStep('email');
                          setFirstName('');
                          setLastName('');
                          setPassword('');
                          setErrors({});
                        }}
                        disabled={loading}
                      >
                        Back to Email
                      </Button>
                    )}

                    {signupStep === 'email' && (
                      <>
                        <div className="relative my-6">
                          <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-zinc-200 dark:border-zinc-800" />
                          </div>
                          <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white/50 dark:bg-zinc-900/50 px-2 text-muted-foreground backdrop-blur-sm">
                              Or continue with
                            </span>
                          </div>
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          className="w-full hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors font-medium"
                          onClick={handleGoogleSignIn}
                          disabled={loading}
                        >
                          <GoogleIcon />
                          <span className="ml-2">Sign in with Google</span>
                        </Button>
                      </>
                    )}
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Auth;