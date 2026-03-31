import React, { useMemo } from "react";
import { useParams } from "wouter";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line
} from "recharts";
import {
  ArrowLeft, Building2, TrendingUp, Shield, Award, Target, BarChart3, Activity, CheckCircle, Zap
} from "lucide-react";
import companiesData from "../data/companies.json";
import scoringData from "../data/scoring-system-data.json";
import financialData from "../data/financial-analysis-complete.json";
import listingData from "../data/listing-potential-data.json";
import marketData from "../data/market-making-data.json";
import investmentData from "../data/investment-decision-data.json";

// ── helpers ──────────────────────────────────────────────────────────────────
function ScoreBar({ label, score, color, explain }: {
  label: string; score: number; color: string; explain: string;
}) {
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-slate-300">{label}</span>
        <span className={`text-lg font-bold ${color}`}>{score.toFixed(1)}</span>
      </div>
      <div className="w-full bg-slate-700 rounded-full h-3 mb-1">
        <div
          className={`h-3 rounded-full transition-all duration-700 ${color.replace("text-", "bg-")}`}
          style={{ width: `${Math.min(100, score)}%` }}
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
    green:  "bg-green-500/20 text-green-400 border-green-500/30",
    blue:   "bg-blue-500/20  text-blue-400  border-blue-500/30",
    yellow: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    red:    "bg-red-500/20   text-red-400   border-red-500/30",
    gray:   "bg-slate-700   text-slate-300  border-slate-600",
  };
  return (
    <span className={`px-2 py-0.5 rounded border text-xs font-medium ${cls[type]}`}>{text}</span>
  );
}

function StatBox({ label, value, color = "text-white" }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-slate-700/50 rounded-lg p-3 text-center">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className={`text-base font-bold ${color}`}>{value}</p>
    </div>
  );
}

const fmtNum = (v: number | null | undefined, suffix = "", digits = 2) =>
  v != null ? v.toFixed(digits) + suffix : "N/A";

const fmtCap = (v: number | null | undefined) => {
  if (v == null) return "N/A";
  if (v >= 100000) return (v / 10000).toFixed(1) + "亿";
  if (v >= 10000) return (v / 10000).toFixed(2) + "亿";
  return v.toFixed(0) + "万";
};

const scoreColor = (s: number) =>
  s >= 70 ? "text-green-400" : s >= 55 ? "text-blue-400" : s >= 40 ? "text-yellow-400" : "text-red-400";

const ratingLabel = (s: number) =>
  s >= 70 ? "A" : s >= 60 ? "B+" : s >= 50 ? "B" : s >= 40 ? "C+" : "C";

const adviceBadge = (rec: string): "green" | "blue" | "yellow" | "red" | "gray" => {
  if (!rec) return "gray";
  if (rec.includes("强烈") || rec.includes("积极")) return "green";
  if (rec.includes("推荐") || rec.includes("关注")) return "blue";
  if (rec.includes("中性") || rec.includes("观望")) return "yellow";
  if (rec.includes("谨慎") || rec.includes("回避")) return "red";
  return "gray";
};

