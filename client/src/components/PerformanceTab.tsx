import type { Company, Analytics } from "@/lib/types";
import { useState, useMemo } from "react";
import { fmtYi, fmtPct, fmtDate, fmt, cn } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, ReferenceLine,
  ScatterChart, Scatter, ZAxis
} from "recharts";

interface Props { companies: Company[]; analytics: Analytics | null }

const GREEN = "#34D399";
const RED = "#F87171";

const Tip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-lg p-3 text-xs shadow-xl">
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

export default function PerformanceTab({ companies, analytics }: Props) {
  if (!analytics) return <div className="text-center py-20 text-muted-foreground">加载中...</div>;

  const { overview, yearly_stats, fd_return_buckets, bust_by_year, rankings } = analytics;

  // Year range filter
  const allYears = useMemo(() =>
    Array.from(new Set((yearly_stats || []).map(d => parseInt(String(d.year))))).sort((a, b) => a - b),
    [yearly_stats]
  );
  const minYear = allYears[0] ?? 2020;
  const maxYear = allYears[allYears.length - 1] ?? 2026;
  const [yearFrom, setYearFrom] = useState<number>(minYear);
  const [yearTo, setYearTo] = useState<number>(maxYear);
  const isFiltered = yearFrom !== minYear || yearTo !== maxYear;

  // Filter companies by selected year range
  const filteredCompanies = useMemo(() => companies.filter(c => {
    const y = c.bse_listing_date ? parseInt(c.bse_listing_date.slice(0, 4)) : 0;
    return y >= yearFrom && y <= yearTo;
  }), [companies, yearFrom, yearTo]);

  const yr1Data = filteredCompanies.filter(c => c.cap_change_pct != null);
  const bustData = filteredCompanies.filter(c => c.is_bust);
  const fdData = filteredCompanies.filter(c => c.first_day_return_pct != null);

  // KPIs from filtered data
  const upCount = yr1Data.filter(c => (c.cap_change_pct || 0) > 0).length;
  const upPct = yr1Data.length > 0 ? upCount / yr1Data.length * 100 : 0;
  const avgFD = fdData.length > 0
    ? fdData.reduce((s, c) => s + (c.first_day_return_pct || 0), 0) / fdData.length
    : 0;
  const medFD = fdData.length > 0
    ? [...fdData].sort((a, b) => (a.first_day_return_pct || 0) - (b.first_day_return_pct || 0))[Math.floor(fdData.length / 2)].first_day_return_pct || 0
    : 0;
  const bustCount = bustData.length;
  const bustPct = filteredCompanies.length > 0 ? bustCount / filteredCompanies.length * 100 : 0;

  // Cap change distribution from filtered data
  const changeBuckets: Record<string, number> = {};
  yr1Data.forEach(c => {
    const v = c.cap_change_pct!;
    let bucket: string;
    if (v < -50) bucket = "<-50%";
    else if (v < -30) bucket = "-50~-30%";
    else if (v < -10) bucket = "-30~-10%";
    else if (v < 0) bucket = "-10~0%";
    else if (v < 10) bucket = "0~10%";
    else if (v < 30) bucket = "10~30%";
    else if (v < 50) bucket = "30~50%";
    else if (v < 100) bucket = "50~100%";
    else bucket = ">100%";
    changeBuckets[bucket] = (changeBuckets[bucket] || 0) + 1;
  });
  const changeDist = ["<-50%", "-50~-30%", "-30~-10%", "-10~0%", "0~10%", "10~30%", "30~50%", "50~100%", ">100%"]
    .map(k => ({ name: k, count: changeBuckets[k] || 0, color: k.startsWith("-") || k === "<-50%" ? RED : GREEN }));

  // First day distribution from filtered data
  const fdBuckets: Record<string, number> = {};
  fdData.forEach(c => {
    const v = (c.first_day_return_pct || 0);
    let bucket: string;
    if (v < -20) bucket = "<-20%";
    else if (v < -10) bucket = "-20~-10%";
    else if (v < 0) bucket = "-10~0%";
    else if (v < 10) bucket = "0~10%";
    else if (v < 30) bucket = "10~30%";
    else if (v < 50) bucket = "30~50%";
    else if (v < 100) bucket = "50~100%";
    else bucket = ">100%";
    fdBuckets[bucket] = (fdBuckets[bucket] || 0) + 1;
  });
  const fdDist = ["<-20%", "-20~-10%", "-10~0%", "0~10%", "10~30%", "30~50%", "50~100%", ">100%"]
    .map(k => ({ name: k, count: fdBuckets[k] || 0 }));

  // Yearly performance filtered
  const yearlyPerf = useMemo(() => (yearly_stats || [])
    .filter(d => parseInt(String(d.year)) >= yearFrom && parseInt(String(d.year)) <= yearTo)
    .map(y => ({
      year: y.year,
      avg_change: +y.avg_cap_change.toFixed(1),
      avg_fd: +(y.avg_first_day_return * 100).toFixed(1),
      bust_pct: +y.bust_pct.toFixed(1),
      count: y.count,
    })), [yearly_stats, yearFrom, yearTo]);

  // Bust by year filtered
  const bustByYearData = useMemo(() => (bust_by_year || [])
    .filter(b => parseInt(String(b.year)) >= yearFrom && parseInt(String(b.year)) <= yearTo)
    .map(b => ({
      year: b.year,
      bust_pct: +b.bust_pct.toFixed(1),
      bust: b.bust,
      total: b.total,
    })), [bust_by_year, yearFrom, yearTo]);

  // Rankings filtered by year
  const filteredGainers = useMemo(() => {
    const codes = new Set(filteredCompanies.map(c => c.bse_code));
    return (rankings?.top_gainers || []).filter(c => codes.has(c.code));
  }, [filteredCompanies, rankings]);

  const filteredLosers = useMemo(() => {
    const codes = new Set(filteredCompanies.map(c => c.bse_code));
    return (rankings?.top_losers || []).filter(c => codes.has(c.code));
  }, [filteredCompanies, rankings]);

  const filteredFirstDay = useMemo(() => {
    const codes = new Set(filteredCompanies.map(c => c.bse_code));
    return (rankings?.top_first_day || []).filter(c => codes.has(c.code));
  }, [filteredCompanies, rankings]);

  return (
    <div className="space-y-5">
      {/* Year Range Filter */}
      <div className="bg-card border border-border/50 rounded-lg p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">时间范围筛选</span>
            {isFiltered && (
              <button
                onClick={() => { setYearFrom(minYear); setYearTo(maxYear); }}
                className="text-xs text-primary hover:underline"
              >
                重置
              </button>
            )}
          </div>
          <div className="flex items-center gap-3 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">从</span>
              <select
                value={yearFrom}
                onChange={e => { const v = parseInt(e.target.value); setYearFrom(v); if (v > yearTo) setYearTo(v); }}
                className="text-xs bg-background border border-border rounded px-2 py-1 text-foreground"
              >
                {allYears.map(y => <option key={y} value={y}>{y}年</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">到</span>
              <select
                value={yearTo}
                onChange={e => { const v = parseInt(e.target.value); setYearTo(v); if (v < yearFrom) setYearFrom(v); }}
                className="text-xs bg-background border border-border rounded px-2 py-1 text-foreground"
              >
                {allYears.map(y => <option key={y} value={y}>{y}年</option>)}
              </select>
            </div>
            <span className="text-xs text-muted-foreground">
              {isFiltered ? (
                <span className="text-primary font-medium">{filteredCompanies.length}家上市企业（{yearFrom}–{yearTo}年）</span>
              ) : (
                <span>全部 {filteredCompanies.length} 家企业</span>
              )}
            </span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {allYears.map(y => (
              <button
                key={y}
                onClick={() => { setYearFrom(y); setYearTo(y); }}
                className={`text-xs px-2 py-1 rounded border transition-colors ${
                  yearFrom === y && yearTo === y
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border hover:border-primary/50 hover:text-primary'
                }`}
              >
                {y}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Narrative Insight */}
      <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-4">
        <h2 className="text-sm font-semibold text-amber-600 mb-1.5">分析观点</h2>
        <p className="text-sm text-foreground/80 leading-relaxed">
          北交所上市表现呈阶段性特征：<strong>2022年是分水岭</strong>——该年破发率高达50.7%，平均首日涨幅仅+2.5%，为市场最差时期。而2024年以来破发率归零、首日平均涨幅超过80%，市场情绪已实现实质性修复。就个股而言，星图测控（+2,241%）、吉林碳谷（+1,459%）等超级牛股均来自高景气细分赛道，说明<strong>判断行业景气度的重要性远超过分析个股财务指标</strong>。
        </p>
      </div>

      {/* Summary cards — dynamic */}
      {isFiltered && (
        <div className="text-xs text-primary/70 font-medium px-1">ℹ️ 展示 {yearFrom}–{yearTo} 年间上市的 {filteredCompanies.length} 家企业数据</div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "有一年后数据", value: `${yr1Data.length}家`, sub: `占比 ${(yr1Data.length / (filteredCompanies.length || 1) * 100).toFixed(0)}%` },
          { label: "一年后上涨", value: `${upCount}家`, sub: `上涨率 ${fmt(upPct, 1)}%`, color: "text-green-500" },
          { label: "平均首日涨跌幅", value: fmtPct(avgFD * 100), sub: `中位数 ${fmtPct(medFD * 100)}` },
          { label: "首日破发", value: `${bustCount}家`, sub: `破发率 ${fmt(bustPct, 1)}%`, color: "text-red-500" },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className="bg-card border border-border/50 rounded-lg p-4">
            <div className="text-xs text-muted-foreground mb-1">{label}</div>
            <div className={cn("text-xl font-bold font-mono", color || "text-primary")}>{value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border/50 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-1">上市后一年市值变化分布</h3>
          <p className="text-xs text-muted-foreground mb-3">基于 {yr1Data.length} 家有一年后数据的公司{isFiltered ? `（${yearFrom}–${yearTo}年）` : ''}</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={changeDist} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
              <XAxis dataKey="name" tick={{ fill: 'var(--muted-foreground)', fontSize: 9 }} />
              <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} />
              <Tooltip content={<Tip />} />
              <ReferenceLine x="-10~0%" stroke="var(--border)" strokeDasharray="4 4" />
              <Bar dataKey="count" name="公司数" radius={[3, 3, 0, 0]}>
                {changeDist.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border/50 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-1">上市首日涨跌幅分布</h3>
          <p className="text-xs text-muted-foreground mb-3">基于 {fdData.length} 家公司{isFiltered ? `（${yearFrom}–${yearTo}年）` : ''}</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={fdDist} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
              <XAxis dataKey="name" tick={{ fill: 'var(--muted-foreground)', fontSize: 9 }} />
              <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} />
              <Tooltip content={<Tip />} />
              <Bar dataKey="count" name="公司数" fill="#60A5FA" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border/50 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-1">各年度平均首日涨跌幅 & 一年后涨跌幅</h3>
          <p className="text-xs text-muted-foreground mb-3">按上市年份分组，对比首日表现与一年后表现</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={yearlyPerf} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
              <XAxis dataKey="year" tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} unit="%" />
              <Tooltip content={<Tip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <ReferenceLine y={0} stroke="var(--border)" />
              <Bar dataKey="avg_fd" name="平均首日涨跌(%)" fill="#60A5FA" radius={[2, 2, 0, 0]} />
              <Bar dataKey="avg_change" name="平均一年后涨跌(%)" fill="#D4A843" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border/50 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-1">各年度破发率趋势</h3>
          <p className="text-xs text-muted-foreground mb-3">按上市年份统计首日破发（收盘价低于发行价）比例</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={bustByYearData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
              <XAxis dataKey="year" tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} unit="%" />
              <Tooltip content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="bg-popover border border-border rounded-lg p-3 text-xs shadow-xl">
                    <div className="font-medium mb-1">{label}年</div>
                    <div>破发率: {d.bust_pct.toFixed(1)}%</div>
                    <div>破发数: {d.bust}家 / {d.total}家</div>
                  </div>
                );
              }} />
              <Line type="monotone" dataKey="bust_pct" name="破发率(%)" stroke={RED} strokeWidth={2} dot={{ fill: RED, r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border/50 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">一年后涨幅 Top 15{isFiltered ? ` (${yearFrom}–${yearTo})` : ''}</h3>
          <div className="space-y-1.5">
            {filteredGainers.slice(0, 15).map((c, i) => (
              <div key={c.code} className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground w-5 text-right flex-shrink-0">{i + 1}.</span>
                <span className="font-medium flex-1 truncate">{c.name}</span>
                <span className="text-muted-foreground font-mono text-[10px]">{c.industry?.slice(0, 6)}</span>
                <span className="font-mono text-green-500 font-medium">{fmtPct(c.change)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border/50 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">一年后跌幅 Top 15{isFiltered ? ` (${yearFrom}–${yearTo})` : ''}</h3>
          <div className="space-y-1.5">
            {filteredLosers.slice(0, 15).map((c, i) => (
              <div key={c.code} className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground w-5 text-right flex-shrink-0">{i + 1}.</span>
                <span className="font-medium flex-1 truncate">{c.name}</span>
                <span className="text-muted-foreground font-mono text-[10px]">{c.industry?.slice(0, 6)}</span>
                <span className="font-mono text-red-500 font-medium">{fmtPct(c.change)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* First day top performers */}
      <div className="bg-card border border-border/50 rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-3">首日涨幅 Top 15{isFiltered ? ` (${yearFrom}–${yearTo})` : ''}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left px-3 py-2 text-muted-foreground">排名</th>
                <th className="text-left px-3 py-2 text-muted-foreground">公司</th>
                <th className="text-right px-3 py-2 text-muted-foreground">首日涨幅</th>
                <th className="text-right px-3 py-2 text-muted-foreground">发行价</th>
                <th className="text-right px-3 py-2 text-muted-foreground">首日收盘</th>
                <th className="text-left px-3 py-2 text-muted-foreground">上市年份</th>
              </tr>
            </thead>
            <tbody>
              {filteredFirstDay.slice(0, 15).map((c, i) => (
                <tr key={c.code} className="border-b border-border/30 hover:bg-muted/20">
                  <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                  <td className="px-3 py-2">
                    <div className="font-medium">{c.name}</div>
                    <div className="text-muted-foreground font-mono text-[10px]">{c.code}</div>
                  </td>
                  <td className="px-3 py-2 text-right font-mono font-medium text-green-500">{fmtPct(c.return * 100)}</td>
                  <td className="px-3 py-2 text-right font-mono">¥{c.issue_price?.toFixed(2) || "—"}</td>
                  <td className="px-3 py-2 text-right font-mono">¥{c.listing_close?.toFixed(2) || "—"}</td>
                  <td className="px-3 py-2 text-muted-foreground">{c.year}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Scatter: PE vs 1-year return */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border/50 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-1">发行PE vs 一年后市值变化（散点图）</h3>
          <p className="text-xs text-muted-foreground mb-3">
            每个点代表一家公司。负相关关系（r ≈ −0.226）说明<strong>低PE发行的公司一年后表现更好</strong>，高估值发行存在均值回归压力。
          </p>
          <ResponsiveContainer width="100%" height={260}>
            <ScatterChart margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} />
              <XAxis
                type="number" dataKey="pe" name="发行PE" unit="x"
                tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
                label={{ value: '发行PE (x)', position: 'insideBottom', offset: -2, fill: 'var(--muted-foreground)', fontSize: 10 }}
                domain={[0, 80]}
              />
              <YAxis
                type="number" dataKey="change" name="一年后变化" unit="%"
                tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
                label={{ value: '一年后变化 (%)', angle: -90, position: 'insideLeft', fill: 'var(--muted-foreground)', fontSize: 10 }}
              />
              <ZAxis range={[20, 20]} />
              <ReferenceLine y={0} stroke="var(--border)" strokeDasharray="4 4" />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="bg-popover border border-border rounded-lg p-2.5 text-xs shadow-xl">
                      <div className="font-medium mb-1">{d.name}</div>
                      <div>发行PE: {d.pe?.toFixed(1)}x</div>
                      <div>一年后变化: {d.change?.toFixed(1)}%</div>
                      <div className="text-muted-foreground">{d.industry?.slice(0, 8)}</div>
                    </div>
                  );
                }}
              />
              <Scatter
                data={filteredCompanies
                  .filter(c => c.issue_pe && c.cap_change_pct != null && c.issue_pe <= 80)
                  .map(c => ({ name: c.name, pe: c.issue_pe, change: c.cap_change_pct, industry: c.industry }))
                }
                fill="#60A5FA"
                fillOpacity={0.6}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border/50 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-1">首日涨幅 vs 一年后市值变化（散点图）</h3>
          <p className="text-xs text-muted-foreground mb-3">
            首日大涨的公司一年后是否能维持？散点分布揭示<strong>首日高涨幅与长期表现的相关性</strong>，帮助判断短期热情是否可持续。
          </p>
          <ResponsiveContainer width="100%" height={260}>
            <ScatterChart margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} />
              <XAxis
                type="number" dataKey="fd" name="首日涨幅" unit="%"
                tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
                label={{ value: '首日涨幅 (%)', position: 'insideBottom', offset: -2, fill: 'var(--muted-foreground)', fontSize: 10 }}
                domain={[-30, 200]}
              />
              <YAxis
                type="number" dataKey="change" name="一年后变化" unit="%"
                tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
                label={{ value: '一年后变化 (%)', angle: -90, position: 'insideLeft', fill: 'var(--muted-foreground)', fontSize: 10 }}
              />
              <ZAxis range={[20, 20]} />
              <ReferenceLine y={0} stroke="var(--border)" strokeDasharray="4 4" />
              <ReferenceLine x={0} stroke="var(--border)" strokeDasharray="4 4" />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="bg-popover border border-border rounded-lg p-2.5 text-xs shadow-xl">
                      <div className="font-medium mb-1">{d.name}</div>
                      <div>首日涨幅: {d.fd?.toFixed(1)}%</div>
                      <div>一年后变化: {d.change?.toFixed(1)}%</div>
                    </div>
                  );
                }}
              />
              <Scatter
                data={filteredCompanies
                  .filter(c => c.first_day_return_pct != null && c.cap_change_pct != null)
                  .map(c => ({ name: c.name, fd: (c.first_day_return_pct || 0), change: c.cap_change_pct }))
                  .filter(d => d.fd >= -30 && d.fd <= 200)
                }
                fill="#D4A843"
                fillOpacity={0.6}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bust companies */}
      {bustData.length > 0 && (
        <div className="bg-card border border-border/50 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">首日破发企业（{bustData.length}家{isFiltered ? `，${yearFrom}–${yearTo}年` : ''}）</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {bustData.map(c => (
              <div key={c.bse_code} className="flex items-center gap-2 p-2 bg-red-500/5 border border-red-500/20 rounded-md">
                <span className="text-xs font-mono text-muted-foreground">{c.bse_code}</span>
                <span className="text-xs font-medium truncate">{c.name}</span>
                <span className="text-xs font-mono text-red-500 ml-auto flex-shrink-0">{fmtPct((c.first_day_return_pct || 0))}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
