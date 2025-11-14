import { Trophy, Medal } from "lucide-react";
import { Card } from "@/components/ui/card";

interface Winner {
  winner_rank: number;
  prize_amount: number;
  profiles?: {
    full_name?: string;
    email?: string;
  };
}

interface WinnersPodiumProps {
  winners: Winner[];
}

export default function WinnersPodium({ winners }: WinnersPodiumProps) {
  // Sort winners by rank
  const sortedWinners = [...winners].sort((a, b) => a.winner_rank - b.winner_rank);
  const topThree = sortedWinners.slice(0, 3);

  const getPodiumHeight = (rank: number) => {
    switch (rank) {
      case 1: return "h-32";
      case 2: return "h-24";
      case 3: return "h-20";
      default: return "h-16";
    }
  };

  const getPodiumColor = (rank: number) => {
    switch (rank) {
      case 1: return "from-yellow-500/20 to-yellow-600/20 border-yellow-500/50";
      case 2: return "from-gray-400/20 to-gray-500/20 border-gray-400/50";
      case 3: return "from-amber-700/20 to-amber-800/20 border-amber-700/50";
      default: return "from-muted to-muted/50 border-border";
    }
  };

  const getMedalIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="w-8 h-8 text-yellow-500" />;
      case 2: return <Medal className="w-7 h-7 text-gray-400" />;
      case 3: return <Medal className="w-6 h-6 text-amber-700" />;
      default: return <Medal className="w-5 h-5 text-muted-foreground" />;
    }
  };

  if (topThree.length === 0) return null;

  // Arrange podium: 2nd, 1st, 3rd
  const arrangedWinners = [
    topThree.find(w => w.winner_rank === 2),
    topThree.find(w => w.winner_rank === 1),
    topThree.find(w => w.winner_rank === 3)
  ].filter(Boolean) as Winner[];

  return (
    <div className="py-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-foreground flex items-center justify-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          Top Winners
        </h3>
        <p className="text-sm text-muted-foreground mt-1">Competition Results</p>
      </div>

      <div className="flex items-end justify-center gap-4 mb-8">
        {arrangedWinners.map((winner) => (
          <div
            key={winner.winner_rank}
            className="flex flex-col items-center"
            style={{ width: '120px' }}
          >
            {/* Winner Info Card */}
            <Card className={`w-full p-4 mb-2 bg-gradient-to-br ${getPodiumColor(winner.winner_rank)} border-2 backdrop-blur-sm`}>
              <div className="flex flex-col items-center gap-2">
                <div className="relative">
                  {getMedalIcon(winner.winner_rank)}
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                    {winner.winner_rank}
                  </div>
                </div>
                
                <div className="text-center">
                  <p className="text-xs font-medium text-foreground truncate w-full">
                    {winner.profiles?.full_name || winner.profiles?.email?.split('@')[0] || 'Winner'}
                  </p>
                  <p className="text-lg font-bold text-primary mt-1">
                    ₦{Number(winner.prize_amount).toLocaleString()}
                  </p>
                </div>
              </div>
            </Card>

            {/* Podium Stand */}
            <div className={`w-full ${getPodiumHeight(winner.winner_rank)} bg-gradient-to-t ${getPodiumColor(winner.winner_rank)} border-2 rounded-t-lg flex items-center justify-center transition-all duration-300`}>
              <span className="text-3xl font-bold text-foreground/30">
                {winner.winner_rank}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Other Winners List */}
      {sortedWinners.length > 3 && (
        <div className="mt-6 space-y-2">
          <p className="text-sm font-semibold text-muted-foreground mb-3">Other Winners</p>
          {sortedWinners.slice(3).map((winner) => (
            <div
              key={winner.winner_rank}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">{winner.winner_rank}</span>
                </div>
                <span className="text-sm font-medium text-foreground">
                  {winner.profiles?.full_name || winner.profiles?.email?.split('@')[0] || 'Winner'}
                </span>
              </div>
              <span className="text-sm font-bold text-primary">
                ₦{Number(winner.prize_amount).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

