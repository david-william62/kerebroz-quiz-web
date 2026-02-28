'use client';

import { ReactNode, CSSProperties } from 'react';

interface GlowCardProps {
  children: ReactNode;
  className?: string;
  glow?: boolean;
  style?: CSSProperties;
  onClick?: () => void;
}

export default function GlowCard({ children, className = '', glow = false, style, onClick }: GlowCardProps) {
  return (
    <div
      className={`glass-card p-6 ${glow ? 'glow-border' : ''} ${className}`}
      style={style}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
