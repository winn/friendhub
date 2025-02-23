import React from 'react';
import { Bot } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  variant?: 'light' | 'dark';
}

export function Logo({ size = 'md', showText = true, variant = 'light' }: LogoProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8 sm:h-10 sm:w-10',
    lg: 'h-12 w-12 sm:h-16 sm:w-16'
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl sm:text-3xl',
    lg: 'text-3xl sm:text-4xl'
  };

  const colorClasses = {
    light: 'text-white',
    dark: 'text-fun-red'
  };

  return (
    <div className="flex items-center space-x-3">
      <div className="relative">
        {/* Main Bot Icon */}
        <div className={`relative z-10 transform transition-transform hover:scale-110 duration-300 ${variant === 'light' ? 'glow-animation' : ''}`}>
          <Bot className={`${sizeClasses[size]} ${colorClasses[variant]}`} strokeWidth={2.5} />
        </div>
        
        {/* Decorative Background Circle */}
        <div className={`absolute inset-0 bg-gradient-to-r from-fun-red via-fun-coral to-fun-pink rounded-full -z-10 blur-[2px] opacity-20 animate-pulse`} />
      </div>

      {showText && (
        <div className="flex items-center">
          <h1 className={`${textSizeClasses[size]} font-bold bg-gradient-to-r ${variant === 'light' ? 'from-white to-white/90' : 'from-fun-red to-fun-coral'} bg-clip-text text-transparent`}>
            AI Friends Hub
          </h1>
        </div>
      )}
    </div>
  );
}