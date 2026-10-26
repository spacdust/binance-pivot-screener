import React, { useState, useEffect } from 'react';

// In-memory client cache of official Binance logos: symbol (upper) -> logoUrl
const binanceLogoCache: Map<string, string> = new Map();
let isFetchingLogos = false;
const logoListeners = new Set<() => void>();

/**
 * Preload all official Binance asset icons into client cache.
 * Tries the backend proxy first (/api/asset-logos), then direct Binance BAPI if needed.
 */
export async function preloadBinanceLogos() {
  if (binanceLogoCache.size > 0 || isFetchingLogos) return;
  isFetchingLogos = true;

  try {
    // 1. Try our local backend API cache first
    const res = await fetch('/api/asset-logos').catch(() => null);
    if (res && res.ok) {
      const data = await res.json();
      if (data && typeof data === 'object') {
        for (const [k, v] of Object.entries(data)) {
          if (typeof v === 'string' && v.startsWith('http')) {
            binanceLogoCache.set(k.toUpperCase(), v);
          }
        }
      }
    }

    // 2. Fallback to direct Binance public BAPI if backend hadn't finished initial sync
    if (binanceLogoCache.size === 0) {
      const bres = await fetch('https://www.binance.com/bapi/asset/v2/public/asset/asset/get-all-asset');
      if (bres.ok) {
        const json = await bres.json();
        if (json?.data && Array.isArray(json.data)) {
          for (const item of json.data) {
            if (item.assetCode && item.logoUrl) {
              binanceLogoCache.set(item.assetCode.toUpperCase(), item.logoUrl);
            }
          }
        }
      }
    }
  } catch (err) {
    // Graceful fallback
  } finally {
    isFetchingLogos = false;
    logoListeners.forEach((fn) => fn());
  }
}

// Automatically initiate preload on import
if (typeof window !== 'undefined') {
  preloadBinanceLogos();
}

export interface CoinIconProps {
  symbol: string;
  logoUrl?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

export const CoinIcon: React.FC<CoinIconProps> = ({
  symbol,
  logoUrl,
  size = 'sm',
  className = '',
}) => {
  const cleanSymbol = symbol.toUpperCase().replace(/USDT$/, '');
  const [, setTick] = useState(0);
  const [sourceIndex, setSourceIndex] = useState(0);

  // Subscribe to global cache updates when Binance logos finish loading
  useEffect(() => {
    const onCacheUpdate = () => setTick((t) => t + 1);
    logoListeners.add(onCacheUpdate);
    return () => {
      logoListeners.delete(onCacheUpdate);
    };
  }, []);

  // Reset image fallback chain if symbol or logoUrl changes
  useEffect(() => {
    setSourceIndex(0);
  }, [cleanSymbol, logoUrl]);

  // Construct priority source list:
  // 1. Local backend proxy /api/logo/:symbol (100% bypasses referer/hotlink blocks, instant RAM cache)
  // 2. Direct official Binance logoUrl with referrerpolicy="no-referrer"
  // 3. Preloaded official Binance CDN URL
  const sources: string[] = [
    `/api/logo/${cleanSymbol}`
  ];

  if (logoUrl && !sources.includes(logoUrl)) {
    sources.push(logoUrl);
  }

  const cachedOfficialUrl = binanceLogoCache.get(cleanSymbol);
  if (cachedOfficialUrl && !sources.includes(cachedOfficialUrl)) {
    sources.push(cachedOfficialUrl);
  }

  const currentSrc = sources[sourceIndex];

  const sizeClasses = {
    xs: 'w-4 h-4 text-[9px]',
    sm: 'w-5 h-5 sm:w-6 sm:h-6 text-[10px]',
    md: 'w-7 h-7 sm:w-8 sm:h-8 text-xs',
    lg: 'w-9 h-9 sm:w-10 sm:h-10 text-sm',
  }[size];

  // If all image sources fail or no source available, render stylized Binance Pro fallback badge
  if (!currentSrc || sourceIndex >= sources.length) {
    return (
      <div
        className={`${sizeClasses} shrink-0 rounded-full bg-[#20252e] border border-[#2b313a] flex items-center justify-center font-bold font-mono text-[#f0b90b] select-none shadow-xs ${className}`}
        title={cleanSymbol}
      >
        {cleanSymbol.slice(0, 3)}
      </div>
    );
  }

  return (
    <img
      src={currentSrc}
      alt={cleanSymbol}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setSourceIndex((i) => i + 1)}
      className={`${sizeClasses} shrink-0 rounded-full object-cover bg-[#12151a] border border-[#2b313a]/60 select-none shadow-xs ${className}`}
    />
  );
};
