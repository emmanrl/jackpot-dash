import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Copy, Check, Gift, Trophy, Coins, Zap, Link as LinkIcon } from "lucide-react";
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
  const [copiedLink, setCopiedLink] = useState(false);
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
      setCopiedLink(true);
      toast.success("Referral link copied!");

      setTimeout(() => {
        setCopiedLink(false);
      }, 2000);
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  return (
    <Card className="overflow-hidden border-white/5 bg-[#0f1923]">
      <CardHeader className="bg-gradient-to-r from-primary/20 to-primary/5 border-b border-white/5">
        <CardTitle className="flex items-center gap-2 text-white">
          <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500 ring-1 ring-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.1)]">
            <Gift className="w-5 h-5 text-primary" />
          </div>
          Referral Program
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-black/20 rounded-lg border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">Referrals</span>
            </div>
            <p className="text-2xl font-bold text-white">{referralData.totalReferrals}</p>
          </div>

          <div className="p-4 bg-black/20 rounded-lg border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <Gift className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">Earned</span>
            </div>
            <p className="text-2xl font-bold text-white">₦{referralData.totalCommission.toFixed(2)}</p>
          </div>
        </div>

        {/* Referral Code */}
        <div className="space-y-2">
          <div>
            <div className="flex gap-2">
              <div className="bg-slate-950 border border-white/10 text-white px-4 py-3 rounded-xl flex-1 font-mono text-lg font-bold tracking-widest text-center shadow-inner select-all">
                {referralData.referralCode}
              </div>
              <button
                onClick={handleCopyCode}
                className={`px-4 rounded-xl border transition-all active:scale-95 group flex items-center justify-center ${copied
                  ? 'bg-green-500/10 border-green-500/20 text-green-500'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border-white/5 hover:border-white/20'
                  }`}
              >
                {copied ? <Check size={20} /> : <Copy size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* How it works */}
        <div className="space-y-3 pt-2">
          <h4 className="font-semibold text-sm text-primary flex items-center gap-2">
            <Gift className="w-4 h-4" />
            How it works:
          </h4>
          <div className="grid gap-3">
            {[
              {
                icon: <Users className="w-4 h-4 text-blue-400" />,
                text: "Share your referral code with friends",
                bg: "bg-blue-500/10",
                border: "border-blue-500/20"
              },
              {
                icon: <Trophy className="w-4 h-4 text-yellow-400" />,
                text: "When they sign up and win, you earn 1% commission",
                bg: "bg-yellow-500/10",
                border: "border-yellow-500/20"
              },
              {
                icon: <Coins className="w-4 h-4 text-green-400" />,
                text: "Commission is added directly to your wallet",
                bg: "bg-green-500/10",
                border: "border-green-500/20"
              },
              {
                icon: <Zap className="w-4 h-4 text-purple-400" />,
                text: "No limit on referrals or earnings!",
                bg: "bg-purple-500/10",
                border: "border-purple-500/20"
              }
            ].map((item, i) => (
              <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border ${item.border} ${item.bg}`}>
                <div className={`p-2 rounded-md bg-black/20`}>
                  {item.icon}
                </div>
                <span className="text-xs text-slate-300 font-medium leading-relaxed">
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <Button
          onClick={handleCopyLink}
          className={`w-full font-bold transition-all duration-300 ${copiedLink
            ? "bg-green-500 hover:bg-green-600 text-white"
            : "bg-primary hover:bg-primary/90 text-black"
            }`}
        >
          {copiedLink ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              Link Copied!
            </>
          ) : (
            <>
              <LinkIcon className="w-4 h-4 mr-2" />
              Copy Referral Link
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
