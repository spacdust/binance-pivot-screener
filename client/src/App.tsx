import React, { useState, useMemo } from 'react';
import { useScreenerSocket } from './hooks/useScreenerSocket';
import { FilterState, CoinData } from './types';
import { Header } from './components/Header';
import { FilterSidebar } from './components/FilterSidebar';
import { ScreenerTable } from './components/ScreenerTable';
import { CoinDetailModal } from './components/CoinDetailModal';
import { checkPivotConfluence, classifyPriceZone } from './utils/pivotConfluence';
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
};

export const App: React.FC = () => {
  const { coins, isConnected, lastMessageTime, refreshData } = useScreenerSocket();
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [selectedCoin, setSelectedCoin] = useState<CoinData | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

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

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.searchQuery) count++;
    if (filters.topMoverCategory !== 'ALL') count++;
    if (filters.enablePercentFilter) count++;
    if (filters.pivotCondition !== 'ALL') count++;
    if (filters.onlyConfluence) count++;
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
          />
        </main>
      </div>

      {/* Coin Detail Modal */}
      <CoinDetailModal
        coin={liveSelectedCoin}
        onClose={() => setSelectedCoin(null)}
      />
    </div>
  );
};

export default App;
