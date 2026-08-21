import { useLocation } from "wouter";
import { ArrowLeft, ShieldAlert, Layers, Activity, AlertTriangle, Gauge, PieChart as PieIcon, Target } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import researchData from "../data/industry_research_data.json";

const DATA: any = researchData;
const INDUSTRIES: any[] = DATA.industries;

const THEME: Record<string, string> = {
  medical: "#22d3ee",
  newenergy: "#a3e635",
  ai: "#f472b6",
};

// 与"行业级聚合研究"一致的敞口点估计（医疗 9% / 新能源 3% / AI 1%）
const EXPO_PT: Record<string, number> = { medical: 9, newenergy: 3, ai: 1 };
const deployed = INDUSTRIES.reduce((s, i) => s + (EXPO_PT[i.id] || 0), 0); // 13
const cashPct = 100 - deployed; // 87

// 权益层（已部署 13%）内权重
const sleeve = INDUSTRIES.map((i) => ({
  id: i.id, name: i.name, icon: i.icon,
  expo: EXPO_PT[i.id], w: EXPO_PT[i.id] / deployed,
}));
// 集中度 HHI（权益层内）
const hhi = sleeve.reduce((s, x) => s + x.w * x.w, 0); // ≈0.538

// 情景 P&L（组合层，单位 pp）
// 医疗：直接采用研究报告"组合贡献"（已是按敞口口径）
// 新能源/AI：建议敞口 × 该行业情景收益率（中/悲观取区间中点），0敞口行业计 0
const SCN: Record<string, { medical: number; newenergy: number; ai: number }> = {
  optimistic:  { medical: 1.52,  newenergy: 0.50, ai: 0.00 },
  neutral:     { medical: 0.13,  newenergy: -0.05, ai: 0.00 },
  pessimistic: { medical: -1.36, newenergy: -0.36, ai: -0.19 },
};
const scnSum = (k: keyof typeof SCN) => SCN[k].medical + SCN[k].newenergy + SCN[k].ai;
const pessDrawdownEquity = scnSum("pessimistic") / deployed; // ≈ -14.7%

const scnChart = [
  { name: "乐观", 医疗: SCN.optimistic.medical, 新能源: SCN.optimistic.newenergy, 人工智能: SCN.optimistic.ai },
  { name: "中性", 医疗: SCN.neutral.medical, 新能源: SCN.neutral.newenergy, 人工智能: SCN.neutral.ai },
  { name: "悲观", 医疗: SCN.pessimistic.medical, 新能源: SCN.pessimistic.newenergy, 人工智能: SCN.pessimistic.ai },
];

