import type { Company, Analytics } from "@/lib/types";
import { useState, useMemo } from "react";
import DrillDownPanel from "@/components/DrillDownPanel";
import { fmtYi, fmtPct, fmt } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, ScatterChart, Scatter, Legend, ReferenceLine, ComposedChart
} from "recharts";

interface Props { companies: Company[]; analytics: Analytics | null; }

const COLORS = ["#D4A843","#4ECDC4","#FF6B6B","#A78BFA","#60A5FA","#34D399","#F97316","#EC4899","#FBBF24","#6EE7B7"];

const StatCard = ({ label, value, sub, color = "" }: { label: string; value: string; sub?: string; color?: string }) => (
  <div className="bg-card border border-border/50 rounded-lg p-4 hover:border-border transition-colors">
    <div className="text-xs text-muted-foreground mb-1">{label}</div>
    <div className={`text-xl font-bold font-mono ${color || "text-primary"}`}>{value}</div>
    {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
  </div>
);

const ChartTip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-lg p-3 text-xs shadow-xl">
      {label && <div className="font-medium text-foreground mb-1">{label}</div>}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex gap-2 items-center">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-mono text-foreground">{typeof p.value === 'number' ? p.value.toFixed(1) : p.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function OverviewTab({ companies, analytics }: Props) {
  if (!analytics) return <div className="text-center py-20 text-muted-foreground">加载中...</div>;
  const { overview, yearly_stats, industry_stats, cap_buckets, fd_return_buckets, rankings } = analytics;
  const [drillDown, setDrillDown] = useState<{ dimension: "industry" | "province"; value: string } | null>(null);

  // Year range filter
  const allYears = useMemo(() => Array.from(new Set((yearly_stats || []).map(d => parseInt(String(d.year))))).sort((a,b) => a-b), [yearly_stats]);
  const minYear = allYears[0] ?? 2020;
  const maxYear = allYears[allYears.length - 1] ?? 2026;
  const [yearFrom, setYearFrom] = useState<number>(minYear);
  const [yearTo, setYearTo] = useState<number>(maxYear);

  const capDist = Object.entries(cap_buckets || {}).map(([k, v]) => ({ name: k, count: v as number }));
  const fdDist = Object.entries(fd_return_buckets || {}).map(([k, v]) => ({ name: k, count: v as number }));

  const topIndustries = useMemo(() => {
    // Filter companies by year range for industry stats
    const filtered = companies.filter(c => {
      const y = c.bse_listing_date ? parseInt(c.bse_listing_date.slice(0, 4)) : 0;
      return y >= yearFrom && y <= yearTo;
    });
    const industryMap: Record<string, { count: number; capSum: number; capCount: number }> = {};
    filtered.forEach(c => {
      const ind = c.industry || '其他';
      if (!industryMap[ind]) industryMap[ind] = { count: 0, capSum: 0, capCount: 0 };
      industryMap[ind].count++;
      if (c.listing_market_cap_yi) { industryMap[ind].capSum += c.listing_market_cap_yi; industryMap[ind].capCount++; }
    });
    return Object.entries(industryMap)
      .map(([industry, d]) => ({
        name: industry.length > 8 ? industry.slice(0, 8) + '…' : industry,
        count: d.count,
        avgCap: d.capCount > 0 ? +(d.capSum / d.capCount).toFixed(1) : 0,
        avgChange: 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [companies, yearFrom, yearTo]);

  const yearlyData = useMemo(() => (yearly_stats || [])
    .filter(d => parseInt(String(d.year)) >= yearFrom && parseInt(String(d.year)) <= yearTo)
    .map(d => ({
      year: d.year,
      count: d.count,
      avgCap: +(d.avg_ipo_cap || 0).toFixed(1),
      avgChange: +(d.avg_cap_change || 0).toFixed(1),
      bustPct: +(d.bust_pct || 0).toFixed(1),
      avgFD: +(d.avg_first_day_return || 0).toFixed(1),
    })), [yearly_stats, yearFrom, yearTo]);

  // Filtered KPIs
  const filteredCompanies = useMemo(() => companies.filter(c => {
    const y = c.bse_listing_date ? parseInt(c.bse_listing_date.slice(0, 4)) : 0;
    return y >= yearFrom && y <= yearTo;
  }), [companies, yearFrom, yearTo]);
  const filteredCount = filteredCompanies.length;
  const filteredAvgCap = filteredCompanies.filter(c => c.listing_market_cap_yi).reduce((s, c) => s + (c.listing_market_cap_yi || 0), 0) / (filteredCompanies.filter(c => c.listing_market_cap_yi).length || 1);
  const filteredBustCount = filteredCompanies.filter(c => c.is_bust === true).length;
  const filteredBustPct = filteredCount > 0 ? filteredBustCount / filteredCount * 100 : 0;
  const filteredAvgFD = filteredCompanies.filter(c => c.first_day_return_pct != null).reduce((s, c) => s + (c.first_day_return_pct || 0), 0) / (filteredCompanies.filter(c => c.first_day_return_pct != null).length || 1);
  const filteredUp = filteredCompanies.filter(c => (c.cap_change_pct || 0) > 0).length;
  const filteredUpPct = filteredCount > 0 ? filteredUp / filteredCount * 100 : 0;

  const upDownData = [
    { name: "一年后上涨", value: overview.cap_change.up_count },
    { name: "一年后下跌", value: overview.cap_change.down_count },
    { name: "暂无数据", value: overview.total_companies - overview.yr1_cap.count },
  ];

  const isFiltered = yearFrom !== minYear || yearTo !== maxYear;

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
                <span className="text-primary font-medium">{filteredCount}家上市企业（{yearFrom}–{yearTo}年）</span>
              ) : (
                <span>全部 {filteredCount} 家企业</span>
              )}
            </span>
          </div>
          <div className="flex gap-2">
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
      {/* Narrative Summary */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-5">
        <h2 className="text-sm font-semibold text-primary mb-2">核心结论</h2>
        <p className="text-sm text-foreground/80 leading-relaxed">
          北交所已形成以制造业为主体、长三角为核心、中小市值为主流的市场格局，其系统性低估值与高首日涨幅并存的特征，折射出市场流动性与定价效率仍有较大提升空间。数据显示，<strong>小市值、低PE是北交所超额收益的来源</strong>：发行PE与一年后表现存在负相关（r = −0.226），而2024年以来破发率归零、首日涨幅大幅提升，说明市场情绪已出现结构性好转。
        </p>
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
          {[
            { label: '制造业占比', value: '88.3%', note: '前10大行业' },
            { label: '长三角占比', value: '40.3%', note: '苏浙安沪' },
            { label: '新三板路径', value: '61.7%', note: '有挂牌经历' },
            { label: '行业PE折价', value: '42.4%', note: '相对A股均値' },
            { label: '2024+破发率', value: '0%', note: '市场情绪修复' },
          ].map((item, i) => (
            <div key={i} className="bg-background/60 rounded p-2 text-center">
              <div className="font-bold text-primary text-base font-mono">{item.value}</div>
              <div className="text-foreground/70 mt-0.5">{item.label}</div>
              <div className="text-muted-foreground text-[10px]">{item.note}</div>
            </div>
          ))}
        </div>
      </div>
      {/* KPI Row 1 */}
      {isFiltered && (
        <div className="text-xs text-primary/70 font-medium px-1">ℹ️ 展示 {yearFrom}–{yearTo} 年间上市的 {filteredCount} 家企业数据</div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="上市公司数" value={`${filteredCount}家`} sub={isFiltered ? `${yearFrom}–${yearTo}年` : "截至2026年3月"} />
        <StatCard label="平均发行市値" value={fmtYi(filteredAvgCap)} sub={isFiltered ? "筛选期间" : `中位数 ${fmtYi(overview.ipo_cap.median)}`} />
        <StatCard label="总发行市値" value={`${(filteredCompanies.filter(c=>c.listing_market_cap_yi).reduce((s,c)=>s+(c.listing_market_cap_yi||0),0)).toFixed(0)}亿`} sub={`${filteredCompanies.filter(c=>c.listing_market_cap_yi).length}家有数据`} />
        <StatCard label="平均一年后变化" value={fmtPct(overview.cap_change.mean)} sub={`中位数 ${fmtPct(overview.cap_change.median)}`} color={overview.cap_change.mean > 0 ? "text-green-500" : "text-red-500"} />
        <StatCard label="首日平均涨幅" value={fmtPct(filteredAvgFD)} sub={`破发率 ${filteredBustPct.toFixed(1)}%`} color={filteredAvgFD > 0 ? "text-green-500" : "text-red-500"} />
        <StatCard label="平均发行市盈率" value={`${fmt(overview.issue_pe.mean, 1)}x`} sub={`中位数 ${fmt(overview.issue_pe.median, 1)}x`} />
      </div>

      {/* KPI Row 2 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="平均新三板挂牌时长" value={`${fmt(overview.neeq_duration.mean, 1)}年`} sub={`${overview.neeq_duration.count}家有数据`} />
        <StatCard label="有融资记录企业" value={`${overview.financing.has_last_round}家`} sub={`占比 ${(overview.financing.has_last_round / overview.total_companies * 100).toFixed(0)}%`} />
        <StatCard label="一年后上涨企业" value={`${filteredUp}家`} sub={`上涨率 ${filteredUpPct.toFixed(1)}%`} color="text-green-500" />
        <StatCard label="首日破发企业" value={`${filteredBustCount}家`} sub={`破发率 ${filteredBustPct.toFixed(1)}%`} color="text-red-500" />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border/50 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">历年上市数量与平均发行市值</h3>
          <ResponsiveContainer width="100%" height={230}>
            <ComposedChart data={yearlyData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
              <XAxis dataKey="year" tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} />
              <YAxis yAxisId="left" tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} />
              <Tooltip content={<ChartTip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar yAxisId="left" dataKey="count" name="上市数量" fill="#D4A843" radius={[3,3,0,0]} />
              <Line yAxisId="right" type="monotone" dataKey="avgCap" name="平均发行市值(亿)" stroke="#4ECDC4" strokeWidth={2} dot={{ r: 3, fill: '#4ECDC4' }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border/50 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">历年平均首日涨幅与破发率</h3>
          <ResponsiveContainer width="100%" height={230}>
            <ComposedChart data={yearlyData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
              <XAxis dataKey="year" tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} />
              <YAxis yAxisId="left" tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} unit="%" />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} unit="%" />
              <Tooltip content={<ChartTip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <ReferenceLine yAxisId="left" y={0} stroke="var(--muted-foreground)" strokeDasharray="4 4" />
              <Bar yAxisId="left" dataKey="avgFD" name="平均首日涨幅%" fill="#4ECDC4" radius={[3,3,0,0]} />
              <Line yAxisId="right" type="monotone" dataKey="bustPct" name="破发率%" stroke="#FF6B6B" strokeWidth={2} dot={{ r: 3, fill: '#FF6B6B' }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-card border border-border/50 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">一年后市值涨跌分布</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={upDownData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                {upDownData.map((_, i) => <Cell key={i} fill={["#34D399","#FF6B6B","#6B7280"][i]} />)}
              </Pie>
              <Tooltip formatter={(v: any) => [`${v}家`]} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border/50 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">发行市值分布</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={capDist} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
              <XAxis dataKey="name" tick={{ fill: 'var(--muted-foreground)', fontSize: 9 }} />
              <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} />
              <Tooltip content={<ChartTip />} />
              <Bar dataKey="count" name="公司数" fill="#D4A843" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border/50 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">首日涨跌幅分布</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={fdDist} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
              <XAxis dataKey="name" tick={{ fill: 'var(--muted-foreground)', fontSize: 9 }} />
              <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} />
              <Tooltip content={<ChartTip />} />
              <Bar dataKey="count" name="公司数" fill="#4ECDC4" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Industry chart */}
      <div className="bg-card border border-border/50 rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-3">行业分布 Top 10（公司数 vs 平均发行市值）</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={topIndustries} layout="vertical" margin={{ top: 5, right: 80, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} horizontal={false} />
            <XAxis type="number" tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} />
            <YAxis type="category" dataKey="name" tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} width={90} />
            <Tooltip content={<ChartTip />} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="count" name="公司数" fill="#D4A843" radius={[0,3,3,0]} />
            <Bar dataKey="avgCap" name="平均发行市值(亿)" fill="#4ECDC4" radius={[0,3,3,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Rankings */}
      {rankings && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-card border border-border/50 rounded-lg p-4">
            <h3 className="text-sm font-semibold mb-3">一年后市值涨幅 Top 10</h3>
            <div className="space-y-1.5">
              {(rankings.top_gainers || []).slice(0, 10).map((c, i) => (
                <div key={i} className="flex items-center justify-between text-xs py-0.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-muted-foreground w-5 flex-shrink-0 font-mono">{i+1}.</span>
                    <span className="truncate">{c.name}</span>
                    <span className="text-muted-foreground flex-shrink-0 font-mono text-[10px]">{c.code}</span>
                  </div>
                  <span className="text-green-500 font-mono font-medium flex-shrink-0 ml-2">+{c.change.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-card border border-border/50 rounded-lg p-4">
            <h3 className="text-sm font-semibold mb-3">一年后市值跌幅 Top 10</h3>
            <div className="space-y-1.5">
              {(rankings.top_losers || []).slice(0, 10).map((c, i) => (
                <div key={i} className="flex items-center justify-between text-xs py-0.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-muted-foreground w-5 flex-shrink-0 font-mono">{i+1}.</span>
                    <span className="truncate">{c.name}</span>
                    <span className="text-muted-foreground flex-shrink-0 font-mono text-[10px]">{c.code}</span>
                  </div>
                  <span className="text-red-500 font-mono font-medium flex-shrink-0 ml-2">{c.change.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {drillDown && (
        <DrillDownPanel
          dimension={drillDown.dimension}
          value={drillDown.value}
          companies={companies}
          analytics={analytics}
          onClose={() => setDrillDown(null)}
        />
      )}
    </div>
  );
}
