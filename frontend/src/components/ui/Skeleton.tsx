import React from 'react';

export interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rectangular',
  width,
  height,
}) => {
  const variants = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
    card: 'h-36 rounded-xl',
  };

  const style: React.CSSProperties = {
    width: width !== undefined ? width : undefined,
    height: height !== undefined ? height : undefined,
  };

  return (
    <div
      style={style}
      className={`animate-pulse bg-background-elevated/70 border border-border/40 ${variants[variant]} ${className}`}
      aria-hidden="true"
    />
  );
};
