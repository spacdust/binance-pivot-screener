import React, { useEffect } from 'react';
import { ToastAlert } from '../types';
import { CoinIcon } from './CoinIcon';
import { X, Flame } from 'lucide-react';

interface ToastContainerProps {
  toasts: ToastAlert[];
  onDismiss: (id: string) => void;
  onSelectCoin?: (symbol: string) => void;
}

const ToastItem: React.FC<{
  toast: ToastAlert;
  onDismiss: (id: string) => void;
  onSelectCoin?: (symbol: string) => void;
}> = ({ toast, onDismiss, onSelectCoin }) => {
  // Guaranteed auto-dismiss after 3.5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 3500);

    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const formatPrice = (val: number) => {
    if (val >= 1000) return val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (val >= 1) return val.toFixed(4);
    if (val >= 0.0001) return val.toFixed(6);
    return val.toFixed(8);
  };

  const isBullish = toast.type.startsWith('R');
  const borderColor = isBullish ? 'border-[#0ecb81]/60' : 'border-[#f6465d]/60';
  const progressBg = isBullish ? 'bg-[#0ecb81]' : 'bg-[#f6465d]';

  return (
    <div
      onClick={() => onSelectCoin?.(toast.symbol)}
      className={`pointer-events-auto bg-[#181a20] border ${borderColor} rounded-xs px-3 py-2.5 shadow-2xl flex flex-col gap-1.5 transition-all duration-200 hover:scale-[1.01] cursor-pointer group relative overflow-hidden animate-in fade-in slide-in-from-right-5 duration-200`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <CoinIcon symbol={toast.baseAsset} logoUrl={toast.logoUrl} size="sm" />
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
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDismiss(toast.id);
          }}
          className="p-1 rounded-xs text-[#848e9c] hover:text-[#eaecef] hover:bg-[#22262e] transition-colors shrink-0"
          title="Tutup"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      <div className="flex items-center justify-between text-[11px] font-mono pl-7">
        <span className="font-semibold text-[#eaecef] tabular-nums">
          ${formatPrice(toast.price)}
        </span>
        <span className="text-[10px] text-[#848e9c] group-hover:text-[#f0b90b] transition-colors">
          Buka Chart &rarr;
        </span>
      </div>

      {/* Auto-close Progress Indicator Bar (3.5s) */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/10 overflow-hidden">
        <div
          className={`h-full ${progressBg} transition-all`}
          style={{
            animation: 'toastProgress 3.5s linear forwards',
          }}
        />
      </div>
    </div>
  );
};

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onDismiss,
  onSelectCoin,
}) => {
  if (toasts.length === 0) return null;

  return (
    <>
      <style>{`
        @keyframes toastProgress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-72 max-w-[calc(100vw-2rem)] pointer-events-none select-none">
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onDismiss={onDismiss}
            onSelectCoin={onSelectCoin}
          />
        ))}
      </div>
    </>
  );
};
