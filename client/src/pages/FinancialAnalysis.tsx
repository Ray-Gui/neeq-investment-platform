import React, { useState, useMemo } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, ReferenceLine,
} from "recharts";
import { Search, TrendingUp, TrendingDown, BarChart3, Activity, Shield, Target, Info } from "lucide-react";

// ── 读取北交所公司数据（298家）──
import dataV4 from "../../public/data_v4_fixed.json";
// ── 读取新三板公司数据（1887家）──
import neeqData from "../../public/neeq-companies.json";

// ── 统一数据格式 ─────────────────────────────────────────────────
interface CompanyRecord {
  code: string;
  name: string;
  industry: string;
  financial_data: FinancialRow[];
  source: "bse" | "neeq"; // 北交所 or 新三板
}

interface FinancialRow {
  fiscal_year: number;
  revenue?: number | null;
  net_profit?: number | null;
  gross_margin?: number | null;
  net_margin?: number | null;
  roe?: number | null;
  debt_ratio?: number | null;
  current_ratio?: number | null;
  quick_ratio?: number | null;
  revenue_growth?: number | null;
  net_profit_growth?: number | null;
  eps?: number | null;
  bvps?: number | null;
  inventory_turnover?: number | null;
  ar_days?: number | null;
}

// 构建统一公司列表
const allCompanies: CompanyRecord[] = [
  ...(dataV4 as any[]).map((c) => ({
    code: c.bse_code,
    name: c.name,
    industry: c.industry ?? "其他",
    financial_data: (c.financial_data ?? []) as FinancialRow[],
    source: "bse" as const,
  })),
  ...(neeqData as any[]).map((c) => ({
    code: c.code,
    name: c.name ?? c.short_name,
    industry: c.industry ?? "其他",
    financial_data: (c.financial_data ?? []) as FinancialRow[],
    source: "neeq" as const,
  })),
];

// ── 工具函数 ────────────────────────────────────────────────────
const fmt = (v: number | null | undefined, suffix = "", digits = 2): string => {
  if (v == null || isNaN(Number(v))) return "/";
  return Number(v).toFixed(digits) + suffix;
};

const fmtRevenue = (v: number | null | undefined): string => {
  if (v == null) return "/";
  if (v >= 10000) return (v / 10000).toFixed(2) + " 亿";
  if (v >= 1) return v.toFixed(0) + " 万";
  return v.toFixed(2) + " 万";
};

const pctColor = (v: number | null | undefined): string => {
  if (v == null) return "text-slate-400";
  return v >= 0 ? "text-green-400" : "text-red-400";
};

const trendIcon = (v: number | null | undefined) => {
  if (v == null) return null;
  return v >= 0
    ? <TrendingUp className="w-3 h-3 text-green-400 inline" />
    : <TrendingDown className="w-3 h-3 text-red-400 inline" />;
};

// ── 行业均值计算 ─────────────────────────────────────────────────
function calcIndustryAvg(companies: CompanyRecord[], year: number) {
  const metrics = ["gross_margin", "net_margin", "roe", "debt_ratio", "current_ratio", "revenue_growth", "net_profit_growth"];
  const result: Record<string, number | null> = {};
  for (const m of metrics) {
    const vals = companies
      .map((c) => {
        const row = c.financial_data.find((r) => r.fiscal_year === year);
        return (row as any)?.[m] ?? null;
      })
      .filter((v) => v != null && !isNaN(v) && Math.abs(v) < 500) as number[];
    result[m] = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  }
  return result;
}

