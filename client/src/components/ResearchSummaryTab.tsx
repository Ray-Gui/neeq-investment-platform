import type { Analytics, Company } from "@/lib/types";
import { fmt, fmtPct, fmtYi, cn } from "@/lib/utils";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, AreaChart, Area, PieChart, Pie, ReferenceLine
} from "recharts";

interface Props { analytics: Analytics | null; companies?: Company[] }

const colorMap: Record<string, { bg: string; border: string; text: string; badge: string; stroke: string; fill: string }> = {
  blue:   { bg: "bg-blue-500/5",   border: "border-blue-500/20",   text: "text-blue-600",   badge: "bg-blue-500/15 text-blue-600",   stroke: "#3B82F6", fill: "#3B82F620" },
  teal:   { bg: "bg-teal-500/5",   border: "border-teal-500/20",   text: "text-teal-600",   badge: "bg-teal-500/15 text-teal-600",   stroke: "#14B8A6", fill: "#14B8A620" },
  orange: { bg: "bg-orange-500/5", border: "border-orange-500/20", text: "text-orange-600", badge: "bg-orange-500/15 text-orange-600", stroke: "#F97316", fill: "#F9731620" },
  green:  { bg: "bg-green-500/5",  border: "border-green-500/20",  text: "text-green-600",  badge: "bg-green-500/15 text-green-600",  stroke: "#22C55E", fill: "#22C55E20" },
  amber:  { bg: "bg-amber-500/5",  border: "border-amber-500/20",  text: "text-amber-600",  badge: "bg-amber-500/15 text-amber-600",  stroke: "#D4A843", fill: "#D4A84320" },
  violet: { bg: "bg-violet-500/5", border: "border-violet-500/20", text: "text-violet-600", badge: "bg-violet-500/15 text-violet-600", stroke: "#8B5CF6", fill: "#8B5CF620" },
  red:    { bg: "bg-red-500/5",    border: "border-red-500/20",    text: "text-red-600",    badge: "bg-red-500/15 text-red-600",    stroke: "#EF4444", fill: "#EF444420" },
};

