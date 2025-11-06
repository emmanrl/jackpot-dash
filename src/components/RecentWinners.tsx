import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy } from "lucide-react";

const RecentWinners = () => {
  const winners = [
    {
      name: "Sarah M.",
      amount: "$50,000",
      category: "Daily Fortune",
      time: "2 hours ago",
      avatar: "SM",
    },
    {
      name: "James K.",
      amount: "$5,000",
      category: "Hourly Mega",
      time: "45 minutes ago",
      avatar: "JK",
    },
    {
      name: "Maria G.",
      amount: "$500,000",
      category: "Weekly Millionaire",
      time: "1 day ago",
      avatar: "MG",
    },
    {
      name: "David L.",
      amount: "$10,000",
      category: "Daily Fortune",
      time: "3 hours ago",
      avatar: "DL",
    },
    {
      name: "Emma R.",
      amount: "$5,000",
      category: "Hourly Mega",
      time: "1 hour ago",
      avatar: "ER",
    },
    {
      name: "Michael B.",
      amount: "$50,000",
      category: "Daily Fortune",
      time: "5 hours ago",
      avatar: "MB",
    },
  ];

  return (
    <section className="py-20 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Trophy className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Live Results</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Recent Winners</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join our community of winners. Your turn could be next!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {winners.map((winner, index) => (
            <Card 
              key={index}
              className="border-2 border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg group overflow-hidden"
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <Avatar className="w-14 h-14 border-2 border-primary/20 group-hover:border-primary transition-colors">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                      {winner.avatar}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <div className="font-bold text-lg">{winner.name}</div>
                    <div className="text-sm text-muted-foreground">{winner.category}</div>
                    <div className="text-xs text-muted-foreground mt-1">{winner.time}</div>
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary gold-glow">
                      {winner.amount}
                    </div>
                    <Trophy className="w-5 h-5 text-primary mx-auto mt-1 animate-pulse" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-8">
          <p className="text-muted-foreground">
            Showing latest winners from the past 24 hours
          </p>
        </div>
      </div>
    </section>
  );
};

export default RecentWinners;
