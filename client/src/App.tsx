import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useScreenerSocket } from './hooks/useScreenerSocket';
import {
  FilterState,
  CoinData,
  TwoTfCounts,
  BreakoutCounts,
  ConfluenceAlertSettings,
  DEFAULT_ALERT_SETTINGS,
  ToastAlert
} from './types';
import { Header } from './components/Header';
import { FilterSidebar } from './components/FilterSidebar';
import { ScreenerTable } from './components/ScreenerTable';
import { CoinDetailModal } from './components/CoinDetailModal';
import { SettingsModal } from './components/SettingsModal';
import { ToastContainer } from './components/ToastContainer';
import { soundPlayer } from './utils/audioAlert';
import {
  checkPivotConfluence,
  classifyPriceZone,
  checkTwoTfZoneConfluence,
  checkBreakoutConfluence
} from './utils/pivotConfluence';
import { Loader2 } from 'lucide-react';

const initialFilters: FilterState = {
  searchQuery: '',
  selectedTimeframe: 'h24',
  topMoverCategory: 'ALL',
  maxPercent: 5,
  enablePercentFilter: false,
  filterMode: 'absolute_below',
  pivotCondition: 'ALL',
  minVolume: 0,
  onlyConfluence: false,
  twoTfZoneFilter: 'OFF',
  breakoutFilter: 'OFF',
};

