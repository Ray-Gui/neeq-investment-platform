import React, { useMemo } from "react";
import { useParams, useLocation } from "wouter";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line
} from "recharts";
import {
  ArrowLeft, Building2, Users, Calendar, DollarSign,
  TrendingUp, TrendingDown, Shield, Award, Target,
  BarChart3, Activity, AlertTriangle, CheckCircle, Info, Zap
} from "lucide-react";

import companiesData from "../data/companies.json";
import scoringData from "../data/scoring-system-data.json";
import financialData from "../data/financial-analysis-complete.json";
import listingData from "../data/listing-potential-data.json";
import marketData from "../data/market-making-data.json";
import investmentData from "../data/investment-decision-data.json";

// ── helpers ──────────────────────────────────────────────────────────────────
function ScoreBar({ label, score, max = 100, color, explain }: {
  label: string; score: number; max?: number; color: string; explain: string;
}) {
  const pct = Math.round((score / max) * 100);
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-slate-300">{label}</span>
        <span className={`text-lg font-bold ${color}`}>{score.toFixed(1)}</span>
      </div>
      <div className="w-full bg-slate-700 rounded-full h-3 mb-1">
        <div
          className={`h-3 rounded-full transition-all duration-700 ${color.replace("text-", "bg-")}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-slate-500">{explain}</p>
    </div>
  );
}

function SectionCard({ title, icon, children }: {
  title: string; icon: React.ReactNode; children: React.ReactNode;
}) {
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

function Badge({ text, type }: { text: string; type: "green" | "blue" | "yellow" | "red" | "gray" }) {
  const cls: Record<string, string> = {
    green: "bg-green-500/20 text-green-400 border-green-500/30",
    blue:  "bg-blue-500/20  text-blue-400  border-blue-500/30",
    yellow:"bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    red:   "bg-red-500/20   text-red-400   border-red-500/30",
    gray:  "bg-slate-600/40 text-slate-400  border-slate-600/40",
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${cls[type]}`}>
      {text}
    </span>
  );
}

// ── rating colour ─────────────────────────────────────────────────────────────
function ratingColor(r: string) {
  if (r === "A" || r === "A+") return "text-green-400";
  if (r?.startsWith("A")) return "text-emerald-400";
  if (r?.startsWith("B")) return "text-blue-400";
  if (r?.startsWith("C")) return "text-yellow-400";
  return "text-red-400";
}

function adviceBadge(a: string): "green" | "blue" | "yellow" | "red" | "gray" {
  if (a === "强烈推荐") return "green";
  if (a === "推荐") return "blue";
  if (a === "中性") return "yellow";
  if (a === "避免" || a === "谨慎") return "red";
  return "gray";
}

