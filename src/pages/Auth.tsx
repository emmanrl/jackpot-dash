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
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  
  // Signup flow states
  const [signupStep, setSignupStep] = useState<'email' | 'details'>('email');
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

      toast({
        title: "Email Verified!",
        description: "Your account has been verified successfully.",
      });

      // Redirect to tutorial
      navigate('/tutorial');
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.message || "Failed to verify email. The link may have expired.",
        variant: "destructive",
      });
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
      // Try to sign up with a temporary password to check if email exists
      // Supabase will reject if email is already registered
      const { data, error } = await supabase.auth.signUp({
        email: email.toLowerCase(),
        password: 'temporary_check_12345', // This won't be used
        options: {
          data: { check_only: true }
        }
      });

      if (error) {
        if (error.message.includes('already registered') || error.message.includes('already been registered')) {
          setErrors({ email: "This email is already registered. Please log in instead." });
        } else {
          throw error;
        }
      } else {
        // Email doesn't exist, proceed to details step
        setSignupStep('details');
      }
    } catch (error: any) {
      console.error('Email check error:', error);
      if (error.message.includes('already registered')) {
        setErrors({ email: "This email is already registered. Please log in instead." });
      } else {
        setErrors({ email: "Failed to check email availability. Please try again." });
      }
    } finally {
      setEmailChecking(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    // Validate all fields
    const newErrors: {[key: string]: string} = {};
    
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
      const redirectUrl = `${window.location.origin}/auth`;
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

      toast({
        title: "Account Created!",
        description: "Please check your email to verify your account.",
      });

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

      toast({
        title: "Welcome back!",
        description: "You have successfully logged in.",
      });

      navigate("/dashboard");
    } catch (error: any) {
      console.error('Login error:', error);
      setErrors({ submit: "An unexpected error occurred. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Animation/Branding */}
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

      {/* Right side - Auth Forms */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center">LuckyWin</CardTitle>
            <CardDescription className="text-center">
              Sign in or create an account to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErrors({ ...errors, email: '' });
                    }}
                    disabled={loading}
                    required
                    className={errors.email ? "border-destructive" : ""}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive animate-fade-in">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrors({ ...errors, password: '' });
                    }}
                    disabled={loading}
                    required
                    className={errors.password ? "border-destructive" : ""}
                  />
                  {errors.password && (
                    <p className="text-sm text-destructive animate-fade-in">{errors.password}</p>
                  )}
                </div>

                {errors.submit && (
                  <div className="p-3 bg-destructive/10 border border-destructive rounded-md">
                    <p className="text-sm text-destructive animate-fade-in">{errors.submit}</p>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    <>
                      <LogIn className="mr-2 h-4 w-4" />
                      Login
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="link"
                  className="text-sm"
                  onClick={() => navigate('/forgot-password')}
                >
                  Forgot password?
                </Button>
              </form>
              </TabsContent>

              <TabsContent value="signup">
              <form onSubmit={signupStep === 'email' ? (e) => { e.preventDefault(); checkEmailAvailability(); } : handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErrors({ ...errors, email: '' });
                    }}
                    disabled={loading || signupStep === 'details'}
                    required
                    className={errors.email ? "border-destructive" : ""}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive animate-fade-in">{errors.email}</p>
                  )}
                </div>

                {signupStep === 'details' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-firstname">First Name</Label>
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
                          className={errors.firstName ? "border-destructive" : ""}
                        />
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
                          className={errors.lastName ? "border-destructive" : ""}
                        />
                        {errors.lastName && (
                          <p className="text-sm text-destructive animate-fade-in">{errors.lastName}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setErrors({ ...errors, password: '' });
                        }}
                        disabled={loading}
                        required
                        className={errors.password ? "border-destructive" : ""}
                      />
                      {errors.password && (
                        <p className="text-sm text-destructive animate-fade-in">{errors.password}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
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
                          className={errors.terms ? "border-destructive" : ""}
                        />
                        <label htmlFor="terms" className="text-sm text-muted-foreground">
                          I agree to the Terms of Service and Privacy Policy
                        </label>
                      </div>
                      {errors.terms && (
                        <p className="text-sm text-destructive animate-fade-in">{errors.terms}</p>
                      )}
                    </div>

                    {errors.submit && (
                      <div className="p-3 bg-destructive/10 border border-destructive rounded-md">
                        <p className="text-sm text-destructive animate-fade-in">{errors.submit}</p>
                      </div>
                    )}
                  </>
                )}

                <Button type="submit" className="w-full" disabled={loading || emailChecking}>
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
                      <ArrowRight className="ml-2 h-4 w-4" />
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
                    variant="outline"
                    className="w-full"
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
              </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;