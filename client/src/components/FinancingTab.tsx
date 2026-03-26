import type { Company, Analytics } from "@/lib/types";
import { fmtWan, fmtYi, fmtPct, fmtDate, fmt } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, ScatterChart, Scatter, Legend, ReferenceLine
} from "recharts";

interface Props { companies: Company[]; analytics: Analytics | null }

const COLORS = ["#D4A843","#4ECDC4","#FF6B6B","#A78BFA","#60A5FA","#34D399","#F97316","#EC4899"];

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

export default function FinancingTab({ companies, analytics }: Props) {
  if (!analytics) return <div className="text-center py-20 text-muted-foreground">加载中...</div>;

  const { financing_stats, multiple_buckets, fin_year_dist, scatter } = analytics;

  const withFinancing = companies.filter(c => c.last_round_date);
  const noFinancing = companies.filter(c => c.no_financing);
  const noData = companies.filter(c => !c.last_round_date && !c.no_financing);

  const pieData = [
    { name: "有融资记录", value: withFinancing.length },
    { name: "明确无融资", value: noFinancing.length },
    { name: "数据待补充", value: noData.length },
  ];

  const finYearData = Object.entries(fin_year_dist || {}).sort().map(([year, count]) => ({ year, count }));
  const multipleDist = Object.entries(multiple_buckets || {}).map(([k, v]) => ({ name: k, count: v as number }));

  // Valuation distribution
  const valuationBuckets: Record<string, number> = {};
  withFinancing.forEach(c => {
    const v = c.last_round_valuation_wan;
    if (!v) return;
    let bucket: string;
    if (v < 5000) bucket = "<5000万";
    else if (v < 10000) bucket = "5000万-1亿";
    else if (v < 30000) bucket = "1-3亿";
    else if (v < 100000) bucket = "3-10亿";
    else bucket = ">10亿";
    valuationBuckets[bucket] = (valuationBuckets[bucket] || 0) + 1;
  });
  const valDist = ["<5000万","5000万-1亿","1-3亿","3-10亿",">10亿"].map(k => ({ name: k, count: valuationBuckets[k] || 0 }));

  // Days from last financing to IPO distribution
  const daysBuckets: Record<string, number> = {};
  companies.forEach(c => {
    const d = c.days_from_last_financing_to_ipo;
    if (!d) return;
    let bucket: string;
    if (d < 180) bucket = "<6个月";
    else if (d < 365) bucket = "6-12个月";
    else if (d < 730) bucket = "1-2年";
    else if (d < 1095) bucket = "2-3年";
    else bucket = ">3年";
    daysBuckets[bucket] = (daysBuckets[bucket] || 0) + 1;
  });
  const daysDist = ["<6个月","6-12个月","1-2年","2-3年",">3年"].map(k => ({ name: k, count: daysBuckets[k] || 0 }));

  // Scatter: last round valuation vs IPO market cap
  const scatterData = (scatter?.fin_vs_ipo || []).slice(0, 150).map(d => ({
    x: +(d.x / 10000).toFixed(2),  // convert wan to yi
    y: +(d.y).toFixed(2),
    name: d.name,
    multiple: d.multiple,
  }));

  return (
    <div className="space-y-5">
      {/* Narrative Insight */}
      <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-4">
        <h2 className="text-sm font-semibold text-green-600 mb-1.5">分析观点</h2>
        <p className="text-sm text-foreground/80 leading-relaxed">
          北交所企业的融资路径展现出明显的“轻融资”特征：大多数企业在上市前只完成了少量轮次的融资，与科创板企业动辄融资的模式存在显著差异。这与北交所主要服务于已有稳定商业模式的传统制造业企业相匹配——这类企业通常不需要大量外部融资就能实现盈利增长。<strong>IPO市值与最后一轮融资估值的倍数关系</strong>，反映了上市对创始投资人的回报水平，也是评估市场定价效率的重要参考。
        </p>
      </div>
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "有融资记录", value: `${withFinancing.length}家`, sub: `占比 ${(withFinancing.length/companies.length*100).toFixed(0)}%` },
          { label: "平均最后轮估值", value: fmtWan(financing_stats?.last_round_valuation?.mean_wan), sub: `中位数 ${fmtWan(financing_stats?.last_round_valuation?.median_wan)}` },
          { label: "IPO市值/融资估值倍数", value: `${fmt(financing_stats?.ipo_vs_last_multiple?.mean, 1)}x`, sub: `中位数 ${fmt(financing_stats?.ipo_vs_last_multiple?.median, 1)}x` },
          { label: "平均融资到IPO间隔", value: `${fmt(financing_stats?.days_to_ipo?.mean ? financing_stats.days_to_ipo.mean / 365 : null, 1)}年`, sub: `中位数 ${fmt(financing_stats?.days_to_ipo?.median ? financing_stats.days_to_ipo.median / 365 : null, 1)}年` },
        ].map(({ label, value, sub }) => (
          <div key={label} className="bg-card border border-border/50 rounded-lg p-4">
            <div className="text-xs text-muted-foreground mb-1">{label}</div>
            <div className="text-xl font-bold font-mono text-primary">{value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-card border border-border/50 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">融资状态分布</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip formatter={(v: any) => [`${v}家`]} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border/50 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">最后一轮融资年份分布</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={finYearData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
              <XAxis dataKey="year" tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} />
              <Tooltip content={<Tip />} />
              <Bar dataKey="count" name="融资次数" fill="#D4A843" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border/50 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">最后轮融资估值分布</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={valDist} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
              <XAxis dataKey="name" tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} />
              <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} />
              <Tooltip content={<Tip />} />
              <Bar dataKey="count" name="公司数" fill="#4ECDC4" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border/50 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">IPO市值/最后融资估值倍数分布</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={multipleDist} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
              <XAxis dataKey="name" tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} />
              <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} />
              <Tooltip content={<Tip />} />
              <ReferenceLine x="1-2x" stroke="var(--primary)" strokeDasharray="4 4" />
              <Bar dataKey="count" name="公司数" fill="#A78BFA" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border/50 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">融资到IPO间隔时长分布</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={daysDist} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
              <XAxis dataKey="name" tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} />
              <Tooltip content={<Tip />} />
              <Bar dataKey="count" name="公司数" fill="#60A5FA" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Scatter: last round val vs IPO cap */}
      <div className="bg-card border border-border/50 rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-1">最后融资估值 vs IPO发行市值（散点图）</h3>
        <p className="text-xs text-muted-foreground mb-3">横轴：最后一轮融资估值（亿元），纵轴：IPO发行市值（亿元）。点越靠近对角线，说明IPO估值与融资估值越接近。</p>
        <ResponsiveContainer width="100%" height={280}>
          <ScatterChart margin={{ top: 10, right: 30, bottom: 10, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
            <XAxis type="number" dataKey="x" name="融资估值(亿)" tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} label={{ value: '融资估值(亿)', position: 'insideBottom', offset: -5, fill: 'var(--muted-foreground)', fontSize: 11 }} />
            <YAxis type="number" dataKey="y" name="IPO市值(亿)" tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} label={{ value: 'IPO市值(亿)', angle: -90, position: 'insideLeft', fill: 'var(--muted-foreground)', fontSize: 11 }} />
            <Tooltip cursor={{ strokeDasharray: "3 3" }} content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload;
              return (
                <div className="bg-popover border border-border rounded-lg p-3 text-xs shadow-xl">
                  <div className="font-medium mb-1">{d.name}</div>
                  <div>融资估值: {d.x.toFixed(2)}亿</div>
                  <div>IPO市值: {d.y.toFixed(2)}亿</div>
                  <div>倍数: {d.multiple.toFixed(1)}x</div>
                </div>
              );
            }} />
            <Scatter data={scatterData} fill="#D4A843" opacity={0.7} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* No financing companies */}
      {noFinancing.length > 0 && (
        <div className="bg-card border border-border/50 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">明确无融资记录企业（{noFinancing.length}家）</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {noFinancing.map(c => (
              <div key={c.bse_code} className="flex items-center gap-2 p-2 bg-muted/20 rounded-md">
                <span className="text-xs font-mono text-muted-foreground">{c.bse_code}</span>
                <span className="text-xs font-medium truncate">{c.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top valuations table */}
      <div className="bg-card border border-border/50 rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-3">最后一轮融资估值 Top 20</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left px-3 py-2 text-muted-foreground">公司</th>
                <th className="text-left px-3 py-2 text-muted-foreground">行业</th>
                <th className="text-right px-3 py-2 text-muted-foreground">最后融资估值</th>
                <th className="text-right px-3 py-2 text-muted-foreground">IPO市值</th>
                <th className="text-right px-3 py-2 text-muted-foreground">IPO/融资倍数</th>
                <th className="text-left px-3 py-2 text-muted-foreground">融资日期</th>
              </tr>
            </thead>
            <tbody>
              {[...withFinancing]
                .filter(c => c.last_round_valuation_wan)
                .sort((a, b) => (b.last_round_valuation_wan || 0) - (a.last_round_valuation_wan || 0))
                .slice(0, 20)
                .map((c, i) => (
                  <tr key={c.bse_code} className="border-b border-border/30 hover:bg-muted/20">
                    <td className="px-3 py-2">
                      <div className="font-medium">{c.name}</div>
                      <div className="text-muted-foreground font-mono text-[10px]">{c.bse_code}</div>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{c.industry?.slice(0, 8) || "—"}</td>
                    <td className="px-3 py-2 text-right font-mono font-medium">{fmtWan(c.last_round_valuation_wan)}</td>
                    <td className="px-3 py-2 text-right font-mono">{fmtYi(c.listing_market_cap_yi)}</td>
                    <td className="px-3 py-2 text-right font-mono">{c.ipo_vs_last_round_multiple ? `${c.ipo_vs_last_round_multiple.toFixed(1)}x` : "—"}</td>
                    <td className="px-3 py-2 text-muted-foreground">{fmtDate(c.last_round_date)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
