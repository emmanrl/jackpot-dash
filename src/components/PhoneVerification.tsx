import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Phone, CheckCircle, Loader2 } from "lucide-react";

interface PhoneVerificationProps {
  userId: string;
  onComplete?: () => void;
}

export function PhoneVerification({ userId, onComplete }: PhoneVerificationProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSendCode = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      toast.error("Please enter a valid phone number");
      return;
    }

    setLoading(true);
    try {
      // In a real implementation, this would call an edge function to send SMS
      // For now, we'll simulate it
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success("Verification code sent to your phone!");
      setCodeSent(true);
    } catch (error) {
      toast.error("Failed to send verification code");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error("Please enter a valid 6-digit code");
      return;
    }

    setLoading(true);
    try {
      // In a real implementation, this would verify the code via edge function
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate verification
      if (verificationCode === "123456") {
        setIsVerified(true);
        toast.success("Phone number verified successfully!");
        // Call onComplete callback after successful verification
        setTimeout(() => {
          onComplete?.();
        }, 1500);
      } else {
        toast.error("Invalid verification code");
      }
    } catch (error) {
      toast.error("Failed to verify code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Phone className="w-5 h-5 text-primary" />
            <CardTitle>Phone Verification</CardTitle>
          </div>
          {isVerified && (
            <Badge variant="default" className="gap-1">
              <CheckCircle className="w-3 h-3" />
              Verified
            </Badge>
          )}
        </div>
        <CardDescription>
          Verify your phone number to enable withdrawals
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isVerified ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="flex gap-2">
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+234 800 000 0000"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  disabled={codeSent || loading}
                  className="flex-1"
                />
                {!codeSent && (
                  <Button onClick={handleSendCode} disabled={loading}>
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Send Code"
                    )}
                  </Button>
                )}
              </div>
            </div>

            {codeSent && (
              <div className="space-y-2">
                <Label htmlFor="code">Verification Code</Label>
                <div className="flex gap-2">
                  <Input
                    id="code"
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    maxLength={6}
                    disabled={loading}
                    className="flex-1"
                  />
                  <Button onClick={handleVerifyCode} disabled={loading}>
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Verify"
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Didn't receive the code?{" "}
                  <button
                    onClick={() => {
                      setCodeSent(false);
                      setVerificationCode("");
                    }}
                    className="text-primary hover:underline"
                  >
                    Resend
                  </button>
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-primary mx-auto mb-3" />
            <p className="text-lg font-semibold">Phone Verified!</p>
            <p className="text-sm text-muted-foreground">
              {phoneNumber}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