export const App: React.FC = () => {
  const { coins, isConnected, lastMessageTime, refreshData } = useScreenerSocket();
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [selectedCoin, setSelectedCoin] = useState<CoinData | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Confluence Alert Settings (Sound, Toast, Desktop, Zones, Cooldown)
  const [alertSettings, setAlertSettings] = useState<ConfluenceAlertSettings>(() => {
    try {
      const saved = localStorage.getItem('binance_screener_2tf_alerts');
      if (saved) return { ...DEFAULT_ALERT_SETTINGS, ...JSON.parse(saved) };
    } catch (e) {}
    return DEFAULT_ALERT_SETTINGS;
  });

  const [toasts, setToasts] = useState<ToastAlert[]>([]);

  // Robust per-coin state tracking to detect brand new entries & zone transitions without border-flicker bugs
  const coinTrackingMapRef = useRef<
    Map<
      string,
      {
        activeZone: string | null;
        exitedAt: number;
        lastAlertedZone: string | null;
        lastAlertTime: number;
      }
    >
  >(new Map());
  const breakoutTrackingMapRef = useRef<
    Map<
      string,
      {
        activeZone: string | null;
        exitedAt: number;
        lastAlertedZone: string | null;
        lastAlertTime: number;
      }
    >
  >(new Map());
  const isInitialDataLoadedRef = useRef(false);

  // Proactively warm up and unlock AudioContext on user interaction for 0ms zero-latency alert playback
  useEffect(() => {
    const warmUp = () => {
      soundPlayer.ensureActive();
    };
    window.addEventListener('click', warmUp, { passive: true });
    window.addEventListener('keydown', warmUp, { passive: true });
    window.addEventListener('pointerdown', warmUp, { passive: true });
    return () => {
      window.removeEventListener('click', warmUp);
      window.removeEventListener('keydown', warmUp);
      window.removeEventListener('pointerdown', warmUp);
    };
  }, []);

  const handleSaveAlertSettings = (newSettings: ConfluenceAlertSettings) => {
    setAlertSettings(newSettings);
    localStorage.setItem('binance_screener_2tf_alerts', JSON.stringify(newSettings));
  };

  const handleToggleSound = () => {
    const next = !alertSettings.soundEnabled;
    handleSaveAlertSettings({ ...alertSettings, soundEnabled: next });
    if (next) {
      soundPlayer.playAlert(alertSettings.soundType, alertSettings.volume);
    }
  };

  const handleDismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleSelectCoinFromToast = useCallback((symbol: string) => {
    const found = coins.find((c) => c.symbol === symbol);
    if (found) setSelectedCoin(found);
  }, [coins]);

  // Real-time detector: alert when a new coin enters 2TF confluence OR Breakout confluence
  useEffect(() => {
    if (!coins || coins.length === 0) return;

    const trackingMap = coinTrackingMapRef.current;
    const boTrackingMap = breakoutTrackingMapRef.current;
    const now = Date.now();
    const cooldownMs = (alertSettings.cooldownSeconds || 60) * 1000;
    const newlyEntered: Array<{
      coin: CoinData;
      type: string;
      badgeText: string;
      badgeStyle: string;
      alertTitle: string;
    }> = [];

    // Initial load: populate current state without sounding an alarm
    if (!isInitialDataLoadedRef.current) {
      coins.forEach((c) => {
        const res = checkTwoTfZoneConfluence(c);
        if (res.hasConfluence) {
          trackingMap.set(c.symbol, {
            activeZone: res.type,
            exitedAt: 0,
            lastAlertedZone: res.type,
            lastAlertTime: now,
          });
        }
        const bo = checkBreakoutConfluence(c);
        if (bo.hasConfluence) {
          boTrackingMap.set(c.symbol, {
            activeZone: bo.type,
            exitedAt: 0,
            lastAlertedZone: bo.type,
            lastAlertTime: now,
          });
        }
      });
      isInitialDataLoadedRef.current = true;
      return;
    }

    coins.forEach((coin) => {
      // 1. Detect 2TF Zone Confluence
      const res = checkTwoTfZoneConfluence(coin);
      let tracked = trackingMap.get(coin.symbol);

      if (res.hasConfluence) {
        if (!tracked) {
          tracked = {
            activeZone: null,
            exitedAt: now - 30000,
            lastAlertedZone: null,
            lastAlertTime: 0,
          };
          trackingMap.set(coin.symbol, tracked);
        }

        const isNewZone = tracked.lastAlertedZone !== res.type;
        const isReEntry = tracked.exitedAt > 0 && now - tracked.exitedAt >= 15000;
        const cooldownElapsed = now - tracked.lastAlertTime >= cooldownMs;

        if ((isNewZone || isReEntry) && cooldownElapsed) {
          const isBull = res.type.startsWith('R');
          const isBear = res.type.startsWith('S');
          const isAllowed =
            (isBull && alertSettings.alertBullish) ||
            (isBear && alertSettings.alertBearish);

          if (isAllowed) {
            newlyEntered.push({
              coin,
              type: res.type,
              badgeText: res.badgeText,
              badgeStyle: res.badgeStyle,
              alertTitle: '2TF Confluence',
            });
            tracked.lastAlertedZone = res.type;
            tracked.lastAlertTime = now;
          }
        }

        tracked.activeZone = res.type;
        tracked.exitedAt = 0;
      } else {
        if (tracked && tracked.activeZone !== null) {
          tracked.activeZone = null;
          tracked.exitedAt = now;
        }
      }

      // 2. Detect Cross-TF Breakout Confluence (M5 > R1 & 1H > P or reverse)
      const bo = checkBreakoutConfluence(coin);
      let boTracked = boTrackingMap.get(coin.symbol);

      if (bo.hasConfluence) {
        if (!boTracked) {
          boTracked = {
            activeZone: null,
            exitedAt: now - 30000,
            lastAlertedZone: null,
            lastAlertTime: 0,
          };
          boTrackingMap.set(coin.symbol, boTracked);
        }

        const isNewZone = boTracked.lastAlertedZone !== bo.type;
        const isReEntry = boTracked.exitedAt > 0 && now - boTracked.exitedAt >= 15000;
        const cooldownElapsed = now - boTracked.lastAlertTime >= cooldownMs;

        if ((isNewZone || isReEntry) && cooldownElapsed) {
          const isBull = bo.type === 'BULLISH';
          const isBear = bo.type === 'BEARISH';
          const isAllowed =
            (isBull && (alertSettings.alertBreakoutBullish ?? true)) ||
            (isBear && (alertSettings.alertBreakoutBearish ?? true));

          if (isAllowed) {
            newlyEntered.push({
              coin,
              type: bo.type,
              badgeText: bo.badgeText,
              badgeStyle: bo.badgeStyle,
              alertTitle: 'Breakout Confluence',
            });
            boTracked.lastAlertedZone = bo.type;
            boTracked.lastAlertTime = now;
          }
        }

        boTracked.activeZone = bo.type;
        boTracked.exitedAt = 0;
      } else {
        if (boTracked && boTracked.activeZone !== null) {
          boTracked.activeZone = null;
          boTracked.exitedAt = now;
        }
      }
    });

    if (newlyEntered.length > 0) {
      // 1. Play audio tone immediately
      if (alertSettings.soundEnabled) {
        soundPlayer.playAlert(alertSettings.soundType, alertSettings.volume);
      }

      // 2. Add visual toast notification
      if (alertSettings.toastEnabled) {
        const newToasts: ToastAlert[] = newlyEntered.slice(0, 3).map((item) => ({
          id: `${item.coin.symbol}-${item.type}-${now}-${Math.random().toString(36).substring(2, 7)}`,
          symbol: item.coin.symbol,
          baseAsset: item.coin.baseAsset || item.coin.symbol.replace(/USDT$/, ''),
          logoUrl: item.coin.logoUrl,
          type: item.type,
          badgeText: item.badgeText,
          badgeStyle: item.badgeStyle,
          price: item.coin.price,
          timestamp: now,
        }));

        setToasts((prev) => [...newToasts, ...prev].slice(0, 5));
      }

      // 3. Desktop Notification if allowed
      if (
        alertSettings.desktopNotification &&
        typeof window !== 'undefined' &&
        'Notification' in window &&
        Notification.permission === 'granted'
      ) {
        const first = newlyEntered[0];
        const count = newlyEntered.length;
        const title =
          count === 1
            ? `🔥 ${first.coin.baseAsset || first.coin.symbol} (${first.alertTitle})!`
            : `🔥 ${count} Koin Masuk Confluence!`;
        const body =
          count === 1
            ? `${first.badgeText} pada harga $${first.coin.price.toLocaleString('en-US')}`
            : newlyEntered.map((x) => x.coin.baseAsset || x.coin.symbol).join(', ');
        try {
          new Notification(title, { body, icon: first.coin.logoUrl || undefined });
        } catch (e) {}
      }
    }
  }, [coins, alertSettings]);

  const handleFilterChange = (updates: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...updates }));
  };

  const handleResetFilters = () => {
    setFilters(initialFilters);
  };

  // Filtered coins computation
  const filteredCoins = useMemo(() => {
    return coins.filter((coin) => {
      // 1. Search filter
      if (filters.searchQuery) {
        const query = filters.searchQuery.toUpperCase().trim();
        const matchesSymbol = coin.symbol.includes(query) || coin.baseAsset.includes(query);
        if (!matchesSymbol) return false;
      }

      // 2. Top Mover Category filter
      if (filters.topMoverCategory === 'TOP_GAINERS') {
        const changeVal = coin.changes[filters.selectedTimeframe] ?? 0;
        if (changeVal <= 0) return false;
      } else if (filters.topMoverCategory === 'TOP_LOSERS') {
        const changeVal = coin.changes[filters.selectedTimeframe] ?? 0;
        if (changeVal >= 0) return false;
      } else if (filters.topMoverCategory === 'FLASH_MOVERS') {
        // High rapid spike in 1m or 5m (|change| >= 1.0% in 5m or >= 0.5% in 1m)
        const isSpike5m = Math.abs(coin.changes.m5) >= 1.0;
        const isSpike1m = Math.abs(coin.changes.m1) >= 0.5;
        if (!isSpike5m && !isSpike1m) return false;
      }

      // 3. Multi-Timeframe percentage filter
      if (filters.enablePercentFilter) {
        const changeVal = coin.changes[filters.selectedTimeframe] ?? 0;
        if (filters.filterMode === 'absolute_below') {
          if (Math.abs(changeVal) > filters.maxPercent) return false;
        } else if (filters.filterMode === 'below') {
          if (changeVal > filters.maxPercent) return false;
        } else if (filters.filterMode === 'above') {
          if (changeVal < filters.maxPercent) return false;
        }
      }

      // 4. Daily Pivot Point condition filter (Live calculated from current price)
      if (filters.pivotCondition !== 'ALL') {
        const liveCond = classifyPriceZone(coin.price, coin.pivots) ?? coin.pivotStatus?.condition;
        if (liveCond !== filters.pivotCondition) {
          return false;
        }
      }

      // 5. Multi-Timeframe Confluence filter (Daily, 1H, 5M in same area)
      if (filters.onlyConfluence) {
        const conf = checkPivotConfluence(coin);
        if (!conf.hasConfluence) return false;
      }

      // 6. 2TF (M5 & H1) Zone Confluence filter (R1..R4 and S1..S4)
      if (filters.twoTfZoneFilter && filters.twoTfZoneFilter !== 'OFF') {
        const twoTf = checkTwoTfZoneConfluence(coin);
        if (!twoTf.hasConfluence) return false;
        if (filters.twoTfZoneFilter === 'ALL') return true;
        if (filters.twoTfZoneFilter === 'ALL_R' && !twoTf.type.startsWith('R')) return false;
        if (filters.twoTfZoneFilter === 'ALL_S' && !twoTf.type.startsWith('S')) return false;
        if (filters.twoTfZoneFilter === 'R1_R2' && twoTf.type !== 'R1_TO_R2') return false;
        if (filters.twoTfZoneFilter === 'R2_R3' && twoTf.type !== 'R2_TO_R3') return false;
        if (filters.twoTfZoneFilter === 'R3_R4' && twoTf.type !== 'R3_TO_R4') return false;
        if (filters.twoTfZoneFilter === 'S1_S2' && twoTf.type !== 'S1_TO_S2') return false;
        if (filters.twoTfZoneFilter === 'S2_S3' && twoTf.type !== 'S2_TO_S3') return false;
        if (filters.twoTfZoneFilter === 'S3_S4' && twoTf.type !== 'S3_TO_S4') return false;
      }

      // 7. Cross-TF Breakout Confluence filter (M5 > R1 & 1H > P or reverse)
      if (filters.breakoutFilter && filters.breakoutFilter !== 'OFF') {
        const bo = checkBreakoutConfluence(coin);
        if (!bo.hasConfluence) return false;
        if (filters.breakoutFilter === 'BULLISH' && bo.type !== 'BULLISH') return false;
        if (filters.breakoutFilter === 'BEARISH' && bo.type !== 'BEARISH') return false;
      }

      return true;
    });
  }, [coins, filters]);

  // Keep selectedCoin up-to-date with live websocket data
  const liveSelectedCoin = useMemo(() => {
    if (!selectedCoin) return null;
    return coins.find((c) => c.symbol === selectedCoin.symbol) || selectedCoin;
  }, [coins, selectedCoin]);

  // Live count per pivot condition for interactive filters (Real-time live evaluations)
  const conditionCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: coins.length };
    coins.forEach((c) => {
      const cond = classifyPriceZone(c.price, c.pivots) ?? c.pivotStatus?.condition;
      if (cond) {
        counts[cond] = (counts[cond] || 0) + 1;
      }
    });
    return counts;
  }, [coins]);

  const confluenceCount = useMemo(() => {
    return coins.filter((c) => checkPivotConfluence(c).hasConfluence).length;
  }, [coins]);

  const twoTfCounts: TwoTfCounts = useMemo(() => {
    let all = 0;
    let allR = 0;
    let allS = 0;
    let r1r2 = 0;
    let r2r3 = 0;
    let r3r4 = 0;
    let s1s2 = 0;
    let s2s3 = 0;
    let s3s4 = 0;
    coins.forEach((c) => {
      const res = checkTwoTfZoneConfluence(c);
      if (res.hasConfluence) {
        all++;
        if (res.type.startsWith('R')) allR++;
        if (res.type.startsWith('S')) allS++;
        if (res.type === 'R1_TO_R2') r1r2++;
        if (res.type === 'R2_TO_R3') r2r3++;
        if (res.type === 'R3_TO_R4') r3r4++;
        if (res.type === 'S1_TO_S2') s1s2++;
        if (res.type === 'S2_TO_S3') s2s3++;
        if (res.type === 'S3_TO_S4') s3s4++;
      }
    });
    return { all, allR, allS, r1r2, r2r3, r3r4, s1s2, s2s3, s3s4 };
  }, [coins]);

  const breakoutCounts: BreakoutCounts = useMemo(() => {
    let all = 0;
    let bullish = 0;
    let bearish = 0;
    coins.forEach((c) => {
      const bo = checkBreakoutConfluence(c);
      if (bo.hasConfluence) {
        all++;
        if (bo.type === 'BULLISH') bullish++;
        if (bo.type === 'BEARISH') bearish++;
      }
    });
    return { all, bullish, bearish };
  }, [coins]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.searchQuery) count++;
    if (filters.topMoverCategory !== 'ALL') count++;
    if (filters.enablePercentFilter) count++;
    if (filters.pivotCondition !== 'ALL') count++;
    if (filters.onlyConfluence) count++;
    if (filters.twoTfZoneFilter && filters.twoTfZoneFilter !== 'OFF') count++;
    if (filters.breakoutFilter && filters.breakoutFilter !== 'OFF') count++;
    return count;
  }, [filters]);

  return (
    <div className="h-screen bg-[#0b0e11] text-[#eaecef] flex flex-col font-sans overflow-hidden">
      {/* App Header */}
      <Header
        totalCoins={coins.length}
        isConnected={isConnected}
        onRefresh={refreshData}
        lastUpdated={lastMessageTime}
        soundEnabled={alertSettings.soundEnabled}
        onToggleSound={handleToggleSound}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Workspace: Collapsible Sidebar (Left) + Table Workspace (Right) */}
      <div className="flex-1 flex overflow-hidden relative">
        <FilterSidebar
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={handleResetFilters}
          resultCount={filteredCoins.length}
          conditionCounts={conditionCounts}
          confluenceCount={confluenceCount}
          twoTfCounts={twoTfCounts}
          breakoutCounts={breakoutCounts}
          soundEnabled={alertSettings.soundEnabled}
          onToggleSound={handleToggleSound}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        <main className="flex-1 min-w-0 flex flex-col h-full overflow-hidden p-1.5 sm:p-2">
          {coins.length === 0 && (
            <div className="bg-[#181a20] border border-[#2b313a] rounded-xs p-4 text-center flex flex-col items-center justify-center gap-2 mb-2 shrink-0">
              <Loader2 className="w-5 h-5 text-[#f0b90b] animate-spin" />
              <div>
                <h3 className="text-xs font-bold text-[#eaecef]">
                  Menghubungkan ke Binance Live & Sinkronisasi Pivots...
                </h3>
                <p className="text-[11px] text-[#848e9c] mt-0.5 max-w-lg mx-auto">
                  Mengambil snapshot harga real-time dan Daily, 1H, 5M Pivots (S4 ➔ R4) untuk seluruh koin USDT.
                </p>
              </div>
            </div>
          )}

          <ScreenerTable
            coins={filteredCoins}
            selectedTimeframe={filters.selectedTimeframe}
            topMoverCategory={filters.topMoverCategory}
            onSelectCoin={(coin) => setSelectedCoin(coin)}
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            activeFilterCount={activeFilterCount}
            filters={filters}
            onFilterChange={handleFilterChange}
            onResetFilters={handleResetFilters}
            confluenceCount={confluenceCount}
            twoTfCounts={twoTfCounts}
            breakoutCounts={breakoutCounts}
          />
        </main>
      </div>

      {/* Coin Detail Modal */}
      <CoinDetailModal
        coin={liveSelectedCoin}
        onClose={() => setSelectedCoin(null)}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={alertSettings}
        onSaveSettings={handleSaveAlertSettings}
      />

      {/* Floating Real-time Toast Notifications */}
      <ToastContainer
        toasts={toasts}
        onDismiss={handleDismissToast}
        onSelectCoin={handleSelectCoinFromToast}
      />
    </div>
  );
};

export default App;
