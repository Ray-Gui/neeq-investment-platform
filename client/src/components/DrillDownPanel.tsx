import { useState, useMemo } from "react";
import type { Company, Analytics } from "@/lib/types";
import { fmtYi, fmtPct, fmtDate, cn } from "@/lib/utils";
import CompanyDetailModal from "@/components/CompanyDetailModal";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, LineChart, Line, ReferenceLine
} from "recharts";

interface Props {
  /** The drill-down dimension: "industry" or "province" */
  dimension: "industry" | "province";
  /** The selected value (e.g. "专用设备制造业" or "江苏省") */
  value: string;
  /** All companies in the dataset */
  companies: Company[];
  analytics?: Analytics | null;
  onClose: () => void;
}

const COLORS = ["#D4A843","#4ECDC4","#60A5FA","#A78BFA","#34D399","#F97316","#EC4899","#6EE7B7","#F59E0B","#3B82F6"];

const Tip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-lg p-2.5 text-xs shadow-xl">
      {label && <div className="font-medium mb-1">{label}</div>}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex gap-2 items-center">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-mono">{typeof p.value === 'number' ? p.value.toFixed(1) : p.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function DrillDownPanel({ dimension, value, companies, analytics = null, onClose }: Props) {
  const [sortBy, setSortBy] = useState<"date" | "cap" | "fd" | "change">("date");
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  // Filter companies for this dimension/value
  const peers = useMemo(() => {
    return companies.filter(c =>
      dimension === "industry" ? c.industry === value : c.province === value
    );
  }, [companies, dimension, value]);

  // PE distribution
  const peDist = useMemo(() => {
    const buckets: Record<string, number> = { "<10x": 0, "10-20x": 0, "20-30x": 0, "30-40x": 0, "40-60x": 0, ">60x": 0 };
    peers.filter(c => c.issue_pe).forEach(c => {
      const v = c.issue_pe!;
      if (v < 10) buckets["<10x"]++;
      else if (v < 20) buckets["10-20x"]++;
      else if (v < 30) buckets["20-30x"]++;
      else if (v < 40) buckets["30-40x"]++;
      else if (v < 60) buckets["40-60x"]++;
      else buckets[">60x"]++;
    });
    return Object.entries(buckets).map(([name, count]) => ({ name, count }));
  }, [peers]);

  // First-day return distribution
  const fdDist = useMemo(() => {
    const buckets: Record<string, number> = { "<-10%": 0, "-10~0%": 0, "0~10%": 0, "10~30%": 0, "30~50%": 0, "50~100%": 0, ">100%": 0 };
    peers.filter(c => c.first_day_return_pct != null).forEach(c => {
      const v = (c.first_day_return_pct!) * 100;
      if (v < -10) buckets["<-10%"]++;
      else if (v < 0) buckets["-10~0%"]++;
      else if (v < 10) buckets["0~10%"]++;
      else if (v < 30) buckets["10~30%"]++;
      else if (v < 50) buckets["30~50%"]++;
      else if (v < 100) buckets["50~100%"]++;
      else buckets[">100%"]++;
    });
    return Object.entries(buckets).map(([name, count]) => ({ name, count }));
  }, [peers]);

  // Yearly listing trend
  const yearlyTrend = useMemo(() => {
    const map: Record<string, { count: number; capSum: number; capN: number; fdSum: number; fdN: number }> = {};
    peers.forEach(c => {
      const y = c.bse_listing_date?.slice(0, 4) || "未知";
      if (!map[y]) map[y] = { count: 0, capSum: 0, capN: 0, fdSum: 0, fdN: 0 };
      map[y].count++;
      if (c.listing_market_cap_yi) { map[y].capSum += c.listing_market_cap_yi; map[y].capN++; }
      if (c.first_day_return_pct != null) { map[y].fdSum += c.first_day_return_pct * 100; map[y].fdN++; }
    });
    return Object.entries(map)
      .filter(([y]) => y !== "未知")
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([year, d]) => ({
        year,
        count: d.count,
        avgCap: d.capN > 0 ? +(d.capSum / d.capN).toFixed(2) : 0,
        avgFD: d.fdN > 0 ? +(d.fdSum / d.fdN).toFixed(1) : 0,
      }));
  }, [peers]);

  // Sub-dimension breakdown (if industry → show provinces; if province → show industries)
  const subDimDist = useMemo(() => {
    const map: Record<string, number> = {};
    peers.forEach(c => {
      const k = dimension === "industry" ? (c.province || "未知") : (c.industry || "未知");
      map[k] = (map[k] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, count]) => ({ name: name.slice(0, 8), count }));
  }, [peers, dimension]);

  // KPIs
  const kpis = useMemo(() => {
    const withCap = peers.filter(c => c.listing_market_cap_yi);
    const withFD = peers.filter(c => c.first_day_return_pct != null);
    const withChange = peers.filter(c => c.cap_change_pct != null);
    const withPE = peers.filter(c => c.issue_pe);
    return {
      count: peers.length,
      avgCap: withCap.length > 0 ? withCap.reduce((s, c) => s + (c.listing_market_cap_yi || 0), 0) / withCap.length : 0,
      avgFD: withFD.length > 0 ? withFD.reduce((s, c) => s + (c.first_day_return_pct || 0) * 100, 0) / withFD.length : 0,
      avgChange: withChange.length > 0 ? withChange.reduce((s, c) => s + (c.cap_change_pct || 0), 0) / withChange.length : 0,
      bustPct: peers.length > 0 ? peers.filter(c => c.is_bust).length / peers.length * 100 : 0,
      avgPE: withPE.length > 0 ? withPE.reduce((s, c) => s + (c.issue_pe || 0), 0) / withPE.length : 0,
    };
  }, [peers]);

  // Sorted company list
  const sortedPeers = useMemo(() => {
    const arr = [...peers];
    if (sortBy === "date") return arr.sort((a, b) => (a.bse_listing_date || "").localeCompare(b.bse_listing_date || ""));
    if (sortBy === "cap") return arr.sort((a, b) => (b.listing_market_cap_yi || 0) - (a.listing_market_cap_yi || 0));
    if (sortBy === "fd") return arr.sort((a, b) => (b.first_day_return_pct || 0) - (a.first_day_return_pct || 0));
    if (sortBy === "change") return arr.sort((a, b) => (b.cap_change_pct || 0) - (a.cap_change_pct || 0));
    return arr;
  }, [peers, sortBy]);

  const dimLabel = dimension === "industry" ? "行业" : "省份";

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-start justify-center overflow-y-auto py-6 px-4">
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{dimLabel}下钻</span>
              <h2 className="text-base font-bold text-foreground">{value}</h2>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">共 {peers.length} 家上市企业</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* KPI Cards */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {[
              { label: "企业数量", value: `${kpis.count}家`, color: "text-primary" },
              { label: "平均发行市值", value: `${kpis.avgCap.toFixed(1)}亿`, color: "text-primary" },
              { label: "平均首日涨幅", value: fmtPct(kpis.avgFD), color: kpis.avgFD >= 0 ? "text-green-500" : "text-red-500" },
              { label: "平均一年后变化", value: fmtPct(kpis.avgChange), color: kpis.avgChange >= 0 ? "text-green-500" : "text-red-500" },
              { label: "破发率", value: `${kpis.bustPct.toFixed(1)}%`, color: kpis.bustPct > 30 ? "text-red-500" : "text-amber-500" },
              { label: "平均发行PE", value: `${kpis.avgPE.toFixed(1)}x`, color: "text-blue-500" },
            ].map(({ label, value: v, color }) => (
              <div key={label} className="bg-background border border-border/50 rounded-lg p-3">
                <div className="text-[10px] text-muted-foreground mb-1">{label}</div>
                <div className={cn("text-sm font-mono font-bold", color)}>{v}</div>
              </div>
            ))}
          </div>

          {/* Charts Row 1: PE dist + FD dist */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-background border border-border/50 rounded-lg p-4">
              <h3 className="text-xs font-semibold text-muted-foreground mb-3">发行PE分布</h3>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={peDist} margin={{ top: 2, right: 5, left: -20, bottom: 2 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                  <XAxis dataKey="name" tick={{ fill: 'var(--muted-foreground)', fontSize: 9 }} />
                  <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 9 }} />
                  <Tooltip content={<Tip />} />
                  <Bar dataKey="count" name="公司数" radius={[3, 3, 0, 0]}>
                    {peDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-background border border-border/50 rounded-lg p-4">
              <h3 className="text-xs font-semibold text-muted-foreground mb-3">首日涨跌幅分布</h3>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={fdDist} margin={{ top: 2, right: 5, left: -20, bottom: 2 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                  <XAxis dataKey="name" tick={{ fill: 'var(--muted-foreground)', fontSize: 9 }} />
                  <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 9 }} />
                  <Tooltip content={<Tip />} />
                  <Bar dataKey="count" name="公司数" radius={[3, 3, 0, 0]}>
                    {fdDist.map((d, i) => (
                      <Cell key={i} fill={d.name.startsWith("-") || d.name === "<-10%" ? "#F87171" : "#34D399"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Charts Row 2: Yearly trend + Sub-dimension breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-background border border-border/50 rounded-lg p-4">
              <h3 className="text-xs font-semibold text-muted-foreground mb-3">历年上市数量与平均首日涨幅</h3>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={yearlyTrend} margin={{ top: 2, right: 30, left: -20, bottom: 2 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                  <XAxis dataKey="year" tick={{ fill: 'var(--muted-foreground)', fontSize: 9 }} />
                  <YAxis yAxisId="left" tick={{ fill: 'var(--muted-foreground)', fontSize: 9 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fill: 'var(--muted-foreground)', fontSize: 9 }} unit="%" />
                  <Tooltip content={<Tip />} />
                  <Bar yAxisId="left" dataKey="count" name="上市数量" fill="#D4A843" radius={[3, 3, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="avgFD" name="平均首日涨幅%" stroke="#4ECDC4" strokeWidth={2} dot={{ r: 3 }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-background border border-border/50 rounded-lg p-4">
              <h3 className="text-xs font-semibold text-muted-foreground mb-3">
                {dimension === "industry" ? "企业省份分布" : "企业行业分布"}（Top 8）
              </h3>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={subDimDist} layout="vertical" margin={{ top: 2, right: 30, left: 5, bottom: 2 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} horizontal={false} />
                  <XAxis type="number" tick={{ fill: 'var(--muted-foreground)', fontSize: 9 }} />
                  <YAxis type="category" dataKey="name" tick={{ fill: 'var(--muted-foreground)', fontSize: 9 }} width={70} />
                  <Tooltip content={<Tip />} />
                  <Bar dataKey="count" name="企业数" radius={[0, 3, 3, 0]}>
                    {subDimDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Company list */}
          <div className="bg-background border border-border/50 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
              <h3 className="text-xs font-semibold">全部企业列表（{peers.length}家）</h3>
              <div className="flex items-center gap-1 text-[10px]">
                <span className="text-muted-foreground mr-1">排序：</span>
                {([["date", "上市日期"], ["cap", "发行市值"], ["fd", "首日涨幅"], ["change", "一年后变化"]] as const).map(([k, label]) => (
                  <button
                    key={k}
                    onClick={() => setSortBy(k)}
                    className={cn("px-2 py-0.5 rounded transition-colors", sortBy === k ? "bg-primary/20 text-primary font-medium" : "text-muted-foreground hover:text-foreground")}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="overflow-x-auto max-h-[320px] overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/30 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left text-muted-foreground font-medium">代码</th>
                    <th className="px-3 py-2 text-left text-muted-foreground font-medium">公司名称</th>
                    {dimension === "industry" && <th className="px-3 py-2 text-left text-muted-foreground font-medium">省份</th>}
                    {dimension === "province" && <th className="px-3 py-2 text-left text-muted-foreground font-medium">行业</th>}
                    <th className="px-3 py-2 text-left text-muted-foreground font-medium">上市日期</th>
                    <th className="px-3 py-2 text-right text-muted-foreground font-medium">发行市值</th>
                    <th className="px-3 py-2 text-right text-muted-foreground font-medium">发行PE</th>
                    <th className="px-3 py-2 text-right text-muted-foreground font-medium">首日涨幅</th>
                    <th className="px-3 py-2 text-right text-muted-foreground font-medium">一年后变化</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedPeers.map((c, i) => (
                    <tr key={c.bse_code} className={cn("border-t border-border/30 hover:bg-muted/20 transition-colors", i % 2 === 0 ? "" : "bg-muted/10")}>
                      <td className="px-3 py-2 font-mono text-muted-foreground">{c.bse_code}</td>
                      <td
                        className="px-3 py-2 font-medium max-w-[120px] truncate cursor-pointer text-primary hover:underline"
                        onClick={() => setSelectedCompany(c)}
                        title="点击查看公司详情"
                      >{c.name}</td>
                      {dimension === "industry" && <td className="px-3 py-2 text-muted-foreground">{c.province || "—"}</td>}
                      {dimension === "province" && <td className="px-3 py-2 text-muted-foreground max-w-[100px] truncate">{c.industry || "—"}</td>}
                      <td className="px-3 py-2 text-muted-foreground font-mono">{c.bse_listing_date?.slice(0, 10) || "—"}</td>
                      <td className="px-3 py-2 text-right font-mono">{c.listing_market_cap_yi ? fmtYi(c.listing_market_cap_yi) : "—"}</td>
                      <td className="px-3 py-2 text-right font-mono">{c.issue_pe ? `${c.issue_pe.toFixed(1)}x` : "—"}</td>
                      <td className={cn("px-3 py-2 text-right font-mono", c.first_day_return_pct != null ? ((c.first_day_return_pct >= 0) ? "text-green-500" : "text-red-500") : "text-muted-foreground")}>
                        {c.first_day_return_pct != null ? fmtPct(c.first_day_return_pct * 100) : "—"}
                      </td>
                      <td className={cn("px-3 py-2 text-right font-mono", c.cap_change_pct != null ? ((c.cap_change_pct >= 0) ? "text-green-500" : "text-red-500") : "text-muted-foreground")}>
                        {c.cap_change_pct != null ? fmtPct(c.cap_change_pct) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      {selectedCompany && (
        <CompanyDetailModal
          company={selectedCompany}
          companies={companies}
          analytics={analytics}
          onClose={() => setSelectedCompany(null)}
        />
      )}
    </div>
  );
}
