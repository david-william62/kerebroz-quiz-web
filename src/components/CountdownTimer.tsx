'use client';

import { useEffect, useRef, useState } from 'react';

interface CountdownTimerProps {
  totalSeconds: number;
  onExpire: () => void;
  running?: boolean;
}

export default function CountdownTimer({
  totalSeconds,
  onExpire,
  running = true,
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(totalSeconds);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    setTimeLeft(totalSeconds);
  }, [totalSeconds]);

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          onExpireRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, totalSeconds]);

  const pct = (timeLeft / totalSeconds) * 100;

  const barColor =
    pct > 50 ? 'var(--cyan)' :
      pct > 25 ? 'var(--warning)' : 'var(--danger)';

  const glowColor =
    pct > 50 ? 'rgba(0,240,255,0.5)' :
      pct > 25 ? 'rgba(255,184,0,0.5)' : 'rgba(255,59,92,0.5)';

  return (
    <div style={{ width: '100%' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '0.4rem',
        }}
      >
        <span
          style={{
            fontFamily: 'Orbitron, monospace',
            fontSize: '0.7rem',
            letterSpacing: '0.08em',
            color: 'var(--text-muted)',
          }}
        >
          TIME
        </span>
        <span
          style={{
            fontFamily: 'Orbitron, monospace',
            fontSize: '0.85rem',
            fontWeight: 700,
            color: barColor,
            textShadow: `0 0 8px ${glowColor}`,
            transition: 'color 0.5s',
          }}
        >
          {timeLeft}s
        </span>
      </div>

      <div className="progress-bar-track">
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: barColor,
            borderRadius: '2px',
            boxShadow: `0 0 8px ${glowColor}`,
            transition: 'width 1s linear, background 0.5s, box-shadow 0.5s',
          }}
        />
      </div>
    </div>
  );
}
