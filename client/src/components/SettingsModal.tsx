import React, { useState } from 'react';
import { ConfluenceAlertSettings, SoundType } from '../types';
import { soundPlayer, requestNotificationPermission } from '../utils/audioAlert';
import {
  X,
  Volume2,
  VolumeX,
  Play,
  RotateCcw,
  Check,
  Flame,
  SlidersHorizontal
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ConfluenceAlertSettings;
  onSaveSettings: (newSettings: ConfluenceAlertSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  const [localSettings, setLocalSettings] = useState<ConfluenceAlertSettings>(settings);
  const [hasNotificationPermission, setHasNotificationPermission] = useState(() => {
    return typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted';
  });

  React.useEffect(() => {
    setLocalSettings(settings);
  }, [settings, isOpen]);

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const update = (updates: Partial<ConfluenceAlertSettings>) => {
    const next = { ...localSettings, ...updates };
    setLocalSettings(next);
    onSaveSettings(next);
  };

  const handleTestSound = (type?: SoundType) => {
    const sound = type || localSettings.soundType;
    soundPlayer.playAlert(sound, localSettings.volume);
  };

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    setHasNotificationPermission(granted);
    if (granted) {
      update({ desktopNotification: true });
    }
  };

  const soundOptions: { key: SoundType; label: string }[] = [
    { key: 'breakout', label: 'TradingView Breakout' },
    { key: 'alarm_urgent', label: 'Radar Chirp (Urgent)' },
    { key: 'jackpot', label: 'Coin Jackpot' },
    { key: 'laser_radar', label: 'Cyberpunk Laser' },
    { key: 'victory', label: 'Trade Fill Fanfare' },
    { key: 'glass_chime', label: 'Crystal Glass' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-xs select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm sm:max-w-md bg-[#181a20] border border-[#2b313a] rounded-xs shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-3.5 py-2.5 border-b border-[#2b313a] bg-[#12151a] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-xs bg-[#f0b90b]/10 text-[#f0b90b]">
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </span>
            <h2 className="text-xs font-bold text-[#eaecef]">Pengaturan Suara &amp; Alert Notifikasi</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xs text-[#848e9c] hover:text-[#eaecef] hover:bg-[#22262e] transition-colors cursor-pointer"
            title="Tutup (ESC)"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-3.5 space-y-3 overflow-y-auto max-h-[80vh] text-xs text-[#eaecef]">

          {/* Master Sound Toggle */}
          <div
            className={`px-3 py-2 rounded-xs border transition-colors flex items-center justify-between cursor-pointer ${
              localSettings.soundEnabled
                ? 'bg-[#0ecb81]/10 border-[#0ecb81]/40'
                : 'bg-[#12151a] border-[#2b313a]'
            }`}
            onClick={() => update({ soundEnabled: !localSettings.soundEnabled })}
          >
            <div className="flex items-center gap-2.5">
              <span
                className={`p-1.5 rounded-xs ${
                  localSettings.soundEnabled ? 'bg-[#0ecb81] text-[#181a20]' : 'bg-[#22262e] text-[#848e9c]'
                }`}
              >
                {localSettings.soundEnabled ? (
                  <Volume2 className="w-4 h-4" />
                ) : (
                  <VolumeX className="w-4 h-4" />
                )}
              </span>
              <div>
                <span className="font-bold text-xs text-[#eaecef]">Suara Alert 2TF</span>
                <span
                  className={`ml-2 text-[9px] font-mono px-1 py-0.2 rounded-xs font-bold ${
                    localSettings.soundEnabled
                      ? 'bg-[#0ecb81] text-[#181a20]'
                      : 'bg-[#2b313a] text-[#848e9c]'
                  }`}
                >
                  {localSettings.soundEnabled ? 'ON' : 'OFF'}
                </span>
              </div>
            </div>

            <div
              className={`w-9 h-5 rounded-full transition-colors relative p-0.5 shrink-0 ${
                localSettings.soundEnabled ? 'bg-[#0ecb81]' : 'bg-[#2b313a]'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  localSettings.soundEnabled ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </div>
          </div>

          {/* Minimalist Sound Selection (No explanations, compact buttons) */}
          <div
            className={`space-y-2 bg-[#12151a] border border-[#2b313a] rounded-xs p-2.5 transition-opacity ${
              localSettings.soundEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none'
            }`}
          >
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-[#848e9c] uppercase tracking-wider flex items-center gap-1">
                <Flame className="w-3 h-3 text-[#f0b90b]" />
                <span>Pilihan Suara</span>
              </span>

              <button
                type="button"
                onClick={() => handleTestSound()}
                className="flex items-center gap-1 px-2 py-0.5 rounded-xs bg-[#22262e] hover:bg-[#2b313a] text-[#f0b90b] border border-[#2b313a] text-[10px] font-bold transition-colors cursor-pointer"
              >
                <Play className="w-2.5 h-2.5 fill-current" />
                <span>Tes Suara</span>
              </button>
            </div>

            {/* 2-column Compact Sound Selector */}
            <div className="grid grid-cols-2 gap-1.5">
              {soundOptions.map((opt) => {
                const isSelected = localSettings.soundType === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => {
                      update({ soundType: opt.key });
                      soundPlayer.playAlert(opt.key, localSettings.volume);
                    }}
                    className={`px-2 py-1.5 rounded-xs border text-left transition-colors flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-[#f0b90b]/15 border-[#f0b90b] text-[#f0b90b] font-bold'
                        : 'bg-[#181a20] border-[#2b313a] text-[#eaecef] hover:bg-[#22262e]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Play
                        className={`w-2.5 h-2.5 shrink-0 ${
                          isSelected ? 'fill-[#f0b90b] text-[#f0b90b]' : 'text-[#848e9c]'
                        }`}
                      />
                      <span className="text-[11px] truncate">{opt.label}</span>
                    </div>
                    {isSelected && <Check className="w-3 h-3 text-[#f0b90b] shrink-0 ml-1" />}
                  </button>
                );
              })}
            </div>

            {/* Volume Slider */}
            <div className="pt-2 border-t border-[#2b313a] flex items-center justify-between gap-3 text-[11px]">
              <span className="text-[#848e9c] shrink-0">Volume</span>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={localSettings.volume}
                onChange={(e) => update({ volume: parseFloat(e.target.value) })}
                className="w-full accent-[#f0b90b] cursor-pointer"
              />
              <span className="font-mono font-bold text-[#f0b90b] w-9 text-right shrink-0">
                {Math.round(localSettings.volume * 100)}%
              </span>
            </div>
          </div>

          {/* Trigger Zones: Bullish & Bearish */}
          <div className="bg-[#12151a] border border-[#2b313a] rounded-xs p-2.5 space-y-2 text-[11px]">
            <span className="font-bold text-[#848e9c] uppercase tracking-wider block">
              Pemicu Alert
            </span>

            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center gap-2 p-1.5 rounded-xs bg-[#181a20] border border-[#2b313a] cursor-pointer hover:bg-[#22262e]">
                <input
                  type="checkbox"
                  checked={localSettings.alertBullish}
                  onChange={(e) => update({ alertBullish: e.target.checked })}
                  className="w-3.5 h-3.5 rounded-xs accent-[#0ecb81] cursor-pointer"
                />
                <span className="font-semibold text-[#0ecb81]">2TF Bull (R)</span>
              </label>

              <label className="flex items-center gap-2 p-1.5 rounded-xs bg-[#181a20] border border-[#2b313a] cursor-pointer hover:bg-[#22262e]">
                <input
                  type="checkbox"
                  checked={localSettings.alertBearish}
                  onChange={(e) => update({ alertBearish: e.target.checked })}
                  className="w-3.5 h-3.5 rounded-xs accent-[#f6465d] cursor-pointer"
                />
                <span className="font-semibold text-[#f6465d]">2TF Bear (S)</span>
              </label>

              <label className="flex items-center gap-2 p-1.5 rounded-xs bg-[#181a20] border border-[#2b313a] cursor-pointer hover:bg-[#22262e]">
                <input
                  type="checkbox"
                  checked={localSettings.alertBreakoutBullish ?? true}
                  onChange={(e) => update({ alertBreakoutBullish: e.target.checked })}
                  className="w-3.5 h-3.5 rounded-xs accent-[#0ecb81] cursor-pointer"
                />
                <span className="font-semibold text-[#0ecb81]">BO (M5&gt;R1 &amp; 1H&gt;P)</span>
              </label>

              <label className="flex items-center gap-2 p-1.5 rounded-xs bg-[#181a20] border border-[#2b313a] cursor-pointer hover:bg-[#22262e]">
                <input
                  type="checkbox"
                  checked={localSettings.alertBreakoutBearish ?? true}
                  onChange={(e) => update({ alertBreakoutBearish: e.target.checked })}
                  className="w-3.5 h-3.5 rounded-xs accent-[#f6465d] cursor-pointer"
                />
                <span className="font-semibold text-[#f6465d]">BD (M5&lt;S1 &amp; 1H&lt;P)</span>
              </label>

              <label className="flex items-center gap-2 p-1.5 rounded-xs bg-[#181a20] border border-[#2b313a] cursor-pointer hover:bg-[#22262e] col-span-2">
                <input
                  type="checkbox"
                  checked={localSettings.alertPivotCondition ?? true}
                  onChange={(e) => update({ alertPivotCondition: e.target.checked })}
                  className="w-3.5 h-3.5 rounded-xs accent-[#f0b90b] cursor-pointer"
                />
                <span className="font-semibold text-[#f0b90b]">Kondisi Pivot Terpilih (5M / 1H / Daily)</span>
              </label>
            </div>

            {/* Cooldown */}
            <div className="pt-1.5 border-t border-[#2b313a] flex items-center justify-between text-[11px]">
              <span className="text-[#848e9c]">Cooldown per Koin</span>
              <select
                value={localSettings.cooldownSeconds}
                onChange={(e) => update({ cooldownSeconds: parseInt(e.target.value, 10) })}
                className="bg-[#181a20] border border-[#2b313a] text-[#eaecef] font-mono text-[11px] rounded-xs px-2 py-0.5 cursor-pointer"
              >
                <option value={30}>30 Detik</option>
                <option value={60}>1 Menit</option>
                <option value={120}>2 Menit</option>
                <option value={300}>5 Menit</option>
              </select>
            </div>
          </div>

          {/* Visual Toast & Desktop Notifications */}
          <div className="bg-[#12151a] border border-[#2b313a] rounded-xs p-2.5 space-y-2 text-[11px]">
            <label className="flex items-center justify-between cursor-pointer">
              <span>Popup Notifikasi Layar (Toast)</span>
              <input
                type="checkbox"
                checked={localSettings.toastEnabled}
                onChange={(e) => update({ toastEnabled: e.target.checked })}
                className="w-3.5 h-3.5 rounded-xs accent-[#f0b90b] cursor-pointer"
              />
            </label>

            <div className="flex items-center justify-between pt-1 border-t border-[#2b313a]">
              <span>Notifikasi Desktop Browser</span>
              {hasNotificationPermission ? (
                <input
                  type="checkbox"
                  checked={localSettings.desktopNotification}
                  onChange={(e) => update({ desktopNotification: e.target.checked })}
                  className="w-3.5 h-3.5 rounded-xs accent-[#f0b90b] cursor-pointer"
                />
              ) : (
                <button
                  type="button"
                  onClick={handleRequestPermission}
                  className="px-2 py-0.5 rounded-xs bg-[#f0b90b] text-[#181a20] font-bold text-[10px] hover:bg-[#fcd535] cursor-pointer"
                >
                  Izinkan
                </button>
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-3.5 py-2.5 border-t border-[#2b313a] bg-[#12151a] flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={() => {
              const def: ConfluenceAlertSettings = {
                soundEnabled: true,
                soundType: 'breakout',
                volume: 0.85,
                toastEnabled: true,
                desktopNotification: false,
                alertBullish: true,
                alertBearish: true,
                alertBreakoutBullish: true,
                alertBreakoutBearish: true,
                alertPivotCondition: true,
                cooldownSeconds: 60,
              };
              setLocalSettings(def);
              onSaveSettings(def);
            }}
            className="flex items-center gap-1 text-[11px] text-[#848e9c] hover:text-[#eaecef] transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1 rounded-xs bg-[#f0b90b] hover:bg-[#fcd535] text-[#181a20] font-bold text-xs transition-colors cursor-pointer"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
