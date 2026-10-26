import React, { useState } from 'react';

interface CoinIconProps {
  symbol: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

export const CoinIcon: React.FC<CoinIconProps> = ({
  symbol,
  size = 'sm',
  className = '',
}) => {
  const [hasError, setHasError] = useState(false);
  const cleanSymbol = symbol.toUpperCase().replace(/USDT$/, '');

  const sizeClasses = {
    xs: 'w-4 h-4 text-[9px]',
    sm: 'w-5 h-5 sm:w-6 sm:h-6 text-[10px]',
    md: 'w-7 h-7 sm:w-8 sm:h-8 text-xs',
    lg: 'w-9 h-9 sm:w-10 sm:h-10 text-sm',
  }[size];

  if (hasError) {
    return (
      <div
        className={`${sizeClasses} shrink-0 rounded-full bg-[#22262e] border border-[#2b313a] flex items-center justify-center font-bold font-mono text-[#f0b90b] select-none ${className}`}
        title={cleanSymbol}
      >
        {cleanSymbol.slice(0, 3)}
      </div>
    );
  }

  return (
    <img
      src={`https://assets.coincap.io/assets/icons/${cleanSymbol.toLowerCase()}@2x.png`}
      alt={cleanSymbol}
      loading="lazy"
      onError={() => setHasError(true)}
      className={`${sizeClasses} shrink-0 rounded-full object-cover bg-[#12151a] border border-[#2b313a]/50 select-none ${className}`}
    />
  );
};
