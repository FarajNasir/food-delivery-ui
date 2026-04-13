"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * useOrderTimer - A hook to manage a 5-minute countdown for orders.
 * @param createdAt - The creation timestamp of the order.
 * @param timeoutMinutes - Duration of the timer (default 5).
 * @param onExpire - Callback function when time runs out.
 */
export function useOrderTimer(
  createdAt: string,
  timeoutMinutes: number = 5,
  onExpire?: () => void
) {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isExpired, setIsExpired] = useState(false);

  const calculateTimeLeft = useCallback(() => {
    const start = new Date(createdAt).getTime();
    const now = new Date().getTime();
    const diff = now - start;
    const duration = timeoutMinutes * 60 * 1000;
    const remaining = Math.max(0, duration - diff);
    
    return Math.floor(remaining / 1000);
  }, [createdAt, timeoutMinutes]);

  useEffect(() => {
    const initial = calculateTimeLeft();
    setTimeLeft(initial);
    
    if (initial <= 0 && !isExpired) {
      setIsExpired(true);
      onExpire?.();
      return;
    }

    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
      
      if (remaining <= 0) {
        clearInterval(timer);
        if (!isExpired) {
          setIsExpired(true);
          onExpire?.();
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [calculateTimeLeft, onExpire, isExpired]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return {
    timeLeft,
    isExpired,
    formattedTime: formatTime(timeLeft),
  };
}