// 系统性风险：三行业风险清单均提及 北证50 → 共同 Beta
const systematicTriggers = INDUSTRIES.map((ind) => {
  const hit = (ind.risks as string[]).find((r) => r.includes("北证50"));
  return { name: ind.name, icon: ind.icon, line: hit || null };
});

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
function Card({ children, className = "", style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return <div className={`bg-gray-800 rounded-xl p-5 ${className}`} style={style}>{children}</div>;
}
// 中国习惯：上涨/正贡献=红，下跌/负贡献=绿
function ppCls(v: number) { return v >= 0 ? "text-red-400" : "text-green-400"; }
function ppStr(v: number) { return `${v >= 0 ? "+" : ""}${v.toFixed(2)}pp`; }

export default function PortfolioRisk() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="mb-4">
        <button
          onClick={() => { if (window.history.length > 1) window.history.back(); else navigate("/"); }}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={18} /><span>返回</span>
        </button>
      </div>

      <div className="mb-5">
        <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
          <ShieldAlert size={22} className="text-red-400" /> 组合层风险
        </h1>
        <p className="text-gray-400 text-sm">
          以三行业研究报告的"建议敞口"作为组合权重，量化组合层集中度、情景 P&amp;L、压力测试与系统性/个例风险
        </p>
      </div>

      {/* 口径说明 */}
      <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 mb-6 flex items-start gap-3">
        <AlertTriangle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-gray-300 leading-relaxed">
          <span className="text-red-400 font-semibold">方法说明：</span>
          本页为基于三份行业研究报告的<span className="text-white">组合层派生计算</span>，所有输入（建议敞口、情景贡献）均来自
          <span className="text-white">同一研究数据源</span>（不混用行情层市值），未引入外部假设。
          医疗情景直接采用报告"组合贡献"(pp)；新能源/AI 按其建议敞口 × 情景收益率折算为组合层 pp。
          颜色遵循中国习惯：<span className="text-red-400">正贡献/上涨=红</span>，<span className="text-green-400">负贡献/下跌=绿</span>。
          <div className="text-gray-500 text-xs mt-1.5">数据生成 {DATA.meta.generatedAt} · 研究基准 {DATA.meta.dataAsOf} · 财年 {DATA.meta.fiscalYear}</div>
        </div>
      </div>

      {/* ① 组合配置结构 */}
      <Section title="① 组合配置结构" icon={<PieIcon size={16} className="text-red-400" />} sub="已部署 13% · 现金缓冲 87%">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <h4 className="text-white font-semibold mb-3">总盘子配置</h4>
            <div className="space-y-2.5">
              {INDUSTRIES.map((i) => (
                <div key={i.id}>
                  <div className="flex justify-between text-sm mb-1"><span className="text-gray-300">{i.icon} {i.name}</span><span className="text-white font-medium">{EXPO_PT[i.id]}%</span></div>
                  <div className="h-2.5 rounded-full bg-gray-700"><div className="h-full rounded-full" style={{ width: `${EXPO_PT[i.id]}%`, background: THEME[i.id] }} /></div>
                </div>
              ))}
              <div>
                <div className="flex justify-between text-sm mb-1"><span className="text-gray-400">现金 / 等价物</span><span className="text-gray-300 font-medium">{cashPct}%</span></div>
                <div className="h-2.5 rounded-full bg-gray-700"><div className="h-full rounded-full bg-slate-500" style={{ width: `${cashPct}%` }} /></div>
              </div>
            </div>
          </Card>
          <Card>
            <h4 className="text-white font-semibold mb-3">权益层内权重（已部署 13% 内部）</h4>
            <div className="space-y-2.5">
              {sleeve.map((s) => (
                <div key={s.id}>
                  <div className="flex justify-between text-sm mb-1"><span className="text-gray-300">{s.icon} {s.name}</span><span className="text-white font-medium">{(s.w * 100).toFixed(1)}%</span></div>
                  <div className="h-2.5 rounded-full bg-gray-700"><div className="h-full rounded-full" style={{ width: `${s.w * 100}%`, background: THEME[s.id] }} /></div>
                </div>
              ))}
            </div>
            <p className="text-gray-500 text-xs mt-3">权益层几乎由单一行业（医疗 ≈69%）主导，分散度极低——见集中度。</p>
          </Card>
        </div>
      </Section>

      {/* ② 集中度 HHI */}
      <Section title="② 集中度（HHI）" icon={<Gauge size={16} className="text-red-400" />} sub="赫芬达尔指数，仅计权益层内部">
        <Card>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-4xl font-extrabold text-red-400">{hhi.toFixed(2)}</div>
              <div className="text-xs text-gray-500 mt-1">HHI（0–1，越高越集中）</div>
            </div>
            <div className="flex-1">
              <div className="h-3 rounded-full bg-gray-700 overflow-hidden">
                <div className="h-full bg-red-500" style={{ width: `${Math.min(100, hhi * 100)}%` }} />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0 分散</span><span>0.25 警戒</span><span>1 单一</span>
              </div>
              <p className="text-sm text-gray-300 mt-3">
                HHI ≈ <b className="text-red-400">0.54</b>，远超 0.25 警戒线 → <b className="text-white">权益层高度集中</b>。
                分散效果几乎全部来自 87% 现金缓冲，而非行业间分散；若提高权益部署，集中度风险将被放大。
              </p>
            </div>
          </div>
        </Card>
      </Section>

      {/* ③ 情景 P&L 加权 */}
      <Section title="③ 情景 P&L（组合层加权）" icon={<Activity size={16} className="text-red-400" />} sub="单位 pp（组合百分点）；正=红 / 负=绿">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 border-b border-gray-700">
                  <th className="text-left font-medium px-2 py-2">情景</th>
                  <th className="text-right font-medium px-2 py-2">医疗</th>
                  <th className="text-right font-medium px-2 py-2">新能源</th>
                  <th className="text-right font-medium px-2 py-2">AI</th>
                  <th className="text-right font-medium px-2 py-2">合计</th>
                </tr>
              </thead>
              <tbody>
                {(["optimistic", "neutral", "pessimistic"] as const).map((k) => (
                  <tr key={k} className="border-b border-gray-700/50">
                    <td className="px-2 py-2.5 text-gray-300 font-medium">
                      {k === "optimistic" ? "乐观" : k === "neutral" ? "中性" : "悲观"}
                    </td>
                    <td className={`px-2 py-2.5 text-right ${ppCls(SCN[k].medical)}`}>{ppStr(SCN[k].medical)}</td>
                    <td className={`px-2 py-2.5 text-right ${ppCls(SCN[k].newenergy)}`}>{ppStr(SCN[k].newenergy)}</td>
                    <td className={`px-2 py-2.5 text-right ${ppCls(SCN[k].ai)}`}>{ppStr(SCN[k].ai)}</td>
                    <td className={`px-2 py-2.5 text-right font-bold ${ppCls(scnSum(k))}`}>{ppStr(scnSum(k))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-gray-500 text-xs mt-2">AI 因 SELL/0 敞口不计入；新能源按 3% 敞口 × 情景收益率折算。</p>
          </Card>
          <Card>
            <h4 className="text-white font-semibold mb-1">三情景组合贡献对比</h4>
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={scnChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" tick={{ fill: "#9ca3af", fontSize: 11 }} />
                <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} unit="pp" />
                <Tooltip formatter={(v: any) => `${v}pp`} contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="医疗" fill={THEME.medical} />
                <Bar dataKey="新能源" fill={THEME.newenergy} />
                <Bar dataKey="人工智能" fill={THEME.ai} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </Section>

      {/* ④ 压力测试 */}
      <Section title="④ 压力测试（悲观情景）" icon={<AlertTriangle size={16} className="text-red-400" />}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-red-500/5 border border-red-500/30">
            <p className="text-xs text-gray-400 mb-1">组合净值影响（极端悲观）</p>
            <p className="text-3xl font-extrabold text-green-400">{ppStr(scnSum("pessimistic"))}</p>
            <p className="text-xs text-gray-500 mt-1">三行业悲观情景加权合计</p>
          </Card>
          <Card className="bg-red-500/5 border border-red-500/30">
            <p className="text-xs text-gray-400 mb-1">权益层回撤（占已部署 13%）</p>
            <p className="text-3xl font-extrabold text-green-400">{(pessDrawdownEquity * 100).toFixed(1)}%</p>
            <p className="text-xs text-gray-500 mt-1">-1.91pp ÷ 13% 部署</p>
          </Card>
          <Card>
            <p className="text-xs text-gray-400 mb-1">现金缓冲吸收后</p>
            <p className="text-3xl font-extrabold text-white">{cashPct}%</p>
            <p className="text-xs text-gray-500 mt-1">组合整体最大跌幅仍受控于个位数 pp</p>
          </Card>
        </div>
        <div className="mt-3 p-3 rounded-lg bg-gray-700/40 text-sm text-gray-300 leading-relaxed">
          尽管权益层局部回撤可达 <b className="text-green-400">-14.7%</b>，但由于仅部署 13%、现金 87%，组合整体极端损失被压缩至约
          <b className="text-green-400"> -1.9pp</b>。风险预算的核心不是"少亏"，而是<b className="text-white">用高现金比例把尾部锁在可承受区间</b>。
        </div>
      </Section>

      {/* ⑤ 系统性风险 */}
      <Section title="⑤ 系统性风险（跨行业共性）" icon={<Layers size={16} className="text-red-400" />} sub="三行业风险清单均指向 北证50 —— 共同 Beta，无法靠行业分散消除">
        <Card className="bg-red-500/10 border border-red-500/30">
          <div className="flex items-start gap-2 mb-3">
            <ShieldAlert size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-200">
              <span className="text-red-400 font-semibold">北证50 是组合唯一 swing factor。</span>
              三行业研究均将其列为首要风险，行业间相关性由此被强制拉高——分散失效。
            </p>
          </div>
          <div className="space-y-2">
            {systematicTriggers.map((t) => (
              <div key={t.name} className="flex items-start gap-2 text-sm bg-gray-900/40 rounded-lg px-3 py-2">
                <span className="text-lg">{t.icon}</span>
                <span className="text-white font-medium w-20 flex-shrink-0">{t.name}</span>
                <span className="text-gray-300 text-xs leading-relaxed">{t.line || "（未直接提及）"}</span>
              </div>
            ))}
          </div>
        </Card>
      </Section>

      {/* ⑥ 单点故障 / 个例风险 */}
      <Section title="⑥ 单点故障与个例风险" icon={<Target size={16} className="text-red-400" />} sub="行业内部的集中度与流动性真空">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {INDUSTRIES.map((ind) => {
            const idio = {
              newenergy: "利润 74.9% 集中于同力+开发两家（双点故障）；开发 Q1 -74% 拖累 PE。升级至 12%+ 物理不可执行（容量≈6%）。",
              ai: "86.1% 无成交价、94.2% 无二级流动性；价格发现缺失，一次性重估 -13%~-24% 无预警。",
              medical: "北交所成交萎缩 -30.4%；折价本身是流动性折价而非低估；中证医疗与北证50 负相关。",
            } as Record<string, string>;
            return (
              <Card key={ind.id} className="border-l-2" style={{ borderLeftColor: THEME[ind.id] }}>
                <h4 className="font-semibold mb-2 flex items-center gap-1.5"><span className="text-lg">{ind.icon}</span><span className="text-white">{ind.name}</span></h4>
                <p className="text-gray-300 text-xs leading-relaxed">{idio[ind.id]}</p>
              </Card>
            );
          })}
        </div>
      </Section>

      {/* ⑦ 流动性尾部 */}
      <Section title="⑦ 流动性尾部" icon={<Activity size={16} className="text-red-400" />}>
        <Card>
          <p className="text-sm text-gray-300 leading-relaxed">
            三行业流动性均偏弱且机制不同：<b className="text-white">医疗</b>为已转板有流动性、未转板无流动性的"负相关锁"；
            <b className="text-white">新能源</b>流动性双向锁死（有效 RR 仅 1.2–1.5:1）；
            <b className="text-white">AI</b>为大面积价格发现真空（94.2% 无流动）。
            结论：组合<b className="text-white">不具备在压力下减仓的能力</b>，"高现金缓冲 + 硬上限"是唯一可行的流动性风险管理手段。
          </p>
        </Card>
      </Section>

      {/* ⑧ 风险预算小结 */}
      <Section title="⑧ 风险预算小结" icon={<Gauge size={16} className="text-red-400" />}>
        <Card>
          <ul className="space-y-2">
            <li className="text-gray-300 text-sm flex gap-2"><span className="text-red-400">▸</span><span>总风险预算 = 已部署 <b className="text-white">{deployed}%</b>；现金缓冲 <b className="text-white">{cashPct}%</b> 为第一道防线。</span></li>
            <li className="text-gray-300 text-sm flex gap-2"><span className="text-red-400">▸</span><span>权益层 HHI <b className="text-red-400">0.54</b>（高度集中），分散依赖现金而非行业间配置。</span></li>
            <li className="text-gray-300 text-sm flex gap-2"><span className="text-red-400">▸</span><span>系统性约束：盯住 <b className="text-white">北证50 1007.64</b> 生命线，击穿即触发新能源降级 / AI 冻结新增。</span></li>
            <li className="text-gray-300 text-sm flex gap-2"><span className="text-red-400">▸</span><span>个例硬约束：AI 敞口<b className="text-white">硬上限 1.5%</b>；新能源扩容受容量≈6% 物理上限约束。</span></li>
            <li className="text-gray-300 text-sm flex gap-2"><span className="text-red-400">▸</span><span>极端悲观组合损失约 <b className="text-green-400">-1.9pp</b>，在可承受区间——维持当前低姿态配置。</span></li>
          </ul>
        </Card>
      </Section>

      {/* 关联入口 */}
      <div className="bg-gray-800 rounded-xl p-5 mb-6">
        <h3 className="text-white font-semibold mb-3 flex items-center gap-2"><ShieldAlert size={15} className="text-red-400" /> 关联研究</h3>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => navigate("/industry-aggregation")} className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm transition-colors">行业级聚合研究 →</button>
          <button onClick={() => navigate("/trading-loop")} className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm transition-colors">买卖结论闭环 →</button>
          <button onClick={() => navigate("/industry-research")} className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm transition-colors">单行业深度研究 →</button>
        </div>
      </div>

      <div className="border-t border-gray-700/40 pt-4">
        <p className="text-gray-500 text-xs leading-relaxed">{DATA.meta.disclaimer}</p>
      </div>
    </div>
  );
}
