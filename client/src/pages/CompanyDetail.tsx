import React, { useMemo } from "react";
import { useParams } from "wouter";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, ReferenceLine,
} from "recharts";
import {
  ArrowLeft, Building2, TrendingUp, TrendingDown, Shield, Award, BarChart3, Activity,
  AlertTriangle, CheckCircle, Info, DollarSign,
} from "lucide-react";
import dataV4Raw from "../../public/data_v4_fixed.json";

const dataV4 = dataV4Raw as any[];

// 从 dataV4 读取真实财务数据
function getFinDataByCode(code: string): any[] {
  const company = dataV4.find((c) => c.bse_code === code);
  return company?.financial_data ?? [];
}

// ── 工具函数 ────────────────────────────────────────────────────
const fmt = (v: number | null | undefined, suffix = "", digits = 2): string => {
  if (v == null || isNaN(Number(v))) return "/";
  return Number(v).toFixed(digits) + suffix;
};

// revenue/net_profit 单位为万元（akshare 原始数据已转换）
const fmtRevenue = (v: number | null | undefined): string => {
  if (v == null) return "/";
  // v 单位为万元
  if (v >= 10000) return (v / 10000).toFixed(2) + " 亿";
  if (v >= 1) return v.toFixed(0) + " 万";
  return v.toFixed(2) + " 万";
};

const fmtDate = (s: string | null | undefined): string => {
  if (!s) return "/";
  return s.slice(0, 10);
};

const pctColor = (v: number | null | undefined): string => {
  if (v == null) return "text-slate-400";
  return v >= 0 ? "text-green-400" : "text-red-400";
};

// ── 评分计算（基于真实财务数据） ─────────────────────────────────
function calcScores(finData: any[]) {
  if (!finData || finData.length === 0) return null;
  const latest = [...finData].sort((a, b) => (b.fiscal_year ?? 0) - (a.fiscal_year ?? 0))[0];
  if (!latest) return null;

  const roeScore = latest.roe != null ? Math.min(35, (latest.roe / 30) * 35) : 0;
  const gmScore = latest.gross_margin != null ? Math.min(15, (latest.gross_margin / 60) * 15) : 0;
  const nmScore = latest.net_margin != null ? Math.min(10, (latest.net_margin / 25) * 10) : 0;
  const profitability = Math.round(roeScore + gmScore + nmScore);

  const rvgScore = latest.revenue_growth != null ? Math.min(15, Math.max(0, (latest.revenue_growth / 40) * 15)) : 0;
  const npgScore = latest.net_profit_growth != null ? Math.min(15, Math.max(0, (latest.net_profit_growth / 40) * 15)) : 0;
  const growth = Math.round(rvgScore + npgScore);

  const drScore = latest.debt_ratio != null ? Math.min(10, ((100 - latest.debt_ratio) / 60) * 10) : 0;
  const crScore = latest.current_ratio != null ? Math.min(10, (latest.current_ratio / 3) * 10) : 0;
  const stability = Math.round(drScore + crScore);

  const revScore = latest.revenue != null ? Math.min(15, (Math.log10(latest.revenue + 1) / 9) * 15) : 0;
  const scale = Math.round(revScore);

  const total = Math.min(100, profitability + growth + stability + scale);
  return { total, profitability, growth, stability, scale, latest };
}

// ── 行业对标 ─────────────────────────────────────────────────────
function calcIndustryBenchmark(industry: string, year: number) {
  const peers = dataV4.filter((c) => c.industry === industry);
  const metrics = ["gross_margin", "net_margin", "roe", "debt_ratio", "current_ratio"];
  const result: Record<string, any> = {};
  for (const m of metrics) {
    const vals = peers
      .map((c) => {
        const fd = getFinDataByCode(c.bse_code);
        const row = fd.find((r: any) => r.fiscal_year === year);
        return row?.[m] ?? null;
      })
      .filter((v) => v != null) as number[];
    result[m] = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  }
  result["peer_count"] = peers.length;
  return result;
}

