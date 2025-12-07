import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import MainLayout from "@/components/MainLayout";
import { useRealtimeAvatar } from "@/hooks/useRealtimeAvatar";
import {
  Trophy,
  Calendar,
  MapPin,
  Share2,
  Award,
  Gamepad2,
  Ticket,
  TrendingUp,
  Star,
  Clock,
  CheckCircle2,
  Shield,
  Loader2
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import Mascot from "@/components/Mascot";

interface ActivityItem {
  action: string;
  amount: string;
  game: string;
  time: string;
  type: 'win' | 'loss';
  timestamp: number;
}

interface Achievement {
  id: string;
  achievement_type: string;
  achieved_at: string;
  metadata: any;
}

const Profile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({
    totalWins: 0,
    totalTickets: 0,
    winRate: "0%",
    totalXP: 0
  });
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [location, setLocation] = useState("Lagos, NG");
  const [bio, setBio] = useState("No bio yet.");
  const [joinedDate, setJoinedDate] = useState("");
  const [userId, setUserId] = useState<string | undefined>();
  const realtimeAvatarUrl = useRealtimeAvatar(userId);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const uid = session.user.id;
      setUserId(uid);

      // Get Metadata (Location, Bio)
      const meta = session.user.user_metadata;
      if (meta) {
        if (meta.location) setLocation(meta.location);
        if (meta.about) setBio(meta.about);
      }

      try {
        // 1. Fetch Profile
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", uid)
          .single();

        setProfile(profileData);
        if (profileData?.created_at) {
          const date = new Date(profileData.created_at);
          setJoinedDate(`Joined ${date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`);
        } else {
          // Fallback to auth creation if profile creation is missing (unlikely)
          const date = new Date(session.user.created_at);
          setJoinedDate(`Joined ${date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`);
        }


        // 2. Fetch Tickets
        const { data: ticketsData } = await supabase
          .from("tickets")
          .select(`
            *,
            jackpots (name)
          `)
          .eq("user_id", uid)
          .order('purchased_at', { ascending: false });

        // 3. Fetch Wins
        const { data: winsData } = await supabase
          .from("winners")
          .select(`
            *,
            jackpots (name)
          `)
          .eq("user_id", uid)
          .order('claimed_at', { ascending: false });

        // 4. Fetch Achievements
        const { data: achievementsData } = await supabase
          .from("achievements")
          .select("*")
          .eq("user_id", uid);

        if (achievementsData) {
          setAchievements(achievementsData);
        }

        // Calculate Stats
        const totalTickets = ticketsData?.length || 0;
        const totalWins = winsData?.length || 0;
        const winRate = totalTickets > 0 ? ((totalWins / totalTickets) * 100).toFixed(1) + "%" : "0%";

        setStats({
          totalWins,
          totalTickets,
          winRate,
          totalXP: profileData?.experience_points || 0
        });

        // Process Activities
        const ticketActivities: ActivityItem[] = (ticketsData || []).map((t: any) => ({
          action: 'Purchased Ticket',
          amount: `-₦${t.purchase_price}`,
          game: t.jackpots?.name || 'Unknown Game',
          time: new Date(t.purchased_at).toLocaleDateString(),
          type: 'loss',
          timestamp: new Date(t.purchased_at).getTime()
        }));

        const winActivities: ActivityItem[] = (winsData || []).map((w: any) => ({
          action: 'Won Jackpot',
          amount: `+₦${Number(w.prize_amount).toLocaleString()}`,
          game: w.jackpots?.name || 'Unknown Game',
          time: new Date(w.claimed_at).toLocaleDateString(),
          type: 'win',
          timestamp: new Date(w.claimed_at).getTime()
        }));

        const combinedActivities = [...ticketActivities, ...winActivities]
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 10); // Show last 10 activities

        // Format relative time
        const now = new Date().getTime();
        const formattedActivities = combinedActivities.map(item => {
          const diff = now - item.timestamp;
          const minutes = Math.floor(diff / 60000);
          const hours = Math.floor(diff / 3600000);
          const days = Math.floor(diff / 86400000);

          let timeStr;
          if (minutes < 60) timeStr = `${minutes}m ago`;
          else if (hours < 24) timeStr = `${hours}h ago`;
          else timeStr = `${days}d ago`;

          return { ...item, time: timeStr };
        });

        setActivities(formattedActivities);

      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const statCards = [
    { label: 'Total Wins', value: stats.totalWins.toString(), icon: Trophy, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
    { label: 'Win Rate', value: stats.winRate, icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-400/10' },
    { label: 'Total Tickets', value: stats.totalTickets.toLocaleString(), icon: Ticket, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { label: 'Total XP', value: stats.totalXP.toLocaleString(), icon: Star, color: 'text-purple-400', bg: 'bg-purple-400/10' },
  ];

  // Helper to format achievement display
  const getAchievementDisplay = (type: string) => {
    const format = type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    let icon = Award;
    let color = 'text-slate-300';
    let bg = 'bg-slate-300/10';

    if (type.includes('win') || type.includes('jackpot')) {
      icon = Trophy;
      color = 'text-yellow-400';
      bg = 'bg-yellow-400/10';
    } else if (type.includes('vip')) {
      icon = Award;
      color = 'text-orange-400';
      bg = 'bg-orange-400/10';
    } else if (type.includes('high') || type.includes('roller')) {
      icon = Star;
      color = 'text-pink-400';
      bg = 'bg-pink-400/10';
    } else if (type.includes('early')) {
      icon = Shield;
      color = 'text-indigo-400';
      bg = 'bg-indigo-400/10';
    }

    return { name: format, icon, color, bg };
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f1923]">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6 animate-in fade-in duration-500 pb-12">

        {/* Header Banner & Profile Info */}
        <div className="relative rounded-2xl overflow-hidden bg-[#0f172a] border border-slate-800 shadow-2xl">
          {/* Banner Image */}
          <div className="h-48 md:h-64 w-full bg-gradient-to-r from-indigo-900 via-slate-900 to-slate-900 relative">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/20 blur-[100px] rounded-full"></div>

            <div className="absolute -bottom-4 right-20 w-32 h-32 md:w-48 md:h-48 z-0 opacity-80 pointer-events-none hidden sm:block">
              <Mascot variant="hero" size="100%" />
            </div>

            <div className="absolute top-6 right-6">
              <Button variant="ghost" className="text-white hover:bg-white/10" onClick={() => navigate('/edit-profile')}>
                Edit Profile
              </Button>
            </div>
          </div>

          {/* Profile Content */}
          <div className="px-6 md:px-10 pb-8 relative">
            <div className="flex flex-col md:flex-row items-start md:items-end gap-6 -mt-16 mb-6">

              {/* Avatar */}
              <div className="relative group">
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-[#0f172a] bg-slate-800 shadow-xl overflow-hidden relative z-10">
                  {(realtimeAvatarUrl || profile?.avatar_url) ? (
                    <img
                      src={realtimeAvatarUrl || profile.avatar_url}
                      alt={profile?.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-4xl font-black text-slate-900">
                      {profile?.full_name?.charAt(0) || '?'}
                    </div>
                  )}
                </div>
                <div className="absolute bottom-2 right-2 z-20 w-8 h-8 bg-green-500 rounded-full border-4 border-[#0f172a] flex items-center justify-center" title="Online">
                  <CheckCircle2 size={14} className="text-white" />
                </div>
              </div>

              {/* Name & Basic Info */}
              <div className="flex-1 pt-2 md:pb-2">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-bold text-white mb-1 flex items-center gap-2">
                      {profile?.full_name || "User"}
                      <Shield size={20} className="text-yellow-400 fill-yellow-400" />
                    </h1>
                    <p className="text-slate-400 font-medium flex items-center gap-3 text-sm">
                      <span className="text-yellow-500">@{profile?.username || "username"}</span>
                      <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                      <span className="flex items-center gap-1"><MapPin size={14} /> {location}</span>
                      <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                      <span className="flex items-center gap-1"><Calendar size={14} /> {joinedDate}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-700 font-medium transition-colors flex items-center gap-2 text-sm">
                      <Share2 size={16} /> Share Profile
                    </button>
                    <button className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-slate-900 rounded-lg font-bold transition-colors text-sm shadow-lg shadow-yellow-500/20">
                      Add Friend
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="h-px bg-slate-800 w-full mb-8"></div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {statCards.map((stat, i) => (
                <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex items-center gap-4 hover:border-slate-700 transition-colors group">
                  <div className={`w-12 h-12 rounded-lg ${stat.bg} ${stat.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <stat.icon size={24} />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{stat.value}</div>
                    <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

              {/* Left Column: Achievements & Bio */}
              <div className="space-y-6">

                {/* Badges */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Award size={20} className="text-purple-400" /> Achievements
                  </h3>
                  {achievements.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                      {achievements.map((ach, i) => {
                        const display = getAchievementDisplay(ach.achievement_type);
                        return (
                          <div key={i} className="flex flex-col items-center justify-center p-4 bg-slate-950 rounded-xl border border-slate-800/50 hover:border-slate-700 transition-colors text-center group">
                            <div className={`mb-2 p-2 rounded-full ${display.bg} ${display.color} group-hover:scale-110 transition-transform`}>
                              <display.icon size={20} />
                            </div>
                            <span className="text-xs font-bold text-slate-300">{display.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-slate-500 text-sm italic py-4 text-center">
                      No achievements yet. Play more to unlock!
                    </div>
                  )}
                </div>

                {/* About */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4">About</h3>
                  <p className="text-slate-400 text-sm leading-relaxed whitespace-pre-line">
                    {bio || "This user hasn't written a bio yet."}
                  </p>
                </div>
              </div>

              {/* Right Column: Recent Activity */}
              <div className="lg:col-span-2">
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
                  <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Gamepad2 size={20} className="text-blue-400" /> Recent Activity
                    </h3>
                    <span className="text-xs text-slate-500 font-medium cursor-pointer hover:text-white transition-colors">View All</span>
                  </div>

                  <div className="divide-y divide-slate-800/50">
                    {activities.length > 0 ? (
                      activities.map((activity, i) => (
                        <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${activity.type === 'win' ? 'bg-green-500/10 text-green-500' : 'bg-slate-800 text-slate-400'}`}>
                              {activity.type === 'win' ? <Trophy size={16} /> : <Ticket size={16} />}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-white">{activity.action}</div>
                              <div className="text-xs text-slate-500 flex items-center gap-1">
                                <Gamepad2 size={10} /> {activity.game}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-sm font-bold ${activity.type === 'win' ? 'text-green-400' : 'text-slate-400'}`}>
                              {activity.amount}
                            </div>
                            <div className="text-[10px] text-slate-600 flex items-center justify-end gap-1">
                              <Clock size={10} /> {activity.time}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-slate-500 text-sm">
                        No recent activity found. Start playing to see your history here!
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Profile;
