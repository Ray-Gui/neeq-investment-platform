import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, ExternalLink, TrendingUp, TrendingDown } from "lucide-react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
} from "recharts";
import researchData from "../data/industry_research_data.json";

const DATA: any = researchData;
const INDUSTRIES: any[] = DATA.industries;

const RATING_STYLE: Record<string, { badge: string; block: string; label: string }> = {
  BUY:  { badge: "bg-green-500/20 text-green-400 border border-green-500/30", block: "from-green-600 to-emerald-500", label: "买入" },
  HOLD: { badge: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30", block: "from-yellow-500 to-amber-500", label: "持有" },
  SELL: { badge: "bg-red-500/20 text-red-400 border border-red-500/30", block: "from-red-600 to-rose-500", label: "卖出" },
};

function fmtNum(v: number | null | undefined, unit = ""): string {
  if (v === null || v === undefined) return "—";
  return `${v}${unit}`;
}

function PriceBadge({ type }: { type: string | null }) {
  if (type === "real") return <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-400">真实价</span>;
  if (type === "model") return <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400">模型价</span>;
  return <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-600/30 text-gray-400">N/A</span>;
}

function WeightBar({ weight, color }: { weight: number; color: string }) {
  return (
    <div className="flex-1 bg-gray-700 rounded-full h-1.5 min-w-[40px]">
      <div className={`${color} h-1.5 rounded-full`} style={{ width: `${Math.min(100, weight * 10)}%` }} />
    </div>
  );
}

export default function IndustryResearch() {
  const [selectedId, setSelectedId] = useState(INDUSTRIES[0].id);
  const ind = INDUSTRIES.find((i: any) => i.id === selectedId) || INDUSTRIES[0];
  const rating = RATING_STYLE[ind.rating] || RATING_STYLE.HOLD;
  const [, navigate] = useLocation();

  const radarData = Object.entries(ind.radar).map(([dim, score]) => ({ dim, score }));

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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">📚 行业研究</h1>
        <p className="text-gray-400 text-sm">医疗健康 · 新能源 · 人工智能 三行业券商级结论与核心数据（数据截至 {DATA.meta.dataAsOf}）</p>
      </div>

      {/* 行业选择 */}
      <div className="flex flex-wrap gap-3 mb-6">
        {INDUSTRIES.map((i: any) => {
          const rs = RATING_STYLE[i.rating] || RATING_STYLE.HOLD;
          return (
            <button
              key={i.id}
              onClick={() => setSelectedId(i.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                selectedId === i.id ? "bg-gray-700 text-white ring-1 ring-gray-500" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              <span className="text-lg">{i.icon}</span>
              <span>{i.name}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${rs.badge}`}>{i.rating}</span>
              <span className="text-xs opacity-70">({i.sampleSize}家)</span>
            </button>
          );
        })}
      </div>

      {/* 决策卡 */}
      <div className={`rounded-xl bg-gradient-to-r ${rating.block} p-5 mb-6 flex flex-col md:flex-row md:items-center gap-4`}>
        <div className="text-center md:text-left">
          <div className="text-3xl font-extrabold text-white leading-none">{ind.rating}</div>
          <div className="text-xs text-white/80 mt-1">{rating.label} · {ind.name}</div>
        </div>
        <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-black/20 rounded-lg px-3 py-2">
            <div className="text-[11px] text-white/70">建议敞口</div>
            <div className="text-white font-semibold">{ind.recommendedExposure}</div>
          </div>
          <div className="bg-black/20 rounded-lg px-3 py-2">
            <div className="text-[11px] text-white/70">置信度</div>
            <div className="text-white font-semibold">{ind.confidence}</div>
          </div>
          <div className="bg-black/20 rounded-lg px-3 py-2">
            <div className="text-[11px] text-white/70">风险等级</div>
            <div className="text-white font-semibold">{ind.riskLevel}</div>
          </div>
          <div className="bg-black/20 rounded-lg px-3 py-2">
            <div className="text-[11px] text-white/70">样本企业</div>
            <div className="text-white font-semibold">{ind.sampleSize} 家</div>
          </div>
        </div>
      </div>

      {/* 核心论点 */}
      <div className="bg-gray-800 rounded-xl p-5 mb-6">
        <h3 className="text-white font-semibold mb-2">核心论点</h3>
        <p className="text-cyan-300 text-sm mb-3">{ind.thesis}</p>
        <ul className="space-y-1.5">
          {ind.execSummary.map((s: string, k: number) => (
            <li key={k} className="text-gray-300 text-sm flex gap-2">
              <span className="text-gray-500">•</span><span>{s}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 关键指标 + 雷达 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 bg-gray-800 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-3">关键指标</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {ind.keyMetrics.map((m: any, k: number) => (
              <div key={k} className="bg-gray-700/40 rounded-lg px-3 py-2">
                <div className="text-[11px] text-gray-400">{m.label}</div>
                <div className="text-white font-semibold text-sm">{m.value}</div>
              </div>
            ))}
          </div>
          <h3 className="text-white font-semibold mt-5 mb-2">细分赛道</h3>
          <div className="space-y-2">
            {ind.subSectors.map((s: any, k: number) => (
              <div key={k} className="bg-gray-700/40 rounded-lg px-3 py-2">
                <div className="flex justify-between text-sm">
                  <span className="text-white font-medium">{s.name}</span>
                  <span className="text-gray-400 text-xs">{s.count != null ? `${s.count} 家` : "样本量 N/A"}</span>
                </div>
                <div className="text-gray-400 text-xs mt-0.5">{s.feature}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-gray-800 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-1">五维综合评分</h3>
          <p className="text-gray-500 text-xs mb-2">满分 10 · 风险面越低越危险</p>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={radarData} outerRadius="72%">
              <PolarGrid stroke="#374151" />
              <PolarAngleAxis dataKey="dim" tick={{ fill: "#9ca3af", fontSize: 11 }} />
              <PolarRadiusAxis domain={[0, 10]} tick={{ fill: "#6b7280", fontSize: 9 }} axisLine={false} />
              <Radar dataKey="score" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.35} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 代表公司 */}
      <div className="bg-gray-800 rounded-xl p-5 mb-6">
        <h3 className="text-white font-semibold mb-3">代表公司深研</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700 text-gray-400">
                <th className="text-left font-medium px-2 py-2">公司</th>
                <th className="text-left font-medium px-2 py-2">代码</th>
                <th className="text-right font-medium px-2 py-2">营收(亿)</th>
                <th className="text-right font-medium px-2 py-2">净利(亿)</th>
                <th className="text-right font-medium px-2 py-2">ROE(%)</th>
                <th className="text-left font-medium px-2 py-2">估值</th>
                <th className="text-center font-medium px-2 py-2">价格</th>
                <th className="text-left font-medium px-2 py-2">备注</th>
              </tr>
            </thead>
            <tbody>
              {ind.companies.map((c: any, k: number) => (
                <tr key={k} className="border-b border-gray-700/50">
                  <td className="px-2 py-2 text-white font-medium whitespace-nowrap">{c.name}</td>
                  <td className="px-2 py-2 text-gray-400 text-xs whitespace-nowrap">{c.code || "—"}</td>
                  <td className="px-2 py-2 text-right text-gray-300">{fmtNum(c.revenue)}</td>
                  <td className="px-2 py-2 text-right text-gray-300">{fmtNum(c.profit)}</td>
                  <td className="px-2 py-2 text-right text-gray-300">{fmtNum(c.roe)}</td>
                  <td className="px-2 py-2 text-gray-300 text-xs whitespace-nowrap">{c.valuation || "—"}</td>
                  <td className="px-2 py-2 text-center"><PriceBadge type={c.priceType} /></td>
                  <td className="px-2 py-2 text-gray-400 text-xs max-w-[220px]">{c.note || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-gray-500 text-xs mt-2">营收/净利单位：亿元；ROE 单位：%。缺失字段以 — 表示。模型价 = 由净利润×21.978 推算，非真实成交价。</p>
      </div>

      {/* 多空辩论 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-800 rounded-xl p-5">
          <h3 className="text-green-400 font-semibold mb-3 flex items-center gap-2"><TrendingUp size={16} />多头论点（权重 1-10）</h3>
          <div className="space-y-3">
            {ind.bullPoints.map((p: any, k: number) => (
              <div key={k}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-gray-300 text-sm flex-1">{p.text}</span>
                  <span className="text-green-400 text-xs font-semibold w-6 text-right">{p.weight}</span>
                </div>
                <WeightBar weight={p.weight} color="bg-green-500" />
              </div>
            ))}
          </div>
        </div>
        <div className="bg-gray-800 rounded-xl p-5">
          <h3 className="text-red-400 font-semibold mb-3 flex items-center gap-2"><TrendingDown size={16} />空头论点（权重 1-10）</h3>
          <div className="space-y-3">
            {ind.bearPoints.map((p: any, k: number) => (
              <div key={k}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-gray-300 text-sm flex-1">{p.text}</span>
                  <span className="text-red-400 text-xs font-semibold w-6 text-right">{p.weight}</span>
                </div>
                <WeightBar weight={p.weight} color="bg-red-500" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 情景分析 */}
      <div className="mb-6">
        <h3 className="text-white font-semibold mb-3">情景分析</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {["optimistic", "neutral", "pessimistic"].map((key: string) => {
            const sc = ind.scenarios[key];
            const tone = key === "optimistic" ? "border-green-500/40" : key === "neutral" ? "border-gray-600/50" : "border-red-500/40";
            return (
              <div key={key} className={`bg-gray-800 rounded-xl p-4 border ${tone}`}>
                <div className="text-sm font-semibold text-white mb-1">{sc.label}</div>
                <div className="text-cyan-300 text-sm font-medium mb-1">{sc.range}</div>
                <div className="text-gray-400 text-xs">{sc.desc}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 风险与催化 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-800 rounded-xl p-5">
          <h3 className="text-red-400 font-semibold mb-3">关键风险</h3>
          <ul className="space-y-1.5">
            {ind.risks.map((r: string, k: number) => (
              <li key={k} className="text-gray-300 text-sm flex gap-2"><span className="text-red-400">⚠</span><span>{r}</span></li>
            ))}
          </ul>
        </div>
        <div className="bg-gray-800 rounded-xl p-5">
          <h3 className="text-amber-400 font-semibold mb-3">关键催化 / 翻多信号</h3>
          <ul className="space-y-1.5">
            {ind.catalysts.map((c: string, k: number) => (
              <li key={k} className="text-gray-300 text-sm flex gap-2"><span className="text-amber-400">★</span><span>{c}</span></li>
            ))}
          </ul>
        </div>
      </div>

      {/* 报告链接 */}
      <div className="bg-gray-800 rounded-xl p-5 mb-6">
        <h3 className="text-white font-semibold mb-3">完整研究报告</h3>
        <div className="flex flex-wrap gap-3">
          <a href={`/${ind.report.standardHtml}`} target="_blank" rel="noopener noreferrer"
             className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm transition-colors">
            <ExternalLink size={14} /> 标准版报告（交互HTML）
          </a>
          <a href={`/${ind.report.brokerageHtml}`} target="_blank" rel="noopener noreferrer"
             className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm transition-colors">
            <ExternalLink size={14} /> 券商加厚版报告（交互HTML）
          </a>
        </div>
        <p className="text-gray-500 text-xs mt-2">加厚版含细分赛道深研、代表公司拆解、可比矩阵、三情景敏感性与估值三法；PDF 版见本地交付压缩包。</p>
      </div>

      {/* 免责声明 */}
      <div className="border-t border-gray-700/40 pt-4">
        <p className="text-gray-500 text-xs leading-relaxed">{DATA.meta.disclaimer}</p>
      </div>
    </div>
  );
}
