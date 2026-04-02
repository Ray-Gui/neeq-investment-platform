import { useState, useMemo } from "react";
import { Link } from "wouter";
import { ArrowLeft, Search, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Minus, Info, CheckCircle2, XCircle } from "lucide-react";
import listingData from "../data/bse-listing-tracker.json";
import { useLocation } from "wouter";

const PAGE_SIZE = 20;

const fmt = (v: number | null | undefined, suffix = "", digits = 1): string => {
  if (v == null || isNaN(Number(v))) return "/";
  return Number(v).toFixed(digits) + suffix;
};

const fmtYi = (v: number | null | undefined): string => {
  if (v == null) return "/";
  if (Math.abs(v) >= 100) return v.toFixed(1) + " 亿";
  if (Math.abs(v) >= 1) return v.toFixed(2) + " 亿";
  return (v * 10000).toFixed(0) + " 万";
};

const sectorColor: Record<string, string> = {
  "医疗健康": "text-green-400 bg-green-500/10 border-green-500/30",
  "新能源": "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
  "人工智能": "text-blue-400 bg-blue-500/10 border-blue-500/30",
};

const condColor: Record<string, string> = {
  "盈利型": "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  "成长型": "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
  "市值型": "bg-purple-500/20 text-purple-300 border-purple-500/40",
};

const trendIcon = (trend: string) => {
  if (trend === "持续改善" || trend === "近期转盈" || trend === "改善") return <TrendingUp size={14} className="text-green-400" />;
  if (trend === "持续恶化" || trend === "恶化") return <TrendingDown size={14} className="text-red-400" />;
  return <Minus size={14} className="text-slate-400" />;
};

const trendTextColor = (trend: string) => {
  if (trend === "持续改善" || trend === "近期转盈" || trend === "改善" || trend === "稳定盈利") return "text-green-400";
  if (trend === "持续恶化" || trend === "恶化" || trend === "持续亏损") return "text-red-400";
  return "text-slate-400";
};

const scoreColor = (s: number) => {
  if (s >= 90) return "text-emerald-400";
  if (s >= 70) return "text-cyan-400";
  if (s >= 50) return "text-yellow-400";
  return "text-orange-400";
};

type SortKey = "score" | "revenue" | "net_profit" | "roe" | "revenue_growth" | "market_cap";

