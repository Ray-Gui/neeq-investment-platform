import { useState, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Search, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Minus, BarChart2 } from "lucide-react";
import trendData from "../data/trend-rating-data.json";

const PAGE_SIZE = 20;

const fmt = (v: number | null | undefined, suffix = "", digits = 1): string => {
  if (v == null || isNaN(Number(v))) return "/";
  return Number(v).toFixed(digits) + suffix;
};

const fmtYi = (v: number | null | undefined): string => {
  if (v == null) return "/";
  if (Math.abs(v) >= 100) return v.toFixed(1) + " 亿";
  if (Math.abs(v) >= 1) return v.toFixed(2) + " 亿";
  if (Math.abs(v) >= 0.01) return (v * 10000).toFixed(0) + " 万";
  return v.toFixed(4) + " 亿";
};

const gradeStyle: Record<string, { bg: string; text: string; border: string }> = {
  "高速增长": { bg: "bg-emerald-500/20", text: "text-emerald-300", border: "border-emerald-500/40" },
  "稳健增长": { bg: "bg-green-500/20", text: "text-green-300", border: "border-green-500/40" },
  "低速增长": { bg: "bg-yellow-500/20", text: "text-yellow-300", border: "border-yellow-500/40" },
  "轻微下滑": { bg: "bg-orange-500/20", text: "text-orange-300", border: "border-orange-500/40" },
  "明显下滑": { bg: "bg-red-500/20", text: "text-red-300", border: "border-red-500/40" },
  "数据不足": { bg: "bg-slate-700", text: "text-slate-400", border: "border-slate-600" },
};

const cfQualityStyle: Record<string, string> = {
  "优质": "text-emerald-400",
  "良好": "text-green-400",
  "一般": "text-yellow-400",
  "偏弱": "text-orange-400",
  "异常": "text-red-400",
  "数据不足": "text-slate-500",
};

const scoreColor = (s: number) => {
  if (s >= 80) return "text-emerald-400";
  if (s >= 60) return "text-cyan-400";
  if (s >= 40) return "text-yellow-400";
  return "text-orange-400";
};

const sectorColor: Record<string, string> = {
  "医疗健康": "text-green-400 bg-green-500/10 border-green-500/30",
  "新能源": "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
  "人工智能": "text-blue-400 bg-blue-500/10 border-blue-500/30",
};

const MiniBar = ({ values, colors }: { values: (number | null)[]; colors: string[] }) => {
  const valid = values.filter(v => v != null) as number[];
  if (valid.length === 0) return <span className="text-slate-600 text-xs">-</span>;
  const max = Math.max(...valid.map(Math.abs));
  if (max === 0) return <span className="text-slate-600 text-xs">-</span>;
  return (
    <div className="flex items-end gap-0.5 h-6">
      {values.slice().reverse().map((v, i) => {
        if (v == null) return <div key={i} className="w-3 h-1 bg-slate-700 rounded-sm" />;
        const h = Math.max(2, Math.abs(v) / max * 20);
        return (
          <div
            key={i}
            style={{ height: `${h}px` }}
            className={`w-3 rounded-sm ${v >= 0 ? colors[0] : colors[1]}`}
            title={`${v.toFixed(2)}亿`}
          />
        );
      })}
    </div>
  );
};

type SortKey = "score" | "cagr" | "profit_score" | "roe_avg" | "revenue";