// ── main component ────────────────────────────────────────────────────────────
export default function CompanyDetail() {
  const params = useParams<{ code: string }>();
  const [, navigate] = useLocation();
  const code = decodeURIComponent(params.code || "");

  const company    = useMemo(() => (companiesData as any[]).find(c => c.code === code), [code]);
  const scoring    = useMemo(() => (scoringData as any[]).find(c => c.code === code), [code]);
  const financial  = useMemo(() => (financialData as any[]).find(c => c.code === code), [code]);
  const listing    = useMemo(() => (listingData as any[]).find(c => c.code === code), [code]);
  const market     = useMemo(() => (marketData as any[]).find(c => c.code === code), [code]);
  const investment = useMemo(() => (investmentData as any[]).find(c => c.code === code), [code]);

  if (!company) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400 text-lg">未找到企业：{code}</p>
          <button onClick={() => navigate(-1)} className="mt-4 text-cyan-400 hover:underline">← 返回</button>
        </div>
      </div>
    );
  }

  // ── radar data ──────────────────────────────────────────────────────────────
  const radarData = scoring ? [
    { subject: "财务健康", value: scoring.financial_health, fullMark: 100 },
    { subject: "成长潜力", value: scoring.growth_potential, fullMark: 100 },
    { subject: "市场竞争力", value: scoring.market_competitiveness, fullMark: 100 },
    { subject: "风险控制", value: 100 - scoring.risk_assessment, fullMark: 100 },
  ] : [];

  // ── financial chart data ────────────────────────────────────────────────────
  const finChartData = financial?.financial_data?.map((d: any) => ({
    year: d.year,
    营收: +(d.revenue / 10000).toFixed(2),
    净利润: +(d.net_profit / 10000).toFixed(2),
    毛利率: +(d.gross_margin * 100).toFixed(1),
    ROE: +(d.roe * 100).toFixed(1),
  })) ?? [];

  // ── listing sub-scores ──────────────────────────────────────────────────────
  const listingSubScores = listing ? [
    { label: "盈利能力得分", value: +(listing.profitability_score * 100).toFixed(1), color: "text-green-400" },
    { label: "成长性得分",   value: +(listing.growth_score * 100).toFixed(1),        color: "text-blue-400" },
    { label: "市场潜力得分", value: +(listing.market_potential * 100).toFixed(1),    color: "text-purple-400" },
  ] : [];

  // ── investment rating display ───────────────────────────────────────────────
  const invRating = investment?.investment_rating ?? "—";
  const invReturn = investment ? (investment.expected_return * 100).toFixed(1) : "—";
  const invTarget = investment ? `¥${investment.target_price.toFixed(2)}` : "—";
  const invAlloc  = investment ? (investment.portfolio_allocation * 100).toFixed(1) : "—";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* ── top nav ── */}
      <div className="sticky top-0 z-20 bg-slate-900/90 backdrop-blur border-b border-slate-800 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-slate-400 hover:text-cyan-400 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />返回
        </button>
        <div className="h-4 w-px bg-slate-700" />
        <span className="text-white font-semibold">{company.short_name}</span>
        <span className="text-slate-500 text-sm">{company.code}</span>
        {scoring && (
          <span className={`ml-auto text-2xl font-bold ${ratingColor(scoring.rating)}`}>
            {scoring.rating}
          </span>
        )}
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">

        {/* ── hero card ── */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-800/50 border border-slate-700 rounded-2xl p-6 mb-6 flex flex-wrap gap-6 items-start">
          <div className="flex-1 min-w-48">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-5 h-5 text-cyan-400" />
              <h1 className="text-xl font-bold">{company.short_name}</h1>
            </div>
            <p className="text-slate-400 text-sm mb-2">{company.full_name}</p>
            <div className="flex flex-wrap gap-2">
              <Badge text={company.sector} type="blue" />
              {scoring && <Badge text={scoring.industry} type="gray" />}
              {scoring && <Badge text={scoring.investment_advice} type={adviceBadge(scoring.investment_advice)} />}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-500 text-xs">成立日期</p>
              <p className="font-medium">{company.established_date?.slice(0, 7)}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs">注册资本</p>
              <p className="font-medium">{(company.registered_capital / 10000).toFixed(1)} 亿元</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs">员工人数</p>
              <p className="font-medium">{company.employees.toLocaleString()} 人</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs">综合评分</p>
              <p className={`text-xl font-bold ${scoring ? ratingColor(scoring.rating) : "text-slate-400"}`}>
                {scoring ? scoring.overall_score.toFixed(1) : "—"}
              </p>
            </div>
          </div>
        </div>

        {/* ── 1. 综合评分透明化 ── */}
        {scoring && (
          <SectionCard title="综合评分计算过程" icon={<Award className="w-5 h-5" />}>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                {/* score bars */}
                <ScoreBar
                  label="财务健康度"
                  score={scoring.financial_health}
                  color="text-green-400"
                  explain="基于近5年营收增长、净利润率、ROE、资产负债率综合计算，满分100分"
                />
                <ScoreBar
                  label="成长潜力"
                  score={scoring.growth_potential}
                  color="text-blue-400"
                  explain="综合营收CAGR、利润CAGR、市场扩张能力、研发投入占比等指标"
                />
                <ScoreBar
                  label="市场竞争力"
                  score={scoring.market_competitiveness}
                  color="text-purple-400"
                  explain="行业地位、产品差异化程度、客户集中度、市场份额变化趋势"
                />
                <ScoreBar
                  label="风险评估（越低越好）"
                  score={scoring.risk_assessment}
                  color="text-orange-400"
                  explain="政策风险、融资风险、市场风险、技术风险的综合评估，数值越低风险越小"
                />
                {/* formula */}
                <div className="mt-4 bg-slate-900/60 rounded-lg p-3 text-xs text-slate-400 border border-slate-700">
                  <p className="font-semibold text-slate-300 mb-1 flex items-center gap-1">
                    <Info className="w-3 h-3" />计算公式
                  </p>
                  <p>综合评分 = 财务健康 × 35% + 成长潜力 × 30% + 市场竞争力 × 25% + (100 − 风险) × 10%</p>
                  <p className="mt-1 text-cyan-400 font-mono">
                    = {scoring.financial_health.toFixed(1)} × 0.35
                    + {scoring.growth_potential.toFixed(1)} × 0.30
                    + {scoring.market_competitiveness.toFixed(1)} × 0.25
                    + {(100 - scoring.risk_assessment).toFixed(1)} × 0.10
                    = <strong>{scoring.overall_score.toFixed(1)}</strong>
                  </p>
                </div>
              </div>
              <div>
                {/* radar */}
                <ResponsiveContainer width="100%" height={220}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar name="评分" dataKey="value" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.25} />
                  </RadarChart>
                </ResponsiveContainer>
                {/* strengths & risks */}
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div>
                    <p className="text-xs text-green-400 font-semibold mb-1 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />核心优势
                    </p>
                    {scoring.key_strengths.map((s: string) => (
                      <p key={s} className="text-xs text-slate-300 mb-0.5">• {s}</p>
                    ))}
                  </div>
                  <div>
                    <p className="text-xs text-red-400 font-semibold mb-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />主要风险
                    </p>
                    {scoring.key_risks.map((r: string) => (
                      <p key={r} className="text-xs text-slate-300 mb-0.5">• {r}</p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>
        )}

        {/* ── 2. 财务数据趋势 ── */}
        {financial && finChartData.length > 0 && (
          <SectionCard title="财务数据趋势（近5年）" icon={<BarChart3 className="w-5 h-5" />}>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs text-slate-400 mb-2">营收 & 净利润（万元）</p>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={finChartData} barSize={14}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="year" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                    <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8 }}
                      labelStyle={{ color: "#e2e8f0" }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="营收" fill="#06b6d4" />
                    <Bar dataKey="净利润" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-2">毛利率 & ROE（%）</p>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={finChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="year" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                    <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8 }}
                      labelStyle={{ color: "#e2e8f0" }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="毛利率" stroke="#a78bfa" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="ROE" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            {/* latest year key metrics */}
            {(() => {
              const latest = financial.financial_data[financial.financial_data.length - 1];
              return (
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: "PE", value: financial.valuation.pe_ratio.toFixed(1), sub: "市盈率" },
                    { label: "PB", value: financial.valuation.pb_ratio.toFixed(2), sub: "市净率" },
                    { label: (latest.gross_margin * 100).toFixed(1) + "%", value: "", sub: "毛利率（最新）" },
                    { label: (latest.roe * 100).toFixed(1) + "%", value: "", sub: "ROE（最新）" },
                  ].map(m => (
                    <div key={m.sub} className="bg-slate-900/50 rounded-lg p-3 text-center">
                      <p className="text-lg font-bold text-cyan-400">{m.label}{m.value}</p>
                      <p className="text-xs text-slate-500">{m.sub}</p>
                    </div>
                  ))}
                </div>
              );
            })()}
          </SectionCard>
        )}

        {/* ── 3. 上市潜力分析 ── */}
        {listing && (
          <SectionCard title="上市潜力评估" icon={<TrendingUp className="w-5 h-5" />}>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                {/* probability gauge */}
                <div className="text-center mb-4">
                  <div className="relative inline-flex items-center justify-center">
                    <svg className="w-32 h-32 -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#1e293b" strokeWidth="12" />
                      <circle
                        cx="50" cy="50" r="40" fill="none"
                        stroke={listing.listing_probability >= 70 ? "#10b981" : listing.listing_probability >= 40 ? "#f59e0b" : "#ef4444"}
                        strokeWidth="12"
                        strokeDasharray={`${listing.listing_probability * 2.513} 251.3`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute text-center">
                      <p className="text-2xl font-bold text-white">{listing.listing_probability}%</p>
                      <p className="text-xs text-slate-400">上市概率</p>
                    </div>
                  </div>
                </div>
                {/* sub-scores */}
                {listingSubScores.map(s => (
                  <ScoreBar key={s.label} label={s.label} score={s.value} color={s.color}
                    explain={
                      s.label === "盈利能力得分" ? "基于净利润率、ROE、资产回报率计算" :
                      s.label === "成长性得分"   ? "基于营收CAGR、利润增速、市场扩张速度" :
                                                  "基于行业规模、竞争格局、政策支持力度"
                    }
                  />
                ))}
                <div className="bg-slate-900/60 rounded-lg p-3 text-xs text-slate-400 border border-slate-700 mt-2">
                  <p className="font-semibold text-slate-300 mb-1 flex items-center gap-1">
                    <Info className="w-3 h-3" />上市概率计算说明
                  </p>
                  <p>上市概率 = 盈利能力 × 40% + 成长性 × 35% + 市场潜力 × 25%</p>
                  <p className="mt-1 text-cyan-400 font-mono">
                    = {listingSubScores[0]?.value} × 0.40
                    + {listingSubScores[1]?.value} × 0.35
                    + {listingSubScores[2]?.value} × 0.25
                    ≈ <strong>{listing.listing_probability}%</strong>
                  </p>
                </div>
              </div>
              <div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {[
                    { label: "预计上市年份", value: listing.estimated_listing_year, color: "text-cyan-400" },
                    { label: "预计IPO价格", value: `¥${listing.estimated_ipo_price?.toFixed(2) ?? "—"}`, color: "text-yellow-400" },
                    { label: "首日涨幅预测", value: `+${listing.estimated_first_day_return?.toFixed(1) ?? "—"}%`, color: "text-green-400" },
                    { label: "一年涨幅预测", value: `${(listing.estimated_one_year_return ?? 0) >= 0 ? "+" : ""}${listing.estimated_one_year_return?.toFixed(1) ?? "—"}%`, color: (listing.estimated_one_year_return ?? 0) >= 0 ? "text-green-400" : "text-red-400" },
                  ].map(m => (
                    <div key={m.label} className="bg-slate-900/50 rounded-lg p-3">
                      <p className="text-xs text-slate-500">{m.label}</p>
                      <p className={`text-lg font-bold ${m.color}`}>{m.value}</p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-green-400 font-semibold mb-1">有利因素</p>
                    {listing.key_factors?.map((f: string) => (
                      <p key={f} className="text-xs text-slate-300 mb-0.5">✓ {f}</p>
                    ))}
                  </div>
                  <div>
                    <p className="text-xs text-red-400 font-semibold mb-1">制约因素</p>
                    {listing.risk_factors?.map((f: string) => (
                      <p key={f} className="text-xs text-slate-300 mb-0.5">✗ {f}</p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>
        )}

        {/* ── 4. 做市机会分析 ── */}
        {market && (
          <SectionCard title="做市机会分析" icon={<Activity className="w-5 h-5" />}>
            <div className="grid md:grid-cols-3 gap-4 mb-4">
              {[
                { label: "当前价格", value: `¥${market.current_price?.toFixed(2)}`, color: "text-white" },
                { label: "流动性评分", value: market.liquidity_score?.toFixed(0), color: "text-cyan-400" },
                { label: "机会评分", value: market.opportunity_score?.toFixed(0), color: "text-yellow-400" },
                { label: "波动率", value: `${market.volatility?.toFixed(1)}%`, color: "text-orange-400" },
                { label: "上升空间", value: `+${market.upside_potential?.toFixed(1)}%`, color: "text-green-400" },
                { label: "下行风险", value: `-${market.downside_risk?.toFixed(1)}%`, color: "text-red-400" },
              ].map(m => (
                <div key={m.label} className="bg-slate-900/50 rounded-lg p-3">
                  <p className="text-xs text-slate-500">{m.label}</p>
                  <p className={`text-xl font-bold ${m.color}`}>{m.value}</p>
                </div>
              ))}
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-slate-900/60 rounded-lg p-3 border border-slate-700">
                <p className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1">
                  <Info className="w-3 h-3 text-cyan-400" />流动性评分计算说明
                </p>
                <div className="text-xs text-slate-400 space-y-1">
                  <p>• 日均成交量：{(market.estimated_daily_volume / 10000).toFixed(1)} 万股（权重 40%）</p>
                  <p>• 买卖价差：{(market.bid_ask_spread * 100).toFixed(2)}%（价差越小流动性越好，权重 35%）</p>
                  <p>• 做市商激励系数：{(market.maker_incentive * 100).toFixed(2)}%（权重 25%）</p>
                  <p className="text-cyan-400 mt-1">→ 流动性评分：<strong>{market.liquidity_score?.toFixed(0)}</strong> / 100</p>
                </div>
              </div>
              <div className="bg-slate-900/60 rounded-lg p-3 border border-slate-700">
                <p className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-yellow-400" />套利机会判断
                </p>
                <div className="text-xs text-slate-400 space-y-1">
                  <p>• 套利机会等级：<span className={market.arbitrage_opportunity === "高" ? "text-green-400" : market.arbitrage_opportunity === "中" ? "text-yellow-400" : "text-slate-400"}>{market.arbitrage_opportunity}</span></p>
                  <p>• 风险等级：<span className={market.risk_level === "低" ? "text-green-400" : market.risk_level === "中" ? "text-yellow-400" : "text-red-400"}>{market.risk_level}</span></p>
                  <p>• 机会评分 = 上升空间权重 × 50% + 流动性 × 30% + 套利机会 × 20%</p>
                  <p className="text-yellow-400 mt-1">→ 综合机会评分：<strong>{market.opportunity_score?.toFixed(0)}</strong> / 100</p>
                </div>
              </div>
            </div>
          </SectionCard>
        )}

        {/* ── 5. 投资决策 ── */}
        {investment && (
          <SectionCard title="投资决策建议" icon={<Target className="w-5 h-5" />}>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`text-3xl font-bold ${adviceBadge(invRating) === "green" ? "text-green-400" : adviceBadge(invRating) === "blue" ? "text-blue-400" : adviceBadge(invRating) === "yellow" ? "text-yellow-400" : "text-red-400"}`}>
                    {invRating}
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">综合投资建议</p>
                    <p className="text-sm text-slate-300">基于评分 {investment.overall_score.toFixed(1)} 分</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {[
                    { label: "目标价格", value: invTarget, color: "text-yellow-400" },
                    { label: "预期收益", value: `${Number(invReturn) >= 0 ? "+" : ""}${invReturn}%`, color: Number(invReturn) >= 0 ? "text-green-400" : "text-red-400" },
                    { label: "建议持仓", value: investment.holding_period, color: "text-cyan-400" },
                    { label: "配置权重", value: `${invAlloc}%`, color: "text-purple-400" },
                  ].map(m => (
                    <div key={m.label} className="bg-slate-900/50 rounded-lg p-3">
                      <p className="text-xs text-slate-500">{m.label}</p>
                      <p className={`text-lg font-bold ${m.color}`}>{m.value}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-slate-900/60 rounded-lg p-3 border border-slate-700 text-xs text-slate-400">
                  <p className="font-semibold text-slate-300 mb-1 flex items-center gap-1">
                    <Info className="w-3 h-3 text-cyan-400" />建议区间
                  </p>
                  <p>建议买入区间：¥{investment.entry_price_range[0].toFixed(2)} ~ ¥{investment.entry_price_range[1].toFixed(2)}</p>
                  <p className="mt-1">风险等级：<span className={investment.risk_rating === "低风险" ? "text-green-400" : investment.risk_rating === "中风险" ? "text-yellow-400" : "text-red-400"}>{investment.risk_rating}</span></p>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-semibold mb-2 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-yellow-400" />关键催化剂
                </p>
                <div className="space-y-2 mb-4">
                  {investment.key_catalysts?.map((c: string) => (
                    <div key={c} className="flex items-center gap-2 bg-slate-900/50 rounded-lg px-3 py-2">
                      <div className="w-2 h-2 rounded-full bg-yellow-400 flex-shrink-0" />
                      <span className="text-sm text-slate-300">{c}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-slate-900/60 rounded-lg p-3 border border-slate-700 text-xs text-slate-400">
                  <p className="font-semibold text-slate-300 mb-1 flex items-center gap-1">
                    <Info className="w-3 h-3 text-cyan-400" />投资评分计算说明
                  </p>
                  <p>投资评分综合了：</p>
                  <p>• 综合评分（来自评分系统）× 40%</p>
                  <p>• 上市潜力得分 × 30%</p>
                  <p>• 做市机会评分 × 20%</p>
                  <p>• 财务估值合理性 × 10%</p>
                  <p className="text-cyan-400 mt-1">→ 投资评分：<strong>{investment.overall_score.toFixed(1)}</strong> / 100</p>
                </div>
              </div>
            </div>
          </SectionCard>
        )}

      </div>
    </div>
  );
}
