import React, { useState, useMemo, useEffect } from "react";
import {
  Search, ChevronLeft, ChevronRight, Building2, Info, Loader2,
} from "lucide-react";

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
  if (v >= 10000) return (v / 10000).toFixed(2) + " 亿";  // >=1亿
  if (v >= 1) return v.toFixed(0) + " 万";               // >=1万元
  return v.toFixed(2) + " 万";
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

export default function NEEQCompanies() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sector, setSector] = useState("全部");
  const [sortBy, setSortBy] = useState<"name" | "cap" | "score" | "roe" | "revenue">("cap");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  const [page, setPage] = useState(1);
  const [showOnlyWithFin, setShowOnlyWithFin] = useState(false);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="border-b border-slate-700 px-6 py-4">
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
                      return (
                        <tr key={c.id} className="border-b border-slate-800 hover:bg-slate-700/30 transition-colors">
                          <td className="py-3 px-4">
                            <div className="text-white font-medium text-sm">{c.name}</div>
                            {fin && <div className="text-xs text-slate-500">{fin.fiscal_year}年数据</div>}
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
                  <p>公司列表来源：东方财富新三板数据，按医疗健康、新能源、人工智能三个行业关键词分类。财务数据来源：同花顺财务摘要接口（akshare），覆盖 2020–2024 年度真实财报。无法获取的数据统一显示为 /。评分基于 ROE、毛利率、净利率、营收增速、利润增速、负债率、流动比率、营收规模等真实指标综合计算，满分 100 分，仅供参考，不构成投资建议。</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