export default function TrendRating() {
  const [search, setSearch] = useState("");
  const [sectorFilter, setSectorFilter] = useState("全部");
  const [gradeFilter, setGradeFilter] = useState("全部");
  const [cfFilter, setCfFilter] = useState("全部");
  const [sortBy, setSortBy] = useState<SortKey>("score");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  const [page, setPage] = useState(1);
  const [expandedCode, setExpandedCode] = useState<string | null>(null);

  const [, navigate] = useLocation();
  const companies: any[] = (trendData as any).companies || [];
  const meta = trendData as any;

  const filtered = useMemo(() => {
    let list = [...companies];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(c => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q));
    }
    if (sectorFilter !== "全部") list = list.filter(c => c.sector === sectorFilter);
    if (gradeFilter !== "全部") list = list.filter(c => c.revenue_grade === gradeFilter);
    if (cfFilter !== "全部") list = list.filter(c => c.cashflow_quality === cfFilter);

    list.sort((a, b) => {
      let va: number, vb: number;
      if (sortBy === "score") { va = a.overall_trend_score ?? 0; vb = b.overall_trend_score ?? 0; }
      else if (sortBy === "cagr") { va = a.rev_cagr_3yr ?? a.rev_cagr ?? -999; vb = b.rev_cagr_3yr ?? b.rev_cagr ?? -999; }
      else if (sortBy === "profit_score") { va = a.profit_improvement_score ?? 0; vb = b.profit_improvement_score ?? 0; }
      else if (sortBy === "roe_avg") { va = a.roe_avg ?? -999; vb = b.roe_avg ?? -999; }
      else { va = a.revenues_yi?.[0] ?? 0; vb = b.revenues_yi?.[0] ?? 0; }
      return sortDir === "desc" ? vb - va : va - vb;
    });
    return list;
  }, [companies, search, sectorFilter, gradeFilter, cfFilter, sortBy, sortDir]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSort = (key: SortKey) => {
    if (sortBy === key) setSortDir(d => d === "desc" ? "asc" : "desc");
    else { setSortBy(key); setSortDir("desc"); }
    setPage(1);
  };

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortBy !== k) return <span className="text-slate-600 ml-1">↕</span>;
    return <span className="text-cyan-400 ml-1">{sortDir === "desc" ? "↓" : "↑"}</span>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="max-w-screen-xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => { if (window.history.length > 1) { window.history.back(); } else { navigate("/"); } }}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
            <span>返回</span>
          </button>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">📈 三年财务趋势评级</h1>
          <p className="text-slate-400">基于近三年营收CAGR、盈利改善评分、ROE趋势和现金流质量，对 {meta.total} 家新三板公司进行综合趋势评级</p>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-5">
            <div className="text-3xl font-bold text-emerald-400 mb-1">{meta.high_growth}</div>
            <div className="text-sm text-slate-400">高速增长</div>
            <div className="text-xs text-slate-500 mt-1">3年营收CAGR ≥ 30%</div>
          </div>
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-5">
            <div className="text-3xl font-bold text-green-400 mb-1">{meta.stable_growth}</div>
            <div className="text-sm text-slate-400">稳健增长</div>
            <div className="text-xs text-slate-500 mt-1">3年营收CAGR 10-30%</div>
          </div>
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-5">
            <div className="text-3xl font-bold text-orange-400 mb-1">{meta.declining}</div>
            <div className="text-sm text-slate-400">营收下滑</div>
            <div className="text-xs text-slate-500 mt-1">3年营收CAGR &lt; 0%</div>
          </div>
          <div className="bg-slate-700/50 border border-slate-600 rounded-xl p-5">
            <div className="text-3xl font-bold text-slate-300 mb-1">{meta.total - meta.high_growth - meta.stable_growth - meta.declining}</div>
            <div className="text-sm text-slate-400">低速增长</div>
            <div className="text-xs text-slate-500 mt-1">3年营收CAGR 0-10%</div>
          </div>
        </div>

        {/* 筛选栏 */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-48">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              placeholder="搜索公司名称或代码..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {["全部", "医疗健康", "新能源", "人工智能"].map(s => (
              <button key={s} onClick={() => { setSectorFilter(s); setPage(1); }}
                className={`px-3 py-2 rounded-lg text-sm border transition-colors ${sectorFilter === s ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300" : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500"}`}
              >{s}</button>
            ))}
          </div>
          <div className="flex gap-2 flex-wrap">
            {["全部", "高速增长", "稳健增长", "低速增长", "轻微下滑", "明显下滑"].map(g => {
              const gs = gradeStyle[g] || { bg: "bg-slate-800", text: "text-slate-400", border: "border-slate-700" };
              return (
                <button key={g} onClick={() => { setGradeFilter(g); setPage(1); }}
                  className={`px-3 py-2 rounded-lg text-sm border transition-colors ${gradeFilter === g ? `${gs.bg} ${gs.border} ${gs.text}` : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500"}`}
                >{g}</button>
              );
            })}
          </div>
          <div className="flex gap-2 flex-wrap">
            {["全部", "优质", "良好", "一般", "偏弱"].map(cf => (
              <button key={cf} onClick={() => { setCfFilter(cf); setPage(1); }}
                className={`px-3 py-2 rounded-lg text-sm border transition-colors ${cfFilter === cf ? "bg-purple-500/20 border-purple-500/50 text-purple-300" : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500"}`}
              >现金流{cf}</button>
            ))}
          </div>
        </div>

        <div className="text-sm text-slate-500 mb-3">共 {filtered.length} 家公司</div>

        {/* 表格 */}
        <div className="bg-slate-800/30 border border-slate-700 rounded-xl overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-800/80">
                  <th className="text-left text-slate-400 py-3 px-4">公司名称</th>
                  <th className="text-left text-slate-400 py-3 px-3">行业</th>
                  <th className="text-left text-slate-400 py-3 px-3">增长评级</th>
                  <th className="text-right text-slate-400 py-3 px-3 cursor-pointer hover:text-white select-none" onClick={() => handleSort("cagr")}>
                    3年CAGR <SortIcon k="cagr" />
                  </th>
                  <th className="text-right text-slate-400 py-3 px-3 cursor-pointer hover:text-white select-none" onClick={() => handleSort("revenue")}>
                    最新营收 <SortIcon k="revenue" />
                  </th>
                  <th className="text-center text-slate-400 py-3 px-3">营收趋势</th>
                  <th className="text-right text-slate-400 py-3 px-3 cursor-pointer hover:text-white select-none" onClick={() => handleSort("profit_score")}>
                    盈利改善 <SortIcon k="profit_score" />
                  </th>
                  <th className="text-center text-slate-400 py-3 px-3">净利润趋势</th>
                  <th className="text-right text-slate-400 py-3 px-3 cursor-pointer hover:text-white select-none" onClick={() => handleSort("roe_avg")}>
                    均值ROE <SortIcon k="roe_avg" />
                  </th>
                  <th className="text-center text-slate-400 py-3 px-3">现金流质量</th>
                  <th className="text-right text-slate-400 py-3 px-3 cursor-pointer hover:text-white select-none" onClick={() => handleSort("score")}>
                    综合评分 <SortIcon k="score" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {paged.map((c: any) => {
                  const gs = gradeStyle[c.revenue_grade] || gradeStyle["数据不足"];
                  return (
                    <>
                      <tr
                        key={c.code}
                        className="border-b border-slate-800 hover:bg-slate-700/30 transition-colors cursor-pointer"
                        onClick={() => setExpandedCode(expandedCode === c.code ? null : c.code)}
                      >
                        <td className="py-3 px-4">
                          <div className="text-white font-medium text-sm">{c.name}</div>
                          <div className="text-xs text-slate-500 font-mono">{c.code}</div>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded border text-xs ${sectorColor[c.sector] ?? "bg-slate-700 text-slate-300 border-slate-600"}`}>
                            {c.sector}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded border text-xs ${gs.bg} ${gs.border} ${gs.text}`}>
                            {c.revenue_grade}
                          </span>
                        </td>
                        <td className={`text-right py-3 px-3 text-sm font-medium ${(c.rev_cagr_3yr ?? c.rev_cagr ?? 0) >= 30 ? "text-emerald-400" : (c.rev_cagr_3yr ?? c.rev_cagr ?? 0) >= 0 ? "text-green-400" : "text-red-400"}`}>
                          {fmt(c.rev_cagr_3yr ?? c.rev_cagr, "%")}
                        </td>
                        <td className="text-right py-3 px-3 text-slate-300 text-sm">
                          {fmtYi(c.revenues_yi?.[0])}
                        </td>
                        <td className="py-3 px-3 flex justify-center">
                          <MiniBar values={c.revenues_yi?.slice(0, 3) ?? []} colors={["bg-cyan-500", "bg-red-500"]} />
                        </td>
                        <td className="text-right py-3 px-3">
                          <div className="flex items-center justify-end gap-1">
                            <div className="w-16 bg-slate-700 rounded-full h-1.5">
                              <div className={`h-1.5 rounded-full ${c.profit_improvement_score >= 80 ? "bg-emerald-500" : c.profit_improvement_score >= 60 ? "bg-green-500" : c.profit_improvement_score >= 40 ? "bg-yellow-500" : "bg-red-500"}`}
                                style={{ width: `${c.profit_improvement_score}%` }} />
                            </div>
                            <span className="text-xs text-slate-400">{c.profit_improvement_score}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 flex justify-center">
                          <MiniBar values={c.net_profits_yi?.slice(0, 3) ?? []} colors={["bg-green-500", "bg-red-500"]} />
                        </td>
                        <td className={`text-right py-3 px-3 text-sm ${(c.roe_avg ?? 0) >= 15 ? "text-emerald-400" : (c.roe_avg ?? 0) >= 8 ? "text-green-400" : (c.roe_avg ?? 0) >= 0 ? "text-yellow-400" : "text-red-400"}`}>
                          {fmt(c.roe_avg, "%")}
                          {c.roe_trend !== "/" && <span className="text-xs text-slate-500 ml-1">({c.roe_trend})</span>}
                        </td>
                        <td className="text-center py-3 px-3">
                          <span className={`text-xs ${cfQualityStyle[c.cashflow_quality] ?? "text-slate-500"}`}>
                            {c.cashflow_quality}
                            {c.cashflow_ratio != null && <span className="text-slate-500 ml-1">({c.cashflow_ratio}x)</span>}
                          </span>
                        </td>
                        <td className="text-right py-3 px-3">
                          <span className={`font-bold text-sm ${scoreColor(c.overall_trend_score)}`}>{c.overall_trend_score}</span>
                        </td>
                      </tr>
                      {expandedCode === c.code && (
                        <tr key={c.code + "_detail"} className="bg-slate-800/60 border-b border-slate-700">
                          <td colSpan={11} className="px-6 py-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                              {/* 营收历史 */}
                              <div>
                                <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                                  <BarChart2 size={14} className="text-cyan-400" /> 营收历史（亿元）
                                </h4>
                                <div className="space-y-1">
                                  {(c.years || []).map((yr: number, i: number) => (
                                    <div key={yr} className="flex items-center gap-2 text-xs">
                                      <span className="text-slate-500 w-10">{yr}</span>
                                      <div className="flex-1 bg-slate-700 rounded-full h-1.5">
                                        <div className="h-1.5 rounded-full bg-cyan-500"
                                          style={{ width: `${Math.min(100, (c.revenues_yi[i] / (Math.max(...c.revenues_yi.filter((v: any) => v != null)) || 1)) * 100)}%` }} />
                                      </div>
                                      <span className="text-slate-300 w-16 text-right">{fmtYi(c.revenues_yi[i])}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              {/* 净利润历史 */}
                              <div>
                                <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                                  <TrendingUp size={14} className="text-green-400" /> 净利润历史（亿元）
                                </h4>
                                <div className="space-y-1">
                                  {(c.years || []).map((yr: number, i: number) => (
                                    <div key={yr} className="flex items-center gap-2 text-xs">
                                      <span className="text-slate-500 w-10">{yr}</span>
                                      <span className={`w-20 ${c.net_profits_yi[i] >= 0 ? "text-green-400" : "text-red-400"}`}>{fmtYi(c.net_profits_yi[i])}</span>
                                      <span className="text-slate-500">{c.roes[i] != null ? `ROE ${c.roes[i]}%` : ""}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              {/* 盈利质量 */}
                              <div>
                                <h4 className="text-sm font-semibold text-white mb-3">盈利质量指标</h4>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">平均毛利率</span>
                                    <span className="text-white">{fmt(c.gross_margin_avg, "%")}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">平均ROE</span>
                                    <span className={c.roe_avg >= 15 ? "text-emerald-400" : c.roe_avg >= 8 ? "text-green-400" : "text-yellow-400"}>{fmt(c.roe_avg, "%")}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">ROE趋势</span>
                                    <span className={c.roe_trend === "改善" ? "text-green-400" : c.roe_trend === "恶化" ? "text-red-400" : "text-slate-400"}>{c.roe_trend}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">现金流质量</span>
                                    <span className={cfQualityStyle[c.cashflow_quality] ?? "text-slate-400"}>
                                      {c.cashflow_quality}{c.cashflow_ratio != null ? ` (${c.cashflow_ratio}x)` : ""}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">盈利改善评分</span>
                                    <span className={scoreColor(c.profit_improvement_score)}>{c.profit_improvement_score}/100</span>
                                  </div>
                                </div>
                              </div>
                              {/* 负债率历史 */}
                              <div>
                                <h4 className="text-sm font-semibold text-white mb-3">财务稳健性</h4>
                                <div className="space-y-1">
                                  {(c.years || []).slice(0, 3).map((yr: number, i: number) => (
                                    <div key={yr} className="flex items-center gap-2 text-xs">
                                      <span className="text-slate-500 w-10">{yr}</span>
                                      <span className="text-slate-400">负债率</span>
                                      <span className={c.debt_ratios[i] > 70 ? "text-red-400" : c.debt_ratios[i] > 50 ? "text-yellow-400" : "text-green-400"}>
                                        {fmt(c.debt_ratios[i], "%")}
                                      </span>
                                      <span className="text-slate-500 ml-2">毛利率</span>
                                      <span className="text-slate-300">{fmt(c.gross_margins[i], "%")}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <div className="mt-4 flex gap-3">
                              <Link href={`/company/${c.code}`}>
                                <a className="px-4 py-2 bg-cyan-500/20 border border-cyan-500/40 rounded-lg text-cyan-300 text-sm hover:bg-cyan-500/30 transition-colors">
                                  查看公司详情
                                </a>
                              </Link>
                              <Link href={`/financial?code=${c.code}`}>
                                <a className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-300 text-sm hover:bg-slate-600 transition-colors">
                                  财务深度分析
                                </a>
                              </Link>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
                {paged.length === 0 && (
                  <tr>
                    <td colSpan={11} className="text-center text-slate-500 py-12">没有符合条件的公司</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white disabled:opacity-40">
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
              let p = i + 1;
              if (totalPages > 7) {
                if (page <= 4) p = i + 1;
                else if (page >= totalPages - 3) p = totalPages - 6 + i;
                else p = page - 3 + i;
              }
              return (
                <button key={p} onClick={() => setPage(p)} className={`w-9 h-9 rounded-lg text-sm border transition-colors ${page === p ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300" : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"}`}>{p}</button>
              );
            })}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white disabled:opacity-40">
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        <div className="mt-8 bg-slate-800/30 border border-slate-700 rounded-xl p-5 text-xs text-slate-500">
          <strong className="text-slate-400">评级说明：</strong>
          <strong className="text-emerald-300">综合趋势评分</strong>由四个维度加权计算：
          营收3年CAGR（最高30分）、盈利改善评分（最高40分，含盈利持续性、趋势方向、稳定性）、ROE水平（最高20分）、现金流质量（最高10分）。
          <strong className="text-cyan-300 ml-2">现金流质量</strong>为经营现金流/净利润的近三年均值，比值越高说明利润含金量越高。
          数据来源：东方财富，财务数据截至最新年报。
        </div>
      </div>
    </div>
  );
}
