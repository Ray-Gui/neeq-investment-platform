import { useState, useMemo } from "react";
import type { Company, Analytics } from "@/lib/types";
import { fmtYi, fmtPct, fmtDate, fmtWan, filterCompanies, sortCompanies, getIndustries, getYears, getProvinces, getSponsors, cn } from "@/lib/utils";
import CompanyDetailModal from "@/components/CompanyDetailModal";
interface Props { companies: Company[]; analytics: Analytics | null }

const PAGE_SIZE = 25;

export default function DataTableTab({ companies, analytics }: Props) {
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [search, setSearch] = useState("");
  const [year, setYear] = useState("all");
  const [financing, setFinancing] = useState("all");
  const [performance, setPerformance] = useState("all");
  const [industry, setIndustry] = useState("all");
  const [province, setProvince] = useState("all");
  const [sponsor, setSponsor] = useState("all");
  const [sortField, setSortField] = useState<keyof Company>("bse_listing_date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);

  const industries = useMemo(() => getIndustries(companies), [companies]);
  const years = useMemo(() => getYears(companies), [companies]);
  const provinces = useMemo(() => getProvinces(companies), [companies]);
  const sponsors = useMemo(() => getSponsors(companies), [companies]);

  const filtered = useMemo(() =>
    filterCompanies(companies, search, year, financing, performance, industry, province, sponsor),
    [companies, search, year, financing, performance, industry, province, sponsor]
  );

  const sorted = useMemo(() => sortCompanies(filtered, sortField, sortDir), [filtered, sortField, sortDir]);
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paged = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // CSV Export
  const exportCSV = () => {
    const headers = [
      "代码","公司名称","行业","省份","北交所上市日","新三板挂牌日","挂牌时长(年)","新三板层级",
      "发行价(元)","发行市値(亿)","发行PE","首日涨跌幅(%)","一年后市値(亿)","一年后变化(%)",
      "最后融资日","最后融资估値(万)","保荐机构","会计师","省份"
    ];
    const rows = sorted.map(c => [
      c.bse_code, c.name, c.industry || "", c.province || "",
      c.bse_listing_date || "", c.neeq_listing_date || "",
      c.neeq_duration_years?.toFixed(1) || "", c.neeq_tier || "",
      c.issue_price?.toFixed(2) || "", c.listing_market_cap_yi?.toFixed(2) || "",
      c.issue_pe?.toFixed(1) || "",
      c.first_day_return_pct != null ? (c.first_day_return_pct * 100).toFixed(1) : "",
      c.one_year_market_cap_yi?.toFixed(2) || "",
      c.cap_change_pct?.toFixed(1) || "",
      c.last_round_date || "", c.last_round_valuation_wan?.toFixed(0) || "",
      c.sponsor || "", c.accountant || "", c.province || ""
    ]);
    const bom = "\uFEFF";
    const csv = bom + [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `北交所上市企业_${filtered.length}家_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSort = (field: keyof Company) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
    setPage(1);
  };

  const Th = ({ field, label, right }: { field: keyof Company; label: string; right?: boolean }) => (
    <th
      className={cn("px-3 py-2 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground whitespace-nowrap select-none", right ? "text-right" : "text-left")}
      onClick={() => handleSort(field)}
    >
      {label}
      <span className={cn("ml-0.5", sortField === field ? "text-primary" : "text-muted-foreground/40")}>
        {sortField === field ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
      </span>
    </th>
  );

  return (
    <>
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-card border border-border/50 rounded-lg p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-2">
          <input
            className="col-span-2 px-3 py-1.5 text-xs bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="搜索公司名称、代码、行业、保荐机构..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
          <select className="px-2 py-1.5 text-xs bg-background border border-border rounded-md" value={year} onChange={e => { setYear(e.target.value); setPage(1); }}>
            <option value="all">全部年份</option>
            {years.map(y => <option key={y} value={y}>{y}年</option>)}
          </select>
          <select className="px-2 py-1.5 text-xs bg-background border border-border rounded-md" value={financing} onChange={e => { setFinancing(e.target.value); setPage(1); }}>
            <option value="all">全部融资状态</option>
            <option value="has">有融资记录</option>
            <option value="none">无融资记录</option>
            <option value="no_data">暂无数据</option>
          </select>
          <select className="px-2 py-1.5 text-xs bg-background border border-border rounded-md" value={performance} onChange={e => { setPerformance(e.target.value); setPage(1); }}>
            <option value="all">全部表现</option>
            <option value="up">一年后上涨</option>
            <option value="down">一年后下跌</option>
            <option value="bust">首日破发</option>
          </select>
          <select className="px-2 py-1.5 text-xs bg-background border border-border rounded-md" value={industry} onChange={e => { setIndustry(e.target.value); setPage(1); }}>
            <option value="all">全部行业</option>
            {industries.map(i => <option key={i} value={i}>{i.slice(0, 10)}</option>)}
          </select>
          <select className="px-2 py-1.5 text-xs bg-background border border-border rounded-md" value={province} onChange={e => { setProvince(e.target.value); setPage(1); }}>
            <option value="all">全部省份</option>
            {provinces.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select className="px-2 py-1.5 text-xs bg-background border border-border rounded-md" value={sponsor} onChange={e => { setSponsor(e.target.value); setPage(1); }}>
            <option value="all">全部保荐机构</option>
            {sponsors.map(s => <option key={s} value={s}>{s.slice(0, 8)}</option>)}
          </select>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            共 <span className="text-foreground font-medium">{filtered.length}</span> 家公司
            {filtered.length !== companies.length && <span className="ml-1">（全部 {companies.length} 家）</span>}
          </div>
          <div className="flex items-center gap-2">
            {(search || year !== "all" || financing !== "all" || performance !== "all" || industry !== "all" || province !== "all" || sponsor !== "all") && (
              <button className="text-xs text-primary hover:underline" onClick={() => { setSearch(""); setYear("all"); setFinancing("all"); setPerformance("all"); setIndustry("all"); setProvince("all"); setSponsor("all"); setPage(1); }}>
                清除筛选
              </button>
            )}
            <button
              onClick={exportCSV}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-md transition-colors font-medium"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              导出 CSV ({filtered.length}家)
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border/50 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[1400px]">
            <thead className="bg-muted/30 border-b border-border/50">
              <tr>
                <Th field="bse_code" label="代码" />
                <Th field="name" label="公司名称" />
                <Th field="industry" label="行业" />
                <Th field="province" label="省份" />
                <Th field="bse_listing_date" label="北交所上市" />
                <Th field="neeq_listing_date" label="新三板挂牌" />
                <Th field="neeq_duration_years" label="挂牌时长" right />
                <Th field="neeq_tier" label="新三板层级" />
                <Th field="issue_price" label="发行价(元)" right />
                <Th field="listing_market_cap_yi" label="发行市值" right />
                <Th field="issue_pe" label="发行PE" right />
                <Th field="first_day_return_pct" label="首日涨跌" right />
                <Th field="one_year_market_cap_yi" label="一年后市值" right />
                <Th field="cap_change_pct" label="一年后变化" right />
                <Th field="last_round_date" label="最后融资日" />
                <Th field="last_round_valuation_wan" label="最后融资估值" right />
                <Th field="second_last_round_date" label="倒数第二融资日" />
                <Th field="second_last_round_valuation_wan" label="倒数第二估值" right />
                <Th field="ipo_vs_last_round_multiple" label="IPO/融资倍数" right />
                <Th field="sponsor" label="保荐机构" />
              </tr>
            </thead>
            <tbody>
              {paged.map((c, i) => (
                <tr key={c.bse_code} className={cn("border-b border-border/30 hover:bg-muted/20 transition-colors", i % 2 !== 0 && "bg-muted/10")}>
                  <td className="px-3 py-2 font-mono text-primary/80 font-medium">{c.bse_code}</td>
                  <td className="px-3 py-2 font-medium whitespace-nowrap">
                    <button
                      className="hover:text-primary hover:underline underline-offset-2 transition-colors text-left"
                      onClick={() => setSelectedCompany(c)}
                    >{c.name}</button>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground max-w-[90px] truncate">{c.industry || "—"}</td>
                  <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">{c.province?.slice(0, 3) || "—"}</td>
                  <td className="px-3 py-2 font-mono text-muted-foreground whitespace-nowrap">{fmtDate(c.bse_listing_date)}</td>
                  <td className="px-3 py-2 font-mono text-muted-foreground whitespace-nowrap">{fmtDate(c.neeq_listing_date)}</td>
                  <td className="px-3 py-2 text-right font-mono">{c.neeq_duration_years ? `${c.neeq_duration_years.toFixed(1)}年` : "—"}</td>
                  <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                    {c.neeq_tier ? (
                      <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full", c.neeq_tier === "精选层" ? "bg-amber-500/20 text-amber-600" : c.neeq_tier === "创新层" ? "bg-blue-500/20 text-blue-600" : "bg-muted text-muted-foreground")}>
                        {c.neeq_tier}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-3 py-2 text-right font-mono">{c.issue_price ? `¥${c.issue_price.toFixed(2)}` : "—"}</td>
                  <td className="px-3 py-2 text-right font-mono font-medium">{fmtYi(c.listing_market_cap_yi)}</td>
                  <td className="px-3 py-2 text-right font-mono">{c.issue_pe ? `${c.issue_pe.toFixed(1)}x` : "—"}</td>
                  <td className={cn("px-3 py-2 text-right font-mono font-medium", (c.first_day_return_pct ?? 0) >= 0 ? "text-green-500" : "text-red-500")}>
                    {c.first_day_return_pct != null ? fmtPct(c.first_day_return_pct * 100) : "—"}
                  </td>
                  <td className="px-3 py-2 text-right font-mono">{fmtYi(c.one_year_market_cap_yi)}</td>
                  <td className={cn("px-3 py-2 text-right font-mono font-medium", (c.cap_change_pct ?? 0) >= 0 ? "text-green-500" : "text-red-500")}>
                    {c.cap_change_pct != null ? fmtPct(c.cap_change_pct) : "—"}
                  </td>
                  <td className="px-3 py-2 font-mono text-muted-foreground whitespace-nowrap">
                    {c.no_financing ? <span className="text-amber-500 text-[10px] px-1.5 py-0.5 bg-amber-500/10 rounded-full">无融资</span> : fmtDate(c.last_round_date)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono">{c.last_round_valuation_wan ? fmtWan(c.last_round_valuation_wan) : "—"}</td>
                  <td className="px-3 py-2 font-mono text-muted-foreground whitespace-nowrap">{fmtDate(c.second_last_round_date)}</td>
                  <td className="px-3 py-2 text-right font-mono">{c.second_last_round_valuation_wan ? fmtWan(c.second_last_round_valuation_wan) : "—"}</td>
                  <td className="px-3 py-2 text-right font-mono">{c.ipo_vs_last_round_multiple ? `${c.ipo_vs_last_round_multiple.toFixed(1)}x` : "—"}</td>
                  <td className="px-3 py-2 text-muted-foreground whitespace-nowrap max-w-[80px] truncate">{c.sponsor || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border/30 text-xs text-muted-foreground">
          <span>第 {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, sorted.length)} 条，共 {sorted.length} 条</span>
          <div className="flex gap-1">
            <button onClick={() => setPage(1)} disabled={page === 1} className="px-2 py-1 rounded border border-border disabled:opacity-40 hover:bg-muted/50">«</button>
            <button onClick={() => setPage(p => p - 1)} disabled={page === 1} className="px-2 py-1 rounded border border-border disabled:opacity-40 hover:bg-muted/50">‹</button>
            <span className="px-3 py-1 bg-primary/10 text-primary rounded border border-primary/20">{page} / {totalPages}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages} className="px-2 py-1 rounded border border-border disabled:opacity-40 hover:bg-muted/50">›</button>
            <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="px-2 py-1 rounded border border-border disabled:opacity-40 hover:bg-muted/50">»</button>
          </div>
        </div>
      </div>
    </div>

    {/* Company Detail Modal */}
    {selectedCompany && (
      <CompanyDetailModal
        company={selectedCompany}
        companies={companies}
        analytics={analytics}
        onClose={() => setSelectedCompany(null)}
      />
    )}
    </>
  );
}
