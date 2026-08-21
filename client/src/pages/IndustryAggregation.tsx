import { useLocation } from "wouter";
import { ArrowLeft, Layers, Scale, Grid3x3, PieChart as PieIcon, ShieldAlert, Sparkles, BookOpen } from "lucide-react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  PieChart, Pie, Cell, Tooltip, Legend,
} from "recharts";
import researchData from "../data/industry_research_data.json";

const DATA: any = researchData;
const INDUSTRIES: any[] = DATA.industries;

// 行业主题色（与雷达/配置图一致）
const THEME: Record<string, string> = {
  medical: "#22d3ee",     // 青
  newenergy: "#a3e635",   // 柠檬绿
  ai: "#f472b6",          // 粉
};

const RATING_STYLE: Record<string, { badge: string; label: string }> = {
  BUY:  { badge: "bg-green-500/20 text-green-400 border border-green-500/30", label: "买入" },
  HOLD: { badge: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30", label: "持有" },
  SELL: { badge: "bg-red-500/20 text-red-400 border border-red-500/30", label: "卖出" },
};

// ── 聚合派生数据 ──────────────────────────────────────────────────────────────
// 推荐跨行业配置（点估计，详见说明）：用三行业建议敞口的中点/条件值
const EXPO_PT: Record<string, number> = {
  medical: 9,     // 8-10% 中点
  newenergy: 3,   // 固定 3%
  ai: 1,          // 条件性预留 1.0%（硬上限 1.5%）
};
const deployed = INDUSTRIES.reduce((s, i) => s + (EXPO_PT[i.id] || 0), 0);
const cashPct = 100 - deployed;

const allocData = [
  ...INDUSTRIES.map((i) => ({ name: i.name, value: EXPO_PT[i.id], color: THEME[i.id] })),
  { name: "现金/等价物", value: cashPct, color: "#475569" },
];

// 五维雷达叠加数据
const DIMS = ["技术面", "基本面", "新闻面", "情绪面", "风险面"];
const radarData = DIMS.map((d) => {
  const o: any = { dim: d };
  INDUSTRIES.forEach((ind) => { o[ind.id] = (ind.radar as any)[d]; });
  return o;
});

// 聚合多空辩论（全行业合并，按权重降序）
const allBull = INDUSTRIES.flatMap((ind) =>
  (ind.bullPoints as any[]).map((p) => ({ ...p, ind: ind.name }))
).sort((a, b) => b.weight - a.weight);
const allBear = INDUSTRIES.flatMap((ind) =>
  (ind.bearPoints as any[]).map((p) => ({ ...p, ind: ind.name }))
).sort((a, b) => b.weight - a.weight);

// 系统性风险识别：三行业风险清单均提及的共性关键词
const SYSTEMIC_TERMS = ["北证50"];
const systemicHits = SYSTEMIC_TERMS.filter((t) =>
  INDUSTRIES.every((ind) => (ind.risks as string[]).some((r) => r.includes(t)))
);

// 催化剂汇总（去重）
const catalysts = Array.from(
  new Set(INDUSTRIES.flatMap((ind) => ind.catalysts as string[]))
);

function Section({ title, icon, children, sub }: { title: string; icon: React.ReactNode; children: React.ReactNode; sub?: string }) {
  return (
    <div className="mb-7">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <h3 className="text-white font-bold text-lg">{title}</h3>
      </div>
      {sub && <p className="text-gray-500 text-xs mb-3 ml-7">{sub}</p>}
      {children}
    </div>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-gray-800 rounded-xl p-5 ${className}`}>{children}</div>;
}

export default function IndustryAggregation() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* 返回 */}
      <div className="mb-4">
        <button
          onClick={() => { if (window.history.length > 1) window.history.back(); else navigate("/"); }}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={18} /><span>返回</span>
        </button>
      </div>

      {/* 标题 */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
          <Layers size={22} className="text-cyan-400" /> 行业级聚合研究
        </h1>
        <p className="text-gray-400 text-sm">
          把医疗健康 / 新能源 / 人工智能 三份行业研究报告聚合为跨行业可比视图——横向对照、配置建议、共性风险一目了然
        </p>
      </div>

      {/* 口径说明 */}
      <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-4 mb-6 flex items-start gap-3">
        <Sparkles size={16} className="text-cyan-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-gray-300 leading-relaxed">
          <span className="text-cyan-400 font-semibold">口径说明：</span>
          本页所有内容均从交易分析团队三份行业研究报告（标准版 + 券商加厚版）抽取的<span className="text-white">真实结构化结论</span>聚合而成，未做任何编造。
          “推荐跨行业配置”中的敞口采用三行业建议敞口的中点/条件值（医疗 9% / 新能源 3% / AI 1%）<span className="text-white">点估计</span>，仅用于呈现相对配比，非交易指令。
          <div className="text-gray-500 text-xs mt-1.5">
            数据生成 {DATA.meta.generatedAt} · 研究基准 {DATA.meta.dataAsOf} · 财年 {DATA.meta.fiscalYear} · {DATA.meta.source}
          </div>
        </div>
      </div>

      {/* ① 总览卡 */}
      <Section title="① 研究总览" icon={<Grid3x3 size={16} className="text-cyan-400" />} sub="三行业评级、敞口与样本量一屏对照">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {INDUSTRIES.map((ind) => {
            const rs = RATING_STYLE[ind.rating] || RATING_STYLE.HOLD;
            return (
              <Card key={ind.id} className="flex flex-col">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{ind.icon}</span>
                  <span className="font-semibold text-white">{ind.name}</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded self-start mb-3 ${rs.badge}`}>{ind.rating} · {rs.label}</span>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between"><span className="text-gray-400">建议敞口</span><span className="text-white font-medium">{ind.recommendedExposure}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">置信度</span><span className="text-white">{ind.confidence}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">风险等级</span><span className="text-white">{ind.riskLevel}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">样本企业</span><span className="text-white">{ind.sampleSize} 家</span></div>
                </div>
              </Card>
            );
          })}
          <Card className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 flex flex-col justify-center">
            <p className="text-xs text-gray-400 mb-1">组合合计部署敞口（点估计）</p>
            <p className="text-3xl font-extrabold text-cyan-300">{deployed}%</p>
            <p className="text-xs text-gray-500 mt-1">现金/等价物 ≥ {cashPct}%</p>
          </Card>
        </div>
      </Section>

      {/* ② 横向对比矩阵 */}
      <Section title="② 横向对比矩阵" icon={<Scale size={16} className="text-cyan-400" />} sub="以指标为行、三行业为列，逐格对照">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-gray-400 border-b border-gray-700">
                <th className="text-left font-medium px-3 py-2 w-36">指标</th>
                {INDUSTRIES.map((ind) => (
                  <th key={ind.id} className="text-left font-medium px-3 py-2">
                    <span className="text-lg mr-1">{ind.icon}</span>{ind.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { k: "评级", v: (ind: any) => <span className={`text-xs px-2 py-0.5 rounded ${RATING_STYLE[ind.rating].badge}`}>{ind.rating}</span> },
                { k: "置信度", v: (ind: any) => <span className="text-gray-200">{ind.confidence}</span> },
                { k: "风险等级", v: (ind: any) => <span className="text-gray-200">{ind.riskLevel}</span> },
                { k: "建议敞口", v: (ind: any) => <span className="text-white font-medium">{ind.recommendedExposure}</span> },
                { k: "样本企业", v: (ind: any) => <span className="text-gray-200">{ind.sampleSize} 家</span> },
                { k: "乐观情景", v: (ind: any) => <span className="text-green-400">{ind.scenarios.optimistic.range}</span> },
                { k: "中性情景", v: (ind: any) => <span className="text-gray-200">{ind.scenarios.neutral.range}</span> },
                { k: "悲观情景", v: (ind: any) => <span className="text-red-400">{ind.scenarios.pessimistic.range}</span> },
              ].map((row, ri) => (
                <tr key={ri} className="border-b border-gray-700/50">
                  <td className="px-3 py-2.5 text-gray-400 font-medium">{row.k}</td>
                  {INDUSTRIES.map((ind) => (
                    <td key={ind.id} className="px-3 py-2.5">{row.v(ind)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ③ 五维雷达叠加 + 推荐配置 */}
      <Section title="③ 多维画像与推荐配置" icon={<PieIcon size={16} className="text-cyan-400" />} sub="左：五维评分叠加对比；右：推荐跨行业配置占比">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <h4 className="text-white font-semibold mb-1">五维综合评分（满分 10，风险面越低越危险）</h4>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData} outerRadius="70%">
                <PolarGrid stroke="#374151" />
                <PolarAngleAxis dataKey="dim" tick={{ fill: "#9ca3af", fontSize: 11 }} />
                <PolarRadiusAxis domain={[0, 10]} tick={{ fill: "#6b7280", fontSize: 9 }} axisLine={false} />
                {INDUSTRIES.map((ind) => (
                  <Radar key={ind.id} dataKey={ind.id} stroke={THEME[ind.id]} fill={THEME[ind.id]} fillOpacity={0.18} />
                ))}
              </RadarChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-3 justify-center mt-1">
              {INDUSTRIES.map((ind) => (
                <span key={ind.id} className="flex items-center gap-1.5 text-xs text-gray-300">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: THEME[ind.id] }} />
                  {ind.icon} {ind.name}
                </span>
              ))}
            </div>
          </Card>

          <Card className="flex flex-col">
            <h4 className="text-white font-semibold mb-1">推荐跨行业配置（点估计）</h4>
            <p className="text-gray-500 text-xs mb-2">组合总部署 {deployed}% · 现金/等价物 {cashPct}%</p>
            <ResponsiveContainer width="100%" height={230}>
              <PieChart>
                <Pie data={allocData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} innerRadius={50} label={(e: any) => `${e.name} ${e.value}%`} labelLine={false}>
                  {allocData.map((d, i) => <Cell key={i} fill={d.color} stroke="#1f2937" />)}
                </Pie>
                <Tooltip formatter={(v: any, n: any) => [`${v}%`, n]} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 grid grid-cols-1 gap-1.5">
              {INDUSTRIES.map((ind) => (
                <div key={ind.id} className="flex items-center justify-between text-xs bg-gray-700/40 rounded px-2.5 py-1.5">
                  <span className="text-gray-300 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: THEME[ind.id] }} />
                    {ind.icon} {ind.name}
                  </span>
                  <span className="text-white font-medium">{EXPO_PT[ind.id]}%</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </Section>

      {/* ④ 聚合多空辩论 */}
      <Section title="④ 聚合多空辩论" icon={<Scale size={16} className="text-cyan-400" />} sub="三行业论据合并、按权重降序；标签标注来源行业">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <h4 className="text-green-400 font-semibold mb-3 flex items-center gap-2"><span>▲</span> 多头论据 Top（权重降序）</h4>
            <div className="space-y-2.5">
              {allBull.slice(0, 9).map((p, k) => (
                <div key={k}>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-gray-200 text-sm leading-snug">{p.text}</span>
                    <span className="text-green-400 text-xs font-bold flex-shrink-0">{p.weight}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="flex-1 bg-gray-700 rounded-full h-1.5"><div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, p.weight * 10)}%` }} /></div>
                    <span className="text-[10px] text-gray-500 flex-shrink-0">{p.ind}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <h4 className="text-red-400 font-semibold mb-3 flex items-center gap-2"><span>▼</span> 空头论据 Top（权重降序）</h4>
            <div className="space-y-2.5">
              {allBear.slice(0, 9).map((p, k) => (
                <div key={k}>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-gray-200 text-sm leading-snug">{p.text}</span>
                    <span className="text-red-400 text-xs font-bold flex-shrink-0">{p.weight}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="flex-1 bg-gray-700 rounded-full h-1.5"><div className="bg-red-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, p.weight * 10)}%` }} /></div>
                    <span className="text-[10px] text-gray-500 flex-shrink-0">{p.ind}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </Section>

      {/* ⑤ 跨行业风险地图 */}
      <Section title="⑤ 跨行业风险地图" icon={<ShieldAlert size={16} className="text-cyan-400" />} sub="逐行业列示关键风险；自动识别三行业共性（系统性）风险">
        {systemicHits.length > 0 && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-2">
            <ShieldAlert size={15} className="text-red-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-gray-300">
              <span className="text-red-400 font-semibold">系统性风险（三行业共性）：</span>
              风险清单均提及 {systemicHits.join("、")}，属跨行业共同 Beta，无法通过行业间分散消除。
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {INDUSTRIES.map((ind) => (
            <Card key={ind.id} className="border-l-2" style={{ borderLeftColor: THEME[ind.id] } as any}>
              <h4 className="font-semibold mb-2 flex items-center gap-1.5">
                <span className="text-lg">{ind.icon}</span>
                <span className="text-white">{ind.name}</span>
              </h4>
              <ul className="space-y-1.5">
                {(ind.risks as string[]).map((r: string, k: number) => (
                  <li key={k} className="text-gray-300 text-xs flex gap-1.5 leading-relaxed"><span className="text-red-400">⚠</span><span>{r}</span></li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </Section>

      {/* ⑥ 催化剂汇总 */}
      <Section title="⑥ 催化剂 / 翻多信号汇总" icon={<Sparkles size={16} className="text-cyan-400" />} sub="三行业催化剂去重合并">
        <Card>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
            {catalysts.map((c: string, k) => (
              <li key={k} className="text-gray-300 text-sm flex gap-2"><span className="text-amber-400">★</span><span>{c}</span></li>
            ))}
          </ul>
        </Card>
      </Section>

      {/* 关联入口 */}
      <div className="bg-gray-800 rounded-xl p-5 mb-6">
        <h3 className="text-white font-semibold mb-3 flex items-center gap-2"><BookOpen size={15} className="text-cyan-400" /> 关联研究</h3>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => navigate("/industry-research")} className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm transition-colors">单行业深度研究 →</button>
          <button onClick={() => navigate("/trading-loop")} className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm transition-colors">买卖结论闭环 →</button>
          <button onClick={() => navigate("/portfolio-risk")} className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm transition-colors">组合层风险 →</button>
        </div>
      </div>

      <div className="border-t border-gray-700/40 pt-4">
        <p className="text-gray-500 text-xs leading-relaxed">{DATA.meta.disclaimer}</p>
      </div>
    </div>
  );
}
