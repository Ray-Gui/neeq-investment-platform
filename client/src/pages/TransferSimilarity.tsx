import { useState, useMemo } from "react";
import { ArrowLeft, Target, TrendingUp, Clock, Star, ChevronDown, ChevronUp } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, ScatterChart, Scatter, ZAxis,
} from "recharts";
import similarityData from "../data/transfer-similarity-data.json";

const PATH_COLORS: Record<string, string> = {
  "盈利型": "#10b981",
  "成长型": "#6366f1",
  "市值型": "#f59e0b",
};

const PATH_DESC: Record<string, string> = {
  "盈利型": "连续2年净利润≥1500万，ROE≥8%",
  "成长型": "营收CAGR≥20%，市值≥2亿",
  "市值型": "市值≥4亿，股东人数≥200人",
};

export default function TransferSimilarity() {
  const [activeTab, setActiveTab] = useState<"candidates" | "timing" | "paths">("candidates");
  const [selectedSector, setSelectedSector] = useState<string>("全部");
  const [expandedCode, setExpandedCode] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { path_benchmarks, timing_analysis, candidates } = similarityData as any;

  const filteredCandidates = useMemo(() => {
    let data = candidates;
    if (selectedSector !== "全部") data = data.filter((c: any) => c.sector === selectedSector);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      data = data.filter((c: any) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q));
    }
    return data;
  }, [selectedSector, searchQuery, candidates]);

  const pathList = Object.entries(path_benchmarks as Record<string, any>);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => window.history.length > 1 ? window.history.back() : window.location.href = '/'}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">返回</span>
          </button>
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-400" />
            <h1 className="text-lg font-bold">转板套利深化分析</h1>
          </div>
          <span className="text-sm text-gray-400">基于 {(candidates as any[]).length} 家候选企业 · {Object.values(path_benchmarks as any).reduce((s: number, v: any) => s + v.count, 0)} 个历史案例</span>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* 路径基准卡片 */}
        <div className="grid grid-cols-3 gap-4">
          {pathList.map(([path, stats]: [string, any]) => (
            <div key={path} className="bg-gray-900 rounded-xl p-4 border border-gray-800">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold" style={{ color: PATH_COLORS[path] }}>{path}路径</span>
                <span className="text-xs text-gray-500">{stats.count} 个历史案例</span>
              </div>
              <div className="text-xs text-gray-400 mb-3">{PATH_DESC[path]}</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { label: "平均挂牌年限", value: `${stats.avg_neeq_years}年` },
                  { label: "平均估值提升", value: `${stats.avg_valuation_multiple}x`, color: "text-emerald-400" },
                  { label: "平均首日涨幅", value: `${stats.avg_first_day_gain}%`, color: "text-amber-400" },
                  { label: "平均毛利率", value: `${stats.avg_gross_margin}%` },
                ].map((item) => (
                  <div key={item.label} className="bg-gray-800 rounded-lg p-2">
                    <div className={`font-medium ${item.color || "text-white"}`}>{item.value}</div>
                    <div className="text-gray-500 mt-0.5">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 标签页 */}
        <div className="flex gap-2">
          {[
            { key: "candidates", label: "相似度匹配候选" },
            { key: "timing", label: "最优转板时机" },
            { key: "paths", label: "路径财务对比" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.key ? "bg-emerald-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 相似度匹配候选 */}
        {activeTab === "candidates" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="搜索企业名称或代码..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 w-64"
              />
              <div className="flex gap-2">
                {["全部", "医疗健康", "新能源", "人工智能"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSector(s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      selectedSector === s ? "bg-emerald-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <span className="text-xs text-gray-500 ml-auto">共 {filteredCandidates.length} 家</span>
            </div>

            <div className="space-y-2">
              {filteredCandidates.map((c: any) => (
                <div key={c.code} className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                  <button
                    className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-800/50 transition-colors"
                    onClick={() => setExpandedCode(expandedCode === c.code ? null : c.code)}
                  >
                    <div className="flex items-center gap-4">
                      <div>
                        <span className="font-semibold text-white">{c.name}</span>
                        <span className="text-xs text-gray-500 ml-2">{c.code}</span>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-400">{c.sector}</span>
                      <div className="flex items-center gap-1 text-xs">
                        <span className="text-gray-400">推荐路径：</span>
                        <span className="font-medium" style={{ color: PATH_COLORS[c.recommended_path] }}>
                          {c.recommended_path}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm text-emerald-400 font-bold">{c.estimated_valuation_multiple}x</div>
                        <div className="text-xs text-gray-500">预估估值提升</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-amber-400 font-medium">{c.total_score}</div>
                        <div className="text-xs text-gray-500">综合评分</div>
                      </div>
                      {expandedCode === c.code ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </div>
                  </button>

                  {expandedCode === c.code && (
                    <div className="px-5 pb-5 border-t border-gray-800">
                      <div className="grid grid-cols-2 gap-6 mt-4">
                        {/* 当前财务 */}
                        <div>
                          <h4 className="text-xs text-gray-400 mb-3 font-medium">当前财务指标</h4>
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            {[
                              { label: "毛利率", value: `${c.gross_margin}%`, color: "text-emerald-400" },
                              { label: "ROE", value: `${c.roe}%`, color: "text-indigo-400" },
                              { label: "营收增速", value: `${c.revenue_growth}%`, color: "text-amber-400" },
                            ].map((item) => (
                              <div key={item.label} className="bg-gray-800 rounded-lg p-2 text-center">
                                <div className={`font-medium ${item.color}`}>{item.value}</div>
                                <div className="text-gray-500 mt-0.5">{item.label}</div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* 最相似历史案例 */}
                        <div>
                          <h4 className="text-xs text-gray-400 mb-3 font-medium">最相似历史转板案例</h4>
                          <div className="space-y-2">
                            {c.best_matches.map((m: any, i: number) => (
                              <div key={i} className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PATH_COLORS[m.transfer_path] }} />
                                  <span className="text-xs text-gray-300">{m.case_name}</span>
                                  <span className="text-xs text-gray-500">{m.case_code}</span>
                                </div>
                                <div className="flex items-center gap-3 text-xs">
                                  <span className="text-cyan-400">相似度 {m.similarity}%</span>
                                  <span className="text-emerald-400">{m.valuation_multiple}x</span>
                                  <span style={{ color: PATH_COLORS[m.transfer_path] }}>{m.transfer_path}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 最优转板时机 */}
        {activeTab === "timing" && (
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
              <h3 className="text-sm font-semibold text-gray-300 mb-4">挂牌年限 vs 估值提升倍数</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={timing_analysis}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="label" tick={{ fill: "#9ca3af", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} unit="x" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px" }}
                    formatter={(v: any) => [`${v}x`, "平均估值提升"]}
                  />
                  <Bar dataKey="avg_valuation_multiple" name="估值提升" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
              <h3 className="text-sm font-semibold text-gray-300 mb-4">挂牌年限 vs 首日涨幅</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={timing_analysis}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="label" tick={{ fill: "#9ca3af", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} unit="%" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px" }}
                    formatter={(v: any) => [`${v}%`, "首日涨幅"]}
                  />
                  <Bar dataKey="avg_first_day_gain" name="首日涨幅" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="col-span-2 bg-gray-900 rounded-xl p-5 border border-gray-800">
              <h3 className="text-sm font-semibold text-gray-300 mb-4">最优转板时机分析表</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800">
                      {["挂牌年限", "案例数", "平均估值提升", "平均首日涨幅", "综合评价"].map((h) => (
                        <th key={h} className="text-left py-2 px-4 text-gray-400 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {timing_analysis.map((t: any, i: number) => {
                      const isOptimal = t.avg_valuation_multiple === Math.max(...timing_analysis.map((x: any) => x.avg_valuation_multiple));
                      return (
                        <tr key={i} className={`border-b border-gray-800/50 ${isOptimal ? "bg-emerald-900/20" : i % 2 === 0 ? "bg-gray-800/20" : ""}`}>
                          <td className="py-3 px-4 font-medium">{t.label}</td>
                          <td className="py-3 px-4 text-gray-400">{t.count}</td>
                          <td className="py-3 px-4">
                            <span className={`font-bold ${t.avg_valuation_multiple >= 4 ? "text-emerald-400" : t.avg_valuation_multiple >= 3 ? "text-cyan-400" : "text-gray-400"}`}>
                              {t.avg_valuation_multiple}x
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`${t.avg_first_day_gain >= 50 ? "text-amber-400" : "text-gray-400"}`}>
                              {t.avg_first_day_gain}%
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {isOptimal ? (
                              <span className="text-xs bg-emerald-900/50 text-emerald-400 border border-emerald-700/50 px-2 py-1 rounded-full">最优时机</span>
                            ) : t.avg_valuation_multiple >= 3.5 ? (
                              <span className="text-xs bg-cyan-900/50 text-cyan-400 border border-cyan-700/50 px-2 py-1 rounded-full">较优</span>
                            ) : (
                              <span className="text-xs text-gray-500">一般</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 p-3 bg-gray-800 rounded-lg text-xs text-gray-400">
                <strong className="text-gray-300">结论：</strong>
                根据 {(candidates as any[]).length} 个历史案例分析，在新三板挂牌
                <strong className="text-emerald-400"> 3-4 年</strong>后转板北交所的企业，
                平均估值提升倍数最高，首日涨幅也最为显著。过早转板（1-2年）因财务积累不足，
                估值提升有限；过晚转板（6年以上）市场热度可能已消退。
              </div>
            </div>
          </div>
        )}

        {/* 路径财务对比 */}
        {activeTab === "paths" && (
          <div className="grid grid-cols-2 gap-6">
            {[
              { key: "avg_gross_margin", label: "平均毛利率", unit: "%" },
              { key: "avg_roe", label: "平均ROE", unit: "%" },
              { key: "avg_revenue_cagr", label: "平均营收CAGR", unit: "%" },
              { key: "avg_valuation_multiple", label: "平均估值提升", unit: "x" },
            ].map((metric) => (
              <div key={metric.key} className="bg-gray-900 rounded-xl p-5 border border-gray-800">
                <h3 className="text-sm font-semibold text-gray-300 mb-4">{metric.label}（三路径对比）</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart
                    data={pathList.map(([path, stats]: [string, any]) => ({
                      path,
                      value: stats[metric.key],
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="path" tick={{ fill: "#9ca3af", fontSize: 12 }} />
                    <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} unit={metric.unit} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px" }}
                      formatter={(v: any) => [`${v}${metric.unit}`, metric.label]}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {pathList.map(([path]: [string, any], index) => (
                        <rect key={index} fill={PATH_COLORS[path]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
