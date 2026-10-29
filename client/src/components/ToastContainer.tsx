import React, { useEffect } from 'react';
import { ToastAlert } from '../types';
import { CoinIcon } from './CoinIcon';
import { X, Flame, ExternalLink } from 'lucide-react';

interface ToastContainerProps {
  toasts: ToastAlert[];
  onDismiss: (id: string) => void;
  onSelectCoin?: (symbol: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onDismiss,
  onSelectCoin,
}) => {
  // Auto-dismiss timers
  useEffect(() => {
    if (toasts.length === 0) return;

    const timer = setTimeout(() => {
      onDismiss(toasts[toasts.length - 1].id);
    }, 6000);

    return () => clearTimeout(timer);
  }, [toasts, onDismiss]);

  if (toasts.length === 0) return null;

  const formatPrice = (val: number) => {
    if (val >= 1000) return val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (val >= 1) return val.toFixed(4);
    if (val >= 0.0001) return val.toFixed(6);
    return val.toFixed(8);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none select-none">
      {toasts.map((toast) => {
        const isBullish = toast.type.startsWith('R');
        const borderColor = isBullish ? 'border-[#0ecb81]/50' : 'border-[#f6465d]/50';
        const glowColor = isBullish ? 'shadow-[#0ecb81]/10' : 'shadow-[#f6465d]/10';

        return (
          <div
            key={toast.id}
            onClick={() => onSelectCoin?.(toast.symbol)}
            className={`pointer-events-auto bg-[#181a20] border ${borderColor} rounded-xs p-3 shadow-xl ${glowColor} flex items-start gap-2.5 transition-all duration-200 hover:scale-[1.02] cursor-pointer group`}
          >
            {/* Coin Logo */}
            <div className="shrink-0 mt-0.5">
              <CoinIcon symbol={toast.baseAsset} logoUrl={toast.logoUrl} size="sm" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="font-bold text-xs text-[#eaecef] group-hover:text-[#f0b90b] transition-colors truncate">
                    {toast.baseAsset}
                  </span>
                  <span className="text-[10px] text-[#848e9c] font-mono">/USDT</span>
                  <span
                    className={`inline-flex items-center gap-0.5 px-1 py-0.2 rounded-xs text-[9px] font-mono font-bold border shrink-0 ${toast.badgeStyle}`}
                  >
                    <Flame className="w-2.5 h-2.5 fill-current" />
                    <span>{toast.badgeText}</span>
                  </span>
                </div>

                {/* Dismiss X button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDismiss(toast.id);
                  }}
                  className="p-1 rounded-xs text-[#848e9c] hover:text-[#eaecef] hover:bg-[#22262e] transition-colors shrink-0"
                  title="Tutup Notifikasi"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>

              <div className="flex items-center justify-between mt-1 text-[11px]">
                <span className="font-mono font-semibold text-[#eaecef] tabular-nums">
                  ${formatPrice(toast.price)}
                </span>
                <span className="text-[10px] text-[#848e9c] flex items-center gap-0.5 group-hover:text-[#f0b90b] transition-colors">
                  <span>Lihat Detail</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
