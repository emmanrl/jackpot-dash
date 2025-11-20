import logoImage from "@/assets/luckywin-logo.png";

interface LuckyWinLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const LuckyWinLogo = ({ className = "", size = "md" }: LuckyWinLogoProps) => {
  const sizeClasses = {
    sm: "h-8",
    md: "h-10",
    lg: "h-14 md:h-16"
  };

  return (
    <img 
      src={logoImage} 
      alt="LuckyWin Logo" 
      className={`${sizeClasses[size]} w-auto ${className}`}
    />
  );
};
