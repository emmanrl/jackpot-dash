import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

interface CountdownTimerProps {
  targetDate: Date | string;
  onExpire?: () => void;
  className?: string;
  showIcon?: boolean;
}

export const CountdownTimer = ({ 
  targetDate, 
  onExpire, 
  className = "",
  showIcon = true 
}: CountdownTimerProps) => {
  const [timeLeft, setTimeLeft] = useState("");
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const target = typeof targetDate === 'string' ? new Date(targetDate) : targetDate;
      const distance = target.getTime() - now;

      if (distance < 0) {
        setTimeLeft("ENDED");
        setIsExpired(true);
        if (onExpire && !isExpired) {
          onExpire();
        }
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h ${minutes}m`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      } else if (minutes > 0) {
        setTimeLeft(`${minutes}m ${seconds}s`);
      } else {
        setTimeLeft(`${seconds}s`);
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [targetDate, onExpire, isExpired]);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showIcon && (
        <Clock className={`w-4 h-4 ${isExpired ? 'text-destructive' : 'text-primary animate-pulse'}`} />
      )}
      <span className={`font-bold ${isExpired ? 'text-destructive' : 'text-primary'}`}>
        {timeLeft}
      </span>
    </div>
  );
};
