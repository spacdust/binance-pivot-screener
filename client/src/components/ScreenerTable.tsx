import React, { useState, useEffect, useRef } from 'react';
import { CoinData, SelectedTimeframe, TopMoverCategory } from '../types';
import { PivotVisualizer } from './PivotVisualizer';
import { ArrowUpDown, ArrowUp, ArrowDown, ExternalLink, Eye, Info } from 'lucide-react';

interface ScreenerTableProps {
  coins: CoinData[];
  selectedTimeframe: SelectedTimeframe;
  topMoverCategory?: TopMoverCategory;
  onSelectCoin: (coin: CoinData) => void;
}

type SortField = 'symbol' | 'price' | 'volume24h' | 'm1' | 'm5' | 'm15' | 'm30' | 'h1' | 'h3' | 'h6' | 'h12' | 'h24' | 'distP';

export const ScreenerTable: React.FC<ScreenerTableProps> = ({
  coins,
  selectedTimeframe,
  topMoverCategory,
  onSelectCoin,
}) => {
  const [sortField, setSortField] = useState<SortField>('volume24h');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const pageSize = 25;

  // Respond to Top Mover Category changes
  useEffect(() => {
    if (!topMoverCategory || topMoverCategory === 'ALL') return;
    if (topMoverCategory === 'TOP_GAINERS') {
      setSortField(selectedTimeframe);
      setSortDirection('desc');
    } else if (topMoverCategory === 'TOP_LOSERS') {
      setSortField(selectedTimeframe);
      setSortDirection('asc');
    } else if (topMoverCategory === 'FLASH_MOVERS') {
      setSortField('m5');
      setSortDirection('desc');
    } else if (topMoverCategory === 'TOP_VOLUME') {
      setSortField('volume24h');
      setSortDirection('desc');
    }
    setPage(1);
  }, [topMoverCategory, selectedTimeframe]);

  // Flash tracker for price changes
  const prevPricesRef = useRef<Map<string, number>>(new Map());
  const [priceFlashMap, setPriceFlashMap] = useState<Map<string, 'up' | 'down'>>(new Map());

  useEffect(() => {
    const flashes = new Map<string, 'up' | 'down'>();
    coins.forEach((c) => {
      const prev = prevPricesRef.current.get(c.symbol);
      if (prev !== undefined && prev !== c.price) {
        flashes.set(c.symbol, c.price > prev ? 'up' : 'down');
      }
      prevPricesRef.current.set(c.symbol, c.price);
    });

    if (flashes.size > 0) {
      setPriceFlashMap(flashes);
      const timer = setTimeout(() => setPriceFlashMap(new Map()), 1100);
      return () => clearTimeout(timer);
    }
  }, [coins]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Sorting logic
  const sortedCoins = [...coins].sort((a, b) => {
    let aVal: number | string = 0;
    let bVal: number | string = 0;

    switch (sortField) {
      case 'symbol':
        aVal = a.symbol;
        bVal = b.symbol;
        return sortDirection === 'asc' ? (aVal as string).localeCompare(bVal as string) : (bVal as string).localeCompare(aVal as string);
      case 'price':
        aVal = a.price;
        bVal = b.price;
        break;
      case 'volume24h':
        aVal = a.volume24h;
        bVal = b.volume24h;
        break;
      case 'm1':
        aVal = a.changes.m1;
        bVal = b.changes.m1;
        break;
      case 'm5':
        aVal = a.changes.m5;
        bVal = b.changes.m5;
        break;
      case 'm15':
        aVal = a.changes.m15;
        bVal = b.changes.m15;
        break;
      case 'm30':
        aVal = a.changes.m30;
        bVal = b.changes.m30;
        break;
      case 'h1':
        aVal = a.changes.h1;
        bVal = b.changes.h1;
        break;
      case 'h3':
        aVal = a.changes.h3;
        bVal = b.changes.h3;
        break;
      case 'h6':
        aVal = a.changes.h6;
        bVal = b.changes.h6;
        break;
      case 'h12':
        aVal = a.changes.h12;
        bVal = b.changes.h12;
        break;
      case 'h24':
        aVal = a.changes.h24;
        bVal = b.changes.h24;
        break;
      case 'distP':
        aVal = a.pivotStatus.distP;
        bVal = b.pivotStatus.distP;
        break;
    }

    return sortDirection === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
  });

  const totalPages = Math.ceil(sortedCoins.length / pageSize) || 1;
  const paginatedCoins = sortedCoins.slice((page - 1) * pageSize, page * pageSize);

  const formatPrice = (val: number) => {
    if (val >= 1000) return val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (val >= 1) return val.toFixed(4);
    if (val >= 0.0001) return val.toFixed(6);
    return val.toFixed(8);
  };

  const getConditionBadgeStyle = (tagColor: string) => {
    switch (tagColor) {
      case 'cyan':
        return 'bg-sky-500/15 text-sky-400 border-sky-500/30';
      case 'emerald':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'green':
        return 'bg-teal-500/15 text-teal-300 border-teal-500/30';
      case 'rose':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      case 'amber':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'fuchsia':
        return 'bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-500/30';
      case 'purple':
        return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
      case 'red':
        return 'bg-red-500/15 text-red-400 border-red-500/30';
      default:
        return 'bg-zinc-800 text-zinc-300 border-zinc-700';
    }
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-zinc-600 inline ml-1" />;
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-amber-400 inline ml-1" />
    ) : (
      <ArrowDown className="w-3 h-3 text-amber-400 inline ml-1" />
    );
  };

  const renderChangeCell = (val: number, tfKey: SelectedTimeframe) => {
    const isSelected = selectedTimeframe === tfKey;
    const isPos = val > 0;
    const isZero = val === 0;
    return (
      <span
        className={`inline-block px-1.5 py-0.5 rounded text-[11px] font-mono tabular-nums font-semibold transition-all duration-300 ${
          isSelected ? 'ring-1 ring-amber-400/80 font-bold bg-amber-500/15 text-amber-200' : ''
        } ${
          isZero
            ? 'text-zinc-500 bg-zinc-800/30'
            : isPos
            ? 'text-emerald-400 bg-emerald-500/10'
            : 'text-rose-400 bg-rose-500/10'
        }`}
      >
        {isPos ? '+' : ''}{val.toFixed(2)}%
      </span>
    );
  };

  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col">
      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-950/60 text-zinc-400 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-3.5 px-4 w-12 text-center">#</th>
              <th
                onClick={() => handleSort('symbol')}
                className="py-3.5 px-4 cursor-pointer hover:text-zinc-200 transition-colors"
              >
                Pasang / Volume {renderSortIcon('symbol')}
              </th>
              <th
                onClick={() => handleSort('price')}
                className="py-3.5 px-4 cursor-pointer hover:text-zinc-200 transition-colors"
              >
                Harga Terakhir {renderSortIcon('price')}
              </th>
              <th
                onClick={() => handleSort('m1')}
                className={`py-3.5 px-2 text-center cursor-pointer hover:text-zinc-200 transition-colors ${
                  selectedTimeframe === 'm1' ? 'text-amber-400 font-bold bg-amber-500/10' : ''
                }`}
              >
                1m {renderSortIcon('m1')}
              </th>
              <th
                onClick={() => handleSort('m5')}
                className={`py-3.5 px-2 text-center cursor-pointer hover:text-zinc-200 transition-colors ${
                  selectedTimeframe === 'm5' ? 'text-amber-400 font-bold bg-amber-500/10' : ''
                }`}
              >
                5m {renderSortIcon('m5')}
              </th>
              <th
                onClick={() => handleSort('m15')}
                className={`py-3.5 px-2 text-center cursor-pointer hover:text-zinc-200 transition-colors ${
                  selectedTimeframe === 'm15' ? 'text-amber-400 font-bold bg-amber-500/10' : ''
                }`}
              >
                15m {renderSortIcon('m15')}
              </th>
              <th
                onClick={() => handleSort('m30')}
                className={`py-3.5 px-2 text-center cursor-pointer hover:text-zinc-200 transition-colors ${
                  selectedTimeframe === 'm30' ? 'text-amber-400 font-bold bg-amber-500/10' : ''
                }`}
              >
                30m {renderSortIcon('m30')}
              </th>
              <th
                onClick={() => handleSort('h1')}
                className={`py-3.5 px-2 text-center cursor-pointer hover:text-zinc-200 transition-colors ${
                  selectedTimeframe === 'h1' ? 'text-amber-400 font-bold bg-amber-500/10' : ''
                }`}
              >
                1j {renderSortIcon('h1')}
              </th>
              <th
                onClick={() => handleSort('h3')}
                className={`py-3.5 px-2 text-center cursor-pointer hover:text-zinc-200 transition-colors ${
                  selectedTimeframe === 'h3' ? 'text-amber-400 font-bold bg-amber-500/10' : ''
                }`}
              >
                3j {renderSortIcon('h3')}
              </th>
              <th
                onClick={() => handleSort('h6')}
                className={`py-3.5 px-2 text-center cursor-pointer hover:text-zinc-200 transition-colors ${
                  selectedTimeframe === 'h6' ? 'text-amber-400 font-bold bg-amber-500/10' : ''
                }`}
              >
                6j {renderSortIcon('h6')}
              </th>
              <th
                onClick={() => handleSort('h12')}
                className={`py-3.5 px-2 text-center cursor-pointer hover:text-zinc-200 transition-colors ${
                  selectedTimeframe === 'h12' ? 'text-amber-400 font-bold bg-amber-500/10' : ''
                }`}
              >
                12j {renderSortIcon('h12')}
              </th>
              <th
                onClick={() => handleSort('h24')}
                className={`py-3.5 px-2 text-center cursor-pointer hover:text-zinc-200 transition-colors ${
                  selectedTimeframe === 'h24' ? 'text-amber-400 font-bold bg-amber-500/10' : ''
                }`}
              >
                24j {renderSortIcon('h24')}
              </th>
              <th className="py-3.5 px-4 min-w-[160px]">
                Posisi Pivot (S3 ➔ R3)
              </th>
              <th
                onClick={() => handleSort('distP')}
                className="py-3.5 px-4 cursor-pointer hover:text-zinc-200 transition-colors"
              >
                Kondisi Pivot Daily {renderSortIcon('distP')}
              </th>
              <th className="py-3.5 px-4 text-center w-20">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {paginatedCoins.length === 0 ? (
              <tr>
                <td colSpan={15} className="py-12 text-center text-zinc-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Info className="w-8 h-8 text-zinc-600" />
                    <p className="text-sm font-medium">Tidak ada koin yang sesuai kriteria filter.</p>
                    <p className="text-xs text-zinc-600">Coba ubah threshold persentase atau reset kondisi pivot.</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedCoins.map((coin, idx) => {
                const rank = (page - 1) * pageSize + idx + 1;
                const flash = priceFlashMap.get(coin.symbol);
                return (
                  <tr
                    key={coin.symbol}
                    onClick={() => onSelectCoin(coin)}
                    className="hover:bg-zinc-800/40 cursor-pointer transition-colors group"
                  >
                    <td className="py-3 px-3 text-center text-zinc-500 font-mono tabular-nums text-[11px]">
                      {rank}
                    </td>

                    {/* Symbol & Volume */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-zinc-100 text-sm group-hover:text-amber-400 transition-colors">
                          {coin.baseAsset}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono">/USDT</span>
                      </div>
                      <div className="text-[11px] text-zinc-500 font-mono tabular-nums">
                        ${(coin.volume24h / 1e6).toFixed(2)}M
                      </div>
                    </td>

                    {/* Live Price with Super Smooth Flash Animation */}
                    <td className="py-3 px-3">
                      <div
                        className={`font-mono tabular-nums text-xs sm:text-sm font-semibold transition-all inline-block px-2 py-0.5 rounded ${
                          flash === 'up'
                            ? 'tick-flash-up border border-emerald-500/30'
                            : flash === 'down'
                            ? 'tick-flash-down border border-rose-500/30'
                            : 'text-zinc-100 border border-transparent'
                        }`}
                      >
                        ${formatPrice(coin.price)}
                      </div>
                    </td>

                    {/* Changes columns (1m to 24h) */}
                    <td className="py-3 px-1 text-center">{renderChangeCell(coin.changes.m1, 'm1')}</td>
                    <td className="py-3 px-1 text-center">{renderChangeCell(coin.changes.m5, 'm5')}</td>
                    <td className="py-3 px-1 text-center">{renderChangeCell(coin.changes.m15, 'm15')}</td>
                    <td className="py-3 px-1 text-center">{renderChangeCell(coin.changes.m30, 'm30')}</td>
                    <td className="py-3 px-1 text-center">{renderChangeCell(coin.changes.h1, 'h1')}</td>
                    <td className="py-3 px-1 text-center">{renderChangeCell(coin.changes.h3, 'h3')}</td>
                    <td className="py-3 px-1 text-center">{renderChangeCell(coin.changes.h6, 'h6')}</td>
                    <td className="py-3 px-1 text-center">{renderChangeCell(coin.changes.h12, 'h12')}</td>
                    <td className="py-3 px-1 text-center">{renderChangeCell(coin.changes.h24, 'h24')}</td>

                    {/* Pivot Visualizer */}
                    <td className="py-3 px-4">
                      <PivotVisualizer
                        pivots={coin.pivots}
                        currentPrice={coin.price}
                        rangePercent={coin.pivotStatus.rangePercent}
                      />
                    </td>

                    {/* Pivot Condition Badge */}
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-1">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${getConditionBadgeStyle(
                            coin.pivotStatus.tagColor
                          )}`}
                        >
                          {coin.pivotStatus.label}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono tabular-nums">
                          Dist P: {coin.pivotStatus.distP > 0 ? '+' : ''}{coin.pivotStatus.distP}%
                        </span>
                      </div>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onSelectCoin(coin)}
                        className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-100 transition-colors"
                        title="Lihat Detail Pivot"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {sortedCoins.length > 0 && (
        <div className="p-3.5 border-t border-zinc-800 bg-zinc-950/60 flex items-center justify-between text-xs text-zinc-400">
          <div>
            Menampilkan{' '}
            <span className="font-mono text-zinc-200">
              {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, sortedCoins.length)}
            </span>{' '}
            dari <span className="font-mono text-zinc-200">{sortedCoins.length}</span> koin
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-200 font-medium transition-colors"
            >
              Sebelumnya
            </button>
            <span className="font-mono text-zinc-300 px-1">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-200 font-medium transition-colors"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
