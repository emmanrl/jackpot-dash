import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, Gift } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ProfileCompletionProps {
  userId: string;
}

interface CompletionItem {
  label: string;
  completed: boolean;
  weight: number;
}

export const ProfileCompletionProgress = ({ userId }: ProfileCompletionProps) => {
  const [completionItems, setCompletionItems] = useState<CompletionItem[]>([]);
  const [completionPercentage, setCompletionPercentage] = useState(0);

  useEffect(() => {
    fetchCompletionStatus();
  }, [userId]);

  const fetchCompletionStatus = async () => {
    try {
      // Fetch user session for verification status
      const { data: { session } } = await supabase.auth.getSession();
      
      // Fetch profile data
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', userId)
        .single();

      // Fetch withdrawal accounts
      const { data: withdrawalAccounts } = await supabase
        .from('withdrawal_accounts')
        .select('id')
        .eq('user_id', userId);

      const items: CompletionItem[] = [
        {
          label: "Email verified",
          completed: !!session?.user?.email_confirmed_at,
          weight: 20
        },
        {
          label: "Phone verified",
          completed: !!session?.user?.phone_confirmed_at,
          weight: 20
        },
        {
          label: "Profile picture uploaded",
          completed: !!profile?.avatar_url,
          weight: 20
        },
        {
          label: "Full name provided",
          completed: !!profile?.full_name && profile.full_name.trim().length > 0,
          weight: 20
        },
        {
          label: "Withdrawal account added",
          completed: !!withdrawalAccounts && withdrawalAccounts.length > 0,
          weight: 20
        }
      ];

      setCompletionItems(items);

      // Calculate percentage
      const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
      const completedWeight = items
        .filter(item => item.completed)
        .reduce((sum, item) => sum + item.weight, 0);
      
      setCompletionPercentage(Math.round((completedWeight / totalWeight) * 100));
    } catch (error) {
      console.error('Error fetching completion status:', error);
    }
  };

  const isFullyCompleted = completionPercentage === 100;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Profile Completion
              {isFullyCompleted && (
                <Badge variant="default" className="bg-green-500">
                  <Gift className="w-3 h-3 mr-1" />
                  Complete!
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {isFullyCompleted 
                ? "🎉 Congratulations! Your profile is 100% complete!" 
                : "Complete your profile to unlock all features"}
            </CardDescription>
          </div>
          <div className="text-3xl font-bold text-primary">
            {completionPercentage}%
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={completionPercentage} className="h-3" />
        
        <div className="space-y-2">
          {completionItems.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 rounded-lg bg-muted/30"
            >
              <div className="flex items-center gap-2">
                {item.completed ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                  <Circle className="w-5 h-5 text-muted-foreground" />
                )}
                <span className={item.completed ? "text-foreground" : "text-muted-foreground"}>
                  {item.label}
                </span>
              </div>
              <span className="text-sm text-muted-foreground">{item.weight}%</span>
            </div>
          ))}
        </div>

        {isFullyCompleted && (
          <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
            <p className="text-sm text-green-700 dark:text-green-300">
              <strong>Reward unlocked!</strong> You now have full access to all platform features including priority withdrawals and exclusive bonuses.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
