import { useState, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Search, ChevronLeft, ChevronRight, Droplets, AlertTriangle, Zap, Shield } from "lucide-react";
import liquidityData from "../data/liquidity-score-data.json";

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
  return "/";
};

const gradeStyle: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  "高流动性":   { bg: "bg-emerald-500/20", text: "text-emerald-300", border: "border-emerald-500/40", dot: "bg-emerald-400" },
  "中高流动性": { bg: "bg-cyan-500/20",    text: "text-cyan-300",    border: "border-cyan-500/40",    dot: "bg-cyan-400" },
  "中等流动性": { bg: "bg-yellow-500/20",  text: "text-yellow-300",  border: "border-yellow-500/40",  dot: "bg-yellow-400" },
  "低流动性":   { bg: "bg-orange-500/20",  text: "text-orange-300",  border: "border-orange-500/40",  dot: "bg-orange-400" },
  "极低流动性": { bg: "bg-red-500/20",     text: "text-red-300",     border: "border-red-500/40",     dot: "bg-red-400" },
};

const makerStyle: Record<string, { bg: string; text: string; border: string; icon: any }> = {
  "优质做市机会": { bg: "bg-emerald-500/20", text: "text-emerald-300", border: "border-emerald-500/40", icon: Zap },
  "潜在做市机会": { bg: "bg-cyan-500/20",    text: "text-cyan-300",    border: "border-cyan-500/40",    icon: Droplets },
  "竞争激烈":     { bg: "bg-yellow-500/20",  text: "text-yellow-300",  border: "border-yellow-500/40",  icon: Shield },
  "一般":         { bg: "bg-slate-700",       text: "text-slate-400",   border: "border-slate-600",      icon: Droplets },
  "风险较高":     { bg: "bg-red-500/20",      text: "text-red-300",     border: "border-red-500/40",     icon: AlertTriangle },
};

const sectorColor: Record<string, string> = {
  "医疗健康": "text-green-400 bg-green-500/10 border-green-500/30",
  "新能源": "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
  "人工智能": "text-blue-400 bg-blue-500/10 border-blue-500/30",
};

const scoreColor = (s: number) => {
  if (s >= 75) return "text-emerald-400";
  if (s >= 55) return "text-cyan-400";
  if (s >= 35) return "text-yellow-400";
  if (s >= 15) return "text-orange-400";
  return "text-red-400";
};

type SortKey = "score" | "market_cap" | "revenue" | "roe";

