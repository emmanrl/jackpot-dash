import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";

interface UserFollowStatsProps {
  userId: string;
}

export const UserFollowStats = ({ userId }: UserFollowStatsProps) => {
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);

  useEffect(() => {
    fetchFollowStats();
  }, [userId]);

  const fetchFollowStats = async () => {
    try {
      const [followersResult, followingResult] = await Promise.all([
        supabase
          .from('user_follows' as any)
          .select('id', { count: 'exact', head: true })
          .eq('following_id', userId),
        supabase
          .from('user_follows' as any)
          .select('id', { count: 'exact', head: true })
          .eq('follower_id', userId),
      ]);

      setFollowers(followersResult.count || 0);
      setFollowing(followingResult.count || 0);
    } catch (error) {
      console.error('Error fetching follow stats:', error);
    }
  };

  return (
    <div className="flex gap-4">
      <Card className="flex-1">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <div>
              <p className="text-2xl font-bold">{followers}</p>
              <p className="text-sm text-muted-foreground">Followers</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="flex-1">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <div>
              <p className="text-2xl font-bold">{following}</p>
              <p className="text-sm text-muted-foreground">Following</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
