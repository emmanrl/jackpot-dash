import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Share2, Star, Trophy, Ticket, Check } from "lucide-react";
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
    <Card className="overflow-hidden">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <span>Public Profile</span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleShareProfile}
            className="gap-2"
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
      <CardContent className="space-y-6">
        {/* Profile Header */}
        <div className="flex items-center gap-4">
          <Avatar className="w-16 h-16 border-2 border-primary">
            <AvatarImage src={avatarUrl} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xl">
              {profile.full_name?.charAt(0) || profile.email.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="text-xl font-bold">{profile.full_name || 'Anonymous User'}</h3>
            {profile.username && (
              <p className="text-sm text-primary font-medium">@{profile.username}</p>
            )}
            <p className="text-xs text-muted-foreground">{profile.email}</p>
          </div>
        </div>

        {/* Stats Badges */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="text-sm px-3 py-1">
            <Star className="w-4 h-4 mr-1" />
            {stats.xp} XP
          </Badge>
          <Badge variant="outline" className="text-sm px-3 py-1">
            <Trophy className="w-4 h-4 mr-1" />
            {stats.totalWins} Wins
          </Badge>
          <Badge variant="outline" className="text-sm px-3 py-1">
            <Ticket className="w-4 h-4 mr-1" />
            {stats.totalTickets} Tickets
          </Badge>
        </div>

        {/* Profile Link */}
        <div className="p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">Your Public Profile URL</p>
          <code className="text-xs break-all text-primary">
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
