'use client';

import React from 'react';

interface AstrologyLoaderProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  light?: boolean;
}

/**
 * Premium Astrology Loader
 * Uses design tokens and sophisticated SVG animations.
 */
export const AstrologyLoader: React.FC<AstrologyLoaderProps> = ({ 
  size = 'md', 
  className = '',
  light = false 
}) => {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32',
  };

  const color = light ? 'var(--gm-gold-light, #E5D0A0)' : 'var(--gm-gold, #C9A961)';
  const secondaryColor = light ? 'rgba(255,255,255,0.2)' : 'var(--gm-border, rgba(201, 169, 97, 0.2))';

  return (
    <div className={`relative flex items-center justify-center ${sizes[size]} ${className}`}>
      {/* Dynamic Halo */}
      <div 
        className="absolute inset-0 rounded-full blur-xl opacity-20 animate-pulse"
        style={{ background: color }}
      />

      {/* Rotating Orbits */}
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full overflow-visible">
        {/* Outer Orbit */}
        <circle 
          cx="50" cy="50" r="48" 
          fill="none" 
          stroke={secondaryColor} 
          strokeWidth="0.5" 
          strokeDasharray="4 8"
          className="animate-[spin_20s_linear_infinite]"
        />
        {/* Inner Orbit */}
        <circle 
          cx="50" cy="50" r="35" 
          fill="none" 
          stroke={secondaryColor} 
          strokeWidth="0.8" 
          className="animate-[spin_10s_linear_infinite_reverse]"
          style={{ strokeDasharray: '60 160' }}
        />
        {/* Orbit Dot */}
        <circle cx="50" cy="2" r="2" fill={color}>
          <animateTransform 
            attributeName="transform" 
            type="rotate" 
            from="0 50 50" 
            to="360 50 50" 
            dur="4s" 
            repeatCount="indefinite" 
          />
        </circle>
      </svg>

      {/* Central Mystical Symbol */}
      <div className="relative z-10 w-[60%] h-[60%]">
        <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="astro-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={color} />
              <stop offset="100%" stopColor="var(--gm-primary-light, #E5D0A0)" />
            </linearGradient>
          </defs>
          
          {/* Animated Sun/Moon Hybrid */}
          <g className="animate-[bounce_4s_ease-in-out_infinite]">
            <path 
              d="M50 5 A45 45 0 1 1 50 95 A35 35 0 1 0 50 5 Z" 
              fill="url(#astro-grad)" 
              className="drop-shadow-sm"
            />
            <circle cx="50" cy="50" r="10" fill={color} className="animate-pulse" />
            
            {/* Spinning Rays */}
            <g className="animate-[spin_15s_linear_infinite]">
              {Array.from({ length: 12 }).map((_, i) => (
                <line 
                  key={i} 
                  x1="50" y1="50" 
                  x2="50" y2="30" 
                  stroke={color} 
                  strokeWidth="1.5" 
                  strokeLinecap="round"
                  transform={`rotate(${i * 30} 50 50)`}
                  opacity={0.6}
                />
              ))}
            </g>
          </g>
        </svg>
      </div>

      {/* Tiny Sparkling Stars */}
      <div className="absolute inset-[-20%] pointer-events-none">
        <div className="absolute top-0 left-1/4 w-0.5 h-0.5 bg-white rounded-full animate-ping" />
        <div className="absolute bottom-0 right-1/4 w-0.5 h-0.5 bg-white rounded-full animate-ping" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 right-0 w-0.5 h-0.5 bg-white rounded-full animate-ping" style={{ animationDelay: '2s' }} />
      </div>
    </div>
  );
};
