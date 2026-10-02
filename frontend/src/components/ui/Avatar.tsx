import React from 'react';

export interface AvatarProps {
  name: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  role?: string;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  src,
  size = 'md',
  role,
  className = '',
}) => {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const sizes = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl',
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 rounded-full bg-slate-800 border border-slate-700 text-slate-200 font-semibold select-none ${sizes[size]} ${className}`}
      title={role ? `${name} (${role})` : name}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          className="w-full h-full rounded-full object-cover"
        />
      ) : (
        <span>{initials || 'U'}</span>
      )}
    </div>
  );
};
