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
    <div className={`font-display font-bold tracking-wide flex items-center gap-0.5 ${sizeClasses[size]} ${className}`}>
      <span className="text-foreground">LUCKY</span>
      <span className="text-primary drop-shadow-[0_0_10px_rgba(250,204,21,0.3)]">WIN</span>
    </div>
  );
};
