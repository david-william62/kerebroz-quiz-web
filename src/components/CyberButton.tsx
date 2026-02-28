'use client';

import { ButtonHTMLAttributes } from 'react';

interface CyberButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'danger';
  fullWidth?: boolean;
}

export default function CyberButton({
  children,
  variant = 'default',
  fullWidth = false,
  className = '',
  ...props
}: CyberButtonProps) {
  const variantClass =
    variant === 'primary' ? 'cyber-btn-primary' :
      variant === 'danger' ? 'cyber-btn-danger' : '';

  return (
    <button
      className={`cyber-btn ${variantClass} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