export default function LiquidityScore() {
  const [search, setSearch] = useState("");
  const [sectorFilter, setSectorFilter] = useState("全部");
  const [gradeFilter, setGradeFilter] = useState("全部");
  const [makerFilter, setMakerFilter] = useState("全部");
  const [sortBy, setSortBy] = useState<SortKey>("score");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  const [page, setPage] = useState(1);
  const [expandedCode, setExpandedCode] = useState<string | null>(null);

  const [, navigate] = useLocation();
  const companies: any[] = (liquidityData as any).companies || [];
  const meta = liquidityData as any;

  const filtered = useMemo(() => {
    let list = [...companies];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(c => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q));
    }
    if (sectorFilter !== "全部") list = list.filter(c => c.sector === sectorFilter);
    if (gradeFilter !== "全部") list = list.filter(c => c.liquidity_grade === gradeFilter);
    if (makerFilter !== "全部") list = list.filter(c => c.maker_opportunity === makerFilter);

    list.sort((a, b) => {
      let va: number, vb: number;
      if (sortBy === "score") { va = a.liquidity_score ?? 0; vb = b.liquidity_score ?? 0; }
      else if (sortBy === "market_cap") { va = a.market_cap_yi ?? 0; vb = b.market_cap_yi ?? 0; }
      else if (sortBy === "revenue") { va = a.revenue_yi ?? 0; vb = b.revenue_yi ?? 0; }
      else { va = a.roe ?? -999; vb = b.roe ?? -999; }
      return sortDir === "desc" ? vb - va : va - vb;
    });
    return list;
  }, [companies, search, sectorFilter, gradeFilter, makerFilter, sortBy, sortDir]);

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

  const gradeDist = meta.grade_distribution || {};
  const makerDist = meta.maker_distribution || {};

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
          <h1 className="text-3xl font-bold text-white mb-2">💧 流动性评分体系</h1>
          <p className="text-slate-400">从做市商视角，对 {meta.total} 家新三板公司进行流动性评分和做市机会识别</p>
        </div>

        {/* 流动性分布 */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {["高流动性", "中高流动性", "中等流动性", "低流动性", "极低流动性"].map(g => {
            const gs = gradeStyle[g];
            return (
              <div key={g} className={`${gs.bg} border ${gs.border} rounded-xl p-4`}>
                <div className={`text-2xl font-bold ${gs.text} mb-1`}>{gradeDist[g] ?? 0}</div>
                <div className="text-xs text-slate-400">{g}</div>
              </div>
            );
          })}
        </div>

        {/* 做市机会分布 */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
          {["优质做市机会", "潜在做市机会", "竞争激烈", "一般", "风险较高"].map(m => {
            const ms = makerStyle[m];
            const Icon = ms.icon;
            return (
              <div key={m} className={`${ms.bg} border ${ms.border} rounded-xl p-4`}>
                <div className="flex items-center gap-2 mb-1">
                  <Icon size={14} className={ms.text} />
                  <span className={`text-2xl font-bold ${ms.text}`}>{makerDist[m] ?? 0}</span>
                </div>
                <div className="text-xs text-slate-400">{m}</div>
              </div>
            );
          })}
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
            {["全部", "高流动性", "中高流动性", "中等流动性", "低流动性", "极低流动性"].map(g => {
              const gs = gradeStyle[g] || { bg: "bg-slate-800", text: "text-slate-400", border: "border-slate-700" };
              return (
                <button key={g} onClick={() => { setGradeFilter(g); setPage(1); }}
                  className={`px-3 py-2 rounded-lg text-sm border transition-colors ${gradeFilter === g ? `${gs.bg} ${gs.border} ${gs.text}` : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500"}`}
                >{g}</button>
              );
            })}
          </div>
          <div className="flex gap-2 flex-wrap">
            {["全部", "优质做市机会", "潜在做市机会", "竞争激烈", "风险较高"].map(m => {
              const ms = makerStyle[m] || { bg: "bg-slate-800", text: "text-slate-400", border: "border-slate-700" };
              return (
                <button key={m} onClick={() => { setMakerFilter(m); setPage(1); }}
                  className={`px-3 py-2 rounded-lg text-sm border transition-colors ${makerFilter === m ? `${ms.bg} ${ms.border} ${ms.text}` : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500"}`}
                >{m}</button>
              );
            })}
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
                  <th className="text-left text-slate-400 py-3 px-3">层级</th>
                  <th className="text-left text-slate-400 py-3 px-3">流动性等级</th>
                  <th className="text-right text-slate-400 py-3 px-3 cursor-pointer hover:text-white select-none" onClick={() => handleSort("market_cap")}>
                    市值 <SortIcon k="market_cap" />
                  </th>
                  <th className="text-right text-slate-400 py-3 px-3 cursor-pointer hover:text-white select-none" onClick={() => handleSort("revenue")}>
                    营收 <SortIcon k="revenue" />
                  </th>
                  <th className="text-right text-slate-400 py-3 px-3">净利润</th>
                  <th className="text-right text-slate-400 py-3 px-3 cursor-pointer hover:text-white select-none" onClick={() => handleSort("roe")}>
                    ROE <SortIcon k="roe" />
                  </th>
                  <th className="text-right text-slate-400 py-3 px-3">负债率</th>
                  <th className="text-left text-slate-400 py-3 px-3">做市机会</th>
                  <th className="text-right text-slate-400 py-3 px-3 cursor-pointer hover:text-white select-none" onClick={() => handleSort("score")}>
                    流动性评分 <SortIcon k="score" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {paged.map((c: any) => {
                  const gs = gradeStyle[c.liquidity_grade] || gradeStyle["极低流动性"];
                  const ms = makerStyle[c.maker_opportunity] || makerStyle["一般"];
                  const MakerIcon = ms.icon;
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
                          <span className={`text-xs ${c.tier?.includes('创新') ? 'text-cyan-400' : 'text-slate-500'}`}>
                            {c.tier || '基础层'}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5">
                            <div className={`w-2 h-2 rounded-full ${gs.dot}`} />
                            <span className={`text-xs ${gs.text}`}>{c.liquidity_grade}</span>
                          </div>
                        </td>
                        <td className="text-right py-3 px-3 text-sm">
                          <span className={c.market_cap_estimated ? "text-yellow-400" : "text-cyan-400"}>
                            {fmtYi(c.market_cap_yi)}
                          </span>
                          {c.market_cap_estimated && <span className="text-yellow-500 text-xs ml-0.5">*</span>}
                        </td>
                        <td className="text-right py-3 px-3 text-slate-300 text-sm">{fmtYi(c.revenue_yi)}</td>
                        <td className={`text-right py-3 px-3 text-sm ${(c.net_profit_yi ?? 0) >= 0 ? "text-green-400" : "text-red-400"}`}>
                          {fmtYi(c.net_profit_yi)}
                        </td>
                        <td className={`text-right py-3 px-3 text-sm ${(c.roe ?? 0) >= 15 ? "text-emerald-400" : (c.roe ?? 0) >= 8 ? "text-green-400" : (c.roe ?? 0) >= 0 ? "text-yellow-400" : "text-red-400"}`}>
                          {fmt(c.roe, "%")}
                        </td>
                        <td className={`text-right py-3 px-3 text-sm ${(c.debt_ratio ?? 0) > 70 ? "text-red-400" : (c.debt_ratio ?? 0) > 50 ? "text-yellow-400" : "text-green-400"}`}>
                          {fmt(c.debt_ratio, "%")}
                        </td>
                        <td className="py-3 px-3">
                          <div className={`flex items-center gap-1 px-2 py-0.5 rounded border text-xs w-fit ${ms.bg} ${ms.border} ${ms.text}`}>
                            <MakerIcon size={10} />
                            <span>{c.maker_opportunity}</span>
                          </div>
                        </td>
                        <td className="text-right py-3 px-3">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-12 bg-slate-700 rounded-full h-1.5">
                              <div className={`h-1.5 rounded-full ${c.liquidity_score >= 75 ? "bg-emerald-500" : c.liquidity_score >= 55 ? "bg-cyan-500" : c.liquidity_score >= 35 ? "bg-yellow-500" : c.liquidity_score >= 15 ? "bg-orange-500" : "bg-red-500"}`}
                                style={{ width: `${c.liquidity_score}%` }} />
                            </div>
                            <span className={`font-bold text-sm ${scoreColor(c.liquidity_score)}`}>{c.liquidity_score}</span>
                          </div>
                        </td>
                      </tr>
                      {expandedCode === c.code && (
                        <tr key={c.code + "_detail"} className="bg-slate-800/60 border-b border-slate-700">
                          <td colSpan={11} className="px-6 py-5">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              {/* 评分依据 */}
                              <div>
                                <h4 className="text-sm font-semibold text-white mb-3">评分依据</h4>
                                <div className="space-y-1.5">
                                  {(c.score_reasons || []).map((r: string, i: number) => (
                                    <div key={i} className="flex items-center gap-2 text-xs">
                                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0" />
                                      <span className="text-slate-300">{r}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              {/* 核心指标 */}
                              <div>
                                <h4 className="text-sm font-semibold text-white mb-3">核心指标（{c.latest_year}年）</h4>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  <div className="text-slate-400">市值</div>
                                  <div className={c.market_cap_estimated ? "text-yellow-400" : "text-white"}>
                                    {fmtYi(c.market_cap_yi)}{c.market_cap_estimated ? " *" : ""}
                                  </div>
                                  <div className="text-slate-400">营业收入</div><div className="text-white">{fmtYi(c.revenue_yi)}</div>
                                  <div className="text-slate-400">净利润</div>
                                  <div className={c.net_profit_yi >= 0 ? "text-green-400" : "text-red-400"}>{fmtYi(c.net_profit_yi)}</div>
                                  <div className="text-slate-400">ROE</div>
                                  <div className={c.roe >= 15 ? "text-emerald-400" : c.roe >= 8 ? "text-green-400" : "text-yellow-400"}>{fmt(c.roe, "%")}</div>
                                  <div className="text-slate-400">毛利率</div><div className="text-white">{fmt(c.gross_margin, "%")}</div>
                                  <div className="text-slate-400">负债率</div>
                                  <div className={c.debt_ratio > 70 ? "text-red-400" : c.debt_ratio > 50 ? "text-yellow-400" : "text-green-400"}>{fmt(c.debt_ratio, "%")}</div>
                                </div>
                              </div>
                              {/* 做市商分析 */}
                              <div>
                                <h4 className="text-sm font-semibold text-white mb-3">做市商视角分析</h4>
                                <div className={`p-3 rounded-lg border ${ms.bg} ${ms.border} mb-3`}>
                                  <div className="flex items-center gap-2 mb-1">
                                    <MakerIcon size={14} className={ms.text} />
                                    <span className={`font-medium text-sm ${ms.text}`}>{c.maker_opportunity}</span>
                                  </div>
                                  <p className="text-xs text-slate-400">
                                    {c.maker_opportunity === "优质做市机会" && "财务质量高、市值适中，价差收益潜力好，机构关注度有望提升"}
                                    {c.maker_opportunity === "潜在做市机会" && "盈利稳定、市值偏小，存在价差机会，但流动性有待提升"}
                                    {c.maker_opportunity === "竞争激烈" && "高质量公司，已有较多做市商参与，价差收益空间有限"}
                                    {c.maker_opportunity === "一般" && "流动性一般，做市收益空间有限，需结合具体情况判断"}
                                    {c.maker_opportunity === "风险较高" && "财务状况较差或亏损严重，做市风险较高，需谨慎评估"}
                                  </p>
                                </div>
                                <div className="text-xs text-slate-500">
                                  层级：<span className={c.tier?.includes('创新') ? 'text-cyan-400' : 'text-slate-400'}>{c.tier || '基础层'}</span>
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
          <strong className="text-slate-400">评分说明：</strong>
          流动性评分（0-100分）基于五个维度：市值规模（25分）、市场层级（20分）、营收规模（20分）、盈利状况（20分）、财务健康度（15分），严重亏损和高负债有扣分项。
          由于新三板协议转让股票无连续竞价，无法获取实时换手率和日均成交额，本评分以财务基本面和市场层级作为流动性代理指标。
          标注 <span className="text-yellow-400">*</span> 的市值为估算值。
          <strong className="text-cyan-300 ml-2">做市机会</strong>：优质做市机会指财务质量高（评分≥60）且市值适中（≤5亿）且盈利的公司，价差收益潜力较好。
        </div>
      </div>
    </div>
  );
}
