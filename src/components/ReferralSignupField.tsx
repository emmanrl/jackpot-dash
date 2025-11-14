import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Gift } from "lucide-react";
import { useState, useEffect } from "react";

interface ReferralSignupFieldProps {
  value: string;
  onChange: (value: string) => void;
}

export const ReferralSignupField = ({ value, onChange }: ReferralSignupFieldProps) => {
  const [hasReferralCode, setHasReferralCode] = useState(false);

  useEffect(() => {
    // Check if there's a referral code in URL
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    
    if (refCode) {
      onChange(refCode);
      setHasReferralCode(true);
    }
  }, []);

  return (
    <div className="space-y-2">
      <Label htmlFor="referralCode" className="flex items-center gap-2">
        <Gift className="w-4 h-4 text-primary" />
        Referral Code (Optional)
      </Label>
      <Input
        id="referralCode"
        type="text"
        placeholder="Enter referral code"
        value={value}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
        className="font-mono"
        maxLength={8}
      />
      {hasReferralCode && (
        <p className="text-xs text-primary">
          ✨ You'll be signed up with this referral code!
        </p>
      )}
    </div>
  );
};
