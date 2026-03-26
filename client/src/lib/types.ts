export interface Company {
  bse_code: string;
  name: string;
  industry?: string;
  bse_listing_date?: string;
  neeq_listing_date?: string;
  neeq_duration_years?: number;
  neeq_tier?: string;
  
  // IPO data
  issue_price?: number;
  total_shares?: number;
  listing_market_cap_yi?: number;
  issue_pe?: number;
  industry_pe?: number;
  pe_vs_industry_pct?: number;
  
  // Price data
  listing_close_price?: number;
  first_day_return_pct?: number;
  is_bust?: boolean;
  
  // 1-year data
  one_year_close_price?: number;
  one_year_market_cap_yi?: number;
  cap_change_pct?: number;
  
  // Financing
  last_round_date?: string;
  last_round_price?: number;
  last_round_valuation_wan?: number;
  second_last_round_date?: string;
  second_last_round_price?: number;
  second_last_round_valuation_wan?: number;
  no_financing?: boolean;
  ipo_vs_last_round_multiple?: number;
  yr1_vs_last_round_multiple?: number;
  days_from_last_financing_to_ipo?: number;
  
  // Company info
  sponsor?: string;
  accountant?: string;
  law_firm?: string;
  province?: string;
}

export interface Analytics {
  overview: {
    total_companies: number;
    ipo_cap: { mean: number; median: number; min: number; max: number; p25: number; p75: number; total: number; count: number };
    yr1_cap: { mean: number; median: number; total: number; count: number };
    cap_change: { mean: number; median: number; up_count: number; down_count: number; up_pct: number };
    first_day: { mean: number; median: number; bust_count: number; bust_pct: number };
    issue_pe: { mean: number; median: number; min: number; max: number };
    neeq_duration: { mean: number; median: number; count: number };
    financing: { has_last_round: number; has_second_round: number; no_financing: number };
  };
  yearly_stats: Array<{
    year: string; count: number; avg_ipo_cap: number; median_ipo_cap: number;
    total_ipo_cap: number; avg_cap_change: number; avg_first_day_return: number;
    avg_issue_pe: number; bust_count: number; bust_pct: number;
    up_count: number; down_count: number;
  }>;
  industry_stats: Array<{
    industry: string; count: number; avg_ipo_cap: number; median_ipo_cap: number;
    avg_cap_change: number; avg_first_day_return: number; avg_issue_pe: number; bust_pct: number;
  }>;
  neeq_duration_stats: Array<{
    group: string; count: number; avg_ipo_cap: number; avg_cap_change: number;
    avg_first_day_return: number; bust_pct: number;
  }>;
  financing_stats: {
    last_round_valuation: { mean_wan: number; median_wan: number; count: number };
    ipo_vs_last_multiple: { mean: number; median: number; min: number; max: number; count: number };
    yr1_vs_last_multiple: { mean: number; median: number; count: number };
    days_to_ipo: { mean: number; median: number; count: number };
  };
  cap_buckets: Record<string, number>;
  fd_return_buckets: Record<string, number>;
  pe_buckets: Record<string, number>;
  multiple_buckets: Record<string, number>;
  province_stats: Array<{ province: string; count: number; avg_ipo_cap: number; total_ipo_cap: number; avg_cap_change: number; avg_first_day_return?: number; bust_pct?: number }>;
  sponsor_stats: Array<{ sponsor: string; count: number; avg_ipo_cap: number; total_ipo_cap: number; avg_cap_change: number; avg_first_day_return: number; bust_pct: number }>;
  bust_by_year: Array<{ year: string; total: number; bust: number; bust_pct: number }>;
  fin_year_dist: Record<string, number>;
  neeq_year_dist: Record<string, number>;
  correlations: Record<string, { r: number; n: number }>;
  scatter: {
    neeq_vs_cap: Array<{ x: number; y: number; change: number; name: string; code: string }>;
    fin_vs_ipo: Array<{ x: number; y: number; multiple: number; name: string; code: string }>;
    pe_vs_fd: Array<{ x: number; y: number; name: string; code: string }>;
  };
  rankings: {
    top_ipo_cap: Array<{ name: string; code: string; cap: number; industry: string; year: string }>;
    top_gainers: Array<{ name: string; code: string; change: number; ipo_cap: number; yr1_cap: number; industry: string }>;
    top_losers: Array<{ name: string; code: string; change: number; ipo_cap: number; yr1_cap: number; industry: string }>;
    top_first_day: Array<{ name: string; code: string; return: number; issue_price: number; listing_close: number; year: string }>;
  };
  pe_discount: { mean: number; median: number; count: number; below_industry: number; above_industry: number };
  neeq_tier_stats: Array<{ tier: string; count: number; avg_ipo_cap: number; avg_cap_change: number }>;
  accountant_dist: Array<{ name: string; count: number }>;
  fd_by_year: Record<string, { mean: number; median: number; count: number; bust_pct: number }>;
}

export type SortField = keyof Company;
export type SortDir = "asc" | "desc";
