import type { Company, Analytics } from "@/lib/types";
import { fmtYi, fmtPct, fmt } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, Cell
} from "recharts";

interface Props { companies: Company[]; analytics: Analytics | null }

const COLORS = ["#D4A843","#4ECDC4","#60A5FA","#A78BFA","#34D399","#F97316","#EC4899","#6EE7B7","#F59E0B","#3B82F6"];

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

export default function SponsorTab({ companies, analytics }: Props) {
  if (!analytics) return <div className="text-center py-20 text-muted-foreground">加载中...</div>;

  const { sponsor_stats, accountant_dist } = analytics;

  const withSponsor = companies.filter(c => c.sponsor);
  const top20Sponsors = (sponsor_stats || []).slice(0, 20);
  const top10Accountants = (accountant_dist || []).slice(0, 10);

  // Sponsor market share (by count)
  const top10 = (sponsor_stats || []).slice(0, 10);
  const others = (sponsor_stats || []).slice(10);
  const othersCount = others.reduce((s, x) => s + x.count, 0);
  const pieData = [
    ...top10.map(s => ({ name: s.sponsor.slice(0, 6), count: s.count })),
    ...(othersCount > 0 ? [{ name: "其他", count: othersCount }] : []),
  ];

  return (
    <div className="space-y-5">
      {/* Narrative Insight */}
      <div className="bg-violet-500/5 border border-violet-500/20 rounded-lg p-4">
        <h2 className="text-sm font-semibold text-violet-600 mb-1.5">分析观点</h2>
        <p className="text-sm text-foreground/80 leading-relaxed">
          北交所的保荐机构格局高度集中，头部几家券商主导市场。需要指出的是，<strong>破发率较高的保荐机构并不意味着保荐质量差</strong>，而是与其保荐的企业类型（规模较大、估值较高）和上市时间（多集中于2022年）密切相关。评价保荐机构质量，需要在控制企业规模和上市时间等因素后进行比较，简单的破发率对比可能产生误导。
        </p>
      </div>
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "有保荐机构数据", value: `${withSponsor.length}家`, sub: `覆盖 ${(withSponsor.length/companies.length*100).toFixed(0)}%` },
          { label: "保荐机构数量", value: `${new Set(withSponsor.map(c => c.sponsor)).size}家`, sub: "参与北交所保荐" },
          { label: "最活跃保荐机构", value: top20Sponsors[0]?.sponsor?.slice(0, 6) || "—", sub: `保荐 ${top20Sponsors[0]?.count || 0} 家` },
          { label: "最活跃会计师事务所", value: top10Accountants[0]?.name?.slice(0, 6) || "—", sub: `审计 ${top10Accountants[0]?.count || 0} 家` },
        ].map(({ label, value, sub }) => (
          <div key={label} className="bg-card border border-border/50 rounded-lg p-4">
            <div className="text-xs text-muted-foreground mb-1">{label}</div>
            <div className="text-xl font-bold font-mono text-primary">{value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border/50 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">保荐机构承销数量 Top 20</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={top20Sponsors} layout="vertical" margin={{ top: 5, right: 30, left: 60, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
              <XAxis type="number" tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} />
              <YAxis type="category" dataKey="sponsor" tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} width={60}
                tickFormatter={(v: string) => v.slice(0, 6)} />
              <Tooltip content={<Tip />} />
              <Bar dataKey="count" name="承销数量" fill="#D4A843" radius={[0,3,3,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border/50 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">保荐机构 vs 平均IPO市值 & 破发率</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={top20Sponsors.slice(0, 15)} layout="vertical" margin={{ top: 5, right: 30, left: 60, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
              <XAxis type="number" tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} />
              <YAxis type="category" dataKey="sponsor" tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} width={60}
                tickFormatter={(v: string) => v.slice(0, 6)} />
              <Tooltip content={<Tip />} />
              <Bar dataKey="avg_ipo_cap" name="平均IPO市值(亿)" fill="#4ECDC4" radius={[0,3,3,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Accountant distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border/50 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">会计师事务所承揽数量 Top 10</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={top10Accountants} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
              <XAxis type="number" tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} width={80}
                tickFormatter={(v: string) => v.slice(0, 8)} />
              <Tooltip content={<Tip />} />
              <Bar dataKey="count" name="承揽数量" fill="#60A5FA" radius={[0,3,3,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border/50 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">保荐机构 vs 平均一年后涨跌幅</h3>
          <p className="text-xs text-muted-foreground mb-3">各保荐机构保荐企业上市一年后的平均市值变化率（仅含有数据的公司）</p>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={top20Sponsors.slice(0, 15).filter(s => s.avg_cap_change != null)} layout="vertical" margin={{ top: 5, right: 30, left: 60, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
              <XAxis type="number" tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} unit="%" />
              <YAxis type="category" dataKey="sponsor" tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} width={60}
                tickFormatter={(v: string) => v.slice(0, 6)} />
              <Tooltip content={<Tip />} />
              <Bar dataKey="avg_cap_change" name="平均涨跌幅(%)" radius={[0,3,3,0]}
                fill="#34D399" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Full sponsor table */}
      <div className="bg-card border border-border/50 rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-3">保荐机构完整数据表</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left px-3 py-2 text-muted-foreground">保荐机构</th>
                <th className="text-right px-3 py-2 text-muted-foreground">承销数量</th>
                <th className="text-right px-3 py-2 text-muted-foreground">平均IPO市值</th>
                <th className="text-right px-3 py-2 text-muted-foreground">总承销市值</th>
                <th className="text-right px-3 py-2 text-muted-foreground">平均一年后涨跌</th>
                <th className="text-right px-3 py-2 text-muted-foreground">平均首日涨跌</th>
                <th className="text-right px-3 py-2 text-muted-foreground">破发率</th>
              </tr>
            </thead>
            <tbody>
              {(sponsor_stats || []).map((s, i) => (
                <tr key={s.sponsor} className={`border-b border-border/30 hover:bg-muted/20 ${i % 2 !== 0 ? 'bg-muted/10' : ''}`}>
                  <td className="px-3 py-2 font-medium">{s.sponsor}</td>
                  <td className="px-3 py-2 text-right font-mono">{s.count}</td>
                  <td className="px-3 py-2 text-right font-mono">{fmtYi(s.avg_ipo_cap)}</td>
                  <td className="px-3 py-2 text-right font-mono">{fmtYi(s.total_ipo_cap)}</td>
                  <td className={`px-3 py-2 text-right font-mono font-medium ${(s.avg_cap_change || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {s.avg_cap_change != null ? fmtPct(s.avg_cap_change) : "—"}
                  </td>
                  <td className={`px-3 py-2 text-right font-mono ${(s.avg_first_day_return || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {s.avg_first_day_return != null ? fmtPct(s.avg_first_day_return * 100) : "—"}
                  </td>
                  <td className="px-3 py-2 text-right font-mono">{s.bust_pct != null ? `${s.bust_pct.toFixed(1)}%` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