// ── 子组件 ───────────────────────────────────────────────────────
function SectionCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-5 mb-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-cyan-400">{icon}</span>
        <h2 className="text-base font-bold text-white">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function StatBox({ label, value, color = "text-white", sub }: { label: string; value: string; color?: string; sub?: string }) {
  return (
    <div className="bg-slate-700/50 rounded-lg p-3 text-center">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className={`text-base font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
    </div>
  );
}

function ScoreRing({ score, label }: { score: number; label: string }) {
  const color = score >= 70 ? "#10b981" : score >= 55 ? "#06b6d4" : score >= 40 ? "#f59e0b" : "#ef4444";
  const r = 40;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div className="flex flex-col items-center">
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#334155" strokeWidth="10" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round" transform="rotate(-90 50 50)" />
        <text x="50" y="46" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold">{score}</text>
        <text x="50" y="60" textAnchor="middle" fill="#94a3b8" fontSize="9">{label}</text>
      </svg>
    </div>
  );
}

function Badge({ text, type }: { text: string; type: "green" | "blue" | "yellow" | "red" | "gray" }) {
  const cls: Record<string, string> = {
    green: "bg-green-500/20 text-green-400 border-green-500/30",
    blue: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    yellow: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    red: "bg-red-500/20 text-red-400 border-red-500/30",
    gray: "bg-slate-700 text-slate-300 border-slate-600",
  };
  return <span className={`px-2 py-0.5 rounded border text-xs font-medium ${cls[type]}`}>{text}</span>;
}

// ── 主组件 ───────────────────────────────────────────────────────
export default function CompanyDetail() {
  const params = useParams<{ code: string }>();
  const code = decodeURIComponent(params.code ?? "");

  const company = useMemo(
    () => dataV4.find((c) => c.bse_code === code || c.bse_code === code.replace(".BSE", "")),
    [code]
  );

  const finData: any[] = useMemo(() => {
    const bseCode = company?.bse_code ?? code.replace(".BSE", "");
    return getFinDataByCode(bseCode);
  }, [company, code]);

  const scores = useMemo(() => calcScores(finData), [finData]);
  const latestFin = scores?.latest ?? null;
  const latestYear = latestFin?.fiscal_year ?? 2024;

  const industryBench = useMemo(
    () => (company?.industry ? calcIndustryBenchmark(company.industry, latestYear) : {}),
    [company, latestYear]
  );

  const trendData = useMemo(() => {
    if (!finData.length) return [];
    return [...finData]
      .sort((a, b) => (a.fiscal_year ?? 0) - (b.fiscal_year ?? 0))
      .map((d) => ({
        year: d.fiscal_year,
        营收: d.revenue != null ? +(d.revenue / 10000).toFixed(3) : null,
        净利润: d.net_profit != null ? +(d.net_profit / 10000).toFixed(3) : null,
        毛利率: d.gross_margin != null ? +d.gross_margin.toFixed(2) : null,
        净利率: d.net_margin != null ? +d.net_margin.toFixed(2) : null,
        ROE: d.roe != null ? +d.roe.toFixed(2) : null,
        资产负债率: d.debt_ratio != null ? +d.debt_ratio.toFixed(2) : null,
      }));
  }, [finData]);

  const radarData = useMemo(() => {
    if (!latestFin) return [];
    const norm = (v: number | null, min: number, max: number) =>
      v == null ? 0 : Math.max(0, Math.min(100, ((v - min) / (max - min)) * 100));
    return [
      { metric: "盈利能力", 公司: norm(latestFin.roe, 0, 30), 行业: norm(industryBench.roe, 0, 30) },
      { metric: "毛利水平", 公司: norm(latestFin.gross_margin, 0, 80), 行业: norm(industryBench.gross_margin, 0, 80) },
      { metric: "净利水平", 公司: norm(latestFin.net_margin, 0, 40), 行业: norm(industryBench.net_margin, 0, 40) },
      { metric: "成长性", 公司: norm(latestFin.revenue_growth, -20, 50), 行业: 50 },
      { metric: "偿债能力", 公司: norm(latestFin.current_ratio, 0.5, 5), 行业: norm(industryBench.current_ratio, 0.5, 5) },
      { metric: "财务稳健", 公司: norm(100 - (latestFin.debt_ratio ?? 50), 0, 100), 行业: norm(100 - (industryBench.debt_ratio ?? 50), 0, 100) },
    ];
  }, [latestFin, industryBench]);

  const rating = useMemo(() => {
    if (!scores) return null;
    const s = scores.total;
    if (s >= 75) return { label: "强烈推荐", type: "green" as const, desc: "各项财务指标优异，具备较强投资价值" };
    if (s >= 60) return { label: "推荐关注", type: "blue" as const, desc: "财务表现良好，建议持续跟踪" };
    if (s >= 45) return { label: "中性观望", type: "yellow" as const, desc: "财务指标一般，需关注改善情况" };
    return { label: "谨慎回避", type: "red" as const, desc: "财务存在一定风险，建议谨慎" };
  }, [scores]);

  if (!company) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400 text-lg mb-4">未找到企业数据：{code}</p>
          <button onClick={() => history.back()} className="text-cyan-400 hover:underline">返回</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* 顶部导航 */}
      <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur border-b border-slate-700 px-6 py-3 flex items-center gap-4">
        <button onClick={() => history.back()} className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> 返回
        </button>
        <div className="flex items-center gap-2 flex-1 flex-wrap">
          <span className="text-white font-semibold">{company.name}</span>
          <span className="text-slate-500 text-sm">{company.bse_code}</span>
          <Badge text={company.industry ?? "/"} type="gray" />
          {rating && <Badge text={rating.label} type={rating.type} />}
          {scores && (
            <span className={`ml-auto text-2xl font-bold ${scores.total >= 70 ? "text-green-400" : scores.total >= 55 ? "text-cyan-400" : scores.total >= 40 ? "text-yellow-400" : "text-red-400"}`}>
              {scores.total}分
            </span>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6">

        {/* 企业基本信息 */}
        <SectionCard title="企业基本信息" icon={<Building2 className="w-5 h-5" />}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <StatBox label="证券代码" value={company.bse_code ?? "/"} />
            <StatBox label="北交所上市日期" value={fmtDate(company.bse_listing_date)} />
            <StatBox label="所属行业" value={company.industry ?? "/"} />
            <StatBox label="所在省份" value={company.province ?? company.region ?? "/"} />
            <StatBox label="总股本" value={company.total_shares != null ? `${(company.total_shares / 1e8).toFixed(2)} 亿股` : "/"} />
            <StatBox label="发行价格" value={company.issue_price != null ? `¥${company.issue_price}` : "/"} />
            <StatBox label="上市首日收盘价" value={company.listing_close_price != null ? `¥${company.listing_close_price}` : "/"} />
            <StatBox label="上市市值" value={company.listing_market_cap_yi != null ? `${company.listing_market_cap_yi} 亿` : "/"} />
            <StatBox label="新三板挂牌日期" value={fmtDate(company.neeq_listing_date)} />
            <StatBox label="新三板挂牌层级" value={company.neeq_tier ?? "/"} />
            <StatBox label="主承销商" value={company.sponsor ?? "/"} />
            <StatBox label="会计师事务所" value={company.accountant ?? "/"} />
          </div>
          {company.law_firm && (
            <div className="text-xs text-slate-500">律师事务所：{company.law_firm}</div>
          )}
        </SectionCard>

        {/* 综合投资评分 */}
        {scores ? (
          <SectionCard title="综合投资评分（基于真实财报数据）" icon={<Award className="w-5 h-5" />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col items-center">
                <div className="flex gap-4 mb-4">
                  <ScoreRing score={scores.total} label="综合" />
                  <ScoreRing score={scores.profitability} label="盈利" />
                  <ScoreRing score={scores.growth} label="成长" />
                  <ScoreRing score={scores.stability} label="稳健" />
                </div>
                {rating && (
                  <div className={`px-4 py-2 rounded-lg border text-sm text-center ${
                    rating.type === "green" ? "bg-green-500/10 border-green-500/30 text-green-400" :
                    rating.type === "blue" ? "bg-blue-500/10 border-blue-500/30 text-blue-400" :
                    rating.type === "yellow" ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-400" :
                    "bg-red-500/10 border-red-500/30 text-red-400"
                  }`}>
                    <div className="font-bold">{rating.label}</div>
                    <div className="text-xs opacity-80 mt-0.5">{rating.desc}</div>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                {[
                  { label: "盈利能力（ROE/毛利率/净利率）", score: scores.profitability, max: 60, color: "bg-cyan-500" },
                  { label: "成长性（营收/利润增速）", score: scores.growth, max: 30, color: "bg-green-500" },
                  { label: "财务稳健（负债率/流动比率）", score: scores.stability, max: 20, color: "bg-yellow-500" },
                  { label: "规模（营收体量）", score: scores.scale, max: 15, color: "bg-purple-500" },
                ].map(({ label, score, max, color }) => (
                  <div key={label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">{label}</span>
                      <span className="text-white font-medium">{score}/{max}</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div className={`h-2 rounded-full ${color}`} style={{ width: `${(score / max) * 100}%` }} />
                    </div>
                  </div>
                ))}
                <div className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-700">
                  <Info className="w-3 h-3 inline mr-1" />
                  评分基于 {latestYear} 年度真实财报数据计算，满分 100 分
                </div>
              </div>
            </div>
          </SectionCard>
        ) : (
          <SectionCard title="综合投资评分" icon={<Award className="w-5 h-5" />}>
            <div className="text-slate-500 text-sm text-center py-4">该公司暂无财务数据，无法计算评分</div>
          </SectionCard>
        )}

        {/* 核心财务指标 */}
        <SectionCard title={`核心财务指标（${latestYear} 年度）`} icon={<DollarSign className="w-5 h-5" />}>
          {latestFin ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <StatBox label="营业收入" value={fmtRevenue(latestFin.revenue)} color="text-cyan-400"
                  sub={latestFin.revenue_growth != null ? `同比 ${fmt(latestFin.revenue_growth, "%", 1)}` : "同比 /"} />
                <StatBox label="净利润" value={fmtRevenue(latestFin.net_profit)}
                  color={(latestFin.net_profit ?? 0) >= 0 ? "text-green-400" : "text-red-400"}
                  sub={latestFin.net_profit_growth != null ? `同比 ${fmt(latestFin.net_profit_growth, "%", 1)}` : "同比 /"} />
                <StatBox label="毛利率" value={fmt(latestFin.gross_margin, "%", 1)} color="text-yellow-400"
                  sub={industryBench.gross_margin != null ? `行业均值 ${fmt(industryBench.gross_margin, "%", 1)}` : "行业均值 /"} />
                <StatBox label="净利率" value={fmt(latestFin.net_margin, "%", 1)} color="text-purple-400"
                  sub={industryBench.net_margin != null ? `行业均值 ${fmt(industryBench.net_margin, "%", 1)}` : "行业均值 /"} />
                <StatBox label="ROE（净资产收益率）" value={fmt(latestFin.roe, "%", 1)} color="text-blue-400"
                  sub={industryBench.roe != null ? `行业均值 ${fmt(industryBench.roe, "%", 1)}` : "行业均值 /"} />
                <StatBox label="资产负债率" value={fmt(latestFin.debt_ratio, "%", 1)}
                  color={(latestFin.debt_ratio ?? 0) > 70 ? "text-red-400" : "text-orange-400"}
                  sub={industryBench.debt_ratio != null ? `行业均值 ${fmt(industryBench.debt_ratio, "%", 1)}` : "行业均值 /"} />
                <StatBox label="流动比率" value={fmt(latestFin.current_ratio, "x", 2)}
                  color={(latestFin.current_ratio ?? 0) >= 1.5 ? "text-green-400" : "text-yellow-400"}
                  sub={industryBench.current_ratio != null ? `行业均值 ${fmt(industryBench.current_ratio, "x", 2)}` : "行业均值 /"} />
                <StatBox label="每股收益（EPS）" value={latestFin.eps != null ? `¥${fmt(latestFin.eps, "", 2)}` : "/"} color="text-slate-200" />
              </div>
              {(industryBench.peer_count ?? 0) > 0 && (
                <div className="text-xs text-slate-500 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  行业均值基于北交所同行业 {industryBench.peer_count} 家公司 {latestYear} 年度真实财报计算
                </div>
              )}
            </>
          ) : (
            <div className="text-slate-500 text-sm text-center py-6">该公司暂无财务数据，所有指标显示为 /</div>
          )}
        </SectionCard>

        {/* 历史财务趋势 */}
        {trendData.length > 0 && (
          <SectionCard title="历史财务趋势（2020–2024）" icon={<BarChart3 className="w-5 h-5" />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
              <div>
                <p className="text-xs text-slate-400 mb-2">营收 & 净利润（亿元）</p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={trendData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="year" stroke="#9ca3af" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#9ca3af" tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }}
                      formatter={(v: any, name: string) => [v != null ? `${v} 亿` : "/", name]} />
                    <Legend />
                    <Bar dataKey="营收" fill="#06b6d4" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="净利润" fill="#10b981" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-2">盈利能力趋势（%）</p>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={trendData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="year" stroke="#9ca3af" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#9ca3af" tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }}
                      formatter={(v: any, name: string) => [v != null ? `${v}%` : "/", name]} />
                    <Legend />
                    <ReferenceLine y={15} stroke="#10b981" strokeDasharray="3 3" />
                    <Line type="monotone" dataKey="毛利率" stroke="#f59e0b" dot={{ r: 3 }} connectNulls />
                    <Line type="monotone" dataKey="净利率" stroke="#8b5cf6" dot={{ r: 3 }} connectNulls />
                    <Line type="monotone" dataKey="ROE" stroke="#06b6d4" dot={{ r: 3 }} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            {/* 完整财务数据表格 */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-700">
                    {["年份", "营收", "净利润", "毛利率", "净利率", "ROE", "负债率", "流动比率", "营收增速", "利润增速"].map((h) => (
                      <th key={h} className={`py-2 px-2 text-slate-400 ${h === "年份" ? "text-left" : "text-right"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...finData].sort((a, b) => (a.fiscal_year ?? 0) - (b.fiscal_year ?? 0)).map((row, i) => (
                    <tr key={i} className="border-b border-slate-800 hover:bg-slate-800/30">
                      <td className="text-white py-1.5 px-2 font-medium">{row.fiscal_year ?? "/"}</td>
                      <td className="text-right text-cyan-400 py-1.5 px-2">{fmtRevenue(row.revenue)}</td>
                      <td className={`text-right py-1.5 px-2 ${(row.net_profit ?? 0) >= 0 ? "text-green-400" : "text-red-400"}`}>{fmtRevenue(row.net_profit)}</td>
                      <td className="text-right text-yellow-400 py-1.5 px-2">{fmt(row.gross_margin, "%", 1)}</td>
                      <td className="text-right text-purple-400 py-1.5 px-2">{fmt(row.net_margin, "%", 1)}</td>
                      <td className="text-right text-blue-400 py-1.5 px-2">{fmt(row.roe, "%", 1)}</td>
                      <td className={`text-right py-1.5 px-2 ${(row.debt_ratio ?? 0) > 70 ? "text-red-400" : "text-orange-400"}`}>{fmt(row.debt_ratio, "%", 1)}</td>
                      <td className="text-right text-slate-300 py-1.5 px-2">{fmt(row.current_ratio, "x", 2)}</td>
                      <td className={`text-right py-1.5 px-2 ${pctColor(row.revenue_growth)}`}>{fmt(row.revenue_growth, "%", 1)}</td>
                      <td className={`text-right py-1.5 px-2 ${pctColor(row.net_profit_growth)}`}>{fmt(row.net_profit_growth, "%", 1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        )}

        {/* 综合能力雷达图 */}
        {radarData.length > 0 && (
          <SectionCard title="综合能力雷达图（vs 行业均值）" icon={<Activity className="w-5 h-5" />}>
            <p className="text-xs text-slate-500 mb-4">各维度已归一化至 0–100 分，基于 {latestYear} 年度真实财务数据</p>
            <ResponsiveContainer width="100%" height={340}>
              <RadarChart data={radarData} margin={{ top: 20, right: 40, bottom: 20, left: 40 }}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="metric" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#475569" tick={{ fontSize: 9 }} />
                <Radar name={company.name} dataKey="公司" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.35} />
                <Radar name="行业均值" dataKey="行业" stroke="#10b981" fill="#10b981" fillOpacity={0.15} />
                <Legend />
                <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }} />
              </RadarChart>
            </ResponsiveContainer>
          </SectionCard>
        )}

        {/* IPO 及融资信息 */}
        <SectionCard title="IPO 及融资信息" icon={<TrendingUp className="w-5 h-5" />}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatBox label="发行市盈率" value={company.issue_pe != null ? `${fmt(company.issue_pe, "x", 2)}` : "/"} />
            <StatBox label="行业市盈率" value={company.industry_pe != null ? `${fmt(company.industry_pe, "x", 2)}` : "/"} />
            <StatBox label="PE vs 行业" value={company.pe_vs_industry_pct != null ? `${fmt(company.pe_vs_industry_pct, "%", 1)}` : "/"} color={company.pe_vs_industry_pct != null && company.pe_vs_industry_pct < 0 ? "text-green-400" : "text-yellow-400"} />
            <StatBox label="首日涨跌幅" value={company.first_day_return_pct != null ? `${(company.first_day_return_pct * 100).toFixed(2)}%` : "/"} color={company.first_day_return_pct != null && company.first_day_return_pct >= 0 ? "text-green-400" : "text-red-400"} />
            <StatBox label="最近一轮融资日期" value={fmtDate(company.last_round_date)} />
            <StatBox label="最近一轮融资价格" value={company.last_round_price != null ? `¥${company.last_round_price}` : "/"} />
            <StatBox label="最近一轮融资金额" value={company.last_round_amount_wan != null ? `${company.last_round_amount_wan} 万` : "/"} />
            <StatBox label="IPO vs 最近融资倍数" value={company.ipo_vs_last_round_multiple != null ? `${fmt(company.ipo_vs_last_round_multiple, "x", 2)}` : "/"} color="text-cyan-400" />
            <StatBox label="认购倍数" value={company.subscription_rate != null ? `${fmt(company.subscription_rate, "x", 2)}` : "/"} />
            <StatBox label="一年后收盘价" value={company.one_year_close_price != null ? `¥${company.one_year_close_price}` : "/"} />
            <StatBox label="一年后市值" value={company.one_year_market_cap_yi != null ? `${company.one_year_market_cap_yi} 亿` : "/"} />
            <StatBox label="上市后市值变化" value={company.cap_change_pct != null ? `${fmt(company.cap_change_pct, "%", 1)}` : "/"} color={company.cap_change_pct != null && company.cap_change_pct >= 0 ? "text-green-400" : "text-red-400"} />
          </div>
        </SectionCard>

        {/* 风险提示 */}
        <SectionCard title="风险提示" icon={<AlertTriangle className="w-5 h-5 text-yellow-400" />}>
          <div className="space-y-2 text-sm">
            {[
              latestFin?.debt_ratio != null && latestFin.debt_ratio > 70
                ? { level: "red", text: `资产负债率偏高（${fmt(latestFin.debt_ratio, "%", 1)}），超过 70% 警戒线，偿债压力较大` }
                : null,
              latestFin?.current_ratio != null && latestFin.current_ratio < 1.0
                ? { level: "red", text: `流动比率不足 1.0（当前 ${fmt(latestFin.current_ratio, "x", 2)}），短期偿债能力存在风险` }
                : null,
              latestFin?.net_profit != null && latestFin.net_profit < 0
                ? { level: "red", text: `${latestYear} 年度净利润为负（${fmtRevenue(latestFin.net_profit)}），公司处于亏损状态` }
                : null,
              latestFin?.net_profit_growth != null && latestFin.net_profit_growth < -30
                ? { level: "yellow", text: `净利润同比下滑 ${Math.abs(latestFin.net_profit_growth).toFixed(1)}%，盈利能力出现较大下滑` }
                : null,
              latestFin?.revenue_growth != null && latestFin.revenue_growth < -10
                ? { level: "yellow", text: `营收同比下滑 ${Math.abs(latestFin.revenue_growth).toFixed(1)}%，需关注业务增长压力` }
                : null,
            ].filter(Boolean).map((risk: any, i) => (
              <div key={i} className={`flex items-start gap-2 p-3 rounded-lg ${risk.level === "red" ? "bg-red-500/10 border border-red-500/20" : "bg-yellow-500/10 border border-yellow-500/20"}`}>
                <AlertTriangle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${risk.level === "red" ? "text-red-400" : "text-yellow-400"}`} />
                <span className={risk.level === "red" ? "text-red-300" : "text-yellow-300"}>{risk.text}</span>
              </div>
            ))}
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
              <span className="text-green-300">
                {latestFin ? "以上风险提示基于真实财报数据自动生成" : "暂无财务数据，无法进行风险评估"}
              </span>
            </div>
            <div className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-700">
              <Info className="w-3 h-3 inline mr-1" />
              以上分析基于公开财报数据，仅供参考，不构成投资建议。投资有风险，入市需谨慎。
            </div>
          </div>
        </SectionCard>

      </div>
    </div>
  );
}
