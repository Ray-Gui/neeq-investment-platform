import type { Company, Analytics } from "@/lib/types";
import { useMemo } from "react";
import { fmtYi, fmtPct, fmtDate, fmtWan, fmt, cn } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, ReferenceLine, ScatterChart, Scatter, ZAxis
} from "recharts";

interface Props {
  company: Company | null;
  companies: Company[];
  analytics: Analytics | null;
  onClose: () => void;
}

const BLUE = "#2E86C1";
const GREEN = "#34D399";
const RED = "#F87171";
const AMBER = "#D4A843";
const GRAY = "#94a3b8";

function Badge({ children, color = "default" }: { children: React.ReactNode; color?: "green" | "red" | "amber" | "blue" | "default" }) {
  const cls = {
    green: "bg-green-500/15 text-green-600",
    red: "bg-red-500/15 text-red-500",
    amber: "bg-amber-500/15 text-amber-600",
    blue: "bg-blue-500/15 text-blue-600",
    default: "bg-muted text-muted-foreground",
  }[color];
  return <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium", cls)}>{children}</span>;
}

function KV({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] text-muted-foreground">{label}</span>
      <span className={cn("text-sm font-mono font-semibold", color || "text-foreground")}>{value}</span>
    </div>
  );
}

export default function CompanyDetailModal({ company, companies, analytics, onClose }: Props) {
  if (!company) return null;

  const c = company;

  // ── Peer Comparison Data ──────────────────────────────────────
  const peers = useMemo(() => {
    if (!c.industry) return [];
    return companies.filter(p => p.industry === c.industry && p.bse_code !== c.bse_code);
  }, [companies, c.industry, c.bse_code]);

  const peerPEData = useMemo(() => {
    const all = peers.filter(p => p.issue_pe != null);
    const buckets: Record<string, number> = {};
    all.forEach(p => {
      const v = p.issue_pe!;
      let b: string;
      if (v < 10) b = "<10x";
      else if (v < 20) b = "10-20x";
      else if (v < 30) b = "20-30x";
      else if (v < 40) b = "30-40x";
      else if (v < 60) b = "40-60x";
      else b = ">60x";
      buckets[b] = (buckets[b] || 0) + 1;
    });
    return ["<10x", "10-20x", "20-30x", "30-40x", "40-60x", ">60x"].map(k => ({ name: k, count: buckets[k] || 0 }));
  }, [peers]);

  const peerFDData = useMemo(() => {
    const all = peers.filter(p => p.first_day_return_pct != null);
    const buckets: Record<string, number> = {};
    all.forEach(p => {
      const v = (p.first_day_return_pct!) * 100;
      let b: string;
      if (v < -10) b = "<-10%";
      else if (v < 0) b = "-10~0%";
      else if (v < 10) b = "0~10%";
      else if (v < 30) b = "10~30%";
      else if (v < 50) b = "30~50%";
      else if (v < 100) b = "50~100%";
      else b = ">100%";
      buckets[b] = (buckets[b] || 0) + 1;
    });
    return ["<-10%", "-10~0%", "0~10%", "10~30%", "30~50%", "50~100%", ">100%"].map(k => ({ name: k, count: buckets[k] || 0 }));
  }, [peers]);

  const peerCapChangeData = useMemo(() => {
    return peers
      .filter(p => p.cap_change_pct != null)
      .sort((a, b) => (b.cap_change_pct || 0) - (a.cap_change_pct || 0))
      .slice(0, 10)
      .map(p => ({ name: p.name.slice(0, 5), value: +(p.cap_change_pct!).toFixed(1), color: (p.cap_change_pct || 0) >= 0 ? "#34D399" : "#F87171", code: p.bse_code }));
  }, [peers]);

  const peerAvgPE = peers.filter(p => p.issue_pe).reduce((s, p) => s + (p.issue_pe || 0), 0) / (peers.filter(p => p.issue_pe).length || 1);
  const peerAvgFD = peers.filter(p => p.first_day_return_pct != null).reduce((s, p) => s + (p.first_day_return_pct || 0), 0) / (peers.filter(p => p.first_day_return_pct != null).length || 1);
  const peerBustPct = peers.length > 0 ? peers.filter(p => p.is_bust).length / peers.length * 100 : 0;

  // ── Financing Timeline ────────────────────────────────────────
  const timelineEvents: Array<{ label: string; date: string; valuation?: string; price?: string; type: "neeq" | "financing" | "ipo" | "yr1" }> = [];

  if (c.neeq_listing_date) {
    timelineEvents.push({ label: "新三板挂牌", date: c.neeq_listing_date, type: "neeq" });
  }
  if (c.second_last_round_date) {
    timelineEvents.push({
      label: "融资（次近轮）",
      date: c.second_last_round_date,
      valuation: c.second_last_round_valuation_wan ? fmtWan(c.second_last_round_valuation_wan) : undefined,
      price: c.second_last_round_price ? `¥${c.second_last_round_price.toFixed(2)}` : undefined,
      type: "financing",
    });
  }
  if (c.last_round_date) {
    timelineEvents.push({
      label: "融资（最近轮）",
      date: c.last_round_date,
      valuation: c.last_round_valuation_wan ? fmtWan(c.last_round_valuation_wan) : undefined,
      price: c.last_round_price ? `¥${c.last_round_price.toFixed(2)}` : undefined,
      type: "financing",
    });
  }
  if (c.bse_listing_date) {
    timelineEvents.push({
      label: "北交所上市",
      date: c.bse_listing_date,
      valuation: c.listing_market_cap_yi ? fmtYi(c.listing_market_cap_yi) : undefined,
      price: c.issue_price ? `¥${c.issue_price.toFixed(2)}` : undefined,
      type: "ipo",
    });
  }
  if (c.one_year_market_cap_yi != null) {
    const yr1Date = c.bse_listing_date ? new Date(new Date(c.bse_listing_date).getTime() + 365 * 24 * 3600 * 1000).toISOString().slice(0, 10) : "";
    timelineEvents.push({
      label: "上市一年后",
      date: yr1Date,
      valuation: fmtYi(c.one_year_market_cap_yi),
      price: c.one_year_close_price ? `¥${c.one_year_close_price.toFixed(2)}` : undefined,
      type: "yr1",
    });
  }

  // Sort by date
  timelineEvents.sort((a, b) => (a.date || "").localeCompare(b.date || ""));

  // ── PE Comparison Bar Chart ───────────────────────────────────
  const peData = [];
  if (c.issue_pe) peData.push({ name: "发行PE", value: +c.issue_pe.toFixed(1), color: BLUE });
  if (c.industry_pe) peData.push({ name: "行业均值PE", value: +c.industry_pe.toFixed(1), color: GRAY });
  // Find industry average from analytics
  const industryAvg = analytics?.industry_stats?.find(i => i.industry === c.industry)?.avg_issue_pe;
  if (industryAvg && Math.abs(industryAvg - (c.industry_pe || 0)) > 0.5) {
    peData.push({ name: "同行业均值", value: +industryAvg.toFixed(1), color: AMBER });
  }
  const overallAvg = analytics?.overview?.issue_pe?.mean;
  if (overallAvg) peData.push({ name: "北交所整体均值", value: +overallAvg.toFixed(1), color: GREEN });

  // ── NEEQ Migration ───────────────────────────────────────────
  const neeqDuration = c.neeq_duration_years;
  const tierColor = c.neeq_tier === "精选层" ? "amber" : c.neeq_tier === "创新层" ? "blue" : "default";

  // ── Performance Summary ───────────────────────────────────────
  const fdReturn = c.first_day_return_pct != null ? c.first_day_return_pct * 100 : null;
  const capChange = c.cap_change_pct;

  const typeStyle = {
    neeq: { dot: "bg-teal-500", line: "border-teal-500/40", text: "text-teal-600" },
    financing: { dot: "bg-blue-500", line: "border-blue-500/40", text: "text-blue-600" },
    ipo: { dot: "bg-amber-500 ring-2 ring-amber-500/30", line: "border-amber-500/40", text: "text-amber-600" },
    yr1: { dot: "bg-green-500", line: "border-green-500/40", text: "text-green-600" },
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-background border border-border rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border px-6 py-4 flex items-start justify-between gap-4 z-10">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-sm text-muted-foreground">{c.bse_code}</span>
              <h2 className="text-lg font-bold text-foreground">{c.name}</h2>
              {c.industry && <Badge color="blue">{c.industry}</Badge>}
              {c.province && <Badge>{c.province}</Badge>}
              {c.neeq_tier && <Badge color={tierColor as any}>{c.neeq_tier}</Badge>}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              上市日期：{fmtDate(c.bse_listing_date)} · 保荐机构：{c.sponsor || "—"} · 会计师：{c.accountant || "—"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* KPI Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-card border border-border/50 rounded-lg p-3">
              <KV label="发行价" value={c.issue_price ? `¥${c.issue_price.toFixed(2)}` : "—"} />
            </div>
            <div className="bg-card border border-border/50 rounded-lg p-3">
              <KV label="发行市值" value={fmtYi(c.listing_market_cap_yi)} />
            </div>
            <div className="bg-card border border-border/50 rounded-lg p-3">
              <KV
                label="首日涨跌幅"
                value={fdReturn != null ? fmtPct(fdReturn) : "—"}
                color={fdReturn == null ? undefined : fdReturn >= 0 ? "text-green-500" : "text-red-500"}
              />
            </div>
            <div className="bg-card border border-border/50 rounded-lg p-3">
              <KV
                label="一年后市值变化"
                value={capChange != null ? fmtPct(capChange) : "—"}
                color={capChange == null ? undefined : capChange >= 0 ? "text-green-500" : "text-red-500"}
              />
            </div>
          </div>

          {/* ── Section 1: Financing Timeline ─────────────────── */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <span className="w-1 h-4 bg-blue-500 rounded-full inline-block" />
              融资路径时间轴
            </h3>
            {timelineEvents.length === 0 ? (
              <p className="text-xs text-muted-foreground">暂无融资路径数据</p>
            ) : (
              <div className="relative pl-4">
                {/* Vertical line */}
                <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />
                <div className="space-y-4">
                  {timelineEvents.map((ev, idx) => {
                    const s = typeStyle[ev.type];
                    return (
                      <div key={idx} className="relative flex gap-3 items-start">
                        {/* Dot */}
                        <div className={cn("w-3 h-3 rounded-full flex-shrink-0 mt-0.5 relative z-10", s.dot)} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={cn("text-xs font-semibold", s.text)}>{ev.label}</span>
                            <span className="text-xs text-muted-foreground font-mono">{ev.date}</span>
                          </div>
                          {(ev.valuation || ev.price) && (
                            <div className="flex gap-3 mt-0.5 text-xs text-muted-foreground">
                              {ev.price && <span>价格：<span className="font-mono text-foreground">{ev.price}</span></span>}
                              {ev.valuation && <span>估值：<span className="font-mono text-foreground">{ev.valuation}</span></span>}
                            </div>
                          )}
                          {/* IPO multiple */}
                          {ev.type === "ipo" && c.ipo_vs_last_round_multiple && (
                            <div className="text-xs text-amber-600 mt-0.5">
                              较最近融资估值 <span className="font-mono font-semibold">{c.ipo_vs_last_round_multiple.toFixed(1)}x</span>
                            </div>
                          )}
                          {ev.type === "yr1" && c.yr1_vs_last_round_multiple && (
                            <div className="text-xs text-green-600 mt-0.5">
                              较最近融资估值 <span className="font-mono font-semibold">{c.yr1_vs_last_round_multiple.toFixed(1)}x</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {c.no_financing && (
              <p className="text-xs text-amber-600 mt-2">该公司无外部融资记录，直接上市</p>
            )}
          </div>

          {/* ── Section 2: NEEQ Migration ─────────────────────── */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <span className="w-1 h-4 bg-teal-500 rounded-full inline-block" />
              新三板 → 北交所 迁移路径
            </h3>
            {c.neeq_listing_date ? (
              <div className="bg-card border border-border/50 rounded-lg p-4">
                <div className="flex items-center gap-0 flex-wrap">
                  {/* NEEQ box */}
                  <div className="flex flex-col items-center bg-teal-500/10 border border-teal-500/30 rounded-lg px-4 py-3 min-w-[120px]">
                    <span className="text-[10px] text-teal-600 font-medium">全国股转（新三板）</span>
                    <span className="text-xs font-mono text-foreground mt-1">{fmtDate(c.neeq_listing_date)}</span>
                    {c.neeq_tier && (
                      <Badge color={tierColor as any}>{c.neeq_tier}</Badge>
                    )}
                  </div>

                  {/* Arrow + duration */}
                  <div className="flex flex-col items-center px-3 py-1">
                    <span className="text-xs text-muted-foreground mb-1">
                      {neeqDuration ? `${neeqDuration.toFixed(1)}年` : ""}
                    </span>
                    <div className="flex items-center gap-1">
                      <div className="w-8 h-px bg-border" />
                      <span className="text-muted-foreground text-sm">→</span>
                      <div className="w-8 h-px bg-border" />
                    </div>
                    <span className="text-[10px] text-muted-foreground mt-1">挂牌时长</span>
                  </div>

                  {/* BSE box */}
                  <div className="flex flex-col items-center bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-3 min-w-[120px]">
                    <span className="text-[10px] text-amber-600 font-medium">北京证券交易所</span>
                    <span className="text-xs font-mono text-foreground mt-1">{fmtDate(c.bse_listing_date)}</span>
                    {c.listing_market_cap_yi && (
                      <span className="text-[10px] text-muted-foreground mt-0.5">市值 {fmtYi(c.listing_market_cap_yi)}</span>
                    )}
                  </div>
                </div>

                {/* NEEQ tier context */}
                {c.neeq_tier && (
                  <p className="text-xs text-muted-foreground mt-3">
                    {c.neeq_tier === "精选层" && "精选层企业可直接转板至北交所，无需重新审核，是最顺畅的上市路径。"}
                    {c.neeq_tier === "创新层" && "创新层企业需在新三板创新层挂牌满12个月后方可申请北交所上市。"}
                    {c.neeq_tier === "基础层" && "基础层企业需先升层至创新层，再满足挂牌时长要求后方可申请北交所上市。"}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">该公司无新三板挂牌记录</p>
            )}
          </div>

          {/* ── Section 3: PE Comparison ──────────────────────── */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <span className="w-1 h-4 bg-blue-500 rounded-full inline-block" />
              估值对比（发行市盈率）
            </h3>
            {peData.length > 0 ? (
              <div className="bg-card border border-border/50 rounded-lg p-4">
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={peData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                    <XAxis dataKey="name" tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} />
                    <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} unit="x" />
                    <Tooltip
                      formatter={(v: any) => [`${v}x`, "PE"]}
                      contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11 }}
                    />
                    <Bar dataKey="value" name="PE" radius={[4, 4, 0, 0]}>
                      {peData.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                {c.pe_vs_industry_pct != null && (
                  <p className="text-xs text-muted-foreground mt-2">
                    相对行业PE：
                    <span className={cn("font-mono font-semibold ml-1", c.pe_vs_industry_pct < 0 ? "text-green-500" : "text-red-500")}>
                      {c.pe_vs_industry_pct > 0 ? "+" : ""}{c.pe_vs_industry_pct.toFixed(1)}%
                    </span>
                    {c.pe_vs_industry_pct < 0 ? "（折价上市，安全边际较大）" : "（溢价上市，市场预期较高）"}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">暂无PE数据</p>
            )}
          </div>

          {/* ── Section 4: Peer Comparison ───────────────────── */}
          {c.industry && peers.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <span className="w-1 h-4 bg-rose-500 rounded-full inline-block" />
                同行业对比（{c.industry}，共{peers.length + 1}家）
              </h3>
              {/* Peer KPIs */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-card border border-border/50 rounded-lg p-3">
                  <div className="text-[10px] text-muted-foreground mb-1">本公司发行PE</div>
                  <div className="text-sm font-mono font-bold text-blue-500">{c.issue_pe ? `${c.issue_pe.toFixed(1)}x` : "—"}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">行业均值 {peerAvgPE.toFixed(1)}x</div>
                </div>
                <div className="bg-card border border-border/50 rounded-lg p-3">
                  <div className="text-[10px] text-muted-foreground mb-1">本公司首日涨幅</div>
                  <div className={cn("text-sm font-mono font-bold", (c.first_day_return_pct || 0) >= 0 ? "text-green-500" : "text-red-500")}>
                    {c.first_day_return_pct != null ? fmtPct(c.first_day_return_pct * 100) : "—"}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">行业均值 {fmtPct(peerAvgFD * 100)}</div>
                </div>
                <div className="bg-card border border-border/50 rounded-lg p-3">
                  <div className="text-[10px] text-muted-foreground mb-1">行业破发率</div>
                  <div className="text-sm font-mono font-bold text-amber-500">{peerBustPct.toFixed(1)}%</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{peers.filter(p => p.is_bust).length}家破发</div>
                </div>
              </div>
              {/* Peer charts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-card border border-border/50 rounded-lg p-3">
                  <h4 className="text-xs font-semibold mb-2 text-muted-foreground">行业PE分布</h4>
                  <ResponsiveContainer width="100%" height={140}>
                    <BarChart data={peerPEData} margin={{ top: 2, right: 5, left: -20, bottom: 2 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                      <XAxis dataKey="name" tick={{ fill: 'var(--muted-foreground)', fontSize: 9 }} />
                      <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 9 }} />
                      <Tooltip contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11 }} />
                      <Bar dataKey="count" name="公司数" fill="#60A5FA" radius={[3, 3, 0, 0]}>
                        {peerPEData.map((d, i) => {
                          // Highlight the bucket that contains this company's PE
                          const pe = c.issue_pe || 0;
                          const inBucket = (
                            (d.name === "<10x" && pe < 10) ||
                            (d.name === "10-20x" && pe >= 10 && pe < 20) ||
                            (d.name === "20-30x" && pe >= 20 && pe < 30) ||
                            (d.name === "30-40x" && pe >= 30 && pe < 40) ||
                            (d.name === "40-60x" && pe >= 40 && pe < 60) ||
                            (d.name === ">60x" && pe >= 60)
                          );
                          return <Cell key={i} fill={inBucket ? "#D4A843" : "#60A5FA"} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  {c.issue_pe && <p className="text-[10px] text-amber-600 mt-1">金色柱为本公司所在区间</p>}
                </div>
                <div className="bg-card border border-border/50 rounded-lg p-3">
                  <h4 className="text-xs font-semibold mb-2 text-muted-foreground">行业首日涨幅分布</h4>
                  <ResponsiveContainer width="100%" height={140}>
                    <BarChart data={peerFDData} margin={{ top: 2, right: 5, left: -20, bottom: 2 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                      <XAxis dataKey="name" tick={{ fill: 'var(--muted-foreground)', fontSize: 9 }} />
                      <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 9 }} />
                      <Tooltip contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11 }} />
                      <Bar dataKey="count" name="公司数" radius={[3, 3, 0, 0]}>
                        {peerFDData.map((d, i) => {
                          const fd = (c.first_day_return_pct || 0) * 100;
                          const inBucket = (
                            (d.name === "<-10%" && fd < -10) ||
                            (d.name === "-10~0%" && fd >= -10 && fd < 0) ||
                            (d.name === "0~10%" && fd >= 0 && fd < 10) ||
                            (d.name === "10~30%" && fd >= 10 && fd < 30) ||
                            (d.name === "30~50%" && fd >= 30 && fd < 50) ||
                            (d.name === "50~100%" && fd >= 50 && fd < 100) ||
                            (d.name === ">100%" && fd >= 100)
                          );
                          return <Cell key={i} fill={inBucket ? "#D4A843" : (d.name.startsWith("-") || d.name === "<-10%" ? "#F87171" : "#34D399")} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  {c.first_day_return_pct != null && <p className="text-[10px] text-amber-600 mt-1">金色柱为本公司所在区间</p>}
                </div>
              </div>
              {/* Top peers by 1yr change */}
              {peerCapChangeData.length > 0 && (
                <div className="bg-card border border-border/50 rounded-lg p-3 mt-4">
                  <h4 className="text-xs font-semibold mb-2 text-muted-foreground">同行业一年后表现 Top 10</h4>
                  <div className="space-y-1">
                    {peerCapChangeData.map((p, i) => (
                      <div key={p.code} className="flex items-center gap-2 text-xs">
                        <span className="text-muted-foreground w-4 text-right flex-shrink-0">{i + 1}.</span>
                        <span className="font-medium flex-1 truncate">{p.name}</span>
                        <span className="font-mono text-[10px] text-muted-foreground">{p.code}</span>
                        <span className={cn("font-mono font-medium", p.value >= 0 ? "text-green-500" : "text-red-500")}>{p.value > 0 ? "+" : ""}{p.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Section 5: Quick Stats ─────────────────────────── */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <span className="w-1 h-4 bg-violet-500 rounded-full inline-block" />
              关键指标速览
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: "发行PE", value: c.issue_pe ? `${c.issue_pe.toFixed(1)}x` : "—" },
                { label: "行业均值PE", value: c.industry_pe ? `${c.industry_pe.toFixed(1)}x` : "—" },
                { label: "PE折溢价", value: c.pe_vs_industry_pct != null ? `${c.pe_vs_industry_pct > 0 ? "+" : ""}${c.pe_vs_industry_pct.toFixed(1)}%` : "—", color: c.pe_vs_industry_pct != null ? (c.pe_vs_industry_pct < 0 ? "text-green-500" : "text-red-500") : undefined },
                { label: "最近融资估值", value: c.last_round_valuation_wan ? fmtWan(c.last_round_valuation_wan) : (c.no_financing ? "无融资" : "—") },
                { label: "IPO/融资倍数", value: c.ipo_vs_last_round_multiple ? `${c.ipo_vs_last_round_multiple.toFixed(1)}x` : "—" },
                { label: "融资到上市间隔", value: c.days_from_last_financing_to_ipo ? `${(c.days_from_last_financing_to_ipo / 365).toFixed(1)}年` : "—" },
                { label: "上市首日收盘价", value: c.listing_close_price ? `¥${c.listing_close_price.toFixed(2)}` : "—" },
                { label: "一年后收盘价", value: c.one_year_close_price ? `¥${c.one_year_close_price.toFixed(2)}` : "—" },
                { label: "新三板挂牌时长", value: c.neeq_duration_years ? `${c.neeq_duration_years.toFixed(1)}年` : "—" },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-card border border-border/50 rounded-lg p-3">
                  <KV label={label} value={value} color={color} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
