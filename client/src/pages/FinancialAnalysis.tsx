import React, { useState, useMemo } from "react";
import { useLocation } from "wouter";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, ReferenceLine,
} from "recharts";
import { Search, TrendingUp, TrendingDown, BarChart3, Activity, Shield, Target, Info, ArrowLeft, Award, Building2, ChevronDown, ChevronUp, Flame, Crown } from "lucide-react";
import { ScatterChart, Scatter, ZAxis } from "recharts";

// ── 行业基准数据 ──
import industryBenchmarkRaw from "../data/industry-benchmark-data.json";
const industryBenchmark = industryBenchmarkRaw as Record<string, any>;

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

// ── 行业分析面板 ───────────────────────────────────────────────
const SECTOR_CONFIG: Record<string, { color: string; bg: string; border: string; accent: string; icon: string }> = {
  "医疗健康": { color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/30", accent: "#10b981", icon: "🏥" },
  "新能源": { color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30", accent: "#f59e0b", icon: "⚡" },
  "人工智能": { color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30", accent: "#3b82f6", icon: "🤖" },
};

function fmtWan(v: number | null | undefined): string {
  if (v == null) return "/";
  if (v >= 100000000) return (v / 100000000).toFixed(2) + " 亿";
  if (v >= 10000) return (v / 10000).toFixed(2) + " 亿";
  if (v >= 1) return v.toFixed(0) + " 万";
  return v.toFixed(2) + " 万";
}

// 分位条形组件
function PercentileBar({ p25, p50, p75, unit = "%" }: { p25: number; p50: number; p75: number; unit?: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-slate-500 w-8 text-right">{p25.toFixed(1)}{unit}</span>
      <div className="flex-1 relative h-4 bg-slate-700 rounded-full overflow-hidden">
        {/* P25-P75 区间 */}
        <div className="absolute h-full bg-cyan-500/30 rounded-full" style={{ left: "0%", width: "50%" }} />
        {/* P50 中位线 */}
        <div className="absolute h-full w-0.5 bg-cyan-400" style={{ left: "50%" }} />
      </div>
      <span className="text-cyan-400 font-medium w-12">{p50.toFixed(1)}{unit}</span>
      <span className="text-slate-500 w-8">{p75.toFixed(1)}{unit}</span>
    </div>
  );
}

// 分位数表格行
function DistRow({ label, p25, p50, p75, p90, mean, unit = "%", reverse = false }: {
  label: string; p25: number; p50: number; p75: number; p90: number; mean: number; unit?: string; reverse?: boolean;
}) {
  const medColor = reverse
    ? (p50 > 60 ? "text-red-400" : p50 > 40 ? "text-yellow-400" : "text-green-400")
    : (p50 > 30 ? "text-green-400" : p50 > 10 ? "text-yellow-400" : "text-orange-400");
  return (
    <tr className="border-b border-slate-800 hover:bg-slate-800/20">
      <td className="py-2 px-3 text-slate-400 text-xs">{label}</td>
      <td className="py-2 px-3 text-right text-xs text-slate-500">{p25.toFixed(1)}{unit}</td>
      <td className={`py-2 px-3 text-right text-sm font-bold ${medColor}`}>{p50.toFixed(1)}{unit}</td>
      <td className="py-2 px-3 text-right text-xs text-slate-400">{p75.toFixed(1)}{unit}</td>
      <td className="py-2 px-3 text-right text-xs text-slate-500">{p90.toFixed(1)}{unit}</td>
      <td className="py-2 px-3 text-right text-xs text-cyan-400">{mean.toFixed(1)}{unit}</td>
    </tr>
  );
}

function IndustryAnalysisPanel() {
  const [activeSector, setActiveSector] = useState<string>("医疗健康");
  const [topMetric, setTopMetric] = useState<"gross_margin" | "roe" | "revenue">("gross_margin");
  const [expandedSection, setExpandedSection] = useState<string | null>("overview");

  const sectors = ["医疗健康", "新能源", "人工智能"];
  const data = industryBenchmark[activeSector];
  const cfg = SECTOR_CONFIG[activeSector];

  const topCompanies = useMemo(() => {
    if (!data?.companies) return [];
    const sorted = [...data.companies].sort((a: any, b: any) => {
      const va = a[topMetric] ?? -Infinity;
      const vb = b[topMetric] ?? -Infinity;
      return vb - va;
    });
    // 去重名（去掉“已切换”的重复公司）
    const seen = new Set<string>();
    const result: any[] = [];
    for (const c of sorted) {
      const baseName = c.name.replace("（已切换）", "");
      if (!seen.has(baseName)) {
        seen.add(baseName);
        result.push(c);
      }
      if (result.length >= 10) break;
    }
    return result;
  }, [data, topMetric]);

  const growthTrendData = useMemo(() => {
    if (!data?.growth_trend) return [];
    return data.growth_trend.map((t: any) => ({
      year: t.year,
      "均均营收（亿）": t.avg_revenue_yi,
      "增速%": t.growth_rate,
    }));
  }, [data]);

  const metricDistData = useMemo(() => {
    if (!data) return [];
    return [
      { name: "P10", 毛利率: data.gross_margin_stats.p10, ROE: data.roe_stats.p10, 负债率: data.debt_ratio_stats.p10 },
      { name: "P25", 毛利率: data.gross_margin_stats.p25, ROE: data.roe_stats.p25, 负债率: data.debt_ratio_stats.p25 },
      { name: "P50", 毛利率: data.gross_margin_stats.p50, ROE: data.roe_stats.p50, 负债率: data.debt_ratio_stats.p50 },
      { name: "P75", 毛利率: data.gross_margin_stats.p75, ROE: data.roe_stats.p75, 负债率: data.debt_ratio_stats.p75 },
      { name: "P90", 毛利率: data.gross_margin_stats.p90, ROE: data.roe_stats.p90, 负债率: data.debt_ratio_stats.p90 },
    ];
  }, [data]);

  const topMetricLabel = { gross_margin: "毛利率", roe: "ROE", revenue: "营收规模" }[topMetric];
  const topMetricUnit = topMetric === "revenue" ? "" : "%";

  const toggleSection = (s: string) => setExpandedSection(prev => prev === s ? null : s);

  if (!data) return null;

  return (
    <div className="space-y-5">
      {/* 页面标题 */}
      <div className="flex items-center gap-3 mb-1">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-bold text-white">行业全景分析</h2>
        </div>
        <span className="text-xs text-slate-500">| 基于新三板真实财报数据 · 三大行业对比</span>
      </div>

      {/* 行业切换标签 */}
      <div className="flex gap-2">
        {sectors.map(s => {
          const c = SECTOR_CONFIG[s];
          const cnt = industryBenchmark[s]?.company_count ?? 0;
          return (
            <button
              key={s}
              onClick={() => setActiveSector(s)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                activeSector === s
                  ? `${c.bg} ${c.border} ${c.color} shadow-lg`
                  : "bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white"
              }`}
            >
              <span>{c.icon}</span>
              <span>{s}</span>
              <span className="text-xs opacity-70">{cnt}家</span>
            </button>
          );
        })}
      </div>

      {/* 行业概览卡片 */}
      <div className={`border rounded-xl p-5 ${cfg.bg} ${cfg.border}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{cfg.icon}</span>
            <div>
              <h3 className={`text-lg font-bold ${cfg.color}`}>{activeSector}</h3>
              <p className="text-xs text-slate-500">新三板挂牌企业 · 真实财报数据</p>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-3xl font-bold ${cfg.color}`}>{data.company_count}</div>
            <div className="text-xs text-slate-500">家挂牌公司</div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "毛利率中位数", value: `${data.gross_margin_stats.p50.toFixed(1)}%`, sub: `均値 ${data.gross_margin_stats.mean.toFixed(1)}%`, color: "text-yellow-400" },
            { label: "ROE 中位数", value: `${data.roe_stats.p50.toFixed(1)}%`, sub: `均値 ${data.roe_stats.mean.toFixed(1)}%`, color: "text-blue-400" },
            { label: "负债率中位数", value: `${data.debt_ratio_stats.p50.toFixed(1)}%`, sub: `P75 ${data.debt_ratio_stats.p75.toFixed(1)}%`, color: "text-orange-400" },
            { label: "最近年均均营收", value: `${growthTrendData[growthTrendData.length-1]?.['均均营收（亿）']?.toFixed(2) ?? '/'}  亿`, sub: `增速 ${growthTrendData[growthTrendData.length-1]?.['增速%'] ?? '/'}%`, color: (growthTrendData[growthTrendData.length-1]?.['增速%'] ?? 0) >= 0 ? "text-green-400" : "text-red-400" },
          ].map(({ label, value, sub, color }) => (
            <div key={label} className="bg-slate-800/60 rounded-lg p-3 text-center">
              <div className="text-xs text-slate-400 mb-1">{label}</div>
              <div className={`text-lg font-bold ${color}`}>{value}</div>
              <div className="text-xs text-slate-500 mt-0.5">{sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 展开收起：指标分位分布 */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-xl overflow-hidden">
        <button
          onClick={() => toggleSection("dist")}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-700/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-semibold text-white">行业指标分位分布（P25 / 中位数P50 / P75 / P90）</span>
          </div>
          {expandedSection === "dist" ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>
        {expandedSection === "dist" && (
          <div className="px-5 pb-5">
            <p className="text-xs text-slate-500 mb-3">
              P25 = 行业内排名前 25% 的门槛；P50 = 中位数（行业中间水平）；P75 = 行业内排名前 25% 的优秀水平；P90 = 行业领先水平。超过 P75 即为行业优秀企业。
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-2 px-3 text-slate-400">指标</th>
                    <th className="text-right py-2 px-3 text-slate-500">P25</th>
                    <th className="text-right py-2 px-3 text-cyan-400 font-bold">P50 中位数</th>
                    <th className="text-right py-2 px-3 text-slate-400">P75</th>
                    <th className="text-right py-2 px-3 text-slate-500">P90</th>
                    <th className="text-right py-2 px-3 text-slate-400">均値</th>
                  </tr>
                </thead>
                <tbody>
                  <DistRow label="毛利率" p25={data.gross_margin_stats.p25} p50={data.gross_margin_stats.p50} p75={data.gross_margin_stats.p75} p90={data.gross_margin_stats.p90} mean={data.gross_margin_stats.mean} />
                  <DistRow label="净利率" p25={data.net_margin_stats.p25} p50={data.net_margin_stats.p50} p75={data.net_margin_stats.p75} p90={data.net_margin_stats.p90} mean={data.net_margin_stats.mean} />
                  <DistRow label="ROE（净资产收益率）" p25={data.roe_stats.p25} p50={data.roe_stats.p50} p75={data.roe_stats.p75} p90={data.roe_stats.p90} mean={data.roe_stats.mean} />
                  <DistRow label="资产负债率" p25={data.debt_ratio_stats.p25} p50={data.debt_ratio_stats.p50} p75={data.debt_ratio_stats.p75} p90={data.debt_ratio_stats.p90} mean={data.debt_ratio_stats.mean} reverse />
                </tbody>
              </table>
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-400 mb-2">毛利率分位分布图</p>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={metricDistData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="name" stroke="#9ca3af" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#9ca3af" tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569", fontSize: 11 }}
                      formatter={(v: any) => [`${v?.toFixed(1)}%`, "毛利率"]} />
                    <Bar dataKey="毛利率" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-2">ROE 分位分布图</p>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={metricDistData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="name" stroke="#9ca3af" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#9ca3af" tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569", fontSize: 11 }}
                      formatter={(v: any) => [`${v?.toFixed(1)}%`, "ROE"]} />
                    <Bar dataKey="ROE" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 展开收起：行业增长趋势 */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-xl overflow-hidden">
        <button
          onClick={() => toggleSection("trend")}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-700/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-semibold text-white">行业增长趋势（2023–2025）</span>
          </div>
          {expandedSection === "trend" ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>
        {expandedSection === "trend" && (
          <div className="px-5 pb-5">
            <p className="text-xs text-slate-500 mb-4">行业内所有公司平均营收及同比增速，反映整个行业的宏观局面。</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-400 mb-2">行业均均营收（亿元）</p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={growthTrendData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="year" stroke="#9ca3af" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#9ca3af" tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569", fontSize: 11 }}
                      formatter={(v: any) => [`${v?.toFixed(2)} 亿`, "均均营收"]} />
                    <Bar dataKey="均均营收（亿）" fill={cfg.accent} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-2">行业营收增速（%）</p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={growthTrendData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="year" stroke="#9ca3af" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#9ca3af" tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569", fontSize: 11 }}
                      formatter={(v: any) => [`${v?.toFixed(1)}%`, "增速"]} />
                    <ReferenceLine y={0} stroke="#64748b" />
                    <Bar dataKey="增速%" fill={growthTrendData[growthTrendData.length-1]?.['增速%'] >= 0 ? "#10b981" : "#ef4444"} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            {/* 趋势解读 */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              {growthTrendData.map((t: any) => {
                const rate = t['增速%'];
                const isPos = rate >= 0;
                return (
                  <div key={t.year} className={`p-3 rounded-lg border text-center ${
                    isPos ? "bg-green-500/10 border-green-500/20" : "bg-red-500/10 border-red-500/20"
                  }`}>
                    <div className="text-xs text-slate-400 mb-1">{t.year} 年</div>
                    <div className={`text-xl font-bold ${isPos ? "text-green-400" : "text-red-400"}`}>
                      {isPos ? "+" : ""}{rate.toFixed(1)}%
                    </div>
                    <div className="text-xs text-slate-500">均均营收 {t['均均营收（亿）']?.toFixed(2)} 亿</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 展开收起：行业领先企业排行 */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-xl overflow-hidden">
        <button
          onClick={() => toggleSection("top")}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-700/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-semibold text-white">行业领先企业排行（TOP 10）</span>
          </div>
          {expandedSection === "top" ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>
        {expandedSection === "top" && (
          <div className="px-5 pb-5">
            <div className="flex gap-2 mb-4">
              {([
                { key: "gross_margin", label: "毛利率 TOP10", color: "text-yellow-400" },
                { key: "roe", label: "ROE TOP10", color: "text-blue-400" },
                { key: "revenue", label: "营收规模 TOP10", color: "text-cyan-400" },
              ] as const).map(({ key, label, color }) => (
                <button
                  key={key}
                  onClick={() => setTopMetric(key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    topMetric === key ? `bg-slate-600 ${color}` : "bg-slate-700/60 text-slate-400 hover:text-white"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              {topCompanies.map((c: any, i: number) => {
                const val = c[topMetric];
                const displayVal = topMetric === "revenue" ? fmtWan(val) : `${val?.toFixed(1)}%`;
                const maxVal = topCompanies[0]?.[topMetric] ?? 1;
                const barWidth = maxVal > 0 ? Math.max(5, (val / maxVal) * 100) : 5;
                const rankColor = i === 0 ? "text-yellow-400" : i === 1 ? "text-slate-300" : i === 2 ? "text-orange-400" : "text-slate-500";
                return (
                  <div key={c.code} className="flex items-center gap-3 group">
                    <span className={`text-sm font-bold w-6 text-center ${rankColor}`}>{i + 1}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-white text-sm">{c.name.replace("（已切换）", "")}</span>
                          <span className="text-slate-500 text-xs font-mono">{c.code}</span>
                          {c[`${topMetric}_pct`] != null && (
                            <span className="text-xs bg-cyan-500/20 text-cyan-400 px-1.5 py-0.5 rounded">
                              超过 {c[`${topMetric}_pct`].toFixed(0)}% 的公司
                            </span>
                          )}
                        </div>
                        <span className={`text-sm font-bold ${
                          topMetric === "gross_margin" ? "text-yellow-400" :
                          topMetric === "roe" ? "text-blue-400" : "text-cyan-400"
                        }`}>{displayVal}</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-all ${
                            topMetric === "gross_margin" ? "bg-yellow-500" :
                            topMetric === "roe" ? "bg-blue-500" : "bg-cyan-500"
                          }`}
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 展开收起：行业健康度全景 */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-xl overflow-hidden">
        <button
          onClick={() => toggleSection("health")}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-700/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-semibold text-white">行业财务健康度全景</span>
          </div>
          {expandedSection === "health" ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>
        {expandedSection === "health" && (
          <div className="px-5 pb-5">
            <p className="text-xs text-slate-500 mb-4">以下分析基于行业内所有有财务数据的公司，展示行业整体财务健康水平。</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 盈利能力健康度 */}
              <div className="bg-slate-700/40 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Flame className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm font-medium text-white">盈利能力</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">毛利率中位数</span>
                    <span className="text-yellow-400 font-medium">{data.gross_margin_stats.p50.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">净利率中位数</span>
                    <span className="text-purple-400 font-medium">{data.net_margin_stats.p50.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">ROE 中位数</span>
                    <span className="text-blue-400 font-medium">{data.roe_stats.p50.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">ROE P75 优秀门槛</span>
                    <span className="text-green-400 font-medium">{data.roe_stats.p75.toFixed(1)}%</span>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-600 text-slate-500">
                    超过 P75 即为行业优秀盈利能力
                  </div>
                </div>
              </div>
              {/* 负债风险 */}
              <div className="bg-slate-700/40 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-4 h-4 text-orange-400" />
                  <span className="text-sm font-medium text-white">负债风险</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">负债率 P25 （低负债）</span>
                    <span className="text-green-400 font-medium">{data.debt_ratio_stats.p25.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">负债率中位数</span>
                    <span className="text-yellow-400 font-medium">{data.debt_ratio_stats.p50.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">负债率 P75 （偏高门槛）</span>
                    <span className="text-orange-400 font-medium">{data.debt_ratio_stats.p75.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">负债率 P90 （高风险门槛）</span>
                    <span className="text-red-400 font-medium">{data.debt_ratio_stats.p90.toFixed(1)}%</span>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-600 text-slate-500">
                    超过 P75 负债率需警惕偏高负债
                  </div>
                </div>
              </div>
              {/* 营收规模分布 */}
              <div className="bg-slate-700/40 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm font-medium text-white">营收规模</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">营收 P25 （小型）</span>
                    <span className="text-slate-300 font-medium">{fmtWan(data.revenue_stats.p25)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">营收中位数</span>
                    <span className="text-cyan-400 font-medium">{fmtWan(data.revenue_stats.p50)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">营收 P75 （优秀）</span>
                    <span className="text-green-400 font-medium">{fmtWan(data.revenue_stats.p75)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">营收 P90 （领先）</span>
                    <span className="text-yellow-400 font-medium">{fmtWan(data.revenue_stats.p90)}</span>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-600 text-slate-500">
                    达到 P75 营收即为行业优秀规模
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 说明注脚 */}
      <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 text-xs text-slate-500">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-cyan-500/70 mt-0.5 flex-shrink-0" />
          <div>
            <span className="text-slate-400 font-medium">数据说明：</span>
            以上行业分析基于新三板挂牌公司真实财报数据，涵盖医疗健康 {industryBenchmark['医疗健康']?.company_count} 家、新能源 {industryBenchmark['新能源']?.company_count} 家、人工智能 {industryBenchmark['人工智能']?.company_count} 家。分位数数据反映行业内真实分布，中位数（P50）为行业中间水平。如需分析具体公司，请在上方搜索框中输入公司名称或代码。
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 主页面 ───────────────────────────────────────────────
export default function FinancialAnalysis() {
  const [, navigate] = useLocation();
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
      <div className="bg-slate-900/80 border-b border-slate-700 px-6 py-4 flex items-center gap-4">
        <button
          onClick={() => { if (window.history.length > 1) { window.history.back(); } else { navigate('/'); } }}
          className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors flex-shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">返回</span>
        </button>
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
          <IndustryAnalysisPanel />
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
