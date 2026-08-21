import { useState, useMemo } from "react";
import {
  ArrowLeft,
  Layers,
  Info,
  TrendingUp,
  TrendingDown,
  Calculator,
  Activity,
  AlertTriangle,
  Search,
  Filter,
} from "lucide-react";
import allCompaniesJson from "../data/companies.json";
import finJson from "../data/financial-analysis-complete.json";
import { QUOTE_AS_OF, FUNDAMENTAL_AS_OF, VINTAGE_SUMMARY } from "../lib/dataProvenance";

// ============================================================
// 数据源（全部来自 financial-analysis-complete.json / companies.json）
// ⚠️ 估值计算统一采用 valuation 的单一财务快照口径（FUNDAMENTAL_AS_OF），
//    不使用行情层市值(QUOTE_AS_OF)参与相乘，避免 dataProvenance 指出的跨层失真。
// ============================================================
const COMPANIES = allCompaniesJson as any[];
const FIN = finJson as any[];

const FIN_MAP: Record<string, any> = {};
FIN.forEach((f) => {
  FIN_MAP[f.code] = f;
});

function industryOf(c: any): string {
  return c.industry || c.sector || "未分类";
}

const INDUSTRIES = Array.from(new Set(COMPANIES.map(industryOf))).filter(
  (i) => i && i !== "未分类"
);

// 行业倍数硬编码基准（与公允价值模型一致，作为实时分位样本不足时的 fallback）
const FALLBACK: Record<string, { pe: { low: number; mid: number; high: number }; pb: { low: number; mid: number; high: number } }> = {
  医疗健康: { pe: { low: 15, mid: 25, high: 40 }, pb: { low: 1.5, mid: 2.8, high: 5 } },
  新能源: { pe: { low: 12, mid: 20, high: 35 }, pb: { low: 1.2, mid: 2.2, high: 4 } },
  人工智能: { pe: { low: 20, mid: 35, high: 60 }, pb: { low: 2, mid: 4, high: 8 } },
};

// ============================================================
// 工具函数
// ============================================================
function pct(arr: number[], p: number): number | null {
  if (!arr.length) return null;
  const s = [...arr].sort((a, b) => a - b);
  const idx = Math.min(s.length - 1, Math.max(0, Math.round(p * (s.length - 1))));
  return s[idx];
}

// 行业可比 PE / PB 分位（实时从 valuation 同源计算）
function industryPercentiles(industry: string, key: "pe_ttm" | "pb") {
  const vals: number[] = [];
  COMPANIES.forEach((c) => {
    if (industryOf(c) !== industry) return;
    const f = FIN_MAP[c.code];
    const v = f?.valuation?.[key] ?? c[key];
    if (typeof v === "number" && isFinite(v) && v > 0) vals.push(v);
  });
  const fb = FALLBACK[industry];
  if (vals.length < 5 && fb) {
    const base = fb[key];
    return { p10: base.low, p50: base.mid, p90: base.high, n: vals.length, fallback: true };
  }
  return { p10: pct(vals, 0.1), p50: pct(vals, 0.5), p90: pct(vals, 0.9), n: vals.length, fallback: false };
}

function fmtMC(v: number | null): string {
  if (v == null) return "—";
  if (Math.abs(v) >= 1e8) return (v / 1e8).toFixed(2) + " 亿";
  if (Math.abs(v) >= 1e4) return (v / 1e4).toFixed(0) + " 万";
  return v.toFixed(0);
}

function fmtPct(v: number | null, digits = 1): string {
  if (v == null) return "—";
  const sign = v > 0 ? "+" : "";
  return sign + (v * 100).toFixed(digits) + "%";
}

function fmtX(v: number | null, digits = 1): string {
  if (v == null) return "—";
  return v.toFixed(digits) + "x";
}

// 中国习惯：上行空间（低估/有利）用红，下行风险（高估）用绿
function toneCls(v: number | null): string {
  if (v == null) return "text-gray-400";
  return v >= 0 ? "text-red-400" : "text-green-400";
}
function toneBg(v: number | null): string {
  if (v == null) return "bg-slate-500/5 border-slate-500/20";
  return v >= 0 ? "bg-red-500/5 border-red-500/20" : "bg-green-500/5 border-green-500/20";
}

