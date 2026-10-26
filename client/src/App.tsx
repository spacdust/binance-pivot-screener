import React, { useState, useMemo } from 'react';
import { useScreenerSocket } from './hooks/useScreenerSocket';
import { FilterState, CoinData } from './types';
import { Header } from './components/Header';
import { StatsOverview } from './components/StatsOverview';
import { FilterBar } from './components/FilterBar';
import { ScreenerTable } from './components/ScreenerTable';
import { CoinDetailModal } from './components/CoinDetailModal';
import { checkPivotConfluence } from './utils/pivotConfluence';
import { Loader2, AlertCircle } from 'lucide-react';

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
};

export const App: React.FC = () => {
  const { coins, stats, isConnected, isLoading, lastMessageTime, refreshData } = useScreenerSocket();
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [selectedCoin, setSelectedCoin] = useState<CoinData | null>(null);

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

      // 4. Daily Pivot Point condition filter
      if (filters.pivotCondition !== 'ALL') {
        if (coin.pivotStatus.condition !== filters.pivotCondition) {
          return false;
        }
      }

      // 5. Multi-Timeframe Confluence filter (Daily, 1H, 5M in same area)
      if (filters.onlyConfluence) {
        const conf = checkPivotConfluence(coin);
        if (!conf.hasConfluence) return false;
      }

      return true;
    });
  }, [coins, filters]);

  // Keep selectedCoin up-to-date with live websocket data
  const liveSelectedCoin = useMemo(() => {
    if (!selectedCoin) return null;
    return coins.find((c) => c.symbol === selectedCoin.symbol) || selectedCoin;
  }, [coins, selectedCoin]);

  // Live count per pivot condition for interactive filters
  const conditionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    coins.forEach((c) => {
      const cond = c.pivotStatus?.condition;
      if (cond) {
        counts[cond] = (counts[cond] || 0) + 1;
      }
    });
    return counts;
  }, [coins]);

  const confluenceCount = useMemo(() => {
    return coins.filter((c) => checkPivotConfluence(c).hasConfluence).length;
  }, [coins]);

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans">
      {/* App Header */}
      <Header
        totalCoins={coins.length}
        isConnected={isConnected}
        onRefresh={refreshData}
        lastUpdated={lastMessageTime}
      />

      {/* Main Content Area: Expanded full-width without excessive side margins */}
      <main className="flex-1 w-full px-2 sm:px-4 lg:px-6 py-4 space-y-4">
        {/* Loading Overlay / Banner */}
        {coins.length === 0 && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 text-center flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
            <div>
              <h3 className="text-base font-bold text-amber-300">
                Menghubungkan ke Binance & Sinkronisasi Daily Pivots...
              </h3>
              <p className="text-xs text-zinc-400 mt-1 max-w-lg mx-auto">
                Mengambil data candlestick multi-timeframe (1m - 24j) dan Daily Pivot untuk seluruh koin USDT aktif.
              </p>
              <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-900/80 border border-zinc-800 text-[11px] text-zinc-400">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  Tip: Jika koin tidak kunjung muncul, pastikan koneksi internet tidak memblokir Binance (bisa gunakan Cloudflare WARP / DNS 1.1.1.1).
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats & One-Click Filters */}
        <StatsOverview
          stats={stats}
          totalFiltered={filteredCoins.length}
          filters={filters}
          onFilterChange={handleFilterChange}
        />

        {/* Filter Controls Bar */}
        <FilterBar
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={handleResetFilters}
          resultCount={filteredCoins.length}
          conditionCounts={conditionCounts}
          confluenceCount={confluenceCount}
        />

        {/* Screener Data Table */}
        <ScreenerTable
          coins={filteredCoins}
          selectedTimeframe={filters.selectedTimeframe}
          topMoverCategory={filters.topMoverCategory}
          onSelectCoin={(coin) => setSelectedCoin(coin)}
        />
      </main>

      {/* Coin Detail Modal */}
      <CoinDetailModal
        coin={liveSelectedCoin}
        onClose={() => setSelectedCoin(null)}
      />

      {/* Footer */}
      <footer className="border-t border-zinc-800/80 bg-zinc-950/60 py-4 text-center text-xs text-zinc-500">
        <div className="w-full px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Binance Coin Screener &bull; Real-time WebSocket Data</span>
          <span className="font-mono text-[11px]">
            Formula: Classic Pivot &bull; Multi-Timeframe: 1m, 5m, 15m, 30m, 1h, 3h, 6h, 12h, 24h &bull; Pivots: 5M, 1H, Daily (S4-R4)
          </span>
        </div>
      </footer>
    </div>
  );
};
export default App;