export default function ResearchSummaryTab({ analytics, companies = [] }: Props) {
  if (!analytics) return <div className="text-center py-20 text-muted-foreground">加载中...</div>;

  const { yearly_stats, industry_stats, province_stats } = analytics;

  // Trend data
  const trendData = (yearly_stats || []).map(y => ({
    year: String(y.year),
    count: y.count,
    avgChange: +(y.avg_cap_change || 0).toFixed(1),
    bustPct: +(y.bust_pct || 0).toFixed(1),
    avgFD: +(y.avg_first_day_return || 0).toFixed(1),
    avgCap: +(y.avg_ipo_cap || 0).toFixed(1),
  }));

  // Industry top 8 for sparkline
  const indTop8 = (industry_stats || []).slice(0, 8).map(x => ({ name: x.industry?.slice(0, 4) || "?", count: x.count }));

  // Province top 8
  const provTop8 = (province_stats || []).slice(0, 8).map(x => ({ name: x.province?.slice(0, 2) || "?", count: x.count }));

  // PE distribution for sparkline
  const peData = [
    { name: "<10", count: companies.filter(c => c.issue_pe && c.issue_pe < 10).length },
    { name: "10-20", count: companies.filter(c => c.issue_pe && c.issue_pe >= 10 && c.issue_pe < 20).length },
    { name: "20-30", count: companies.filter(c => c.issue_pe && c.issue_pe >= 20 && c.issue_pe < 30).length },
    { name: "30-40", count: companies.filter(c => c.issue_pe && c.issue_pe >= 30 && c.issue_pe < 40).length },
    { name: "40-60", count: companies.filter(c => c.issue_pe && c.issue_pe >= 40 && c.issue_pe < 60).length },
    { name: ">60", count: companies.filter(c => c.issue_pe && c.issue_pe >= 60).length },
  ];

  // First-day return distribution
  const fdData = [
    { name: "<-10%", count: companies.filter(c => c.first_day_return_pct != null && c.first_day_return_pct * 100 < -10).length, neg: true },
    { name: "-10~0%", count: companies.filter(c => c.first_day_return_pct != null && c.first_day_return_pct * 100 >= -10 && c.first_day_return_pct * 100 < 0).length, neg: true },
    { name: "0~10%", count: companies.filter(c => c.first_day_return_pct != null && c.first_day_return_pct * 100 >= 0 && c.first_day_return_pct * 100 < 10).length, neg: false },
    { name: "10~30%", count: companies.filter(c => c.first_day_return_pct != null && c.first_day_return_pct * 100 >= 10 && c.first_day_return_pct * 100 < 30).length, neg: false },
    { name: "30~100%", count: companies.filter(c => c.first_day_return_pct != null && c.first_day_return_pct * 100 >= 30 && c.first_day_return_pct * 100 < 100).length, neg: false },
    { name: ">100%", count: companies.filter(c => c.first_day_return_pct != null && c.first_day_return_pct * 100 >= 100).length, neg: false },
  ];

  // 1-year performance distribution
  const changeData = [
    { name: "<-30%", count: companies.filter(c => c.cap_change_pct != null && c.cap_change_pct < -30).length, neg: true },
    { name: "-30~0%", count: companies.filter(c => c.cap_change_pct != null && c.cap_change_pct >= -30 && c.cap_change_pct < 0).length, neg: true },
    { name: "0~30%", count: companies.filter(c => c.cap_change_pct != null && c.cap_change_pct >= 0 && c.cap_change_pct < 30).length, neg: false },
    { name: "30~100%", count: companies.filter(c => c.cap_change_pct != null && c.cap_change_pct >= 30 && c.cap_change_pct < 100).length, neg: false },
    { name: ">100%", count: companies.filter(c => c.cap_change_pct != null && c.cap_change_pct >= 100).length, neg: false },
  ];

  // NEEQ duration distribution
  const neeqData = [
    { name: "<1yr", count: companies.filter(c => c.neeq_duration_years != null && c.neeq_duration_years < 1).length },
    { name: "1-3yr", count: companies.filter(c => c.neeq_duration_years != null && c.neeq_duration_years >= 1 && c.neeq_duration_years < 3).length },
    { name: "3-5yr", count: companies.filter(c => c.neeq_duration_years != null && c.neeq_duration_years >= 3 && c.neeq_duration_years < 5).length },
    { name: "5-8yr", count: companies.filter(c => c.neeq_duration_years != null && c.neeq_duration_years >= 5 && c.neeq_duration_years < 8).length },
    { name: ">8yr", count: companies.filter(c => c.neeq_duration_years != null && c.neeq_duration_years >= 8).length },
  ];

  // Financing rounds distribution (using no_financing and last_round_date as proxies)
  const withRound = companies.filter(c => c.last_round_date);
  const withSecondRound = companies.filter(c => c.second_last_round_date);
  const noFinancing = companies.filter(c => c.no_financing);
  const finData = [
    { name: "无融资", count: noFinancing.length },
    { name: "1轮", count: withRound.length - withSecondRound.length },
    { name: "2轮+", count: withSecondRound.length },
  ];

  type SparklineType = "area" | "bar" | "colorbar";

  const conclusions: Array<{
    id: number; category: string; color: string; title: string; body: string;
    metric: string; metricLabel: string;
    sparkType: SparklineType;
    sparkData: any[];
    sparkKey: string;
    sparkLabel?: string;
  }> = [
    {
      id: 1, category: "市场规模", color: "blue",
      title: "北交所已成为中小企业上市的重要通道",
      body: "自2021年11月成立至2026年3月，北交所已累计上市298家企业，总发行市值达4632亿元。市场规模持续扩大，2022年达到上市高峰（67家），此后有所回落，2024年起呈现复苏态势。",
      metric: "298家", metricLabel: "累计上市企业",
      sparkType: "area", sparkData: trendData, sparkKey: "count", sparkLabel: "历年上市数量",
    },
    {
      id: 2, category: "行业结构", color: "teal",
      title: "制造业主导，专精特新是核心标签",
      body: "北交所上市企业中，制造业占比高达88.3%，涵盖机械设备、电子、化工、医药等细分领域。这与北交所定位于服务专精特新中小企业的战略高度吻合——这类企业通常深耕细分赛道，技术壁垒高，但规模相对较小。",
      metric: "88.3%", metricLabel: "制造业占比",
      sparkType: "bar", sparkData: indTop8, sparkKey: "count", sparkLabel: "行业分布 Top 8",
    },
    {
      id: 3, category: "地域分布", color: "orange",
      title: "长三角是最大的企业来源地",
      body: "苏浙安沪长三角地区贡献了全部上市企业的40.3%，江苏省以56家居首。这与该地区成熟的制造业产业集群和完善的中小企业生态密切相关。西部和东北地区上市企业较少，未来仍有较大的挖掘空间。",
      metric: "40.3%", metricLabel: "长三角占比",
      sparkType: "bar", sparkData: provTop8, sparkKey: "count", sparkLabel: "省份分布 Top 8",
    },
    {
      id: 4, category: "上市表现", color: "green",
      title: "整体上涨，但分化显著",
      body: "上市一年后，52.5%的企业市值上涨，平均涨幅43.5%（中位数+3.6%）。均值与中位数的巨大差距说明少数超级明星企业拉高了整体均值，多数企业表现平淡。这要求投资者在选股时更注重个股研究，而非依赖市场整体趋势。",
      metric: "+43.5%", metricLabel: "平均一年涨幅",
      sparkType: "colorbar", sparkData: changeData, sparkKey: "count", sparkLabel: "一年后涨跌幅分布",
    },
    {
      id: 5, category: "首日表现", color: "amber",
      title: "首日涨幅高，但破发率不容忽视",
      body: "上市首日平均涨幅80.1%，但整体破发率达22.9%。2022年破发率高峰期后，2024年破发率已降至0%，首日涨幅大幅提升，显示市场情绪已出现结构性好转。",
      metric: "80.1%", metricLabel: "平均首日涨幅",
      sparkType: "colorbar", sparkData: fdData, sparkKey: "count", sparkLabel: "首日涨跌幅分布",
    },
    {
      id: 6, category: "估值分析", color: "blue",
      title: "系统性折价上市，安全边际较大",
      body: "超过70%的北交所企业以低于同行业市盈率的价格上市，平均折价幅度42.4%。这一现象的根本原因在于市场流动性不足——投资者要求流动性折价作为补偿。对于能够识别优质资产的投资者而言，这提供了相对其他板块更大的安全边际。",
      metric: "42.4%", metricLabel: "平均PE折价幅度",
      sparkType: "bar", sparkData: peData, sparkKey: "count", sparkLabel: "发行PE分布",
    },
    {
      id: 7, category: "选股信号", color: "violet",
      title: "低PE是有效的正向选股信号",
      body: "发行PE与上市后一年表现存在显著负相关（r = -0.226），即发行PE越低的企业，上市后表现往往越好。这为投资者提供了一个简单但有效的选股策略：在同等条件下，优先选择发行PE较低的公司。",
      metric: "r = -0.226", metricLabel: "PE与表现相关性",
      sparkType: "area", sparkData: trendData, sparkKey: "avgChange", sparkLabel: "历年平均一年后涨幅%",
    },
    {
      id: 8, category: "新三板路径", color: "teal",
      title: "新三板是制度准备，而非质量筛选",
      body: "61.7%的北交所上市企业有新三板挂牌经历，平均挂牌时长4.0年。然而，挂牌时长与上市后表现几乎无相关（r = +0.019），说明新三板的核心价值在于帮助企业建立规范的信息披露和公司治理体系，而非筛选出更优质的公司。",
      metric: "61.7%", metricLabel: "有新三板经历",
      sparkType: "bar", sparkData: neeqData, sparkKey: "count", sparkLabel: "新三板挂牌时长分布",
    },
    {
      id: 9, category: "融资路径", color: "green",
      title: "轻融资模式，与科创板形成鲜明对比",
      body: "北交所企业普遍呈现轻融资特征，大多数企业在上市前只完成了少量轮次的融资，与科创板企业动辄多轮融资的模式存在显著差异。这与北交所主要服务于已有稳定商业模式的传统制造业企业相匹配。",
      metric: "62%", metricLabel: "有融资记录占比",
      sparkType: "bar", sparkData: finData, sparkKey: "count", sparkLabel: "融资轮次分布",
    },
    {
      id: 10, category: "市场展望", color: "amber",
      title: "2024年以来市场情绪明显改善",
      body: "2024年北交所破发率降至0%，首日涨幅大幅提升，显示市场情绪已出现结构性好转。随着北交所制度建设不断完善、流动性逐步改善，以及更多优质专精特新企业的加入，北交所的投资价值有望进一步提升。",
      metric: "0%", metricLabel: "2024年破发率",
      sparkType: "area", sparkData: trendData, sparkKey: "bustPct", sparkLabel: "历年破发率%",
    },
  ];

  const Sparkline = ({ c }: { c: typeof conclusions[0] }) => {
    const cls = colorMap[c.color] || colorMap.blue;
    if (c.sparkType === "area") {
      return (
        <div className="mt-3">
          <div className="text-[9px] text-muted-foreground mb-1">{c.sparkLabel}</div>
          <ResponsiveContainer width="100%" height={60}>
            <AreaChart data={c.sparkData} margin={{ top: 2, right: 2, left: -30, bottom: 0 }}>
              <defs>
                <linearGradient id={`grad-${c.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={cls.stroke} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={cls.stroke} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="year" tick={{ fill: 'var(--muted-foreground)', fontSize: 8 }} tickLine={false} axisLine={false} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 9, padding: '4px 8px' }}
                formatter={(v: any) => [typeof v === 'number' ? v.toFixed(1) : v, c.sparkKey]}
              />
              <Area type="monotone" dataKey={c.sparkKey} stroke={cls.stroke} strokeWidth={1.5} fill={`url(#grad-${c.id})`} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      );
    }
    if (c.sparkType === "bar") {
      return (
        <div className="mt-3">
          <div className="text-[9px] text-muted-foreground mb-1">{c.sparkLabel}</div>
          <ResponsiveContainer width="100%" height={60}>
            <BarChart data={c.sparkData} margin={{ top: 2, right: 2, left: -30, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fill: 'var(--muted-foreground)', fontSize: 8 }} tickLine={false} axisLine={false} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 9, padding: '4px 8px' }}
                formatter={(v: any) => [v, "数量"]}
              />
              <Bar dataKey={c.sparkKey} fill={cls.stroke} radius={[2, 2, 0, 0]} opacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      );
    }
    if (c.sparkType === "colorbar") {
      return (
        <div className="mt-3">
          <div className="text-[9px] text-muted-foreground mb-1">{c.sparkLabel}</div>
          <ResponsiveContainer width="100%" height={60}>
            <BarChart data={c.sparkData} margin={{ top: 2, right: 2, left: -30, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fill: 'var(--muted-foreground)', fontSize: 7 }} tickLine={false} axisLine={false} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 9, padding: '4px 8px' }}
                formatter={(v: any) => [v, "数量"]}
              />
              <Bar dataKey={c.sparkKey} radius={[2, 2, 0, 0]}>
                {c.sparkData.map((d: any, i: number) => (
                  <Cell key={i} fill={d.neg ? "#F87171" : "#34D399"} opacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Hero Summary */}
      <div className="bg-gradient-to-br from-blue-500/10 via-background to-amber-500/5 border border-border/50 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-foreground mb-2">北交所上市企业研究报告 · 核心结论</h2>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
              本报告基于298家北交所上市企业的完整数据集，从市场规模、行业结构、地域分布、上市表现、估值分析、融资路径等维度进行系统性研究，
              旨在为投资者和研究人员提供关于北交所市场特征的全面认识。以下10个核心结论是本报告最重要的发现，每条结论均附有支撑数据图表。
            </p>
          </div>
          <div className="hidden sm:grid grid-cols-2 gap-3 flex-shrink-0">
            {[
              { v: "298家", l: "上市企业" },
              { v: "4632亿", l: "总发行市值" },
              { v: "+43.5%", l: "平均一年涨幅" },
              { v: "22.9%", l: "整体破发率" },
            ].map(({ v, l }) => (
              <div key={l} className="text-center bg-background/60 border border-border/50 rounded-lg px-4 py-2">
                <div className="text-lg font-bold font-mono text-primary">{v}</div>
                <div className="text-[10px] text-muted-foreground">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 10 Conclusions Grid - each with sparkline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {conclusions.map(c => {
          const cls = colorMap[c.color] || colorMap.blue;
          return (
            <div key={c.id} className={cn("border rounded-xl p-5", cls.bg, cls.border)}>
              <div className="flex gap-3">
                {/* Number badge */}
                <div className={cn("flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mt-0.5", cls.badge)}>
                  {c.id}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", cls.badge)}>{c.category}</span>
                    <h3 className="text-sm font-semibold text-foreground">{c.title}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-2">{c.body}</p>
                  <div className="flex items-baseline gap-1">
                    <span className={cn("text-xl font-bold font-mono", cls.text)}>{c.metric}</span>
                    <span className="text-[10px] text-muted-foreground">{c.metricLabel}</span>
                  </div>
                  {/* Sparkline */}
                  <Sparkline c={c} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Market Trend Chart */}
      <div className="bg-card border border-border/50 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-2">市场情绪演变：历年首日涨幅与破发率趋势</h3>
        <p className="text-xs text-muted-foreground mb-4">
          2022年受宏观环境影响，北交所破发率攀升至历史高点，首日涨幅大幅收窄；2024年以来，破发率归零，首日涨幅显著回升，市场情绪已出现结构性好转。
        </p>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={trendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
            <XAxis dataKey="year" tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} />
            <YAxis yAxisId="left" tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} unit="%" />
            <YAxis yAxisId="right" orientation="right" tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} unit="%" />
            <Tooltip
              contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11 }}
              formatter={(v: any, name: string) => [`${v}%`, name]}
            />
            <Line yAxisId="left" type="monotone" dataKey="avgFD" name="平均首日涨幅" stroke="#D4A843" strokeWidth={2} dot={{ r: 3 }} />
            <Line yAxisId="right" type="monotone" dataKey="bustPct" name="破发率" stroke="#F87171" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 2" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Market Outlook */}
      <div className="bg-card border border-border/50 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3">市场展望</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              icon: "📈",
              title: "流动性改善是关键",
              body: "北交所当前最大的挑战是流动性不足，这直接导致了系统性折价上市现象。随着市场规模扩大、机构投资者参与度提升，流动性改善将是推动估值修复的核心驱动力。",
            },
            {
              icon: "🏭",
              title: "专精特新供给持续扩大",
              body: "西部和东北地区的优质专精特新企业尚未充分挖掘，随着区域经济政策支持和北交所制度建设完善，这些地区将成为未来上市企业的重要增量来源。",
            },
            {
              icon: "💡",
              title: "低PE选股策略具有持续有效性",
              body: "发行PE与上市后表现的负相关性（r = -0.226）在统计上显著，这一规律在流动性改善后可能进一步强化。投资者可将低发行PE作为初步筛选条件，再结合基本面分析进行深度研究。",
            },
          ].map(({ icon, title, body }) => (
            <div key={title} className="bg-muted/30 rounded-lg p-4">
              <div className="text-2xl mb-2">{icon}</div>
              <h4 className="text-xs font-semibold text-foreground mb-1.5">{title}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="border border-border/30 rounded-lg p-4 bg-muted/20">
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          <strong>免责声明：</strong>本报告所有数据均来源于公开市场信息，截至2026年3月。本报告仅供学术研究和参考用途，不构成任何投资建议。
          过往市场表现不代表未来收益。投资者应结合自身风险承受能力，独立做出投资决策。
        </p>
      </div>
    </div>
  );
}