export default function BSEListingTracker() {
  const [search, setSearch] = useState("");
  const [sectorFilter, setSectorFilter] = useState<string>("全部");
  const [condFilter, setCondFilter] = useState<string>("全部");
  const [sortBy, setSortBy] = useState<SortKey>("score");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  const [page, setPage] = useState(1);
  const [expandedCode, setExpandedCode] = useState<string | null>(null);

  const [, navigate] = useLocation();
  const companies: any[] = (listingData as any).companies || [];
  const meta = listingData as any;

  const filtered = useMemo(() => {
    let list = [...companies];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(c => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q));
    }
    if (sectorFilter !== "全部") list = list.filter(c => c.sector === sectorFilter);
    if (condFilter !== "全部") {
      if (condFilter === "盈利型") list = list.filter(c => c.cond_profit);
      else if (condFilter === "成长型") list = list.filter(c => c.cond_growth);
      else if (condFilter === "市值型") list = list.filter(c => c.cond_market_cap);
      else if (condFilter === "三项全满") list = list.filter(c => c.cond_profit && c.cond_growth && c.cond_market_cap);
    }
    list.sort((a, b) => {
      let va: number, vb: number;
      if (sortBy === "score") { va = a.listing_score; vb = b.listing_score; }
      else if (sortBy === "revenue") { va = a.revenue_yi ?? 0; vb = b.revenue_yi ?? 0; }
      else if (sortBy === "net_profit") { va = a.net_profit_yi ?? 0; vb = b.net_profit_yi ?? 0; }
      else if (sortBy === "roe") { va = a.roe ?? 0; vb = b.roe ?? 0; }
      else if (sortBy === "revenue_growth") { va = a.revenue_growth ?? 0; vb = b.revenue_growth ?? 0; }
      else { va = a.market_cap_yi ?? 0; vb = b.market_cap_yi ?? 0; }
      return sortDir === "desc" ? vb - va : va - vb;
    });
    return list;
  }, [companies, search, sectorFilter, condFilter, sortBy, sortDir]);

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
        {/* Header */}
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
          <h1 className="text-3xl font-bold text-white mb-2">🚀 北交所转板潜力追踪</h1>
          <p className="text-slate-400">基于北交所上市财务条件，从 1887 家新三板公司中筛选出具备转板潜力的候选企业</p>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
            <div className="text-3xl font-bold text-white mb-1">{meta.total}</div>
            <div className="text-sm text-slate-400">满足任一条件</div>
            <div className="text-xs text-slate-500 mt-1">占全库 {(meta.total / 1887 * 100).toFixed(1)}%</div>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-5">
            <div className="text-3xl font-bold text-emerald-400 mb-1">{meta.cond_profit_count}</div>
            <div className="text-sm text-slate-400">盈利型</div>
            <div className="text-xs text-slate-500 mt-1">连续两年盈利 &amp;≥5000万</div>
          </div>
          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-5">
            <div className="text-3xl font-bold text-cyan-400 mb-1">{meta.cond_growth_count}</div>
            <div className="text-sm text-slate-400">成长型</div>
            <div className="text-xs text-slate-500 mt-1">营收≥1亿且增速≥30%</div>
          </div>
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-5">
            <div className="text-3xl font-bold text-purple-400 mb-1">{meta.cond_market_cap_count}</div>
            <div className="text-sm text-slate-400">市值型</div>
            <div className="text-xs text-slate-500 mt-1">市值≥2亿且营收≥1亿</div>
          </div>
        </div>

        {/* 条件说明 */}
        <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-5 mb-6">
          <div className="flex items-start gap-3">
            <Info size={18} className="text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-slate-300">
              <span className="font-semibold text-blue-300">北交所上市财务条件说明：</span>
              <span className="text-slate-400 ml-2">
                <strong className="text-emerald-300">盈利型</strong>（连续两年净利润为正且累计≥5000万，营收≥5000万）；
                <strong className="text-cyan-300 ml-2">成长型</strong>（营收≥1亿、净利润为正、营收增速≥30%）；
                <strong className="text-purple-300 ml-2">市值型</strong>（市值≥2亿且营收≥1亿）。
                综合评分满分100分，同时满足多个条件得分更高。
              </span>
            </div>
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
          <div className="flex gap-2">
            {["全部", "医疗健康", "新能源", "人工智能"].map(s => (
              <button
                key={s}
                onClick={() => { setSectorFilter(s); setPage(1); }}
                className={`px-3 py-2 rounded-lg text-sm border transition-colors ${sectorFilter === s ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300" : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500"}`}
              >{s}</button>
            ))}
          </div>
          <div className="flex gap-2">
            {["全部", "盈利型", "成长型", "市值型", "三项全满"].map(c => (
              <button
                key={c}
                onClick={() => { setCondFilter(c); setPage(1); }}
                className={`px-3 py-2 rounded-lg text-sm border transition-colors ${condFilter === c ? "bg-purple-500/20 border-purple-500/50 text-purple-300" : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500"}`}
              >{c}</button>
            ))}
          </div>
        </div>

        {/* 数量提示 */}
        <div className="text-sm text-slate-500 mb-3">共 {filtered.length} 家候选企业</div>

        {/* 表格 */}
        <div className="bg-slate-800/30 border border-slate-700 rounded-xl overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-800/80">
                  <th className="text-left text-slate-400 py-3 px-4">公司名称</th>
                  <th className="text-left text-slate-400 py-3 px-3">代码</th>
                  <th className="text-left text-slate-400 py-3 px-3">行业</th>
                  <th className="text-left text-slate-400 py-3 px-3">满足条件</th>
                  <th className="text-right text-slate-400 py-3 px-3 cursor-pointer hover:text-white select-none" onClick={() => handleSort("revenue")}>
                    营收 <SortIcon k="revenue" />
                  </th>
                  <th className="text-right text-slate-400 py-3 px-3 cursor-pointer hover:text-white select-none" onClick={() => handleSort("net_profit")}>
                    净利润 <SortIcon k="net_profit" />
                  </th>
                  <th className="text-right text-slate-400 py-3 px-3 cursor-pointer hover:text-white select-none" onClick={() => handleSort("revenue_growth")}>
                    营收增速 <SortIcon k="revenue_growth" />
                  </th>
                  <th className="text-right text-slate-400 py-3 px-3 cursor-pointer hover:text-white select-none" onClick={() => handleSort("roe")}>
                    ROE <SortIcon k="roe" />
                  </th>
                  <th className="text-right text-slate-400 py-3 px-3 cursor-pointer hover:text-white select-none" onClick={() => handleSort("market_cap")}>
                    市值 <SortIcon k="market_cap" />
                  </th>
                  <th className="text-center text-slate-400 py-3 px-3">盈利趋势</th>
                  <th className="text-right text-slate-400 py-3 px-3 cursor-pointer hover:text-white select-none" onClick={() => handleSort("score")}>
                    转板评分 <SortIcon k="score" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {paged.map((c: any) => (
                  <>
                    <tr
                      key={c.code}
                      className="border-b border-slate-800 hover:bg-slate-700/30 transition-colors cursor-pointer"
                      onClick={() => setExpandedCode(expandedCode === c.code ? null : c.code)}
                    >
                      <td className="py-3 px-4">
                        <div className="text-white font-medium text-sm">{c.name}</div>
                        <div className="text-xs text-slate-500">{c.latest_year}年数据</div>
                      </td>
                      <td className="py-3 px-3 text-slate-400 text-xs font-mono">{c.code}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded border text-xs ${sectorColor[c.sector] ?? "bg-slate-700 text-slate-300 border-slate-600"}`}>
                          {c.sector}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex flex-wrap gap-1">
                          {(c.conditions || []).map((cond: string) => (
                            <span key={cond} className={`px-1.5 py-0.5 rounded border text-xs ${condColor[cond] ?? ""}`}>{cond}</span>
                          ))}
                        </div>
                      </td>
                      <td className="text-right py-3 px-3 text-slate-300 text-sm">{fmtYi(c.revenue_yi)}</td>
                      <td className={`text-right py-3 px-3 text-sm ${c.net_profit_yi >= 0 ? "text-green-400" : "text-red-400"}`}>
                        {fmtYi(c.net_profit_yi)}
                      </td>
                      <td className={`text-right py-3 px-3 text-sm ${(c.revenue_growth ?? 0) >= 30 ? "text-green-400" : (c.revenue_growth ?? 0) >= 0 ? "text-slate-300" : "text-red-400"}`}>
                        {fmt(c.revenue_growth, "%")}
                      </td>
                      <td className={`text-right py-3 px-3 text-sm ${(c.roe ?? 0) >= 15 ? "text-green-400" : (c.roe ?? 0) >= 8 ? "text-yellow-400" : "text-slate-400"}`}>
                        {fmt(c.roe, "%")}
                      </td>
                      <td className="text-right py-3 px-3 text-sm">
                        <span className={c.market_cap_estimated ? "text-yellow-400" : "text-cyan-400"}>
                          {fmtYi(c.market_cap_yi)}
                        </span>
                        {c.market_cap_estimated && <span className="text-yellow-500 text-xs ml-0.5">*</span>}
                      </td>
                      <td className="text-center py-3 px-3">
                        {c.trend ? (
                          <div className="flex items-center justify-center gap-1">
                            {trendIcon(c.trend.profit_trend)}
                            <span className={`text-xs ${trendTextColor(c.trend.profit_trend)}`}>{c.trend.profit_trend}</span>
                          </div>
                        ) : <span className="text-slate-600 text-xs">/</span>}
                      </td>
                      <td className="text-right py-3 px-3">
                        <span className={`font-bold text-sm ${scoreColor(c.listing_score)}`}>{c.listing_score}</span>
                      </td>
                    </tr>
                    {expandedCode === c.code && (
                      <tr key={c.code + "_detail"} className="bg-slate-800/60 border-b border-slate-700">
                        <td colSpan={11} className="px-6 py-5">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* 条件满足情况 */}
                            <div>
                              <h4 className="text-sm font-semibold text-white mb-3">北交所上市条件</h4>
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  {c.cond_profit ? <CheckCircle2 size={16} className="text-emerald-400" /> : <XCircle size={16} className="text-slate-600" />}
                                  <span className={`text-sm ${c.cond_profit ? "text-emerald-300" : "text-slate-500"}`}>
                                    盈利型：连续两年净利润为正，累计≥5000万，营收≥5000万
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {c.cond_growth ? <CheckCircle2 size={16} className="text-cyan-400" /> : <XCircle size={16} className="text-slate-600" />}
                                  <span className={`text-sm ${c.cond_growth ? "text-cyan-300" : "text-slate-500"}`}>
                                    成长型：营收≥1亿、净利润为正、营收增速≥30%
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {c.cond_market_cap ? <CheckCircle2 size={16} className="text-purple-400" /> : <XCircle size={16} className="text-slate-600" />}
                                  <span className={`text-sm ${c.cond_market_cap ? "text-purple-300" : "text-slate-500"}`}>
                                    市值型：市值≥2亿且营收≥1亿
                                  </span>
                                </div>
                              </div>
                            </div>
                            {/* 核心财务指标 */}
                            <div>
                              <h4 className="text-sm font-semibold text-white mb-3">核心财务指标（{c.latest_year}年）</h4>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div className="text-slate-400">营业收入</div><div className="text-white">{fmtYi(c.revenue_yi)}</div>
                                <div className="text-slate-400">净利润</div><div className={c.net_profit_yi >= 0 ? "text-green-400" : "text-red-400"}>{fmtYi(c.net_profit_yi)}</div>
                                <div className="text-slate-400">上年净利润</div><div className={c.net_profit_prev_wan >= 0 ? "text-green-400" : "text-red-400"}>{fmtYi(c.net_profit_prev_wan / 10000)}</div>
                                <div className="text-slate-400">毛利率</div><div className="text-white">{fmt(c.gross_margin, "%")}</div>
                                <div className="text-slate-400">净利率</div><div className="text-white">{fmt(c.net_margin, "%")}</div>
                                <div className="text-slate-400">负债率</div><div className={c.debt_ratio > 70 ? "text-red-400" : "text-white"}>{fmt(c.debt_ratio, "%")}</div>
                              </div>
                            </div>
                            {/* 三年趋势 */}
                            <div>
                              <h4 className="text-sm font-semibold text-white mb-3">近三年财务趋势</h4>
                              {c.trend ? (
                                <div>
                                  <div className="flex items-center gap-2 mb-2">
                                    {trendIcon(c.trend.profit_trend)}
                                    <span className={`text-sm font-medium ${trendTextColor(c.trend.profit_trend)}`}>{c.trend.profit_trend}</span>
                                    {c.trend.cagr != null && (
                                      <span className={`text-xs ml-2 ${c.trend.cagr >= 0 ? "text-green-400" : "text-red-400"}`}>
                                        营收CAGR {c.trend.cagr >= 0 ? "+" : ""}{c.trend.cagr}%
                                      </span>
                                    )}
                                  </div>
                                  <div className="space-y-1">
                                    {c.trend.years.map((yr: number, i: number) => (
                                      <div key={yr} className="flex items-center gap-3 text-xs">
                                        <span className="text-slate-500 w-12">{yr}年</span>
                                        <span className="text-slate-300 w-20">营收 {fmtYi(c.trend.revenues[i])}</span>
                                        <span className={c.trend.net_profits[i] >= 0 ? "text-green-400" : "text-red-400"}>
                                          净利润 {fmtYi(c.trend.net_profits[i])}
                                        </span>
                                        <span className="text-slate-400">ROE {c.trend.roes[i]}%</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ) : <span className="text-slate-500 text-sm">数据不足</span>}
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
                ))}
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

        {/* 数据说明 */}
        <div className="mt-8 bg-slate-800/30 border border-slate-700 rounded-xl p-5 text-xs text-slate-500">
          <strong className="text-slate-400">数据说明：</strong>
          北交所上市条件参考《北京证券交易所股票上市规则》财务指标要求，本系统仅作财务层面的初步筛选，不代表实际上市资格判断（实际上市还需满足挂牌满12个月、无重大违规等非财务条件）。
          标注 <span className="text-yellow-400">*</span> 的市值为估算值（行业PE/PS中位数法），协议转让股票无连续竞价，东方财富不提供实时市值。
          数据来源：东方财富 + akshare，财务数据截至最新年报。
        </div>
      </div>
    </div>
  );
}
