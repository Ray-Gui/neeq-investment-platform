import type { Company, Analytics } from "@/lib/types";
import { fmtYi, fmtPct, fmtDate, fmt } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, Cell, PieChart, Pie, Legend
} from "recharts";

interface Props { companies: Company[]; analytics: Analytics | null }

const COLORS = ["#D4A843","#4ECDC4","#60A5FA","#A78BFA","#34D399","#F97316","#EC4899","#6EE7B7"];

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

export default function NeeqTab({ companies, analytics }: Props) {
  if (!analytics) return <div className="text-center py-20 text-muted-foreground">加载中...</div>;

  const { neeq_duration_stats, neeq_tier_stats, neeq_year_dist, scatter, correlations } = analytics;

  const withNeeq = companies.filter(c => c.neeq_listing_date && c.neeq_duration_years);

  // Duration distribution
  const durBuckets: Record<string, number> = {};
  withNeeq.forEach(c => {
    const y = c.neeq_duration_years!;
    let bucket: string;
    if (y < 1) bucket = "<1年";
    else if (y < 2) bucket = "1-2年";
    else if (y < 3) bucket = "2-3年";
    else if (y < 4) bucket = "3-4年";
    else if (y < 5) bucket = "4-5年";
    else if (y < 7) bucket = "5-7年";
    else bucket = "7年以上";
    durBuckets[bucket] = (durBuckets[bucket] || 0) + 1;
  });
  const durDist = ["<1年","1-2年","2-3年","3-4年","4-5年","5-7年","7年以上"].map(k => ({ name: k, count: durBuckets[k] || 0 }));

  // Neeq listing year distribution
  const neeqYearData = Object.entries(neeq_year_dist || {}).sort().map(([year, count]) => ({ year, count }));

  // Tier distribution
  const tierData = (neeq_tier_stats || []).filter(t => t.tier && t.count > 0);

  // Scatter: neeq duration vs IPO cap
  const scatterData = (scatter?.neeq_vs_cap || []).slice(0, 200).map(d => ({
    x: +d.x.toFixed(1),
    y: +d.y.toFixed(2),
    change: d.change,
    name: d.name,
  }));

  // Duration group performance
  const durGroupData = (neeq_duration_stats || []).filter(g => g.count > 0);

  const corrNeeqCap = correlations?.['neeq_duration_vs_ipo_cap'];
  const corrNeeqChange = correlations?.['neeq_duration_vs_cap_change'];

  return (
    <div className="space-y-5">
      {/* Narrative Insight */}
      <div className="bg-teal-500/5 border border-teal-500/20 rounded-lg p-4">
        <h2 className="text-sm font-semibold text-teal-600 mb-1.5">分析观点</h2>
        <p className="text-sm text-foreground/80 leading-relaxed">
          新三板是北交所的“预备役”，但其价值主要体现在<strong>规范公司治理</strong>，而非筛选出更优质的公司。数据显示，新三板挂牌时长与上市后表现几乎无相关（r = +0.019），说明“在新三板挂牌越久越好”的直觉判断是错误的。实际上，新三板的核心价值在于帮助企业建立规范的信息披露和公司治理体系，为上市做好制度准备。
        </p>
      </div>
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "有新三板挂牌记录", value: `${withNeeq.length}家`, sub: `占比 ${(withNeeq.length/companies.length*100).toFixed(0)}%` },
          { label: "平均挂牌时长", value: `${fmt(analytics.overview.neeq_duration.mean, 1)}年`, sub: `中位数 ${fmt(analytics.overview.neeq_duration.median, 1)}年` },
          { label: "挂牌时长与IPO市值相关性", value: corrNeeqCap ? `r=${corrNeeqCap.r.toFixed(2)}` : "—", sub: corrNeeqCap ? `基于${corrNeeqCap.n}家` : "" },
          { label: "挂牌时长与一年涨跌相关性", value: corrNeeqChange ? `r=${corrNeeqChange.r.toFixed(2)}` : "—", sub: corrNeeqChange ? `基于${corrNeeqChange.n}家` : "" },
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
          <h3 className="text-sm font-semibold mb-3">新三板挂牌时长分布</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={durDist} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
              <XAxis dataKey="name" tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} />
              <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} />
              <Tooltip content={<Tip />} />
              <Bar dataKey="count" name="公司数" fill="#D4A843" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border/50 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">新三板挂牌年份分布</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={neeqYearData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
              <XAxis dataKey="year" tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} />
              <Tooltip content={<Tip />} />
              <Bar dataKey="count" name="公司数" fill="#4ECDC4" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border/50 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">新三板层级分布</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={tierData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="count" nameKey="tier">
                {tierData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip formatter={(v: any) => [`${v}家`]} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Duration group performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border/50 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-1">挂牌时长分组 vs 平均IPO市值</h3>
          <p className="text-xs text-muted-foreground mb-3">不同挂牌时长区间的企业，上市时的平均发行市值对比</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={durGroupData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
              <XAxis dataKey="group" tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} />
              <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} unit="亿" />
              <Tooltip content={<Tip />} />
              <Bar dataKey="avg_ipo_cap" name="平均IPO市值(亿)" fill="#60A5FA" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border/50 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-1">挂牌时长分组 vs 平均一年后涨跌幅</h3>
          <p className="text-xs text-muted-foreground mb-3">不同挂牌时长区间的企业，上市一年后的平均市值变化率</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={durGroupData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
              <XAxis dataKey="group" tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} />
              <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} unit="%" />
              <Tooltip content={<Tip />} />
              <Bar dataKey="avg_cap_change" name="平均涨跌幅(%)" radius={[3,3,0,0]}
                fill="#34D399"
                label={{ position: 'top', fontSize: 9, fill: 'var(--muted-foreground)', formatter: (v: number) => `${v > 0 ? '+' : ''}${v.toFixed(0)}%` }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Scatter: neeq duration vs IPO cap */}
      <div className="bg-card border border-border/50 rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-1">新三板挂牌时长 vs IPO发行市值（散点图）</h3>
        <p className="text-xs text-muted-foreground mb-3">横轴：新三板挂牌时长（年），纵轴：IPO发行市值（亿元）。颜色深浅代表上市后一年涨跌幅。</p>
        <ResponsiveContainer width="100%" height={280}>
          <ScatterChart margin={{ top: 10, right: 30, bottom: 20, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
            <XAxis type="number" dataKey="x" name="挂牌时长(年)" tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} label={{ value: '挂牌时长(年)', position: 'insideBottom', offset: -10, fill: 'var(--muted-foreground)', fontSize: 11 }} />
            <YAxis type="number" dataKey="y" name="IPO市值(亿)" tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} label={{ value: 'IPO市值(亿)', angle: -90, position: 'insideLeft', fill: 'var(--muted-foreground)', fontSize: 11 }} />
            <Tooltip cursor={{ strokeDasharray: "3 3" }} content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload;
              return (
                <div className="bg-popover border border-border rounded-lg p-3 text-xs shadow-xl">
                  <div className="font-medium mb-1">{d.name}</div>
                  <div>挂牌时长: {d.x.toFixed(1)}年</div>
                  <div>IPO市值: {d.y.toFixed(2)}亿</div>
                  <div>一年后涨跌: {d.change > 0 ? '+' : ''}{d.change.toFixed(1)}%</div>
                </div>
              );
            }} />
            <Scatter data={scatterData} fill="#D4A843" opacity={0.7} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Top companies by neeq duration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border/50 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">新三板挂牌时间最长 Top 15</h3>
          <div className="space-y-1.5">
            {[...withNeeq]
              .sort((a, b) => (b.neeq_duration_years || 0) - (a.neeq_duration_years || 0))
              .slice(0, 15)
              .map((c, i) => (
                <div key={c.bse_code} className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground w-5 text-right flex-shrink-0">{i + 1}.</span>
                  <span className="font-medium flex-1 truncate">{c.name}</span>
                  <span className="font-mono text-primary">{c.neeq_duration_years?.toFixed(1)}年</span>
                  <span className="text-muted-foreground font-mono text-[10px]">{fmtDate(c.neeq_listing_date)}</span>
                </div>
              ))}
          </div>
        </div>

        <div className="bg-card border border-border/50 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">新三板挂牌时间最短 Top 15</h3>
          <div className="space-y-1.5">
            {[...withNeeq]
              .sort((a, b) => (a.neeq_duration_years || 0) - (b.neeq_duration_years || 0))
              .slice(0, 15)
              .map((c, i) => (
                <div key={c.bse_code} className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground w-5 text-right flex-shrink-0">{i + 1}.</span>
                  <span className="font-medium flex-1 truncate">{c.name}</span>
                  <span className="font-mono text-amber-500">{c.neeq_duration_years?.toFixed(1)}年</span>
                  <span className="text-muted-foreground font-mono text-[10px]">{fmtDate(c.neeq_listing_date)}</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