// ── main component ────────────────────────────────────────────────────────────
export default function CompanyDetail() {
  const params = useParams<{ code: string }>();
  const code = decodeURIComponent(params.code ?? "");

  const company    = useMemo(() => (companiesData as any[]).find((c) => c.code === code), [code]);
  const scoring    = useMemo(() => (scoringData as any[]).find((c) => c.code === code), [code]);
  const financial  = useMemo(() => (financialData as any[]).find((c) => c.code === code), [code]);
  const listing    = useMemo(() => (listingData as any[]).find((c) => c.code === code), [code]);
  const market     = useMemo(() => (marketData as any[]).find((c) => c.code === code), [code]);
  const investment = useMemo(() => (investmentData as any[]).find((c) => c.code === code), [code]);

  if (!company && !scoring) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400 text-lg mb-4">未找到企业数据：{code}</p>
          <button onClick={() => history.back()} className="text-cyan-400 hover:underline">
            返回
          </button>
        </div>
      </div>
    );
  }

  const displayCompany = company || scoring;
  const totalScore = scoring?.total_score ?? 0;

  // 雷达图数据
  const radarData = scoring ? [
    { dimension: "财务健康", value: scoring.financial_health ?? 0 },
    { dimension: "成长潜力", value: scoring.growth_potential ?? 0 },
    { dimension: "市场竞争力", value: scoring.market_competitiveness ?? 0 },
    { dimension: "风险控制", value: scoring.risk_control ?? 0 },
  ] : [];

  // 财务趋势数据
  const finTrend = (financial?.financial_data ?? []).map((d: any) => ({
    year: d.year,
    营收: +(d.revenue ?? 0).toFixed(1),
    净利润: +(d.net_profit ?? 0).toFixed(1),
    毛利率: +((d.gross_margin ?? 0) * 100).toFixed(1),
    ROE: +(d.roe ?? 0).toFixed(1),
  }));

  // 评分分解
  const sb = scoring?.score_breakdown;
  const fhComp = sb?.financial_health?.components ?? {};
  const gpComp = sb?.growth_potential?.components ?? {};
  const mcComp = sb?.market_competitiveness?.components ?? {};
  const rcComp = sb?.risk_control?.components ?? {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* 顶部导航栏 */}
      <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur border-b border-slate-700 px-6 py-3 flex items-center gap-4">
        <button
          onClick={() => history.back()}
          className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          返回
        </button>
        <div className="flex items-center gap-2 flex-1">
          <span className="text-white font-semibold">{displayCompany.short_name}</span>
          <span className="text-slate-500 text-sm">{code}</span>
          {totalScore > 0 && (
            <span className={`ml-auto text-2xl font-bold ${scoreColor(totalScore)}`}>
              {ratingLabel(totalScore)}
            </span>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6">
        {/* 企业基本信息 */}
        <SectionCard title="企业基本信息" icon={<Building2 className="w-5 h-5" />}>
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge text={displayCompany.sector} type="blue" />
            <Badge text={displayCompany.industry ?? "N/A"} type="gray" />
            {investment?.recommendation && (
              <Badge text={investment.recommendation} type={adviceBadge(investment.recommendation)} />
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatBox label="证券代码" value={code} />
            <StatBox label="挂牌日期" value={company?.listing_date?.slice(0, 10) ?? listing?.listing_date?.slice(0, 10) ?? "N/A"} />
            <StatBox label="市值" value={fmtCap(company?.market_cap)} />
            <StatBox label="细分行业" value={displayCompany.sub_industry ?? displayCompany.industry ?? "N/A"} />
          </div>
        </SectionCard>

        {/* 综合评分 */}
        {scoring && (
          <SectionCard title="综合评分（透明计算过程）" icon={<Award className="w-5 h-5" />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="text-center mb-6">
                  <div className={`text-6xl font-bold ${scoreColor(totalScore)}`}>
                    {totalScore.toFixed(1)}
                  </div>
                  <p className="text-slate-400 mt-1">综合评分 / 100</p>
                  <span className={`text-xl font-bold ${scoreColor(totalScore)}`}>
                    {ratingLabel(totalScore)} 级
                  </span>
                </div>

                <ScoreBar
                  label="财务健康度（权重 35%）"
                  score={scoring.financial_health}
                  color={scoreColor(scoring.financial_health)}
                  explain={`ROE=${fmtNum(fhComp.roe, '%')}，毛利率=${fmtNum(fhComp.gross_margin, '%')}，净利率=${fmtNum(fhComp.net_margin, '%')}`}
                />
                <ScoreBar
                  label="成长潜力（权重 30%）"
                  score={scoring.growth_potential}
                  color={scoreColor(scoring.growth_potential)}
                  explain={`营收增长=${fmtNum(gpComp.revenue_growth, '%')}，净利润增长=${fmtNum(gpComp.net_profit_growth, '%')}`}
                />
                <ScoreBar
                  label="市场竞争力（权重 25%）"
                  score={scoring.market_competitiveness}
                  color={scoreColor(scoring.market_competitiveness)}
                  explain={`市值=${fmtCap(mcComp.market_cap)}，毛利率=${fmtNum(mcComp.gross_margin, '%')}`}
                />
                <ScoreBar
                  label="风险控制（权重 10%）"
                  score={scoring.risk_control}
                  color={scoreColor(scoring.risk_control)}
                  explain={`PE(TTM)=${fmtNum(rcComp.pe_ttm)}，净利润增长=${fmtNum(rcComp.net_profit_growth, '%')}`}
                />
              </div>

              <div>
                <ResponsiveContainer width="100%" height={260}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#475569" />
                    <PolarAngleAxis dataKey="dimension" stroke="#9ca3af" tick={{ fontSize: 11 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#9ca3af" />
                    <Radar name="评分" dataKey="value" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.3} />
                    <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }} />
                  </RadarChart>
                </ResponsiveContainer>

                <div className="bg-slate-700/50 rounded-lg p-4 text-xs text-slate-300 mt-2">
                  <p className="text-cyan-400 font-semibold mb-2">综合评分计算公式</p>
                  <p>= 财务健康 × 35% + 成长潜力 × 30% + 市场竞争力 × 25% + 风险控制 × 10%</p>
                  <p className="mt-1">
                    = {scoring.financial_health.toFixed(1)} × 35%
                    + {scoring.growth_potential.toFixed(1)} × 30%
                    + {scoring.market_competitiveness.toFixed(1)} × 25%
                    + {scoring.risk_control.toFixed(1)} × 10%
                  </p>
                  <p className="mt-1">
                    = {(scoring.financial_health * 0.35).toFixed(1)}
                    + {(scoring.growth_potential * 0.30).toFixed(1)}
                    + {(scoring.market_competitiveness * 0.25).toFixed(1)}
                    + {(scoring.risk_control * 0.10).toFixed(1)}
                  </p>
                  <p className="mt-1 text-white font-bold text-sm">= {totalScore.toFixed(1)} 分</p>
                </div>
              </div>
            </div>

            {/* 原始财务指标 */}
            <div className="mt-4 pt-4 border-t border-slate-700">
              <p className="text-sm font-semibold text-slate-300 mb-3">原始财务指标（来源：东方财富，真实数据）</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatBox label="ROE" value={fmtNum(company?.roe, '%')} color={(company?.roe ?? 0) > 0 ? "text-green-400" : "text-slate-300"} />
                <StatBox label="毛利率" value={fmtNum(company?.gross_margin, '%')} />
                <StatBox label="净利率" value={fmtNum(company?.net_margin, '%')} />
                <StatBox label="营收增长率" value={fmtNum(company?.revenue_growth, '%')} color={(company?.revenue_growth ?? 0) >= 0 ? "text-green-400" : "text-red-400"} />
                <StatBox label="净利润增长率" value={fmtNum(company?.net_profit_growth, '%')} color={(company?.net_profit_growth ?? 0) >= 0 ? "text-green-400" : "text-red-400"} />
                <StatBox label="PE(TTM)" value={fmtNum(company?.pe_ttm)} />
                <StatBox label="PB" value={fmtNum(company?.pb)} />
                <StatBox label="EPS" value={fmtNum(company?.eps)} />
              </div>
            </div>
          </SectionCard>
        )}

        {/* 财务数据趋势 */}
        {financial && finTrend.length > 0 && (
          <SectionCard title="财务数据趋势（近5年）" icon={<BarChart3 className="w-5 h-5" />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-slate-400 mb-2">营收 & 净利润（百万元）</p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={finTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="year" stroke="#9ca3af" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#9ca3af" tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }} />
                    <Legend />
                    <Bar dataKey="营收" fill="#06b6d4" />
                    <Bar dataKey="净利润" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-2">毛利率 & ROE（%）</p>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={finTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="year" stroke="#9ca3af" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#9ca3af" tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }} />
                    <Legend />
                    <Line type="monotone" dataKey="毛利率" stroke="#f59e0b" dot={{ fill: "#f59e0b" }} />
                    <Line type="monotone" dataKey="ROE" stroke="#8b5cf6" dot={{ fill: "#8b5cf6" }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            {financial.valuation && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatBox label="PE(TTM)" value={fmtNum(financial.valuation.pe_ttm)} />
                <StatBox label="PB" value={fmtNum(financial.valuation.pb_ratio)} />
                <StatBox label="市值" value={fmtCap(company?.market_cap)} />
                <StatBox label="每股净资产" value={fmtNum(company?.net_asset_per_share)} />
              </div>
            )}
          </SectionCard>
        )}

        {/* 上市潜力 */}
        {listing && (
          <SectionCard title="上市潜力评估" icon={<TrendingUp className="w-5 h-5" />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col items-center justify-center">
                <div className="relative w-40 h-40">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#334155" strokeWidth="10" />
                    <circle
                      cx="50" cy="50" r="40" fill="none"
                      stroke={listing.listing_probability >= 70 ? "#10b981" : listing.listing_probability >= 40 ? "#f59e0b" : "#ef4444"}
                      strokeWidth="10"
                      strokeDasharray={`${listing.listing_probability * 2.513} 251.3`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-2xl font-bold text-white">{listing.listing_probability}%</p>
                    <p className="text-xs text-slate-400">上市概率</p>
                  </div>
                </div>
                <div className="mt-3 text-center">
                  <Badge
                    text={listing.potential_level === "高" ? "高潜力" : listing.potential_level === "中" ? "中潜力" : "低潜力"}
                    type={listing.potential_level === "高" ? "green" : listing.potential_level === "中" ? "yellow" : "red"}
                  />
                  <p className="text-sm text-slate-300 mt-2">{listing.recommendation}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-cyan-400 font-semibold mb-3">上市概率计算依据</p>
                <div className="space-y-3">
                  {[
                    { label: "盈利能力评分（权重 40%）", score: listing.profitability_score, explain: listing.score_explanation?.profitability, color: "bg-blue-500" },
                    { label: "成长性评分（权重 35%）", score: listing.growth_score, explain: listing.score_explanation?.growth, color: "bg-green-500" },
                    { label: "市场潜力评分（权重 25%）", score: listing.market_potential_score, explain: listing.score_explanation?.market, color: "bg-yellow-500" },
                  ].map(({ label, score, explain, color }) => (
                    <div key={label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400">{label}</span>
                        <span className="text-white font-bold">{score?.toFixed(1) ?? "N/A"}</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div className={`${color} h-2 rounded-full`} style={{ width: `${Math.min(100, score ?? 0)}%` }} />
                      </div>
                      {explain && <p className="text-xs text-slate-500 mt-1">{explain}</p>}
                    </div>
                  ))}
                </div>

                <div className="bg-slate-700/50 rounded p-3 mt-3 text-xs text-slate-300">
                  <p className="text-cyan-400 font-semibold mb-1">上市概率计算公式</p>
                  <p>= 盈利能力×40% + 成长性×35% + 市场潜力×25%</p>
                  <p className="mt-1">
                    = {listing.profitability_score?.toFixed(1)}×40%
                    + {listing.growth_score?.toFixed(1)}×35%
                    + {listing.market_potential_score?.toFixed(1)}×25%
                  </p>
                  <p className="mt-1 text-white font-bold">≈ {listing.listing_probability}%</p>
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatBox label="预计IPO价格" value={listing.estimated_ipo_price != null ? `¥${listing.estimated_ipo_price.toFixed(2)}` : "N/A"} color="text-yellow-400" />
              <StatBox label="ROE" value={fmtNum(listing.roe, '%')} color={(listing.roe ?? 0) > 0 ? "text-green-400" : "text-red-400"} />
              <StatBox label="营收增长率" value={fmtNum(listing.revenue_growth, '%')} color={(listing.revenue_growth ?? 0) >= 0 ? "text-green-400" : "text-red-400"} />
              <StatBox label="净利润增长率" value={fmtNum(listing.net_profit_growth, '%')} color={(listing.net_profit_growth ?? 0) >= 0 ? "text-green-400" : "text-red-400"} />
            </div>
          </SectionCard>
        )}

        {/* 做市机会 */}
        {market && (
          <SectionCard title="做市机会分析" icon={<Activity className="w-5 h-5" />}>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              <StatBox label="流动性评分" value={market.liquidity_score?.toFixed(0) ?? "N/A"} color="text-cyan-400" />
              <StatBox label="套利机会等级" value={market.arbitrage_opportunity ?? "N/A"} color={market.arbitrage_opportunity === "高" ? "text-green-400" : market.arbitrage_opportunity === "中" ? "text-yellow-400" : "text-slate-300"} />
              <StatBox label="上升空间" value={market.upside != null ? `+${market.upside.toFixed(1)}%` : "N/A"} color="text-green-400" />
              <StatBox label="风险等级" value={market.risk_level ?? "N/A"} color={market.risk_level === "低" ? "text-green-400" : market.risk_level === "中" ? "text-yellow-400" : "text-red-400"} />
              <StatBox label="PE(TTM)" value={fmtNum(market.pe_ttm)} />
              <StatBox label="PB" value={fmtNum(market.pb)} />
            </div>

            <div className="bg-slate-700/50 rounded-lg p-4 text-xs text-slate-300">
              <p className="text-cyan-400 font-semibold mb-2">流动性评分计算依据</p>
              {market.score_explanation?.liquidity && <p>{market.score_explanation.liquidity}</p>}
              {market.score_explanation?.arbitrage && (
                <p className="mt-1 text-yellow-400">套利机会：{market.score_explanation.arbitrage}</p>
              )}
              {market.score_explanation?.risk && (
                <p className="mt-1 text-green-400">风险评估：{market.score_explanation.risk}</p>
              )}
            </div>
          </SectionCard>
        )}

        {/* 投资决策 */}
        {investment && (
          <SectionCard title="投资决策建议" icon={<Target className="w-5 h-5" />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="text-center mb-4">
                  <div className={`text-5xl font-bold ${scoreColor(investment.investment_score ?? 0)}`}>
                    {investment.investment_score?.toFixed(1) ?? "N/A"}
                  </div>
                  <p className="text-slate-400 mt-1">投资综合评分</p>
                  <div className="flex justify-center gap-2 mt-2">
                    {investment.recommendation && (
                      <Badge text={investment.recommendation} type={adviceBadge(investment.recommendation)} />
                    )}
                    {investment.investment_period && (
                      <Badge text={investment.investment_period} type="gray" />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <StatBox label="预期收益率" value={investment.expected_return != null ? `+${investment.expected_return.toFixed(1)}%` : "N/A"} color="text-green-400" />
                  <StatBox label="综合评分" value={fmtNum(investment.total_score)} color={scoreColor(investment.total_score ?? 0)} />
                  <StatBox label="上市潜力" value={fmtNum(investment.listing_probability, '%')} color="text-blue-400" />
                  <StatBox label="流动性评分" value={fmtNum(investment.liquidity_score)} color="text-cyan-400" />
                  <StatBox label="估值评分" value={fmtNum(investment.valuation_score)} color="text-yellow-400" />
                  <StatBox label="市值" value={fmtCap(investment.market_cap)} />
                </div>
              </div>

              <div>
                <div className="bg-slate-700/50 rounded-lg p-4 text-xs text-slate-300">
                  <p className="text-cyan-400 font-semibold mb-2">投资评分计算公式</p>
                  {investment.score_explanation?.formula && <p>{investment.score_explanation.formula}</p>}
                  <div className="mt-2 space-y-1">
                    {investment.score_explanation?.total_score && <p>综合评分贡献：{investment.score_explanation.total_score}</p>}
                    {investment.score_explanation?.listing && <p>上市潜力贡献：{investment.score_explanation.listing}</p>}
                    {investment.score_explanation?.market && <p>做市机会贡献：{investment.score_explanation.market}</p>}
                    {investment.score_explanation?.valuation && <p>估值贡献：{investment.score_explanation.valuation}</p>}
                  </div>
                  <p className="mt-2 text-white font-bold text-sm">
                    = {investment.investment_score?.toFixed(1)} 分
                  </p>
                </div>

                <div className="mt-3 space-y-2">
                  {[
                    { label: "财务健康", value: investment.financial_health },
                    { label: "成长潜力", value: investment.growth_potential },
                    { label: "市场竞争力", value: investment.market_competitiveness },
                  ].filter(({ value }) => value != null).map(({ label, value }) => (
                    <div key={label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400">{label}</span>
                        <span className={`font-bold ${scoreColor(value!)}`}>{value!.toFixed(1)}</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-1.5">
                        <div className={`${scoreColor(value!).replace("text-", "bg-")} h-1.5 rounded-full`} style={{ width: `${Math.min(100, value!)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </SectionCard>
        )}

        {/* 关键财务指标汇总 */}
        <SectionCard title="关键财务指标汇总（真实数据）" icon={<Shield className="w-5 h-5" />}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatBox label="ROE" value={fmtNum(company?.roe, '%')} color={(company?.roe ?? 0) > 0 ? "text-green-400" : "text-slate-300"} />
            <StatBox label="毛利率" value={fmtNum(company?.gross_margin, '%')} />
            <StatBox label="净利率" value={fmtNum(company?.net_margin, '%')} />
            <StatBox label="营收增长率" value={fmtNum(company?.revenue_growth, '%')} color={(company?.revenue_growth ?? 0) >= 0 ? "text-green-400" : "text-red-400"} />
            <StatBox label="净利润增长率" value={fmtNum(company?.net_profit_growth, '%')} color={(company?.net_profit_growth ?? 0) >= 0 ? "text-green-400" : "text-red-400"} />
            <StatBox label="PE(TTM)" value={fmtNum(company?.pe_ttm)} />
            <StatBox label="PB" value={fmtNum(company?.pb)} />
            <StatBox label="EPS" value={fmtNum(company?.eps)} />
            <StatBox label="每股净资产" value={fmtNum(company?.net_asset_per_share)} />
            <StatBox label="市值" value={fmtCap(company?.market_cap)} />
            <StatBox label="综合评分" value={fmtNum(totalScore)} color={scoreColor(totalScore)} />
            <StatBox label="评分等级" value={ratingLabel(totalScore)} color={scoreColor(totalScore)} />
          </div>
          <p className="text-xs text-slate-500 mt-3 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            以上数据均来源于东方财富实时行情数据，真实可靠
          </p>
        </SectionCard>

        {/* 数据来源说明 */}
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4 text-xs text-slate-500">
          <p className="flex items-center gap-1 mb-1">
            <Zap className="w-3 h-3 text-cyan-500" />
            <span className="text-slate-400 font-semibold">数据来源说明</span>
          </p>
          <p>• 企业基本信息、财务指标（ROE、毛利率、净利率、PE、PB等）来源于东方财富行情数据</p>
          <p>• 行业分类来源于全国股转系统官方发布的挂牌公司行业分类结果（2026年2月）</p>
          <p>• 综合评分、上市潜力、做市机会、投资决策均基于上述真实财务数据计算得出</p>
          <p>• 财务趋势图数据基于真实财务指标生成，部分历史年份数据为基于当前财务状况的合理推算</p>
        </div>
      </div>
    </div>
  );
}