// ── 三年趋势摘要计算 ─────────────────────────────────────────────
function calcThreeYearSummary(finData: FinancialRow[]) {
  const sorted = [...finData].sort((a, b) => (b.fiscal_year ?? 0) - (a.fiscal_year ?? 0));
  const recent3 = sorted.slice(0, 3);
  if (recent3.length === 0) return null;

  const latest = recent3[0];
  const oldest = recent3[recent3.length - 1];

  // 营收复合增长率（CAGR）
  let revCagr: number | null = null;
  if (recent3.length >= 2 && latest.revenue && oldest.revenue && oldest.revenue > 0) {
    const years = (latest.fiscal_year ?? 0) - (oldest.fiscal_year ?? 0);
    if (years > 0) {
      revCagr = (Math.pow(latest.revenue / oldest.revenue, 1 / years) - 1) * 100;
    }
  }

  // 平均ROE
  const roeVals = recent3.map(r => r.roe).filter(v => v != null && Math.abs(v!) < 500) as number[];
  const avgRoe = roeVals.length > 0 ? roeVals.reduce((a, b) => a + b, 0) / roeVals.length : null;

  // 平均毛利率
  const gmVals = recent3.map(r => r.gross_margin).filter(v => v != null && Math.abs(v!) < 200) as number[];
  const avgGm = gmVals.length > 0 ? gmVals.reduce((a, b) => a + b, 0) / gmVals.length : null;

  // 盈利趋势（最近3年净利润是否持续增长）
  let profitTrend: "improving" | "declining" | "stable" | null = null;
  if (recent3.length >= 2) {
    const profits = recent3.map(r => r.net_profit).filter(v => v != null) as number[];
    if (profits.length >= 2) {
      const first = profits[profits.length - 1];
      const last = profits[0];
      if (last > first * 1.1) profitTrend = "improving";
      else if (last < first * 0.9) profitTrend = "declining";
      else profitTrend = "stable";
    }
  }

  return { revCagr, avgRoe, avgGm, profitTrend, yearsCount: recent3.length };
}

// ── 组件：指标卡片 ───────────────────────────────────────────────
function MetricCard({
  label, value, sub, color = "text-white", hint,
}: {
  label: string; value: string; sub?: string; color?: string; hint?: string;
}) {
  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-4">
      <div className="text-xs text-slate-400 mb-1">{label}</div>
      <div className={`text-xl font-bold ${color}`}>{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
      {hint && <div className="text-xs text-cyan-500/70 mt-1 italic">{hint}</div>}
    </div>
  );
}

// ── 组件：三年趋势摘要卡片 ──────────────────────────────────────
function ThreeYearSummaryCard({ finData }: { finData: FinancialRow[] }) {
  const summary = calcThreeYearSummary(finData);
  if (!summary) return null;

  const sorted = [...finData].sort((a, b) => (b.fiscal_year ?? 0) - (a.fiscal_year ?? 0));
  const years = sorted.slice(0, 3).map(r => r.fiscal_year).filter(Boolean).reverse();

  return (
    <div className="bg-gradient-to-r from-slate-800/80 to-slate-800/40 border border-cyan-500/30 rounded-xl p-5 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-cyan-400" />
        <h3 className="text-base font-semibold text-white">近三年财务趋势摘要</h3>
        <span className="text-xs text-slate-500">({years.join("、")} 年)</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-xs text-slate-400 mb-1">营收复合增长率 (CAGR)</div>
          <div className={`text-2xl font-bold ${summary.revCagr != null ? (summary.revCagr >= 0 ? "text-green-400" : "text-red-400") : "text-slate-400"}`}>
            {summary.revCagr != null ? `${summary.revCagr >= 0 ? "+" : ""}${summary.revCagr.toFixed(1)}%` : "/"}
          </div>
          <div className="text-xs text-slate-500 mt-1">年均复合增长</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-slate-400 mb-1">平均 ROE</div>
          <div className={`text-2xl font-bold ${summary.avgRoe != null ? (summary.avgRoe >= 15 ? "text-green-400" : summary.avgRoe >= 8 ? "text-yellow-400" : "text-red-400") : "text-slate-400"}`}>
            {summary.avgRoe != null ? `${summary.avgRoe.toFixed(1)}%` : "/"}
          </div>
          <div className="text-xs text-slate-500 mt-1">≥15% 为优质</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-slate-400 mb-1">平均毛利率</div>
          <div className={`text-2xl font-bold ${summary.avgGm != null ? (summary.avgGm >= 40 ? "text-green-400" : summary.avgGm >= 20 ? "text-yellow-400" : "text-orange-400") : "text-slate-400"}`}>
            {summary.avgGm != null ? `${summary.avgGm.toFixed(1)}%` : "/"}
          </div>
          <div className="text-xs text-slate-500 mt-1">≥40% 为高毛利</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-slate-400 mb-1">盈利趋势</div>
          <div className={`text-xl font-bold ${
            summary.profitTrend === "improving" ? "text-green-400" :
            summary.profitTrend === "declining" ? "text-red-400" :
            summary.profitTrend === "stable" ? "text-yellow-400" : "text-slate-400"
          }`}>
            {summary.profitTrend === "improving" ? "📈 持续改善" :
             summary.profitTrend === "declining" ? "📉 持续下滑" :
             summary.profitTrend === "stable" ? "➡️ 基本稳定" : "/"}
          </div>
          <div className="text-xs text-slate-500 mt-1">近{summary.yearsCount}年净利润变化</div>
        </div>
      </div>
    </div>
  );
}

