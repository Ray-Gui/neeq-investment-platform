import React, { useState, useMemo, useEffect } from "react";
import { useLocation } from "wouter";
import {
  Search, ChevronLeft, ChevronRight, Building2, Info, Loader2, ArrowLeft,
  ChevronDown, ChevronUp, Award, BarChart3, Activity, AlertTriangle, CheckCircle,
  DollarSign, TrendingUp,
} from "lucide-react";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, ReferenceLine,
} from "recharts";

// ── 工具函数 ────────────────────────────────────────────────────
const fmt = (v: number | null | undefined, suffix = "", digits = 2): string => {
  if (v == null || isNaN(Number(v))) return "/";
  return Number(v).toFixed(digits) + suffix;
};

const fmtCap = (v: number | null | undefined): string => {
  if (v == null) return "/";
  if (v >= 10000) return (v / 10000).toFixed(2) + " 亿";
  return v.toFixed(0) + " 万";
};

// 数据单位为万元
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

function getLatestFin(company: any) {
  const fd = company.financial_data;
  if (!fd || !Array.isArray(fd) || fd.length === 0) return null;
  return [...fd].sort((a: any, b: any) => (b.fiscal_year ?? 0) - (a.fiscal_year ?? 0))[0];
}

function calcScore(company: any): number | null {
  const fin = getLatestFin(company);
  if (!fin) return null;
  const roeScore = fin.roe != null ? Math.min(35, (fin.roe / 30) * 35) : 0;
  const gmScore = fin.gross_margin != null ? Math.min(15, (fin.gross_margin / 60) * 15) : 0;
  const nmScore = fin.net_margin != null ? Math.min(10, (fin.net_margin / 25) * 10) : 0;
  const rvgScore = fin.revenue_growth != null ? Math.min(15, Math.max(0, (fin.revenue_growth / 40) * 15)) : 0;
  const npgScore = fin.net_profit_growth != null ? Math.min(15, Math.max(0, (fin.net_profit_growth / 40) * 15)) : 0;
  const drScore = fin.debt_ratio != null ? Math.min(10, ((100 - fin.debt_ratio) / 60) * 10) : 0;
  const crScore = fin.current_ratio != null ? Math.min(10, (fin.current_ratio / 3) * 10) : 0;
  const revScore = fin.revenue != null ? Math.min(15, (Math.log10(fin.revenue + 1) / 9) * 15) : 0;
  return Math.min(100, Math.round(roeScore + gmScore + nmScore + rvgScore + npgScore + drScore + crScore + revScore));
}

function calcDetailScores(finData: any[]) {
  if (!finData || finData.length === 0) return null;
  const latest = [...finData].sort((a: any, b: any) => (b.fiscal_year ?? 0) - (a.fiscal_year ?? 0))[0];
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

function calcSectorStats(companies: any[]) {
  const withFin = companies.filter((c) => getLatestFin(c));
  if (withFin.length === 0) return null;
  const avgROE = withFin.reduce((s: number, c: any) => s + (getLatestFin(c)?.roe ?? 0), 0) / withFin.length;
  const avgGM = withFin.reduce((s: number, c: any) => s + (getLatestFin(c)?.gross_margin ?? 0), 0) / withFin.length;
  return { avgROE, avgGM, withFinCount: withFin.length };
}

const sectorColor: Record<string, string> = {
  "医疗健康": "text-green-400 bg-green-500/10 border-green-500/30",
  "新能源": "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
  "人工智能": "text-blue-400 bg-blue-500/10 border-blue-500/30",
};

const scoreColor = (s: number | null): string => {
  if (s == null) return "text-slate-500";
  if (s >= 70) return "text-green-400";
  if (s >= 55) return "text-cyan-400";
  if (s >= 40) return "text-yellow-400";
  return "text-red-400";
};

// ── 评分环形图 ───────────────────────────────────────────────────
function ScoreRing({ score, label }: { score: number; label: string }) {
  const color = score >= 70 ? "#10b981" : score >= 55 ? "#06b6d4" : score >= 40 ? "#f59e0b" : "#ef4444";
  const r = 36;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div className="flex flex-col items-center">
      <svg width="88" height="88" viewBox="0 0 88 88">
        <circle cx="44" cy="44" r={r} fill="none" stroke="#334155" strokeWidth="9" />
        <circle cx="44" cy="44" r={r} fill="none" stroke={color} strokeWidth="9"
          strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round" transform="rotate(-90 44 44)" />
        <text x="44" y="41" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">{score}</text>
        <text x="44" y="54" textAnchor="middle" fill="#94a3b8" fontSize="9">{label}</text>
      </svg>
    </div>
  );
}

