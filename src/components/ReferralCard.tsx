import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Users, Copy, Check, Gift } from "lucide-react";
import { toast } from "sonner";

interface ReferralCardProps {
  userId: string;
}

interface ReferralData {
  referralCode: string;
  totalReferrals: number;
  totalCommission: number;
}

export const ReferralCard = ({ userId }: ReferralCardProps) => {
  const [copied, setCopied] = useState(false);
  const [referralData, setReferralData] = useState<ReferralData>({
    referralCode: '',
    totalReferrals: 0,
    totalCommission: 0,
  });

  useEffect(() => {
    fetchReferralData();
  }, [userId]);

  const fetchReferralData = async () => {
    try {
      // Get referral code
      const { data: profile } = await supabase
        .from('profiles')
        .select('referral_code')
        .eq('id', userId)
        .single();

      // Get referral stats
      const { data: referrals } = await supabase
        .from('referrals' as any)
        .select('total_commission')
        .eq('referrer_id', userId);

      const totalCommission = referrals?.reduce((sum: number, r: any) => sum + Number(r.total_commission), 0) || 0;

      setReferralData({
        referralCode: (profile as any)?.referral_code || '',
        totalReferrals: referrals?.length || 0,
        totalCommission,
      });
    } catch (error) {
      console.error('Error fetching referral data:', error);
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(referralData.referralCode);
      setCopied(true);
      toast.success("Referral code copied!");
      
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      toast.error("Failed to copy code");
    }
  };

  const handleCopyLink = async () => {
    const referralLink = `https://luckywin.name.ng/auth?ref=${referralData.referralCode}`;
    
    try {
      await navigator.clipboard.writeText(referralLink);
      toast.success("Referral link copied!");
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  return (
    <Card className="overflow-hidden border-primary/20">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
        <CardTitle className="flex items-center gap-2">
          <Gift className="w-5 h-5 text-primary" />
          Referral Program
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Referral Code */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Your Referral Code</label>
          <div className="flex gap-2">
            <Input 
              value={referralData.referralCode}
              readOnly
              className="font-mono text-lg font-bold"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopyCode}
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">Referrals</span>
            </div>
            <p className="text-2xl font-bold">{referralData.totalReferrals}</p>
          </div>
          
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Gift className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">Earned</span>
            </div>
            <p className="text-2xl font-bold">₦{referralData.totalCommission.toFixed(2)}</p>
          </div>
        </div>

        {/* How it works */}
        <div className="p-4 bg-primary/5 rounded-lg space-y-2">
          <h4 className="font-semibold text-sm">How it works:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Share your referral code with friends</li>
            <li>• When they sign up and win, you earn 1% commission</li>
            <li>• Commission is added directly to your wallet</li>
            <li>• No limit on referrals or earnings!</li>
          </ul>
        </div>

        {/* Actions */}
        <Button 
          onClick={handleCopyLink}
          className="w-full"
          variant="default"
        >
          Copy Referral Link
        </Button>
      </CardContent>
    </Card>
  );
};
