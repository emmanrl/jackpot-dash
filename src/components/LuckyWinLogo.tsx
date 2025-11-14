import { useTheme } from "@/hooks/useTheme";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

interface LuckyWinLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const LuckyWinLogo = ({ className = "", size = "md" }: LuckyWinLogoProps) => {
  const [userId, setUserId] = useState<string>();
  
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id);
    });
  }, []);

  const { currentTheme } = useTheme(userId);
  
  const sizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-3xl md:text-4xl"
  };

  return (
    <div className={`font-bold ${sizeClasses[size]} ${className}`}>
      <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
        Lucky
      </span>
      <span className="bg-gradient-to-r from-accent to-accent/80 bg-clip-text text-transparent">
        Win
      </span>
    </div>
  );
};
