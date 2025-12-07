import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Share2, Check } from "lucide-react";
import { toast } from "sonner";

interface PublicProfileCardProps {
  profile: any;
  avatarUrl?: string;
  stats: {
    xp: number;
    totalWins: number;
    totalTickets: number;
  };
}

const StatBadge = ({ value, label, highlight }: { value: string, label: string, highlight?: boolean }) => (
  <div className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-colors ${highlight ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-slate-800/50 border-slate-700/50 text-slate-200 hover:bg-slate-800'}`}>
    <span className="text-sm font-bold mb-0.5">{value}</span>
    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{label}</span>
  </div>
);

export const PublicProfileCard = ({ profile, avatarUrl, stats }: PublicProfileCardProps) => {
  const [copied, setCopied] = useState(false);

  const handleShareProfile = async () => {
    const username = profile.username || profile.id;
    const profileUrl = `https://luckywin.name.ng/profile/${username}`;

    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      toast.success("Profile link copied to clipboard!");

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  return (
    <Card className="overflow-hidden bg-card border-border">
      <CardHeader className="pb-4 border-b border-border">
        <CardTitle className="flex items-center justify-between text-card-foreground">
          <span>Public Profile</span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleShareProfile}
            className="gap-2 border-border text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copied!
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                Share Profile
              </>
            )}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {/* Profile Header */}
        <div className="flex items-center gap-4">
          <Avatar className="w-16 h-16 border-2 border-primary ring-4 ring-primary/10">
            <AvatarImage src={avatarUrl} />
            <AvatarFallback className="bg-primary text-primary-foreground font-bold text-xl">
              {profile.full_name?.charAt(0) || profile.email.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-foreground">{profile.full_name || 'Anonymous User'}</h3>
            {profile.username && (
              <p className="text-sm text-primary font-medium">@{profile.username}</p>
            )}
            <p className="text-xs text-muted-foreground">{profile.email}</p>
          </div>
        </div>

        {/* Stats Badges */}
        <div className="grid grid-cols-3 gap-2">
          <StatBadge value={stats.xp.toLocaleString()} label="XP" highlight />
          <StatBadge value={stats.totalWins.toString()} label="Wins" />
          <StatBadge value={stats.totalTickets.toString()} label="Tickets" />
        </div>

        {/* Profile Link */}
        <div className="p-3 bg-muted/50 rounded-lg border border-border">
          <p className="text-xs text-muted-foreground mb-1">Your Public Profile URL</p>
          <code className="text-xs break-all text-foreground font-mono">
            https://luckywin.name.ng/profile/{profile.username || profile.id}
          </code>
        </div>

        <p className="text-xs text-muted-foreground">
          💡 Share your profile link with friends to show off your achievements and stats!
        </p>
      </CardContent>
    </Card>
  );
};