// 简化两阶段 DCF（同源口径，单位与 valuation.market_cap 一致）
function dcf(base: number, g: number, r = 0.1, gTerm = 0.03, N = 5): number {
  let pv = 0;
  let fcf = base;
  for (let t = 1; t <= N; t++) {
    fcf *= 1 + g;
    pv += fcf / Math.pow(1 + r, t);
  }
  const term = (fcf * (1 + gTerm)) / (r - gTerm) / Math.pow(1 + r, N);
  return pv + term;
}

const SCENARIO_LABELS = ["悲观", "中性", "乐观"] as const;

// ============================================================
// 主页面
// ============================================================
export default function ValuationScenario() {
  const [industry, setIndustry] = useState<string>(INDUSTRIES[0] || "医疗健康");
  const [query, setQuery] = useState<string>("");

  // 当前行业下的候选公司
  const candidates = useMemo(() => {
    return COMPANIES.filter((c) => industryOf(c) === industry).filter((c) => {
      if (!query.trim()) return true;
      const f = FIN_MAP[c.code];
      const name = (c.short_name || f?.short_name || "").toLowerCase();
      const code = (c.code || "").toLowerCase();
      const q = query.trim().toLowerCase();
      return name.includes(q) || code.includes(q);
    });
  }, [industry, query]);

  // 默认选中：该行业第一家有完整 valuation 的公司
  const [selectedCode, setSelectedCode] = useState<string>(() => {
    const first = COMPANIES.find((c) => {
      if (industryOf(c) !== (INDUSTRIES[0] || "医疗健康")) return false;
      const f = FIN_MAP[c.code];
      return f?.valuation?.pe_ttm != null && f?.valuation?.market_cap != null;
    });
    return first?.code || COMPANIES[0]?.code || "";
  });

  // 切换行业时，若当前选中不在该行业，自动选第一候选
  const activeComp = COMPANIES.find((c) => c.code === selectedCode);
  const activeIndustry = activeComp ? industryOf(activeComp) : industry;
  const effectiveCode =
    activeComp && industryOf(activeComp) === industry ? selectedCode : candidates[0]?.code || "";

  const fin = FIN_MAP[effectiveCode];
  const comp = COMPANIES.find((c) => c.code === effectiveCode);

  const analysis = useMemo(() => {
    if (!fin || !comp) return null;
    const curPE = fin.valuation?.pe_ttm ?? null;
    const curPB = fin.valuation?.pb ?? null;
    const curMC = fin.valuation?.market_cap ?? null;
    const ind = industryOf(comp);

    const peStats = industryPercentiles(ind, "pe_ttm");
    const pbStats = industryPercentiles(ind, "pb");

    // 三情景倍数（悲观/中性/乐观）
    const peScen = [peStats.p10, peStats.p50, peStats.p90];
    const pbScen = [pbStats.p10, pbStats.p50, pbStats.p90];

    // 可比倍数法：相对当前市值的重估空间（倍数比，单位无关）
    const peUpside = peScen.map((m) => (curPE && m != null ? m / curPE - 1 : null));
    const pbUpside = pbScen.map((m) => (curPB && m != null ? m / curPB - 1 : null));

    // DCF：同源净利基数 = market_cap / pe_ttm（均来自 valuation 快照）
    const baseFCF = curMC != null && curPE ? curMC / curPE : null;
    const gRaw = fin.growth_metrics?.net_profit_growth ?? comp?.net_profit_growth ?? 0;
    const gNeutral = (typeof gRaw === "number" ? gRaw : 0) / 100;
    const gBear = Math.min(gNeutral * 0.4, 0.04);
    const gBull = Math.max(gNeutral, 0.15);
    const gScen = [gBear, gNeutral, gBull];
    const dcfVals = gScen.map((g) => (baseFCF != null ? dcf(baseFCF, g) : null));
    const dcfUpside = dcfVals.map((v) => (v != null && curMC ? v / curMC - 1 : null));

    // 敏感性矩阵：DCF 内在价值 / 当前市值 − 1，纵轴=增长，横轴=折现率
    const rates = [0.08, 0.1, 0.12];
    const sens = gScen.map((g) =>
      rates.map((r) => (baseFCF != null && curMC ? dcf(baseFCF, g, r) / curMC - 1 : null))
    );

    // 当前 PE 在行业分布中的位置
    let pePosition: string | null = null;
    if (curPE != null && peStats.p10 != null && peStats.p90 != null) {
      if (curPE < peStats.p10) pePosition = "低于行业 P10（相对便宜）";
      else if (curPE > peStats.p90) pePosition = "高于行业 P90（相对偏贵）";
      else if (peStats.p50 != null && curPE < peStats.p50) pePosition = "处于行业 P10–P50（中性偏低）";
      else pePosition = "处于行业 P50–P90（中性偏高）";
    }

    return {
      curPE,
      curPB,
      curMC,
      ind,
      peStats,
      pbStats,
      peScen,
      pbScen,
      peUpside,
      pbUpside,
      gScen,
      dcfUpside,
      sens,
      pePosition,
      roe: fin.valuation?.eps != null ? fin.growth_metrics?.roe ?? comp?.roe : comp?.roe,
      eps: fin.valuation?.eps ?? comp?.eps,
      totalScore: comp?.total_score,
    };
  }, [fin, comp]);

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
          <Layers size={18} className="text-violet-400" />
          <span className="font-bold text-white">估值情景分析</span>
        </div>
        <span className="text-gray-500 text-sm">多情景估值 · DCF 内在价值 · 敏感性矩阵（纯静态 / 单口径）</span>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* 说明横幅 */}
        <div className="bg-violet-500/5 border border-violet-500/20 rounded-xl p-4 mb-6 flex items-start gap-3">
          <Info size={16} className="text-violet-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-gray-300 leading-relaxed">
            <span className="text-violet-400 font-semibold">口径说明：</span>
            本模块所有估值计算统一采用 <b className="text-white">财务快照（{FUNDAMENTAL_AS_OF}）</b> 单一口径，PE/PB/市值/净利均取自同一份 valuation 数据，内部自洽。
            <span className="text-yellow-400"> 行情层市值（{QUOTE_AS_OF}）未参与相乘</span>，以避免跨层推导失真（详见网站数据时点说明）。
            行业可比区间为该行业全部公司的实时分位（P10/P50/P90）；样本不足时回退至行业基准倍数。
            <span className="text-violet-300"> 所有情景倍数与折现率均为模型内置假设，非实时，仅供框架参考。</span>
            <div className="text-gray-500 text-xs mt-1.5">{VINTAGE_SUMMARY}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 左侧：公司选择器 */}
          <div className="lg:col-span-1">
            <div className="bg-[#1a2535] border border-[#2a3a4f] rounded-xl p-4 sticky top-6">
              <div className="flex items-center gap-2 mb-3">
                <Filter size={14} className="text-violet-400" />
                <h2 className="text-white font-bold text-sm">选择公司</h2>
              </div>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full bg-[#0f1923] border border-[#2a3a4f] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500 mb-3"
              >
                {INDUSTRIES.map((ind) => (
                  <option key={ind} value={ind}>
                    {ind}
                  </option>
                ))}
              </select>
              <div className="relative mb-3">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="搜索代码 / 名称"
                  className="w-full bg-[#0f1923] border border-[#2a3a4f] rounded-lg pl-9 pr-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-violet-500"
                />
              </div>
              <div className="max-h-[420px] overflow-y-auto space-y-1 pr-1">
                {candidates.slice(0, 120).map((c) => {
                  const f = FIN_MAP[c.code];
                  const active = c.code === effectiveCode;
                  return (
                    <button
                      key={c.code}
                      onClick={() => setSelectedCode(c.code)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        active ? "bg-violet-500/20 text-white border border-violet-500/40" : "text-gray-300 hover:bg-[#0f1923] border border-transparent"
                      }`}
                    >
                      <div className="font-medium truncate">{c.short_name || f?.short_name || c.code}</div>
                      <div className="text-gray-500 text-xs">{c.code}</div>
                    </button>
                  );
                })}
                {candidates.length === 0 && (
                  <p className="text-gray-500 text-xs text-center py-4">无匹配公司</p>
                )}
              </div>
            </div>
          </div>

          {/* 右侧：分析区 */}
          <div className="lg:col-span-3 space-y-6">
            {!analysis || !comp ? (
              <div className="flex flex-col items-center justify-center h-96 text-gray-500">
                <Calculator size={48} className="mb-4 opacity-20" />
                <p>请选择一家有完整估值数据的公司</p>
              </div>
            ) : (
              <>
                {/* 当前快照 */}
                <div className="bg-[#1a2535] border border-[#2a3a4f] rounded-xl p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-white font-bold text-lg">
                        {comp.short_name || fin?.short_name || comp.code}
                      </h3>
                      <p className="text-gray-400 text-xs mt-0.5">
                        {comp.code} · {analysis.ind}
                      </p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-violet-400/10 text-violet-300 font-medium">
                      财务快照 {FUNDAMENTAL_AS_OF}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Metric label="市值（快照）" value={fmtMC(analysis.curMC)} />
                    <Metric label="PE(TTM)" value={fmtX(analysis.curPE)} />
                    <Metric label="PB" value={fmtX(analysis.curPB)} />
                    <Metric label="EPS" value={analysis.eps != null ? analysis.eps.toFixed(2) : "—"} />
                    <Metric label="ROE" value={analysis.roe != null ? analysis.roe.toFixed(1) + "%" : "—"} />
                    <Metric label="综合评分" value={analysis.totalScore != null ? analysis.totalScore.toFixed(1) : "—"} />
                    <Metric label="当前PE位置" value={analysis.pePosition ? analysis.pePosition.split("（")[0] : "—"} small />
                    <Metric
                      label="行业PE区间"
                      value={`${fmtX(analysis.peStats.p10)}–${fmtX(analysis.peStats.p90)}`}
                      small
                    />
                  </div>
                  {analysis.pePosition && (
                    <div className="mt-3 p-2.5 bg-blue-500/5 border border-blue-500/20 rounded-lg">
                      <p className="text-blue-300 text-xs flex items-center gap-1.5">
                        <Activity size={12} /> 估值位置：{analysis.pePosition}
                        {analysis.peStats.fallback && "（行业分位样本不足，已用基准倍数）"}
                      </p>
                    </div>
                  )}
                </div>

                {/* 三情景估值法 */}
                <ScenarioBlock
                  title="可比 PE 法 · 三情景"
                  icon={<TrendingUp size={14} className="text-violet-400" />}
                  current={analysis.curPE}
                  scens={analysis.peScen}
                  upsides={analysis.peUpside}
                  unit="x"
                />
                <ScenarioBlock
                  title="可比 PB 法 · 三情景"
                  icon={<TrendingUp size={14} className="text-cyan-400" />}
                  current={analysis.curPB}
                  scens={analysis.pbScen}
                  upsides={analysis.pbUpside}
                  unit="x"
                />
                <ScenarioBlock
                  title="DCF 内在价值 · 三情景（增长假设）"
                  icon={<Calculator size={14} className="text-amber-400" />}
                  current={null}
                  scens={analysis.gScen.map((g) => g * 100)}
                  upsides={analysis.dcfUpside}
                  unit="%"
                  growthMode
                />

                {/* 敏感性矩阵 */}
                <div className="bg-[#1a2535] border border-[#2a3a4f] rounded-xl p-5">
                  <h3 className="text-white font-bold text-sm mb-1 flex items-center gap-2">
                    <Activity size={14} className="text-violet-400" />
                    DCF 敏感性矩阵（内在价值 / 当前市值 − 1）
                  </h3>
                  <p className="text-gray-500 text-xs mb-4">
                    纵轴 = 净利润增速假设（悲观 / 中性 / 乐观）· 横轴 = 折现率（8% / 10% / 12%）
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-gray-500 border-b border-[#2a3a4f]">
                          <th className="text-left py-2 pr-3 text-xs">增速 \ 折现率</th>
                          <th className="text-right py-2 px-2 text-xs">8%</th>
                          <th className="text-right py-2 px-2 text-xs">10%</th>
                          <th className="text-right py-2 px-2 text-xs">12%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analysis.sens.map((row, i) => (
                          <tr key={i} className="border-b border-[#2a3a4f]/50">
                            <td className="py-2 pr-3 text-gray-300 text-xs">
                              {SCENARIO_LABELS[i]}（{(analysis.gScen[i] * 100).toFixed(0)}%）
                            </td>
                            {row.map((v, j) => (
                              <td key={j} className={`text-right py-2 px-2 font-medium ${toneCls(v)}`}>
                                {fmtPct(v)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 结论 */}
                <div className="bg-gradient-to-br from-violet-500/10 to-blue-500/10 border border-violet-500/30 rounded-xl p-5">
                  <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
                    <AlertTriangle size={14} className="text-violet-400" />
                    情景结论与框架提示
                  </h3>
                  <ul className="space-y-2 text-xs text-gray-300 leading-relaxed">
                    <li>
                      · <b className="text-white">可比 PE 法</b>：若市场给予行业中位 / 上限倍数，相对当前快照估值有
                      <span className={toneCls(analysis.peUpside[1])}> {fmtPct(analysis.peUpside[1])} </span>/
                      <span className={toneCls(analysis.peUpside[2])}> {fmtPct(analysis.peUpside[2])} </span>
                      的重估空间；若回落至 P10，则
                      <span className={toneCls(analysis.peUpside[0])}> {fmtPct(analysis.peUpside[0])} </span>。
                    </li>
                    <li>
                      · <b className="text-white">DCF 法</b>：以中性增长假设、10% 折现率计，内在价值相对当前市值
                      <span className={toneCls(analysis.dcfUpside[1])}> {fmtPct(analysis.dcfUpside[1])} </span>
                      ；敏感性见上表（折现率上行将显著压缩估值）。
                    </li>
                    <li className="text-gray-500 pt-2 border-t border-[#2a3a4f]">
                      · 本模块为<b className="text-gray-400">一次性静态框架</b>：情景倍数 / 增速 / 折现率均为模型内置假设，未接入实时行情或持续维护数据。实际投资需结合最新财报、流动性与个股风险综合判断。
                    </li>
                  </ul>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 子组件
// ============================================================
function Metric({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div className="bg-[#0f1923] rounded-lg p-3">
      <p className="text-gray-500 text-xs mb-1">{label}</p>
      <p className={`text-white font-bold ${small ? "text-sm" : "text-lg"} truncate`}>{value}</p>
    </div>
  );
}

function ScenarioBlock({
  title,
  icon,
  current,
  scens,
  upsides,
  unit,
  growthMode,
}: {
  title: string;
  icon: React.ReactNode;
  current: number | null;
  scens: (number | null)[];
  upsides: (number | null)[];
  unit: string;
  growthMode?: boolean;
}) {
  return (
    <div className="bg-[#1a2535] border border-[#2a3a4f] rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-bold text-sm flex items-center gap-2">{icon} {title}</h3>
        {current != null && (
          <span className="text-xs text-gray-400">当前 {current.toFixed(unit === "x" ? 1 : 0)}{unit}</span>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {SCENARIO_LABELS.map((lab, i) => {
          const v = scens[i];
          const up = upsides[i];
          return (
            <div key={lab} className={`rounded-xl p-4 border ${toneBg(up)}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-300 text-sm font-medium">{lab}</span>
                {growthMode ? (
                  <span className="text-white font-bold text-lg">{(v ?? 0).toFixed(0)}%</span>
                ) : (
                  <span className="text-white font-bold text-lg">{fmtX(v)}</span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                {up != null && up >= 0 ? (
                  <TrendingUp size={14} className="text-red-400" />
                ) : (
                  <TrendingDown size={14} className="text-green-400" />
                )}
                <span className={`text-sm font-semibold ${toneCls(up)}`}>相对当前 {fmtPct(up)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
