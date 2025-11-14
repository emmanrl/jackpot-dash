import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import TopNav from "@/components/TopNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { AchievementBadge } from "@/components/AchievementBadge";
import { Loader2, Trophy, Ticket, Star } from "lucide-react";
import { toast } from "sonner";

export default function UserProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalTickets: 0,
    totalWins: 0,
    totalWinnings: 0,
    xp: 0,
  });

  useEffect(() => {
    if (userId) {
      fetchUserProfile();
    }
  }, [userId]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Fetch achievements
      const { data: achievementsData } = await supabase
        .from('achievements' as any)
        .select('*')
        .eq('user_id', userId)
        .order('achieved_at', { ascending: false });

      setAchievements(achievementsData || []);

      // Fetch stats
      const [ticketsResult, winsResult] = await Promise.all([
        supabase
          .from('tickets')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId),
        supabase
          .from('winners')
          .select('prize_amount')
          .eq('user_id', userId),
      ]);

      const totalWinnings = winsResult.data?.reduce((sum: number, win: any) => sum + Number(win.prize_amount), 0) || 0;

      setStats({
        totalTickets: ticketsResult.count || 0,
        totalWins: winsResult.data?.length || 0,
        totalWinnings,
        xp: (profileData as any)?.experience_points || 0,
      });

    } catch (error: any) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load user profile');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <TopNav />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <TopNav />
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-muted-foreground">User not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Profile Header */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <Avatar className="w-24 h-24">
                <AvatarImage src={profile.avatar_url} />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {profile.full_name?.charAt(0) || profile.email.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl font-bold mb-2">{profile.full_name || 'Anonymous User'}</h1>
                <p className="text-muted-foreground mb-4">{profile.email}</p>
                
                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                  <Badge variant="secondary" className="text-sm">
                    <Star className="w-4 h-4 mr-1" />
                    {stats.xp} XP
                  </Badge>
                  <Badge variant="outline" className="text-sm">
                    <Trophy className="w-4 h-4 mr-1" />
                    {stats.totalWins} Wins
                  </Badge>
                  <Badge variant="outline" className="text-sm">
                    <Ticket className="w-4 h-4 mr-1" />
                    {stats.totalTickets} Tickets
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Ticket className="w-5 h-5 text-primary" />
                Total Tickets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.totalTickets}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" />
                Total Wins
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.totalWins}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Star className="w-5 h-5 text-primary" />
                Total Winnings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">₦{stats.totalWinnings.toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>

        {/* Achievements */}
        <Card>
          <CardHeader>
            <CardTitle>Achievements</CardTitle>
          </CardHeader>
          <CardContent>
            {achievements.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {achievements.map((achievement) => (
                  <AchievementBadge
                    key={achievement.id}
                    type={achievement.achievement_type}
                    achieved={true}
                    achievedAt={achievement.achieved_at}
                    metadata={achievement.metadata}
                  />
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No achievements yet. Start playing to unlock badges!
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
