import { Award, Ticket, Trophy, Star, Zap, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface AchievementBadgeProps {
  type: string;
  achieved: boolean;
  achievedAt?: string;
  metadata?: any;
}

const achievementConfig: Record<string, {
  title: string;
  description: string;
  icon: any;
  color: string;
}> = {
  tickets_10: {
    title: "Ticket Starter",
    description: "Purchase 10 tickets",
    icon: Ticket,
    color: "from-blue-500 to-cyan-500",
  },
  tickets_50: {
    title: "Ticket Enthusiast",
    description: "Purchase 50 tickets",
    icon: Ticket,
    color: "from-purple-500 to-pink-500",
  },
  tickets_100: {
    title: "Ticket Master",
    description: "Purchase 100 tickets",
    icon: Ticket,
    color: "from-yellow-500 to-orange-500",
  },
  first_win: {
    title: "First Victory",
    description: "Win your first jackpot",
    icon: Trophy,
    color: "from-green-500 to-emerald-500",
  },
  wins_5: {
    title: "Lucky Streak",
    description: "Win 5 jackpots",
    icon: Trophy,
    color: "from-amber-500 to-yellow-500",
  },
  xp_100: {
    title: "Rising Star",
    description: "Earn 100 XP",
    icon: Star,
    color: "from-indigo-500 to-purple-500",
  },
  xp_500: {
    title: "Experience Master",
    description: "Earn 500 XP",
    icon: Zap,
    color: "from-pink-500 to-rose-500",
  },
};

export const AchievementBadge = ({ type, achieved, achievedAt, metadata }: AchievementBadgeProps) => {
  const config = achievementConfig[type] || {
    title: "Unknown Achievement",
    description: "Mystery achievement",
    icon: Award,
    color: "from-gray-500 to-slate-500",
  };

  const Icon = config.icon;

  return (
    <Card
      className={`relative overflow-hidden transition-all ${
        achieved
          ? 'border-primary/50 shadow-lg'
          : 'border-border opacity-60 grayscale'
      }`}
    >
      {/* Background Gradient */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${config.color} opacity-10`}
      />

      <CardContent className="relative p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div
            className={`p-3 rounded-lg bg-gradient-to-br ${config.color} ${
              achieved ? 'opacity-100' : 'opacity-40'
            }`}
          >
            <Icon className="w-6 h-6 text-white" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm mb-1">{config.title}</h3>
            <p className="text-xs text-muted-foreground mb-2">
              {config.description}
            </p>

            {achieved ? (
              <Badge variant="secondary" className="text-xs">
                Unlocked {achievedAt ? new Date(achievedAt).toLocaleDateString() : ''}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs">
                Locked
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
