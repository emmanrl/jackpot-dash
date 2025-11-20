interface LuckyWinLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const LuckyWinLogo = ({ className = "", size = "md" }: LuckyWinLogoProps) => {
  const sizeClasses = {
    sm: "text-2xl",
    md: "text-3xl",
    lg: "text-5xl md:text-6xl"
  };

  return (
    <span className={`font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent ${sizeClasses[size]} ${className}`}>
      LuckyWin
    </span>
  );
};
