import { useState } from "react";
import {
  ArrowLeft,
  Scale,
  Gavel,
  Briefcase,
  ShieldAlert,
  ThumbsUp,
  ThumbsDown,
  Info,
} from "lucide-react";
import researchData from "../data/industry_research_data.json";

const INDUSTRIES: any[] = (researchData as any).industries;
const META = (researchData as any).meta;

// 中国习惯：买入/看好=红，卖出/看空=绿
function ratingStyle(rating: string) {
  if (rating === "BUY") return { cls: "text-red-400 bg-red-500/10 border-red-500/30", tag: "买入 BUY" };
  if (rating === "SELL") return { cls: "text-green-400 bg-green-500/10 border-green-500/30", tag: "卖出 SELL" };
  return { cls: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30", tag: "持有 HOLD" };
}

function DebateList({ points, side }: { points: any[]; side: "bull" | "bear" }) {
  const isBull = side === "bull";
  return (
    <div className={`rounded-xl p-4 border ${isBull ? "bg-red-500/5 border-red-500/20" : "bg-green-500/5 border-green-500/20"}`}>
      <div className={`flex items-center gap-2 mb-3 ${isBull ? "text-red-400" : "text-green-400"}`}>
        {isBull ? <ThumbsUp size={15} /> : <ThumbsDown size={15} />}
        <span className="font-semibold text-sm">{isBull ? "看多论据" : "看空论据"}</span>
        <span className="text-xs text-gray-500">（权重 1–9）</span>
      </div>
      <div className="space-y-3">
        {points.map((p, i) => (
          <div key={i}>
            <div className="flex items-start justify-between gap-2">
              <span className="text-gray-200 text-sm leading-snug">{p.text}</span>
              <span className={`text-xs font-bold ${isBull ? "text-red-400" : "text-green-400"} flex-shrink-0`}>{p.weight}</span>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-[#0f1923] overflow-hidden">
              <div className={`h-full ${isBull ? "bg-red-400" : "bg-green-400"}`} style={{ width: `${(p.weight / 9) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="text-white font-bold text-base mb-3 flex items-center gap-2">{icon}{title}</h3>
      {children}
    </div>
  );
}

function StepDot({ n, active, label }: { n: number; active: boolean; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${active ? "bg-rose-500 text-white" : "bg-[#1a2535] text-gray-500"}`}>{n}</span>
      <span className={active ? "text-gray-300" : "text-gray-600"}>{label}</span>
    </div>
  );
}

function Bar() {
  return <div className="flex-1 h-px bg-[#2a3a4f]" />;
}

function PlanCard({ label, value, tone, sub }: { label: string; value: string; tone: "blue" | "yellow" | "red"; sub: string }) {
  const toneCls = tone === "red" ? "text-red-400" : tone === "yellow" ? "text-yellow-400" : "text-blue-400";
  return (
    <div className="bg-[#1a2535] border border-[#2a3a4f] rounded-xl p-4">
      <p className="text-gray-500 text-xs mb-1">{label}</p>
      <p className={`text-xl font-bold ${toneCls}`}>{value}</p>
      <p className="text-gray-500 text-xs mt-1 leading-snug">{sub}</p>
    </div>
  );
}

export default function TradingDecisionLoop() {
  const [idx, setIdx] = useState(0);
  const ind = INDUSTRIES[idx];
  const rs = ratingStyle(ind.rating);
  const maxW = Math.max(
    ...ind.bullPoints.map((p: any) => p.weight),
    ...ind.bearPoints.map((p: any) => p.weight),
    1
  );

  return (
    <div className="min-h-screen bg-[#0f1923] text-white">
      {/* 顶部导航 */}
      <div className="border-b border-[#1a2535] px-6 py-4 flex items-center gap-4">
        <button
          onClick={() => (window.location.href = "/")}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
        >
          <ArrowLeft size={16} /> 返回
        </button>
        <div className="flex items-center gap-2">
          <Scale size={18} className="text-rose-400" />
          <span className="font-bold text-white">买卖结论闭环</span>
        </div>
        <span className="text-gray-500 text-sm">多空辩论 → 研究主管裁决 → 交易方案 → 风险预算</span>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* 说明横幅 */}
        <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-4 mb-6 flex items-start gap-3">
          <Info size={16} className="text-rose-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-gray-300 leading-relaxed">
            <span className="text-rose-400 font-semibold">口径说明：</span>
            本闭环基于交易分析团队行业研究报告（标准版 + 券商加厚版）抽取的真实结构化结论，未做任何编造。
            四步流程为<span className="text-white">决策框架</span>；其中"交易方案 / 风险预算"的仓位与压力边界，由报告既有字段（建议敞口、三情景组合贡献、风险清单）直接组织呈现，非新增测算。
            <div className="text-gray-500 text-xs mt-1.5">
              数据生成 {META.generatedAt} · 研究基准 {META.dataAsOf} · 财年 {META.fiscalYear} · {META.source}
            </div>
          </div>
        </div>

        {/* 行业切换 */}
        <div className="flex gap-2 mb-6">
          {INDUSTRIES.map((it, i) => (
            <button
              key={it.id}
              onClick={() => setIdx(i)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                i === idx ? "bg-rose-500 text-white" : "bg-[#1a2535] text-gray-400 hover:text-white border border-[#2a3a4f]"
              }`}
            >
              {it.icon} {it.name}
            </button>
          ))}
        </div>

        {/* 步骤条 */}
        <div className="flex items-center gap-2 mb-6 text-xs text-gray-500 flex-wrap">
          <StepDot n={1} active label="多空辩论" />
          <Bar />
          <StepDot n={2} active label="研究主管裁决" />
          <Bar />
          <StepDot n={3} active label="交易方案" />
          <Bar />
          <StepDot n={4} active label="风险预算" />
        </div>

        {/* STEP 1 多空辩论 */}
        <Section title="① 多空辩论" icon={<Scale size={15} className="text-rose-400" />}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DebateList points={ind.bullPoints} side="bull" />
            <DebateList points={ind.bearPoints} side="bear" />
          </div>
          <p className="text-xs text-gray-500 mt-3">多空最高权重均为 {maxW}；净方向由研究主管在下一步裁决。</p>
        </Section>

        {/* STEP 2 研究主管裁决 */}
        <Section title="② 研究主管裁决" icon={<Gavel size={15} className="text-amber-400" />}>
          <div className="bg-[#1a2535] border border-[#2a3a4f] rounded-xl p-5">
            <div className="flex items-center gap-4 mb-4">
              <span className={`text-lg font-bold px-4 py-2 rounded-xl border ${rs.cls}`}>{rs.tag}</span>
              <div>
                <p className="text-gray-300 text-sm">
                  置信度 <b className="text-white">{ind.confidence}</b> · 风险等级 <b className="text-white">{ind.riskLevel}</b>
                </p>
                <p className="text-gray-400 text-xs mt-0.5">样本 {ind.sampleSize} 家 · 建议敞口 {ind.recommendedExposure}</p>
              </div>
            </div>
            <p className="text-gray-200 text-sm leading-relaxed mb-4">{ind.thesis}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {ind.execSummary.map((s: string, i: number) => (
                <div key={i} className="bg-[#0f1923] rounded-lg p-3 text-xs text-gray-300 leading-relaxed">{s}</div>
              ))}
            </div>
          </div>
        </Section>

        {/* STEP 3 交易方案 */}
        <Section title="③ 交易方案" icon={<Briefcase size={15} className="text-blue-400" />}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <PlanCard label="建议仓位上限" value={ind.recommendedExposure} tone="blue" sub="组合层级敞口" />
            <PlanCard label="中性基准贡献" value={ind.scenarios.neutral.range} tone="yellow" sub={ind.scenarios.neutral.desc} />
            <PlanCard label="乐观目标贡献" value={ind.scenarios.optimistic.range} tone="red" sub={ind.scenarios.optimistic.desc} />
          </div>
          <div className="mt-4 bg-[#1a2535] border border-[#2a3a4f] rounded-xl p-4">
            <p className="text-xs text-gray-400 leading-relaxed">
              交易方案边界由报告三情景组合贡献直接给出：以 <b className="text-white">{ind.recommendedExposure}</b> 为仓位上限，
              中性情形组合贡献 <b className={ind.scenarios.neutral.range.includes("-") ? "text-green-400" : "text-red-400"}>{ind.scenarios.neutral.range}</b>，
              悲观压力测试 <b className="text-green-400">{ind.scenarios.pessimistic.range}</b>（{ind.scenarios.pessimistic.desc}），
              乐观兑现 <b className="text-red-400">{ind.scenarios.optimistic.range}</b>。
              触发止损的条件：悲观情景落地或北证50击穿清仓线（详见风险预算）。
            </p>
          </div>
        </Section>

        {/* STEP 4 风险预算 */}
        <Section title="④ 风险预算" icon={<ShieldAlert size={15} className="text-red-400" />}>
          <div className="bg-[#1a2535] border border-[#2a3a4f] rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-300 text-sm font-medium">敞口上限（风险预算）</span>
              <span className="text-red-400 font-bold">{ind.recommendedExposure}</span>
            </div>
            <ul className="space-y-2">
              {ind.risks.map((r: string, i: number) => (
                <li key={i} className="flex gap-2 text-sm text-gray-300">
                  <span className="text-red-400 mt-0.5">▸</span>
                  <span className="leading-relaxed">{r}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
              <p className="text-xs text-gray-400">
                压力测试（悲观情景）：<span className="text-green-400 font-semibold">{ind.scenarios.pessimistic.range}</span> · {ind.scenarios.pessimistic.desc}
              </p>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}
