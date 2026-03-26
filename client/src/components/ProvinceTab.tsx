import type { Company, Analytics } from "@/lib/types";
import { useState } from "react";
import DrillDownPanel from "@/components/DrillDownPanel";
import { fmtYi, fmtPct, fmt } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

interface Props { companies: Company[]; analytics: Analytics | null }

const COLORS = ["#D4A843","#4ECDC4","#60A5FA","#A78BFA","#34D399","#F97316","#EC4899","#6EE7B7","#F59E0B","#3B82F6","#8B5CF6","#EF4444","#14B8A6","#F472B6","#84CC16"];

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

export default function ProvinceTab({ companies, analytics }: Props) {
  if (!analytics) return <div className="text-center py-20 text-muted-foreground">加载中...</div>;
  const [drillDown, setDrillDown] = useState<string | null>(null);

  const { province_stats } = analytics;

  const withProvince = companies.filter(c => c.province);
  const top15 = (province_stats || []).slice(0, 15);
  const top10Pie = (province_stats || []).slice(0, 9);
  const othersCount = (province_stats || []).slice(9).reduce((s, x) => s + x.count, 0);
  const pieData = [
    ...top10Pie.map(p => ({ name: p.province, count: p.count })),
    ...(othersCount > 0 ? [{ name: "其他", count: othersCount }] : []),
  ];

  return (
    <div className="space-y-5">
      {/* Narrative Insight */}
      <div className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-4">
        <h2 className="text-sm font-semibold text-orange-600 mb-1.5">分析观点</h2>
        <p className="text-sm text-foreground/80 leading-relaxed">
          北交所上市企业呈现出高度集中的地域格局：<strong>苏浙安沪长三角地区占据全部40.3%的企业</strong>，这与该地区成熟的制造业产业集群、完善的资本市场生态和强烈的中小企业创新气氛密切相关。相比之下，西部和东北地区的企业数量较少，但这也意味着这些地区的优质“专精特新”企业仍有较大的上市空间，将是北交所未来增量的重要来源。
        </p>
      </div>
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "有省份数据", value: `${withProvince.length}家`, sub: `覆盖 ${(withProvince.length/companies.length*100).toFixed(0)}%` },
          { label: "覆盖省份/地区", value: `${new Set(withProvince.map(c => c.province)).size}个`, sub: "省市自治区" },
          { label: "企业最多省份", value: top15[0]?.province || "—", sub: `${top15[0]?.count || 0}家企业` },
          { label: "平均IPO市值最高", value: [...(province_stats || [])].sort((a,b) => (b.avg_ipo_cap||0)-(a.avg_ipo_cap||0))[0]?.province || "—", sub: `${fmtYi([...(province_stats || [])].sort((a,b) => (b.avg_ipo_cap||0)-(a.avg_ipo_cap||0))[0]?.avg_ipo_cap || 0)}` },
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
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">各省份上市企业数量 Top 15</h3>
            <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">点击柱子可下钒</span>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart
              data={top15}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 55, bottom: 5 }}
              onClick={(data) => {
                if (data?.activePayload?.[0]) {
                  const prov = data.activePayload[0].payload?.province;
                  if (prov) setDrillDown(prov);
                }
              }}
              style={{ cursor: 'pointer' }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
              <XAxis type="number" tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} />
              <YAxis type="category" dataKey="province" tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} width={55} />
              <Tooltip content={<Tip />} />
              <Bar dataKey="count" name="企业数量" radius={[0,3,3,0]}>
                {top15.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border/50 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">省份企业数量占比</h3>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="count" nameKey="name">
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v: any) => [`${v}家`]} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border/50 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-1">各省份平均IPO发行市值 Top 15</h3>
          <p className="text-xs text-muted-foreground mb-3">按平均发行市值排序（亿元）</p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={[...(province_stats || [])].sort((a,b) => (b.avg_ipo_cap||0)-(a.avg_ipo_cap||0)).slice(0, 15)}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 55, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
              <XAxis type="number" tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} unit="亿" />
              <YAxis type="category" dataKey="province" tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} width={55} />
              <Tooltip content={<Tip />} />
              <Bar dataKey="avg_ipo_cap" name="平均IPO市值(亿)" fill="#4ECDC4" radius={[0,3,3,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border/50 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-1">各省份平均一年后涨跌幅 Top 15</h3>
          <p className="text-xs text-muted-foreground mb-3">按平均一年后市值变化率排序</p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={[...(province_stats || [])].filter(p => p.avg_cap_change != null).sort((a,b) => (b.avg_cap_change||0)-(a.avg_cap_change||0)).slice(0, 15)}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 55, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
              <XAxis type="number" tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} unit="%" />
              <YAxis type="category" dataKey="province" tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} width={55} />
              <Tooltip content={<Tip />} />
              <Bar dataKey="avg_cap_change" name="平均涨跌幅(%)" fill="#34D399" radius={[0,3,3,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Full province table */}
      <div className="bg-card border border-border/50 rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-3">省份完整数据表</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left px-3 py-2 text-muted-foreground">省份</th>
                <th className="text-right px-3 py-2 text-muted-foreground">企业数量</th>
                <th className="text-right px-3 py-2 text-muted-foreground">平均IPO市值</th>
                <th className="text-right px-3 py-2 text-muted-foreground">总IPO市值</th>
                <th className="text-right px-3 py-2 text-muted-foreground">平均一年后涨跌</th>
                <th className="text-right px-3 py-2 text-muted-foreground">平均首日涨跌</th>
                <th className="text-right px-3 py-2 text-muted-foreground">破发率</th>
              </tr>
            </thead>
            <tbody>
              {(province_stats || []).map((p, i) => (
                <tr key={p.province} className={`border-b border-border/30 hover:bg-muted/20 ${i % 2 !== 0 ? 'bg-muted/10' : ''}`}>
                  <td className="px-3 py-2 font-medium">{p.province}</td>
                  <td className="px-3 py-2 text-right font-mono">{p.count}</td>
                  <td className="px-3 py-2 text-right font-mono">{fmtYi(p.avg_ipo_cap)}</td>
                  <td className="px-3 py-2 text-right font-mono">{fmtYi(p.total_ipo_cap)}</td>
                  <td className={`px-3 py-2 text-right font-mono font-medium ${(p.avg_cap_change || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {p.avg_cap_change != null ? fmtPct(p.avg_cap_change) : "—"}
                  </td>
                  <td className={`px-3 py-2 text-right font-mono ${(p.avg_first_day_return || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {p.avg_first_day_return != null ? fmtPct(p.avg_first_day_return * 100) : "—"}
                  </td>
                  <td className="px-3 py-2 text-right font-mono">{p.bust_pct != null ? `${p.bust_pct.toFixed(1)}%` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {drillDown && (
        <DrillDownPanel
          dimension="province"
          value={drillDown}
          companies={companies}
          analytics={analytics}
          onClose={() => setDrillDown(null)}
        />
      )}
    </div>
  );
}
