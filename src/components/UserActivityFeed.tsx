import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Ticket, Trophy, Star, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Activity {
  activity_type: string;
  activity_date: string;
  activity_data: any;
}

interface UserActivityFeedProps {
  userId: string;
}

export const UserActivityFeed = ({ userId }: UserActivityFeedProps) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, [userId]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      
      // Fetch activities manually
      const [tickets, wins, achievements] = await Promise.all([
        supabase
          .from('tickets')
          .select('id, ticket_number, purchased_at, purchase_price, jackpot_id')
          .eq('user_id', userId)
          .order('purchased_at', { ascending: false })
          .limit(10),
        supabase
          .from('winners')
          .select('id, prize_amount, claimed_at, jackpot_id, ticket_id')
          .eq('user_id', userId)
          .order('claimed_at', { ascending: false })
          .limit(10),
        supabase
          .from('achievements' as any)
          .select('id, achievement_type, achieved_at, metadata')
          .eq('user_id', userId)
          .order('achieved_at', { ascending: false })
          .limit(10),
      ]);

      const activities: Activity[] = [
        ...(tickets.data || []).map(t => ({
          activity_type: 'ticket_purchase',
          activity_date: t.purchased_at,
          activity_data: {
            ticket_id: t.id,
            ticket_number: t.ticket_number,
            purchase_price: t.purchase_price,
            jackpot_id: t.jackpot_id,
          },
        })),
        ...(wins.data || []).map(w => ({
          activity_type: 'win',
          activity_date: w.claimed_at,
          activity_data: {
            win_id: w.id,
            prize_amount: w.prize_amount,
            jackpot_id: w.jackpot_id,
            ticket_id: w.ticket_id,
          },
        })),
        ...((achievements.data as any[]) || []).map((a: any) => ({
          activity_type: 'achievement',
          activity_date: a.achieved_at,
          activity_data: {
            achievement_id: a.id,
            achievement_type: a.achievement_type,
            metadata: a.metadata,
          },
        })),
      ].sort((a, b) => new Date(b.activity_date).getTime() - new Date(a.activity_date).getTime());

      setActivities(activities.slice(0, 20));
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'ticket_purchase':
        return <Ticket className="w-4 h-4" />;
      case 'win':
        return <Trophy className="w-4 h-4" />;
      case 'achievement':
        return <Star className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getActivityText = (activity: Activity) => {
    switch (activity.activity_type) {
      case 'ticket_purchase':
        return `Purchased ticket #${activity.activity_data.ticket_number}`;
      case 'win':
        return `Won ₦${Number(activity.activity_data.prize_amount).toLocaleString()}`;
      case 'achievement':
        return `Unlocked "${activity.activity_data.achievement_type}" achievement`;
      default:
        return 'Activity';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length > 0 ? (
          <div className="space-y-3">
            {activities.map((activity, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <Badge variant="secondary" className="w-8 h-8 rounded-full flex items-center justify-center p-0">
                  {getActivityIcon(activity.activity_type)}
                </Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {getActivityText(activity)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.activity_date), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">
            No recent activity
          </p>
        )}
      </CardContent>
    </Card>
  );
};
