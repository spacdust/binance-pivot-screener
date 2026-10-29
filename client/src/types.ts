export interface Pivots {
  H: number;
  L: number;
  C: number;
  P: number;
  R1: number;
  S1: number;
  R2: number;
  S2: number;
  R3: number;
  S3: number;
  R4: number;
  S4: number;
}

export type PivotConditionType =
  | 'ALL'
  | 'AREA_P'
  | 'S1_TO_S2'
  | 'S2_TO_S3'
  | 'S3_TO_S4'
  | 'S1_TO_P'
  | 'R1_TO_R2'
  | 'R2_TO_R3'
  | 'R3_TO_R4'
  | 'R1_TO_P'
  | 'P_TO_R1'
  | 'P_TO_S1'
  | 'ABOVE_R2'
  | 'ABOVE_R3'
  | 'ABOVE_R4'
  | 'BELOW_S2'
  | 'BELOW_S3'
  | 'BELOW_S4';

export interface PivotStatus {
  condition: PivotConditionType;
  label: string;
  description: string;
  tagColor: 'blue' | 'cyan' | 'emerald' | 'amber' | 'rose' | 'red' | 'green' | 'fuchsia' | 'sky' | 'orange' | 'purple' | 'pink';
  distP: number;
  distR1: number;
  distS1: number;
  distR2: number;
  distS2: number;
  distR3: number;
  distS3: number;
  distR4?: number;
  distS4?: number;
  rangePercent: number;
}

export interface TimeframeChanges {
  m1: number;
  m5: number;
  m10?: number;
  m15: number;
  m20?: number;
  m25?: number;
  m30: number;
  m35?: number;
  m40?: number;
  m45?: number;
  m50?: number;
  m55?: number;
  h1: number;
  h3: number;
  h6: number;
  h12: number;
  h24: number;
}

export interface CoinData {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  marketType?: string;
  contractType?: string;
  logoUrl?: string | null;
  price: number;
  volume24h: number;
  pivots: Pivots; // Daily (1D) Pivot
  pivotsWeekly?: Pivots | null; // Weekly (1W) Pivot - Aligns with TV 1H chart
  pivotsMonthly?: Pivots | null; // Monthly (1M) Pivot - Aligns with TV Daily chart
  pivots1h?: Pivots | null; // Hourly Candle Pivot
  pivots5m?: Pivots | null; // 5M Candle Pivot
  baselines: {
    open1m: number | null;
    open5m: number | null;
    open10m?: number | null;
    open15m: number | null;
    open20m?: number | null;
    open25m?: number | null;
    open30m: number | null;
    open35m?: number | null;
    open40m?: number | null;
    open45m?: number | null;
    open50m?: number | null;
    open55m?: number | null;
    open1h: number | null;
    open3h: number | null;
    open6h: number | null;
    open12h: number | null;
    open24h: number | null;
  };
  pivotStatus: PivotStatus;
  pivotStatusWeekly?: PivotStatus | null;
  pivotStatusMonthly?: PivotStatus | null;
  pivotStatus1h?: PivotStatus | null;
  pivotStatus5m?: PivotStatus | null;
  changes: TimeframeChanges;
  lastUpdated: number;
}

export interface ScreenerStats {
  total: number;
  under5pct24h: number;
  under2pct24h: number;
  areaP: number;
  r1ToR2: number;
  r2ToR3?: number;
  r3ToR4?: number;
  r1ToP: number;
  s1ToS2: number;
  s2ToS3?: number;
  s3ToS4?: number;
  s1ToP: number;
  aboveR2: number;
  aboveR3?: number;
  aboveR4?: number;
  belowS2: number;
  belowS3?: number;
  belowS4?: number;
  confluence3tf?: number;
}

export type SelectedTimeframe =
  | 'h24'
  | 'h12'
  | 'h6'
  | 'h3'
  | 'h1'
  | 'm55'
  | 'm50'
  | 'm45'
  | 'm40'
  | 'm35'
  | 'm30'
  | 'm25'
  | 'm20'
  | 'm15'
  | 'm10'
  | 'm5'
  | 'm1';

export type TopMoverCategory =
  | 'ALL'
  | 'TOP_GAINERS'
  | 'TOP_LOSERS'
  | 'FLASH_MOVERS'
  | 'TOP_VOLUME';

export type TwoTfZoneFilterType =
  | 'OFF'
  | 'ALL'
  | 'ALL_R'
  | 'ALL_S'
  | 'R1_R2'
  | 'R2_R3'
  | 'R3_R4'
  | 'S1_S2'
  | 'S2_S3'
  | 'S3_S4';

export interface TwoTfCounts {
  all: number;
  allR: number;
  allS: number;
  r1r2: number;
  r2r3: number;
  r3r4: number;
  s1s2: number;
  s2s3: number;
  s3s4: number;
}

export type BreakoutConfluenceFilterType = 'OFF' | 'ALL' | 'BULLISH' | 'BEARISH';

export interface BreakoutCounts {
  all: number;
  bullish: number;
  bearish: number;
}

export interface FilterState {
  searchQuery: string;
  selectedTimeframe: SelectedTimeframe;
  topMoverCategory: TopMoverCategory;
  maxPercent: number; // e.g. 5 for < 5%
  enablePercentFilter: boolean;
  filterMode: 'below' | 'above' | 'absolute_below'; // absolute_below means |change| < 5%
  pivotCondition: PivotConditionType;
  minVolume: number; // in USDT, e.g. 1000000
  onlyConfluence?: boolean; // Filter only coins with 3TF Confluence (Daily, 1H, 5M in same area)
  twoTfZoneFilter?: TwoTfZoneFilterType; // Filter 2TF Confluence (M5 & H1 between R or S zones)
  breakoutFilter?: BreakoutConfluenceFilterType; // Filter Cross-TF Breakout (M5 > R1 & 1H > P or reverse)
}

export type SoundType =
  | 'breakout'
  | 'alarm_urgent'
  | 'jackpot'
  | 'laser_radar'
  | 'glass_chime'
  | 'victory'
  | 'chime'
  | 'radar'
  | 'ping'
  | 'bell';

export interface ConfluenceAlertSettings {
  soundEnabled: boolean; // Suara on/off saat koin baru masuk 2TF confluence
  soundType: SoundType; // Jenis suara
  volume: number; // 0.1 to 1.0 (default 0.85)
  toastEnabled: boolean; // Popup alert visual di layar
  desktopNotification: boolean; // Notifikasi desktop browser
  alertBullish: boolean; // Bunyi untuk zona Bullish (R1-R2, R2-R3, R3-R4)
  alertBearish: boolean; // Bunyi untuk zona Bearish (S1-S2, S2-S3, S3-S4)
  alertBreakoutBullish: boolean; // Bunyi untuk Breakout Bullish (M5 > R1 & 1H > P)
  alertBreakoutBearish: boolean; // Bunyi untuk Breakdown Bearish (M5 < S1 & 1H < P)
  cooldownSeconds: number; // Cooldown per koin agar tidak spam (default 60s)
}

export const DEFAULT_ALERT_SETTINGS: ConfluenceAlertSettings = {
  soundEnabled: true,
  soundType: 'breakout',
  volume: 0.85,
  toastEnabled: true,
  desktopNotification: false,
  alertBullish: true,
  alertBearish: true,
  alertBreakoutBullish: true,
  alertBreakoutBearish: true,
  cooldownSeconds: 60,
};

export interface ToastAlert {
  id: string;
  symbol: string;
  baseAsset: string;
  logoUrl?: string | null;
  type: string;
  badgeText: string;
  badgeStyle: string;
  price: number;
  timestamp: number;
}
