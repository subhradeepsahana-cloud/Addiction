import { useEffect, useRef, useState } from 'react';

export function useCountdown(totalSeconds: number, autoStart = true) {
  const [remaining, setRemaining] = useState(totalSeconds);
  const [running, setRunning] = useState(autoStart);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setRemaining((r) => (r > 0 ? r - 1 : 0));
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const formatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  const progress = 1 - remaining / totalSeconds;

  return { remaining, formatted, progress, isDone: remaining === 0, pause: () => setRunning(false), resume: () => setRunning(true) };
}