// ── 指标卡片 ─────────────────────────────────────────────────────
function StatBox({ label, value, color = "text-white", sub }: { label: string; value: string; color?: string; sub?: string }) {
  return (
    <div className="bg-slate-700/50 rounded-lg p-3 text-center">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className={`text-sm font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
    </div>
  );
}

// ── 内嵌详情面板 ─────────────────────────────────────────────────
function CompanyDetailPanel({ company }: { company: any }) {
  const finData: any[] = useMemo(() => {
    const fd = company.financial_data;
    if (!fd || !Array.isArray(fd)) return [];
    return fd;
  }, [company]);

  const scores = useMemo(() => calcDetailScores(finData), [finData]);
  const latestFin = scores?.latest ?? null;
  const latestYear = latestFin?.fiscal_year ?? 2024;

  const trendData = useMemo(() => {
    if (!finData.length) return [];
    return [...finData]
      .sort((a: any, b: any) => (a.fiscal_year ?? 0) - (b.fiscal_year ?? 0))
      .map((d: any) => ({
        year: d.fiscal_year,
        营收: d.revenue != null ? +(d.revenue / 10000).toFixed(3) : null,
        净利润: d.net_profit != null ? +(d.net_profit / 10000).toFixed(3) : null,
        毛利率: d.gross_margin != null ? +d.gross_margin.toFixed(2) : null,
        净利率: d.net_margin != null ? +d.net_margin.toFixed(2) : null,
        ROE: d.roe != null ? +d.roe.toFixed(2) : null,
      }));
  }, [finData]);

  const radarData = useMemo(() => {
    if (!latestFin) return [];
    const norm = (v: number | null, min: number, max: number) =>
      v == null ? 0 : Math.max(0, Math.min(100, ((v - min) / (max - min)) * 100));
    return [
      { metric: "盈利能力", 公司: norm(latestFin.roe, 0, 30) },
      { metric: "毛利水平", 公司: norm(latestFin.gross_margin, 0, 80) },
      { metric: "净利水平", 公司: norm(latestFin.net_margin, 0, 40) },
      { metric: "成长性", 公司: norm(latestFin.revenue_growth, -20, 50) },
      { metric: "偿债能力", 公司: norm(latestFin.current_ratio, 0.5, 5) },
      { metric: "财务稳健", 公司: norm(100 - (latestFin.debt_ratio ?? 50), 0, 100) },
    ];
  }, [latestFin]);

  const rating = useMemo(() => {
    if (!scores) return null;
    const s = scores.total;
    if (s >= 75) return { label: "强烈推荐", cls: "bg-green-500/10 border-green-500/30 text-green-400", desc: "各项财务指标优异，具备较强投资价值" };
    if (s >= 60) return { label: "推荐关注", cls: "bg-blue-500/10 border-blue-500/30 text-blue-400", desc: "财务表现良好，建议持续跟踪" };
    if (s >= 45) return { label: "中性观望", cls: "bg-yellow-500/10 border-yellow-500/30 text-yellow-400", desc: "财务指标一般，需关注改善情况" };
    return { label: "谨慎回避", cls: "bg-red-500/10 border-red-500/30 text-red-400", desc: "财务存在一定风险，建议谨慎" };
  }, [scores]);

  const risks = useMemo(() => {
    if (!latestFin) return [];
    const r: { level: "red" | "yellow"; text: string }[] = [];
    if (latestFin.debt_ratio != null && latestFin.debt_ratio > 70)
      r.push({ level: "red", text: `资产负债率偏高（${fmt(latestFin.debt_ratio, "%", 1)}），超过 70% 警戒线` });
    if (latestFin.current_ratio != null && latestFin.current_ratio < 1.0)
      r.push({ level: "red", text: `流动比率不足 1.0（当前 ${fmt(latestFin.current_ratio, "x", 2)}），短期偿债能力存在风险` });
    if (latestFin.net_profit != null && latestFin.net_profit < 0)
      r.push({ level: "red", text: `${latestYear} 年度净利润为负（${fmtRevenue(latestFin.net_profit)}），公司处于亏损状态` });
    if (latestFin.net_profit_growth != null && latestFin.net_profit_growth < -30)
      r.push({ level: "yellow", text: `净利润同比下滑 ${Math.abs(latestFin.net_profit_growth).toFixed(1)}%，盈利能力出现较大下滑` });
    if (latestFin.revenue_growth != null && latestFin.revenue_growth < -10)
      r.push({ level: "yellow", text: `营收同比下滑 ${Math.abs(latestFin.revenue_growth).toFixed(1)}%，需关注业务增长压力` });
    return r;
  }, [latestFin, latestYear]);

  return (
    <div className="bg-slate-900/80 border-t border-slate-600 px-6 py-5">
      {/* 基本信息 */}
      <div className="flex flex-wrap gap-3 mb-5 text-xs text-slate-400">
        <span>代码：<span className="text-white font-mono">{company.code}</span></span>
        <span>行业：<span className="text-white">{company.industry ?? company.sector ?? "/"}</span></span>
        <span>挂牌层级：<span className="text-white">{company.neeq_layer ?? "/"}</span></span>
        <span>挂牌日期：<span className="text-white">{company.neeq_listing_date?.slice(0, 10) ?? "/"}</span></span>
        <span>北交所状态：<span className={`font-medium ${company.bse_listing_status === "已上市" ? "text-green-400" : company.bse_listing_status === "申报中" ? "text-yellow-400" : "text-slate-300"}`}>{company.bse_listing_status ?? "/"}</span></span>
        {company.province && <span>省份：<span className="text-white">{company.province}</span></span>}
        {company.main_business && <span className="max-w-xs">主营：<span className="text-white">{company.main_business}</span></span>}
      </div>

      {/* 综合评分 */}
      {scores ? (
        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">综合投资评分（基于真实财报数据）</h3>
          </div>
          <div className="flex flex-wrap gap-4 items-start">
            <div className="flex gap-3">
              <ScoreRing score={scores.total} label="综合" />
              <ScoreRing score={scores.profitability} label="盈利" />
              <ScoreRing score={scores.growth} label="成长" />
              <ScoreRing score={scores.stability} label="稳健" />
            </div>
            <div className="flex-1 min-w-48 space-y-2">
              {[
                { label: "盈利能力（ROE/毛利率/净利率）", score: scores.profitability, max: 60, color: "bg-cyan-500" },
                { label: "成长性（营收/利润增速）", score: scores.growth, max: 30, color: "bg-green-500" },
                { label: "财务稳健（负债率/流动比率）", score: scores.stability, max: 20, color: "bg-yellow-500" },
              ].map(({ label, score, max, color }) => (
                <div key={label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">{label}</span>
                    <span className="text-white font-medium">{score}/{max}</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-1.5">
                    <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${(score / max) * 100}%` }} />
                  </div>
                </div>
              ))}
              {rating && (
                <div className={`px-3 py-2 rounded-lg border text-xs mt-2 ${rating.cls}`}>
                  <span className="font-bold">{rating.label}</span>
                  <span className="ml-2 opacity-80">{rating.desc}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 mb-4 text-slate-500 text-sm text-center">
          该公司暂无财务数据，无法计算评分
        </div>
      )}

      {/* 核心财务指标 */}
      {latestFin && (
        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">核心财务指标（{latestYear} 年度）</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <StatBox label="营业收入" value={fmtRevenue(latestFin.revenue)} color="text-cyan-400"
              sub={latestFin.revenue_growth != null ? `同比 ${fmt(latestFin.revenue_growth, "%", 1)}` : "同比 /"} />
            <StatBox label="净利润" value={fmtRevenue(latestFin.net_profit)}
              color={(latestFin.net_profit ?? 0) >= 0 ? "text-green-400" : "text-red-400"}
              sub={latestFin.net_profit_growth != null ? `同比 ${fmt(latestFin.net_profit_growth, "%", 1)}` : "同比 /"} />
            <StatBox label="毛利率" value={fmt(latestFin.gross_margin, "%", 1)} color="text-yellow-400" />
            <StatBox label="净利率" value={fmt(latestFin.net_margin, "%", 1)} color="text-purple-400" />
            <StatBox label="ROE" value={fmt(latestFin.roe, "%", 1)} color="text-blue-400" />
            <StatBox label="资产负债率" value={fmt(latestFin.debt_ratio, "%", 1)}
              color={(latestFin.debt_ratio ?? 0) > 70 ? "text-red-400" : "text-orange-400"} />
            <StatBox label="流动比率" value={fmt(latestFin.current_ratio, "x", 2)}
              color={(latestFin.current_ratio ?? 0) >= 1.5 ? "text-green-400" : "text-yellow-400"} />
            <StatBox label="每股收益（EPS）" value={latestFin.eps != null ? `¥${fmt(latestFin.eps, "", 2)}` : "/"} />
          </div>
        </div>
      )}

      {/* 历史趋势图 + 雷达图 */}
      {trendData.length > 0 && (
        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">历史财务趋势</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 营收 & 净利润柱状图 */}
            <div>
              <p className="text-xs text-slate-400 mb-2">营收 & 净利润（亿元）</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={trendData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="year" stroke="#9ca3af" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#9ca3af" tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569", fontSize: 11 }}
                    formatter={(v: any, name: string) => [v != null ? `${v} 亿` : "/", name]} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="营收" fill="#06b6d4" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="净利润" fill="#10b981" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* 盈利能力折线图 */}
            <div>
              <p className="text-xs text-slate-400 mb-2">盈利能力趋势（%）</p>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={trendData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="year" stroke="#9ca3af" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#9ca3af" tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569", fontSize: 11 }}
                    formatter={(v: any, name: string) => [v != null ? `${v}%` : "/", name]} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <ReferenceLine y={15} stroke="#10b981" strokeDasharray="3 3" />
                  <Line type="monotone" dataKey="毛利率" stroke="#f59e0b" dot={{ r: 3 }} connectNulls />
                  <Line type="monotone" dataKey="净利率" stroke="#8b5cf6" dot={{ r: 3 }} connectNulls />
                  <Line type="monotone" dataKey="ROE" stroke="#06b6d4" dot={{ r: 3 }} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
            {/* 雷达图 */}
            {radarData.length > 0 && (
              <div>
                <p className="text-xs text-slate-400 mb-2">综合能力雷达图</p>
                <ResponsiveContainer width="100%" height={180}>
                  <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis dataKey="metric" stroke="#94a3b8" tick={{ fontSize: 9 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#475569" tick={{ fontSize: 8 }} />
                    <Radar name={company.name} dataKey="公司" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.35} />
                    <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569", fontSize: 11 }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 完整财务数据表格 */}
      {finData.length > 0 && (
        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">历年财务数据明细</h3>
          </div>
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
                {[...finData].sort((a: any, b: any) => (a.fiscal_year ?? 0) - (b.fiscal_year ?? 0)).map((row: any, i: number) => (
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
        </div>
      )}

      {/* 风险提示 */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-4 h-4 text-yellow-400" />
          <h3 className="text-sm font-bold text-white">风险提示</h3>
        </div>
        <div className="space-y-2 text-xs">
          {risks.map((risk, i) => (
            <div key={i} className={`flex items-start gap-2 p-2.5 rounded-lg ${risk.level === "red" ? "bg-red-500/10 border border-red-500/20" : "bg-yellow-500/10 border border-yellow-500/20"}`}>
              <AlertTriangle className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${risk.level === "red" ? "text-red-400" : "text-yellow-400"}`} />
              <span className={risk.level === "red" ? "text-red-300" : "text-yellow-300"}>{risk.text}</span>
            </div>
          ))}
          {risks.length === 0 && latestFin && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-green-500/10 border border-green-500/20">
              <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
              <span className="text-green-300">未发现明显财务风险，各项指标处于合理范围</span>
            </div>
          )}
          <div className="text-slate-500 mt-2 pt-2 border-t border-slate-700">
            <Info className="w-3 h-3 inline mr-1" />
            以上分析基于公开财报数据，仅供参考，不构成投资建议。
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 主页面 ───────────────────────────────────────────────────────
export default function NEEQCompanies() {
  const [, navigate] = useLocation();
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sector, setSector] = useState("全部");
  const [sortBy, setSortBy] = useState<"name" | "cap" | "score" | "roe" | "revenue">("cap");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  const [page, setPage] = useState(1);
  const [showOnlyWithFin, setShowOnlyWithFin] = useState(false);
  const [expandedCode, setExpandedCode] = useState<string | null>(null);
  const PAGE_SIZE = 20;

  // 异步加载完整公司数据（含财务数据）
  useEffect(() => {
    fetch("/neeq-companies.json")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: any[]) => {
        setCompanies(data);
        setLoading(false);
      })
      .catch((e) => {
        setLoadError(e.message);
        setLoading(false);
      });
  }, []);

  const sectorStats = useMemo(() => {
    return ["医疗健康", "新能源", "人工智能"].map((s) => {
      const sectorCompanies = companies.filter((c) => c.sector === s);
      return { sector: s, count: sectorCompanies.length, stats: calcSectorStats(sectorCompanies) };
    });
  }, [companies]);

  const filtered = useMemo(() => {
    let list = companies;
    if (sector !== "全部") list = list.filter((c) => c.sector === sector);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((c) => c.name?.toLowerCase().includes(q) || c.code?.includes(q));
    }
    if (showOnlyWithFin) list = list.filter((c) => getLatestFin(c) != null);

    list = [...list].sort((a, b) => {
      let va: number | null = null, vb: number | null = null;
      if (sortBy === "cap") { va = a.market_cap_wan ?? null; vb = b.market_cap_wan ?? null; }
      else if (sortBy === "score") { va = calcScore(a); vb = calcScore(b); }
      else if (sortBy === "roe") { va = getLatestFin(a)?.roe ?? null; vb = getLatestFin(b)?.roe ?? null; }
      else if (sortBy === "revenue") { va = getLatestFin(a)?.revenue ?? null; vb = getLatestFin(b)?.revenue ?? null; }
      else { return (a.name ?? "").localeCompare(b.name ?? ""); }
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      return sortDir === "desc" ? vb - va : va - vb;
    });

    return list;
  }, [companies, search, sector, sortBy, sortDir, showOnlyWithFin]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSort = (key: typeof sortBy) => {
    if (sortBy === key) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else { setSortBy(key); setSortDir("desc"); }
    setPage(1);
  };

  const SortIcon = ({ k }: { k: typeof sortBy }) => (
    <span className="text-slate-500 ml-1">
      {sortBy === k ? (sortDir === "desc" ? "↓" : "↑") : "↕"}
    </span>
  );

  const totalCount = companies.length;

  const toggleExpand = (code: string) => {
    setExpandedCode((prev) => (prev === code ? null : code));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="border-b border-slate-700 px-6 py-4 flex items-center gap-4">
        <button
          onClick={() => { if (window.history.length > 1) { window.history.back(); } else { navigate('/'); } }}
          className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors flex-shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">返回</span>
        </button>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Building2 className="w-6 h-6 text-cyan-400" />
          新三板企业库
          <span className="text-sm font-normal text-slate-400 ml-2">
            三大行业 · {loading ? "加载中..." : `${totalCount} 家真实挂牌公司`} · 来源：东方财富 + akshare
          </span>
        </h1>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">

        {/* 加载状态 */}
        {loading && (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mr-3" />
            <span className="text-slate-400 text-lg">正在加载 1909 家公司数据...</span>
          </div>
        )}

        {loadError && (
          <div className="bg-red-900/30 border border-red-500/30 rounded-xl p-6 text-center">
            <p className="text-red-400 font-medium">数据加载失败：{loadError}</p>
            <button
              onClick={() => { setLoading(true); setLoadError(null); fetch("/neeq-companies.json").then(r => r.json()).then(d => { setCompanies(d); setLoading(false); }).catch(e => { setLoadError(e.message); setLoading(false); }); }}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-500"
            >
              重试
            </button>
          </div>
        )}

        {!loading && !loadError && (
          <>
            {/* 行业统计卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {sectorStats.map(({ sector: s, count, stats }) => (
                <button
                  key={s}
                  onClick={() => { setSector(sector === s ? "全部" : s); setPage(1); }}
                  className={`bg-slate-800/60 border rounded-xl p-5 text-left transition-all hover:scale-[1.01] ${
                    sector === s ? "border-cyan-500 bg-slate-700/60" : "border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-2 py-0.5 rounded border text-xs font-semibold ${sectorColor[s]}`}>{s}</span>
                    <span className="text-2xl font-bold text-white">{count}</span>
                  </div>
                  <div className="text-xs text-slate-500 mb-2">家挂牌公司</div>
                  {stats ? (
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <div className="text-slate-500">均值ROE</div>
                        <div className="text-blue-400 font-medium">{fmt(stats.avgROE, "%", 1)}</div>
                      </div>
                      <div>
                        <div className="text-slate-500">均值毛利率</div>
                        <div className="text-yellow-400 font-medium">{fmt(stats.avgGM, "%", 1)}</div>
                      </div>
                      <div>
                        <div className="text-slate-500">有财务数据</div>
                        <div className="text-cyan-400 font-medium">{stats.withFinCount} 家</div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-600">财务数据抓取中...</div>
                  )}
                </button>
              ))}
            </div>

            {/* 搜索 + 筛选栏 */}
            <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 mb-5 flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  placeholder="搜索公司名称或代码..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 text-sm"
                />
              </div>
              <div className="flex gap-2">
                {["全部", "医疗健康", "新能源", "人工智能"].map((s) => (
                  <button
                    key={s}
                    onClick={() => { setSector(s); setPage(1); }}
                    className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                      sector === s ? "bg-cyan-600 text-white" : "bg-slate-700 text-slate-400 hover:text-white"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showOnlyWithFin}
                  onChange={(e) => { setShowOnlyWithFin(e.target.checked); setPage(1); }}
                  className="rounded"
                />
                仅显示有财务数据
              </label>
              <div className="text-sm text-slate-500 ml-auto">
                共 <span className="text-white font-medium">{filtered.length}</span> 家
              </div>
            </div>

            {/* 数据表格 */}
            <div className="bg-slate-800/60 border border-slate-700 rounded-xl overflow-hidden mb-5">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700 bg-slate-800/80">
                      <th className="text-left text-slate-400 py-3 px-4">公司名称</th>
                      <th className="text-left text-slate-400 py-3 px-3">代码</th>
                      <th className="text-left text-slate-400 py-3 px-3">行业</th>
                      <th className="text-right text-slate-400 py-3 px-3 cursor-pointer hover:text-white select-none" onClick={() => handleSort("cap")}>
                        市值 <SortIcon k="cap" />
                        <span className="text-yellow-500 text-xs ml-1" title="标注*的市值为估算值（行业PE/PS法），协议转让股票无连续竞价，东方财富不提供实时市值">*估算</span>
                      </th>
                      <th className="text-right text-slate-400 py-3 px-3 cursor-pointer hover:text-white select-none" onClick={() => handleSort("revenue")}>
                        营收 <SortIcon k="revenue" />
                      </th>
                      <th className="text-right text-slate-400 py-3 px-3">净利润</th>
                      <th className="text-right text-slate-400 py-3 px-3">毛利率</th>
                      <th className="text-right text-slate-400 py-3 px-3 cursor-pointer hover:text-white select-none" onClick={() => handleSort("roe")}>
                        ROE <SortIcon k="roe" />
                      </th>
                      <th className="text-right text-slate-400 py-3 px-3">负债率</th>
                      <th className="text-right text-slate-400 py-3 px-3 cursor-pointer hover:text-white select-none" onClick={() => handleSort("score")}>
                        评分 <SortIcon k="score" />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map((c: any) => {
                      const fin = getLatestFin(c);
                      const score = calcScore(c);
                      const isExpanded = expandedCode === c.code;
                      return (
                        <React.Fragment key={c.id ?? c.code}>
                          <tr className={`border-b border-slate-800 hover:bg-slate-700/30 transition-colors ${isExpanded ? "bg-slate-700/40" : ""}`}>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <div>
                                  <div className="text-white font-medium text-sm">{c.name}</div>
                                  {fin && <div className="text-xs text-slate-500">{fin.fiscal_year}年数据</div>}
                                </div>
                                <button
                                  onClick={() => toggleExpand(c.code)}
                                  className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs transition-colors flex-shrink-0 ${
                                    isExpanded
                                      ? "bg-cyan-600 text-white"
                                      : "bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white border border-slate-600"
                                  }`}
                                  title={isExpanded ? "收起详情" : "展开详情"}
                                >
                                  {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                  <span>详情</span>
                                </button>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-slate-400 text-xs font-mono">{c.code}</td>
                            <td className="py-3 px-3">
                              <span className={`px-2 py-0.5 rounded border text-xs ${sectorColor[c.sector] ?? "bg-slate-700 text-slate-300 border-slate-600"}`}>
                                {c.sector}
                              </span>
                            </td>
                            <td className="text-right py-3 px-3 text-sm">
                              <span className={c.market_cap_estimated ? 'text-yellow-400' : 'text-cyan-400'}>
                                {fmtCap(c.market_cap_wan)}
                              </span>
                              {c.market_cap_estimated && c.market_cap_wan && (
                                <span
                                  className="ml-1 text-xs text-yellow-500 cursor-help"
                                  title={c.market_cap_note || `估算方法：${c.market_cap_method}`}
                                >*</span>
                              )}
                            </td>
                            <td className="text-right py-3 px-3 text-slate-300 text-sm">{fin ? fmtRevenue(fin.revenue) : "/"}</td>
                            <td className={`text-right py-3 px-3 text-sm ${fin && (fin.net_profit ?? 0) >= 0 ? "text-green-400" : "text-red-400"}`}>
                              {fin ? fmtRevenue(fin.net_profit) : "/"}
                            </td>
                            <td className="text-right py-3 px-3 text-yellow-400 text-sm">{fin ? fmt(fin.gross_margin, "%", 1) : "/"}</td>
                            <td className="text-right py-3 px-3 text-blue-400 text-sm">{fin ? fmt(fin.roe, "%", 1) : "/"}</td>
                            <td className={`text-right py-3 px-3 text-sm ${fin && (fin.debt_ratio ?? 0) > 70 ? "text-red-400" : "text-orange-400"}`}>
                              {fin ? fmt(fin.debt_ratio, "%", 1) : "/"}
                            </td>
                            <td className={`text-right py-3 px-3 font-bold text-sm ${scoreColor(score)}`}>
                              {score != null ? score : "/"}
                            </td>
                          </tr>
                          {/* 展开详情行 */}
                          {isExpanded && (
                            <tr className="border-b border-slate-700">
                              <td colSpan={10} className="p-0">
                                <CompanyDetailPanel company={c} />
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                    {paged.length === 0 && (
                      <tr>
                        <td colSpan={10} className="text-center text-slate-500 py-12">没有符合条件的公司</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 分页 */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mb-6">
                <div className="text-sm text-slate-500">
                  第 {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} 条，共 {filtered.length} 条
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                    className="p-2 rounded-lg bg-slate-700 text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                    let p: number;
                    if (totalPages <= 7) p = i + 1;
                    else if (page <= 4) p = i + 1;
                    else if (page >= totalPages - 3) p = totalPages - 6 + i;
                    else p = page - 3 + i;
                    return (
                      <button key={p} onClick={() => setPage(p)}
                        className={`w-9 h-9 rounded-lg text-sm ${page === p ? "bg-cyan-600 text-white" : "bg-slate-700 text-slate-400 hover:text-white"}`}>
                        {p}
                      </button>
                    );
                  })}
                  <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="p-2 rounded-lg bg-slate-700 text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* 数据说明 */}
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 text-xs text-slate-500">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-cyan-500/70 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-slate-400 font-medium mb-1">数据说明</p>
                  <p>公司列表来源：东方财富新三板数据，按医疗健康、新能源、人工智能三个行业关键词分类。财务数据来源：同花顺财务摘要接口（akshare），覆盖 2020–2024 年度真实财报。无法获取的数据统一显示为 /。评分基于 ROE、毛利率、净利率、营收增速、利润增速、负债率、流动比率、营收规模等真实指标综合计算，满分 100 分，仅供参考，不构成投资建议。点击公司名称旁的"详情"按钮可展开查看该公司的完整财务分析报告。</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
