import React, { useState } from 'react';
import { ConfluenceAlertSettings, SoundType } from '../types';
import { soundPlayer, requestNotificationPermission } from '../utils/audioAlert';
import {
  X,
  Volume2,
  VolumeX,
  Bell,
  Play,
  RotateCcw,
  Sparkles,
  ShieldAlert,
  Flame,
  Check,
  Radio,
  Sliders,
  SlidersHorizontal,
  Monitor
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ConfluenceAlertSettings;
  onSaveSettings: (newSettings: ConfluenceAlertSettings) => void;
  pivotStyle?: 'hud' | 'zone_zoom';
  onChangePivotStyle?: (style: 'hud' | 'zone_zoom') => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  pivotStyle = 'hud',
  onChangePivotStyle,
}) => {
  const [localSettings, setLocalSettings] = useState<ConfluenceAlertSettings>(settings);
  const [hasNotificationPermission, setHasNotificationPermission] = useState(() => {
    return typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted';
  });

  // Keep local state in sync when opened
  React.useEffect(() => {
    setLocalSettings(settings);
  }, [settings, isOpen]);

  // Handle ESC key to close
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
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

  const soundOptions: {
    key: SoundType;
    label: string;
    tag: string;
    tagClass: string;
    desc: string;
  }[] = [
    {
      key: 'breakout',
      label: 'TradingView Breakout',
      tag: 'Direkomendasikan',
      tagClass: 'bg-[#0ecb81]/20 text-[#0ecb81] border-[#0ecb81]/40',
      desc: 'Arpeggio triad 4-nada cepat & punchy (G5 ➔ C6 ➔ E6 ➔ G6)',
    },
    {
      key: 'alarm_urgent',
      label: 'Radar Chirp (Urgent)',
      tag: 'Super Alert 🔥',
      tagClass: 'bg-[#f6465d]/20 text-[#f6465d] border-[#f6465d]/40',
      desc: 'Double chirp tajam frekuensi tinggi — 100% menarik perhatian!',
    },
    {
      key: 'jackpot',
      label: 'Coin Rush / Jackpot',
      tag: 'Koin Emas 💰',
      tagClass: 'bg-[#f0b90b]/20 text-[#f0b90b] border-[#f0b90b]/40',
      desc: '3 denting koin emas cepat berturut disusul lonceng resonansi',
    },
    {
      key: 'laser_radar',
      label: 'Cyberpunk Laser Sweep',
      tag: 'Futuristik ⚡',
      tagClass: 'bg-[#3b82f6]/20 text-[#3b82f6] border-[#3b82f6]/40',
      desc: 'Laser FM sweep modern khas terminal trading institusional',
    },
    {
      key: 'victory',
      label: 'Trade Fill Fanfare',
      tag: 'Level Up 🎯',
      tagClass: 'bg-[#a855f7]/20 text-[#a855f7] border-[#a855f7]/40',
      desc: 'Melodi kenaikan kemenangan 4-nada energik & memuaskan',
    },
    {
      key: 'glass_chime',
      label: 'Apple Crystal Glass',
      tag: 'Kristal 💎',
      tagClass: 'bg-[#14b8a6]/20 text-[#14b8a6] border-[#14b8a6]/40',
      desc: 'Denting kaca kristal dengan 3 overtone harmonik beresonansi',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs select-none">
      <div
        className="w-full max-w-lg bg-[#181a20] border border-[#2b313a] rounded-xs shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-[#2b313a] bg-[#12151a] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-xs bg-[#f0b90b]/10 text-[#f0b90b]">
              <SlidersHorizontal className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-[#eaecef]">Pengaturan Screener & Alert</h2>
              <p className="text-[11px] text-[#848e9c]">Atur notifikasi suara 2TF confluence dan tampilan</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xs text-[#848e9c] hover:text-[#eaecef] hover:bg-[#22262e] transition-colors cursor-pointer"
            title="Tutup (ESC)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1 text-xs text-[#eaecef]">
          
          {/* Main Sound Master Switch Card */}
          <div
            className={`p-3 rounded-xs border transition-colors flex items-center justify-between cursor-pointer ${
              localSettings.soundEnabled
                ? 'bg-[#0ecb81]/10 border-[#0ecb81]/40'
                : 'bg-[#12151a] border-[#2b313a]'
            }`}
            onClick={() => update({ soundEnabled: !localSettings.soundEnabled })}
          >
            <div className="flex items-center gap-3">
              <span
                className={`p-2 rounded-xs ${
                  localSettings.soundEnabled
                    ? 'bg-[#0ecb81] text-[#181a20]'
                    : 'bg-[#22262e] text-[#848e9c]'
                }`}
              >
                {localSettings.soundEnabled ? (
                  <Volume2 className="w-5 h-5" />
                ) : (
                  <VolumeX className="w-5 h-5" />
                )}
              </span>
              <div>
                <div className="font-bold text-sm text-[#eaecef] flex items-center gap-2">
                  <span>Suara Alert 2TF Confluence</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded-xs font-bold ${
                      localSettings.soundEnabled
                        ? 'bg-[#0ecb81] text-[#181a20]'
                        : 'bg-[#2b313a] text-[#848e9c]'
                    }`}
                  >
                    {localSettings.soundEnabled ? 'AKTIF' : 'NONAKTIF'}
                  </span>
                </div>
                <p className="text-[11px] text-[#848e9c] mt-0.5">
                  Bunyikan alarm audio ketika koin baru memasuki zona 2TF (M5 + H1).
                </p>
              </div>
            </div>

            {/* Toggle switch */}
            <div
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 shrink-0 ${
                localSettings.soundEnabled ? 'bg-[#0ecb81]' : 'bg-[#2b313a]'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  localSettings.soundEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </div>
          </div>

          {/* Sound Controls (Only visible when soundEnabled or dim) */}
          <div
            className={`space-y-3 bg-[#12151a] border border-[#2b313a] rounded-xs p-3 transition-opacity ${
              localSettings.soundEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-[#eaecef] uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-[#f0b90b]" />
                <span>Pilihan Jenis Suara</span>
              </span>

              {/* Test Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleTestSound();
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-xs bg-[#22262e] hover:bg-[#2b313a] text-[#f0b90b] border border-[#2b313a] text-[11px] font-bold transition-colors cursor-pointer"
                title="Dengarkan contoh suara saat ini"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Uji Suara</span>
              </button>
            </div>

            {/* Sound Radio Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {soundOptions.map((opt) => {
                const isSelected = localSettings.soundType === opt.key;
                return (
                  <div
                    key={opt.key}
                    onClick={() => {
                      update({ soundType: opt.key });
                      soundPlayer.playAlert(opt.key, localSettings.volume);
                    }}
                    className={`p-2.5 rounded-xs border cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-[#f0b90b]/10 border-[#f0b90b] text-[#eaecef] shadow-xs'
                        : 'bg-[#181a20] border-[#2b313a] text-[#848e9c] hover:border-[#f0b90b]/40 hover:text-[#eaecef]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`font-bold text-xs ${isSelected ? 'text-[#f0b90b]' : 'text-[#eaecef]'}`}>
                            {opt.label}
                          </span>
                          <span className={`text-[9px] font-mono px-1 py-0.2 rounded-xs border ${opt.tagClass}`}>
                            {opt.tag}
                          </span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#f0b90b] shrink-0" />}
                      </div>
                      <p className="text-[10.5px] text-[#848e9c] leading-snug">{opt.desc}</p>
                    </div>

                    <div className="mt-2 pt-1.5 border-t border-[#2b313a]/60 flex items-center justify-between text-[10px]">
                      <span className="text-[#848e9c] font-mono">Klik untuk pilih & dengar</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          update({ soundType: opt.key });
                          soundPlayer.playAlert(opt.key, localSettings.volume);
                        }}
                        className="px-1.5 py-0.5 rounded-xs bg-[#22262e] hover:bg-[#2b313a] text-[#f0b90b] font-bold flex items-center gap-1"
                      >
                        <Play className="w-2.5 h-2.5 fill-current" />
                        <span>Play</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Volume Slider */}
            <div className="pt-2 border-t border-[#2b313a] space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#848e9c] flex items-center gap-1">
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Volume Audio</span>
                </span>
                <span className="font-mono font-bold text-[#f0b90b]">
                  {Math.round(localSettings.volume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={localSettings.volume}
                onChange={(e) => update({ volume: parseFloat(e.target.value) })}
                className="w-full accent-[#f0b90b] cursor-pointer"
              />
            </div>
          </div>

          {/* Filtering Criteria for Alerts */}
          <div className="bg-[#12151a] border border-[#2b313a] rounded-xs p-3 space-y-2.5">
            <span className="font-bold text-xs text-[#eaecef] uppercase tracking-wider block">
              Filter Pemicu Alert (Zona Confluence)
            </span>

            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center gap-2 p-2 rounded-xs bg-[#181a20] border border-[#2b313a] cursor-pointer hover:bg-[#22262e] transition-colors">
                <input
                  type="checkbox"
                  checked={localSettings.alertBullish}
                  onChange={(e) => update({ alertBullish: e.target.checked })}
                  className="w-4 h-4 rounded-xs accent-[#0ecb81] cursor-pointer"
                />
                <div>
                  <div className="font-bold text-xs text-[#0ecb81]">Zona Bullish (R)</div>
                  <div className="text-[10px] text-[#848e9c]">R1-R2, R2-R3, R3-R4</div>
                </div>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-xs bg-[#181a20] border border-[#2b313a] cursor-pointer hover:bg-[#22262e] transition-colors">
                <input
                  type="checkbox"
                  checked={localSettings.alertBearish}
                  onChange={(e) => update({ alertBearish: e.target.checked })}
                  className="w-4 h-4 rounded-xs accent-[#f6465d] cursor-pointer"
                />
                <div>
                  <div className="font-bold text-xs text-[#f6465d]">Zona Bearish (S)</div>
                  <div className="text-[10px] text-[#848e9c]">S1-S2, S2-S3, S3-S4</div>
                </div>
              </label>
            </div>

            {/* Anti-spam Cooldown */}
            <div className="pt-2 border-t border-[#2b313a] flex items-center justify-between gap-2">
              <div>
                <div className="font-medium text-xs text-[#eaecef]">Cooldown per Koin</div>
                <div className="text-[10px] text-[#848e9c]">Mencegah spam jika harga bolak-balik di garis</div>
              </div>
              <select
                value={localSettings.cooldownSeconds}
                onChange={(e) => update({ cooldownSeconds: parseInt(e.target.value, 10) })}
                className="bg-[#181a20] border border-[#2b313a] text-[#eaecef] font-mono text-xs rounded-xs px-2 py-1 focus:outline-none focus:border-[#f0b90b] cursor-pointer"
              >
                <option value={30}>30 Detik</option>
                <option value={60}>1 Menit (Standar)</option>
                <option value={120}>2 Menit</option>
                <option value={300}>5 Menit</option>
              </select>
            </div>
          </div>

          {/* Visual Toast & Desktop Notification */}
          <div className="bg-[#12151a] border border-[#2b313a] rounded-xs p-3 space-y-2">
            <span className="font-bold text-xs text-[#eaecef] uppercase tracking-wider block">
              Notifikasi Visual & Desktop
            </span>

            {/* Toast popup */}
            <label className="flex items-center justify-between p-2 rounded-xs bg-[#181a20] border border-[#2b313a] cursor-pointer hover:bg-[#22262e] transition-colors">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#f0b90b]" />
                <div>
                  <div className="font-medium text-xs text-[#eaecef]">Banner Popup di Layar (Toast)</div>
                  <div className="text-[10px] text-[#848e9c]">Muncul kartu notifikasi mengambang di pojok layar</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={localSettings.toastEnabled}
                onChange={(e) => update({ toastEnabled: e.target.checked })}
                className="w-4 h-4 rounded-xs accent-[#f0b90b] cursor-pointer"
              />
            </label>

            {/* Browser push */}
            <div className="flex items-center justify-between p-2 rounded-xs bg-[#181a20] border border-[#2b313a]">
              <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4 text-[#848e9c]" />
                <div>
                  <div className="font-medium text-xs text-[#eaecef]">Notifikasi Browser Desktop</div>
                  <div className="text-[10px] text-[#848e9c]">
                    {hasNotificationPermission
                      ? 'Izin browser aktif'
                      : 'Membutuhkan izin notifikasi browser'}
                  </div>
                </div>
              </div>

              {hasNotificationPermission ? (
                <input
                  type="checkbox"
                  checked={localSettings.desktopNotification}
                  onChange={(e) => update({ desktopNotification: e.target.checked })}
                  className="w-4 h-4 rounded-xs accent-[#f0b90b] cursor-pointer"
                />
              ) : (
                <button
                  type="button"
                  onClick={handleRequestPermission}
                  className="px-2 py-0.5 rounded-xs bg-[#f0b90b] text-[#181a20] font-bold text-[11px] hover:bg-[#fcd535] transition-colors cursor-pointer"
                >
                  Izinkan
                </button>
              )}
            </div>
          </div>

          {/* Screener Visual Theme Preference */}
          {onChangePivotStyle && (
            <div className="bg-[#12151a] border border-[#2b313a] rounded-xs p-3 space-y-2">
              <span className="font-bold text-xs text-[#eaecef] uppercase tracking-wider block">
                Gaya Tampilan Slider Pivot
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onChangePivotStyle('hud')}
                  className={`p-2 rounded-xs border text-left cursor-pointer transition-colors ${
                    pivotStyle === 'hud'
                      ? 'bg-[#22262e] border-[#f0b90b] text-[#eaecef] font-bold'
                      : 'bg-[#181a20] border-[#2b313a] text-[#848e9c] hover:text-[#eaecef]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>HUD Presisi (S4..R4)</span>
                    {pivotStyle === 'hud' && <Check className="w-3.5 h-3.5 text-[#f0b90b]" />}
                  </div>
                  <div className="text-[10px] font-normal text-[#848e9c] mt-0.5">
                    Track 8 zona lengkap dengan jarum solid 3px (Default)
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => onChangePivotStyle('zone_zoom')}
                  className={`p-2 rounded-xs border text-left cursor-pointer transition-colors ${
                    pivotStyle === 'zone_zoom'
                      ? 'bg-[#22262e] border-[#f0b90b] text-[#eaecef] font-bold'
                      : 'bg-[#181a20] border-[#2b313a] text-[#848e9c] hover:text-[#eaecef]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>Zone Zoom-in</span>
                    {pivotStyle === 'zone_zoom' && <Check className="w-3.5 h-3.5 text-[#f0b90b]" />}
                  </div>
                  <div className="text-[10px] font-normal text-[#848e9c] mt-0.5">
                    Zoom-in area aktif dengan batas kiri & kanan
                  </div>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-[#2b313a] bg-[#12151a] flex items-center justify-between shrink-0">
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
                cooldownSeconds: 60,
              };
              setLocalSettings(def);
              onSaveSettings(def);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xs bg-[#181a20] hover:bg-[#22262e] text-[#848e9c] hover:text-[#eaecef] border border-[#2b313a] text-xs transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Default</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xs bg-[#f0b90b] hover:bg-[#fcd535] text-[#181a20] font-bold text-xs transition-colors shadow-xs cursor-pointer"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