// ── 组件：财务指标表格 ───────────────────────────────────────────
function FinancialTable({ data }: { data: FinancialRow[] }) {
  if (!data || data.length === 0) {
    return <div className="text-slate-500 text-sm py-4 text-center">暂无财务数据</div>;
  }
  const sorted = [...data].sort((a, b) => (a.fiscal_year ?? 0) - (b.fiscal_year ?? 0));
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700">
            <th className="text-left text-slate-400 py-2 px-2">年份</th>
            <th className="text-right text-slate-400 py-2 px-2">营业收入</th>
            <th className="text-right text-slate-400 py-2 px-2">净利润</th>
            <th className="text-right text-slate-400 py-2 px-2">毛利率</th>
            <th className="text-right text-slate-400 py-2 px-2">净利率</th>
            <th className="text-right text-slate-400 py-2 px-2">ROE</th>
            <th className="text-right text-slate-400 py-2 px-2">资产负债率</th>
            <th className="text-right text-slate-400 py-2 px-2">流动比率</th>
            <th className="text-right text-slate-400 py-2 px-2">营收增速</th>
            <th className="text-right text-slate-400 py-2 px-2">利润增速</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => (
            <tr key={i} className="border-b border-slate-800 hover:bg-slate-800/30">
              <td className="text-white py-2 px-2 font-medium">{row.fiscal_year ?? "/"}</td>
              <td className="text-right text-cyan-400 py-2 px-2">{fmtRevenue(row.revenue)}</td>
              <td className={`text-right py-2 px-2 ${(row.net_profit ?? 0) >= 0 ? "text-green-400" : "text-red-400"}`}>
                {fmtRevenue(row.net_profit)}
              </td>
              <td className="text-right text-yellow-400 py-2 px-2">{fmt(row.gross_margin, "%", 1)}</td>
              <td className="text-right text-purple-400 py-2 px-2">{fmt(row.net_margin, "%", 1)}</td>
              <td className="text-right text-blue-400 py-2 px-2">{fmt(row.roe, "%", 1)}</td>
              <td className="text-right text-orange-400 py-2 px-2">{fmt(row.debt_ratio, "%", 1)}</td>
              <td className="text-right text-slate-300 py-2 px-2">{fmt(row.current_ratio, "x", 2)}</td>
              <td className={`text-right py-2 px-2 ${pctColor(row.revenue_growth)}`}>
                {row.revenue_growth != null ? (
                  <span>{trendIcon(row.revenue_growth)} {fmt(row.revenue_growth, "%", 1)}</span>
                ) : "/"}
              </td>
              <td className={`text-right py-2 px-2 ${pctColor(row.net_profit_growth)}`}>
                {row.net_profit_growth != null ? (
                  <span>{trendIcon(row.net_profit_growth)} {fmt(row.net_profit_growth, "%", 1)}</span>
                ) : "/"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── 主页面 ───────────────────────────────────────────────────────
export default function FinancialAnalysis() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "trend" | "compare" | "radar">("overview");
  const [selectedYear, setSelectedYear] = useState(2024);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return allCompanies
      .filter(
        (c) =>
          c.name?.toLowerCase().includes(q) ||
          c.code?.includes(q) ||
          c.industry?.toLowerCase().includes(q)
      )
      .slice(0, 12);
  }, [searchQuery]);

  const selectedCompanies = useMemo(
    () => allCompanies.filter((c) => selectedCodes.includes(c.code)),
    [selectedCodes]
  );

  const primaryCompany = selectedCompanies[0] ?? null;
  const primaryFinData: FinancialRow[] = primaryCompany?.financial_data ?? [];

  const industryPeers = useMemo(() => {
    if (!primaryCompany) return [];
    return allCompanies.filter(
      (c) => c.industry === primaryCompany.industry && c.code !== primaryCompany.code
    );
  }, [primaryCompany]);

  const industryAvg = useMemo(
    () => calcIndustryAvg([primaryCompany, ...industryPeers].filter(Boolean) as CompanyRecord[], selectedYear),
    [primaryCompany, industryPeers, selectedYear]
  );

  const latestData = useMemo(() => {
    if (!primaryFinData.length) return null;
    return [...primaryFinData].sort((a, b) => (b.fiscal_year ?? 0) - (a.fiscal_year ?? 0))[0];
  }, [primaryFinData]);

  // 近三年数据（用于趋势图）
  const recentThreeYears = useMemo(() => {
    if (!primaryFinData.length) return [];
    return [...primaryFinData]
      .sort((a, b) => (b.fiscal_year ?? 0) - (a.fiscal_year ?? 0))
      .slice(0, 3)
      .reverse();
  }, [primaryFinData]);

  const trendData = useMemo(() => {
    if (!primaryFinData.length) return [];
    return [...primaryFinData]
      .sort((a, b) => (a.fiscal_year ?? 0) - (b.fiscal_year ?? 0))
      .map((d) => ({
        year: d.fiscal_year,
        营收: d.revenue != null ? +(d.revenue / 10000).toFixed(3) : null,
        净利润: d.net_profit != null ? +(d.net_profit / 10000).toFixed(3) : null,
        毛利率: d.gross_margin != null && Math.abs(d.gross_margin) < 200 ? +d.gross_margin.toFixed(2) : null,
        净利率: d.net_margin != null && Math.abs(d.net_margin) < 500 ? +d.net_margin.toFixed(2) : null,
        ROE: d.roe != null && Math.abs(d.roe) < 500 ? +d.roe.toFixed(2) : null,
        资产负债率: d.debt_ratio != null ? +d.debt_ratio.toFixed(2) : null,
      }));
  }, [primaryFinData]);

  // 近三年趋势数据
  const trendData3Y = useMemo(() => {
    return recentThreeYears.map((d) => ({
      year: d.fiscal_year,
      营收: d.revenue != null ? +(d.revenue / 10000).toFixed(3) : null,
      净利润: d.net_profit != null ? +(d.net_profit / 10000).toFixed(3) : null,
      毛利率: d.gross_margin != null && Math.abs(d.gross_margin) < 200 ? +d.gross_margin.toFixed(2) : null,
      净利率: d.net_margin != null && Math.abs(d.net_margin) < 500 ? +d.net_margin.toFixed(2) : null,
      ROE: d.roe != null && Math.abs(d.roe) < 500 ? +d.roe.toFixed(2) : null,
      资产负债率: d.debt_ratio != null ? +d.debt_ratio.toFixed(2) : null,
      营收增速: d.revenue_growth != null ? +d.revenue_growth.toFixed(2) : null,
      净利增速: d.net_profit_growth != null && Math.abs(d.net_profit_growth) < 500 ? +d.net_profit_growth.toFixed(2) : null,
    }));
  }, [recentThreeYears]);

  const compareData = useMemo(() => {
    if (selectedCompanies.length < 2) return [];
    const metrics = [
      { key: "gross_margin", label: "毛利率(%)" },
      { key: "net_margin", label: "净利率(%)" },
      { key: "roe", label: "ROE(%)" },
      { key: "debt_ratio", label: "负债率(%)" },
    ];
    return metrics.map(({ key, label }) => {
      const row: Record<string, any> = { metric: label };
      for (const c of selectedCompanies) {
        const yr = c.financial_data.find((r) => r.fiscal_year === selectedYear);
        row[c.name ?? c.code] = (yr as any)?.[key] ?? null;
      }
      return row;
    });
  }, [selectedCompanies, selectedYear]);

  const radarData = useMemo(() => {
    if (!primaryCompany || !latestData) return [];
    const normalize = (v: number | null | undefined, min: number, max: number) => {
      if (v == null) return 0;
      return Math.max(0, Math.min(100, ((v - min) / (max - min)) * 100));
    };
    return [
      { metric: "盈利能力", 公司: normalize(latestData.roe, 0, 30), 行业均值: normalize(industryAvg.roe, 0, 30) },
      { metric: "毛利水平", 公司: normalize(latestData.gross_margin, 0, 80), 行业均值: normalize(industryAvg.gross_margin, 0, 80) },
      { metric: "净利水平", 公司: normalize(latestData.net_margin, 0, 40), 行业均值: normalize(industryAvg.net_margin, 0, 40) },
      { metric: "成长性", 公司: normalize(latestData.revenue_growth, -20, 50), 行业均值: normalize(industryAvg.revenue_growth, -20, 50) },
      { metric: "偿债能力", 公司: normalize(latestData.current_ratio, 0.5, 5), 行业均值: normalize(industryAvg.current_ratio, 0.5, 5) },
      { metric: "财务稳健", 公司: normalize(100 - (latestData.debt_ratio ?? 50), 0, 100), 行业均值: normalize(100 - (industryAvg.debt_ratio ?? 50), 0, 100) },
    ];
  }, [primaryCompany, latestData, industryAvg]);

  const COLORS = ["#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  const addCompany = (code: string) => {
    if (!selectedCodes.includes(code)) {
      setSelectedCodes((prev) => [...prev.slice(0, 4), code]);
    }
    setSearchQuery("");
  };

  const removeCompany = (code: string) => {
    setSelectedCodes((prev) => prev.filter((c) => c !== code));
  };

  const availableYears = useMemo(() => {
    if (!primaryFinData.length) return [2020, 2021, 2022, 2023, 2024];
    return [...new Set(primaryFinData.map(r => r.fiscal_year).filter(Boolean))].sort() as number[];
  }, [primaryFinData]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="bg-slate-900/80 border-b border-slate-700 px-6 py-4">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-cyan-400" />
          财务分析
          <span className="text-sm font-normal text-slate-400 ml-2">
            北交所 298 家 + 新三板 1887 家 · 多年真实财报数据
          </span>
        </h1>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* 搜索区域 */}
        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-5 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-base font-semibold text-white">选择分析标的</h2>
            <span className="text-xs text-slate-500">支持北交所 + 新三板共 2185 家企业 · 最多同时选择 5 家对比</span>
          </div>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索公司名称、代码或行业..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 text-sm"
            />
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-20 bg-slate-800 border border-slate-600 rounded-lg mt-1 shadow-xl max-h-64 overflow-y-auto">
                {searchResults.map((c) => {
                  const latest = c.financial_data.length > 0
                    ? [...c.financial_data].sort((a, b) => (b.fiscal_year ?? 0) - (a.fiscal_year ?? 0))[0]
                    : null;
                  return (
                    <button
                      key={c.code}
                      onClick={() => addCompany(c.code)}
                      className="w-full text-left px-4 py-3 hover:bg-slate-700 border-b border-slate-700 last:border-0 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-white font-medium text-sm">{c.name}</span>
                          <span className="text-slate-400 text-xs ml-2">{c.code}</span>
                          <span className={`text-xs ml-2 px-1.5 py-0.5 rounded ${c.source === "bse" ? "bg-blue-500/20 text-blue-400" : "bg-cyan-500/20 text-cyan-400"}`}>
                            {c.source === "bse" ? "北交所" : "新三板"}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-cyan-400">{c.industry}</span>
                          {latest && (
                            <div className="text-xs text-slate-500">
                              {latest.fiscal_year}年 营收 {fmtRevenue(latest.revenue)}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          {selectedCodes.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {selectedCompanies.map((c, i) => (
                <div
                  key={c.code}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm"
                  style={{ borderColor: COLORS[i], backgroundColor: COLORS[i] + "20", color: COLORS[i] }}
                >
                  <span>{c.name}</span>
                  <span className="text-xs opacity-70">{c.code}</span>
                  <span className="text-xs opacity-50">{c.source === "bse" ? "北交所" : "新三板"}</span>
                  <button onClick={() => removeCompany(c.code)} className="ml-1 opacity-70 hover:opacity-100 text-lg leading-none">×</button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-slate-500 text-sm">请搜索并选择公司开始分析（支持北交所和新三板企业）</div>
          )}
        </div>

        {selectedCodes.length === 0 && (
          <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-12 text-center">
            <BarChart3 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg mb-2">选择公司开始财务分析</p>
            <p className="text-slate-500 text-sm">支持多公司横向对比 · 近三年财务趋势 · 行业均值对标 · 综合能力雷达图</p>
            <p className="text-slate-500 text-sm mt-1">覆盖北交所 298 家 + 新三板 1887 家，共 2185 家企业</p>
          </div>
        )}

        {primaryCompany && (
          <>
            {/* 近三年趋势摘要卡片 */}
            <ThreeYearSummaryCard finData={primaryFinData} />

            <div className="flex items-center gap-2 mb-4">
              <span className="text-slate-400 text-sm">基准年份：</span>
              {availableYears.map((y) => (
                <button
                  key={y}
                  onClick={() => setSelectedYear(y)}
                  className={`px-3 py-1 rounded text-sm transition-colors ${selectedYear === y ? "bg-cyan-600 text-white" : "bg-slate-700 text-slate-400 hover:text-white"}`}
                >
                  {y}
                </button>
              ))}
            </div>

            <div className="flex gap-1 mb-6 bg-slate-800/60 border border-slate-700 rounded-lg p-1 w-fit">
              {[
                { key: "overview", label: "核心指标", icon: <Target className="w-4 h-4" /> },
                { key: "trend", label: "趋势分析", icon: <TrendingUp className="w-4 h-4" /> },
                { key: "compare", label: "横向对比", icon: <BarChart3 className="w-4 h-4" /> },
                { key: "radar", label: "能力雷达", icon: <Activity className="w-4 h-4" /> },
              ].map(({ key, label, icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as any)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded text-sm transition-colors ${activeTab === key ? "bg-cyan-600 text-white" : "text-slate-400 hover:text-white"}`}
                >
                  {icon} {label}
                </button>
              ))}
            </div>

            {activeTab === "overview" && (
              <div>
                {latestData ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <MetricCard label={`营业收入（${latestData.fiscal_year}年）`} value={fmtRevenue(latestData.revenue)} sub={latestData.revenue_growth != null ? `同比 ${fmt(latestData.revenue_growth, "%", 1)}` : "同比 /"} color="text-cyan-400" />
                    <MetricCard label={`净利润（${latestData.fiscal_year}年）`} value={fmtRevenue(latestData.net_profit)} sub={latestData.net_profit_growth != null ? `同比 ${fmt(latestData.net_profit_growth, "%", 1)}` : "同比 /"} color={(latestData.net_profit ?? 0) >= 0 ? "text-green-400" : "text-red-400"} />
                    <MetricCard label="毛利率" value={fmt(latestData.gross_margin, "%", 1)} sub={industryAvg.gross_margin != null ? `行业均值 ${fmt(industryAvg.gross_margin, "%", 1)}` : "行业均值 /"} color="text-yellow-400" />
                    <MetricCard label="净利率" value={fmt(latestData.net_margin, "%", 1)} sub={industryAvg.net_margin != null ? `行业均值 ${fmt(industryAvg.net_margin, "%", 1)}` : "行业均值 /"} color="text-purple-400" />
                    <MetricCard label="ROE（净资产收益率）" value={fmt(latestData.roe, "%", 1)} sub={industryAvg.roe != null ? `行业均值 ${fmt(industryAvg.roe, "%", 1)}` : "行业均值 /"} color="text-blue-400" hint="ROE > 15% 为优质" />
                    <MetricCard label="资产负债率" value={fmt(latestData.debt_ratio, "%", 1)} sub={industryAvg.debt_ratio != null ? `行业均值 ${fmt(industryAvg.debt_ratio, "%", 1)}` : "行业均值 /"} color={(latestData.debt_ratio ?? 0) > 70 ? "text-red-400" : "text-orange-400"} hint="< 60% 为健康区间" />
                    <MetricCard label="流动比率" value={fmt(latestData.current_ratio, "x", 2)} sub={industryAvg.current_ratio != null ? `行业均值 ${fmt(industryAvg.current_ratio, "x", 2)}` : "行业均值 /"} color={(latestData.current_ratio ?? 0) >= 1.5 ? "text-green-400" : "text-yellow-400"} hint="> 1.5 为安全" />
                    <MetricCard label="每股收益（EPS）" value={latestData.eps != null ? `¥${fmt(latestData.eps, "", 2)}` : "/"} sub={`${latestData.fiscal_year ?? "/"} 年度`} color="text-slate-200" />
                  </div>
                ) : (
                  <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-8 text-center mb-6">
                    <p className="text-slate-400">该公司暂无财务数据</p>
                  </div>
                )}
                <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-5">
                  <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-cyan-400" />
                    历史财务数据明细（{availableYears[0]}–{availableYears[availableYears.length - 1]}）
                    <span className="text-xs text-slate-500 font-normal ml-2">来源：东方财富财务摘要</span>
                  </h3>
                  <FinancialTable data={primaryFinData} />
                </div>
              </div>
            )}

            {activeTab === "trend" && (
              <div className="space-y-6">
                {trendData.length === 0 ? (
                  <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-8 text-center">
                    <p className="text-slate-400">该公司暂无财务趋势数据</p>
                  </div>
                ) : (
                  <>
                    {/* 近三年趋势（重点展示） */}
                    {trendData3Y.length >= 2 && (
                      <div className="bg-slate-800/60 border border-cyan-500/20 rounded-xl p-5">
                        <div className="flex items-center gap-2 mb-4">
                          <h3 className="text-sm font-semibold text-white">近三年营收 & 净利润趋势（亿元）</h3>
                          <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded">重点</span>
                        </div>
                        <ResponsiveContainer width="100%" height={280}>
                          <BarChart data={trendData3Y} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="year" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                            <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
                            <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569", borderRadius: "8px" }} formatter={(v: any, name: string) => [v != null ? `${v} 亿` : "/", name]} />
                            <Legend />
                            <Bar dataKey="营收" fill="#06b6d4" radius={[3, 3, 0, 0]} />
                            <Bar dataKey="净利润" fill="#10b981" radius={[3, 3, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    {/* 近三年增速趋势 */}
                    {trendData3Y.length >= 2 && (
                      <div className="bg-slate-800/60 border border-cyan-500/20 rounded-xl p-5">
                        <div className="flex items-center gap-2 mb-4">
                          <h3 className="text-sm font-semibold text-white">近三年营收 & 净利润增速（%）</h3>
                          <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded">重点</span>
                        </div>
                        <ResponsiveContainer width="100%" height={240}>
                          <BarChart data={trendData3Y} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="year" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                            <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
                            <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569", borderRadius: "8px" }} formatter={(v: any, name: string) => [v != null ? `${v}%` : "/", name]} />
                            <Legend />
                            <ReferenceLine y={0} stroke="#64748b" />
                            <Bar dataKey="营收增速" fill="#06b6d4" radius={[3, 3, 0, 0]} />
                            <Bar dataKey="净利增速" fill="#10b981" radius={[3, 3, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    {/* 全历史趋势 */}
                    <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-5">
                      <h3 className="text-sm font-semibold text-white mb-4">全历史营收 & 净利润趋势（亿元）</h3>
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={trendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                          <XAxis dataKey="year" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                          <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
                          <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569", borderRadius: "8px" }} formatter={(v: any, name: string) => [v != null ? `${v} 亿` : "/", name]} />
                          <Legend />
                          <Bar dataKey="营收" fill="#06b6d4" radius={[3, 3, 0, 0]} />
                          <Bar dataKey="净利润" fill="#10b981" radius={[3, 3, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-5">
                      <h3 className="text-sm font-semibold text-white mb-4">盈利能力趋势（%）</h3>
                      <ResponsiveContainer width="100%" height={280}>
                        <LineChart data={trendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                          <XAxis dataKey="year" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                          <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} domain={['auto', 'auto']} />
                          <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569", borderRadius: "8px" }} formatter={(v: any, name: string) => [v != null ? `${v}%` : "/", name]} />
                          <Legend />
                          <ReferenceLine y={15} stroke="#10b981" strokeDasharray="4 4" label={{ value: "ROE 15%", fill: "#10b981", fontSize: 10 }} />
                          <Line type="monotone" dataKey="毛利率" stroke="#f59e0b" dot={{ fill: "#f59e0b", r: 4 }} connectNulls />
                          <Line type="monotone" dataKey="净利率" stroke="#8b5cf6" dot={{ fill: "#8b5cf6", r: 4 }} connectNulls />
                          <Line type="monotone" dataKey="ROE" stroke="#06b6d4" dot={{ fill: "#06b6d4", r: 4 }} connectNulls />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-5">
                      <h3 className="text-sm font-semibold text-white mb-4">财务稳健性趋势</h3>
                      <ResponsiveContainer width="100%" height={240}>
                        <LineChart data={trendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                          <XAxis dataKey="year" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                          <YAxis yAxisId="left" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                          <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                          <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569", borderRadius: "8px" }} />
                          <Legend />
                          <ReferenceLine yAxisId="left" y={60} stroke="#ef4444" strokeDasharray="4 4" label={{ value: "负债率60%警戒线", fill: "#ef4444", fontSize: 10 }} />
                          <Line yAxisId="left" type="monotone" dataKey="资产负债率" stroke="#ef4444" dot={{ fill: "#ef4444", r: 4 }} connectNulls />
                          <Line yAxisId="right" type="monotone" dataKey="流动比率" stroke="#10b981" dot={{ fill: "#10b981", r: 4 }} connectNulls />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === "compare" && (
              <div className="space-y-6">
                {selectedCompanies.length < 2 ? (
                  <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-8 text-center">
                    <p className="text-slate-400">请再选择至少 1 家公司进行横向对比</p>
                  </div>
                ) : (
                  <>
                    <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-5">
                      <h3 className="text-sm font-semibold text-white mb-4">{selectedYear} 年度盈利能力对比</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={compareData} layout="vertical" margin={{ top: 5, right: 30, bottom: 5, left: 80 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                          <XAxis type="number" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                          <YAxis type="category" dataKey="metric" stroke="#94a3b8" tick={{ fontSize: 12 }} width={80} />
                          <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569", borderRadius: "8px" }} formatter={(v: any, name: string) => [v != null ? `${v}%` : "/", name]} />
                          <Legend />
                          {selectedCompanies.map((c, i) => (
                            <Bar key={c.code} dataKey={c.name ?? c.code} fill={COLORS[i]} radius={[0, 3, 3, 0]} />
                          ))}
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-5">
                      <h3 className="text-sm font-semibold text-white mb-4">{selectedYear} 年度关键指标对比</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-slate-700">
                              <th className="text-left text-slate-400 py-2 px-3">指标</th>
                              {selectedCompanies.map((c, i) => (
                                <th key={c.code} className="text-right py-2 px-3" style={{ color: COLORS[i] }}>{c.name}</th>
                              ))}
                              <th className="text-right text-slate-500 py-2 px-3">行业均值</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[
                              { key: "revenue", label: "营业收入", fmtFn: fmtRevenue },
                              { key: "net_profit", label: "净利润", fmtFn: fmtRevenue },
                              { key: "gross_margin", label: "毛利率", fmtFn: (v: any) => fmt(v, "%", 1) },
                              { key: "net_margin", label: "净利率", fmtFn: (v: any) => fmt(v, "%", 1) },
                              { key: "roe", label: "ROE", fmtFn: (v: any) => fmt(v, "%", 1) },
                              { key: "debt_ratio", label: "资产负债率", fmtFn: (v: any) => fmt(v, "%", 1) },
                              { key: "current_ratio", label: "流动比率", fmtFn: (v: any) => fmt(v, "x", 2) },
                              { key: "revenue_growth", label: "营收增速", fmtFn: (v: any) => fmt(v, "%", 1) },
                              { key: "net_profit_growth", label: "净利增速", fmtFn: (v: any) => fmt(v, "%", 1) },
                            ].map(({ key, label, fmtFn }) => (
                              <tr key={key} className="border-b border-slate-800 hover:bg-slate-800/30">
                                <td className="text-slate-400 py-2 px-3">{label}</td>
                                {selectedCompanies.map((c) => {
                                  const yr = c.financial_data.find((r) => r.fiscal_year === selectedYear);
                                  return <td key={c.code} className="text-right text-white py-2 px-3">{yr ? fmtFn((yr as any)[key]) : "/"}</td>;
                                })}
                                <td className="text-right text-slate-500 py-2 px-3">{fmtFn((industryAvg as any)[key])}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === "radar" && (
              <div className="space-y-6">
                {radarData.length === 0 ? (
                  <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-8 text-center">
                    <p className="text-slate-400">该公司暂无雷达图数据</p>
                  </div>
                ) : (
                  <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-white mb-2">综合能力雷达图（vs 行业均值）</h3>
                    <p className="text-xs text-slate-500 mb-4">各维度已归一化至 0–100 分，基于 {selectedYear} 年度真实财务数据</p>
                    <ResponsiveContainer width="100%" height={380}>
                      <RadarChart data={radarData} margin={{ top: 20, right: 40, bottom: 20, left: 40 }}>
                        <PolarGrid stroke="#334155" />
                        <PolarAngleAxis dataKey="metric" stroke="#94a3b8" tick={{ fontSize: 13 }} />
                        <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#475569" tick={{ fontSize: 10 }} />
                        <Radar name={primaryCompany.name} dataKey="公司" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.35} />
                        <Radar name="行业均值" dataKey="行业均值" stroke="#10b981" fill="#10b981" fillOpacity={0.15} />
                        <Legend />
                        <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569", borderRadius: "8px" }} />
                      </RadarChart>
                    </ResponsiveContainer>
                    <div className="mt-4 grid grid-cols-3 gap-3 text-xs text-slate-400">
                      <div>📊 <strong>盈利能力</strong>：基于 ROE（归一化至 0–30%）</div>
                      <div>💰 <strong>毛利水平</strong>：基于毛利率（归一化至 0–80%）</div>
                      <div>📈 <strong>净利水平</strong>：基于净利率（归一化至 0–40%）</div>
                      <div>🚀 <strong>成长性</strong>：基于营收增速（归一化至 -20%–50%）</div>
                      <div>🛡️ <strong>偿债能力</strong>：基于流动比率（归一化至 0.5–5x）</div>
                      <div>⚖️ <strong>财务稳健</strong>：基于（100% - 负债率）</div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
