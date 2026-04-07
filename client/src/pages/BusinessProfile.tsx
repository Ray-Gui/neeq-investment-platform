import { useState, useMemo } from "react";
import { ArrowLeft, Layers, TrendingUp, Award, Search } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, Cell,
} from "recharts";
import businessData from "../data/business-profile-data.json";
import subTrackData from "../data/sub-track-data.json";

const SECTOR_COLORS: Record<string, string> = {
  "医疗健康": "#10b981",
  "新能源": "#f59e0b",
  "人工智能": "#6366f1",
};

const TREND_COLORS: Record<string, string> = {
  "高速增长": "#10b981",
  "快速增长": "#06b6d4",
  "稳健增长": "#6366f1",
  "平稳": "#9ca3af",
  "早期阶段": "#f59e0b",
};

export default function BusinessProfile() {
  const [activeTab, setActiveTab] = useState<"heatmap" | "compare" | "detail">("heatmap");
  const [selectedSector, setSelectedSector] = useState<string>("全部");
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);

  // 合并 businessData 和 subTrackData 的景气度信息
  const enrichedData = useMemo(() => {
    return businessData.map((b) => {
      const sub = subTrackData.find((s) => s.name === b.track);
      return {
        ...b,
        prosperity_score: sub?.prosperity_score ?? b.prosperity_score,
        growth_trend: sub?.growth_trend ?? b.growth_trend,
        trend_data: sub?.trend_data ?? [],
      };
    });
  }, []);

  const filteredData = useMemo(() => {
    if (selectedSector === "全部") return enrichedData;
    return enrichedData.filter((d) => d.sector === selectedSector);
  }, [selectedSector, enrichedData]);

  const selectedData = selectedTrack ? enrichedData.find((d) => d.track === selectedTrack) : null;

  // 热度地图数据（按景气度和企业数排列）
  const heatmapData = useMemo(() => {
    return [...enrichedData].sort((a, b) => b.prosperity_score - a.prosperity_score);
  }, [enrichedData]);

  // 对比图数据
  const compareData = useMemo(() => {
    return filteredData.map((d) => ({
      name: d.track,
      毛利率: d.avg_gross_margin,
      ROE: d.avg_roe,
      营收增速: d.avg_revenue_growth,
      景气度: d.prosperity_score,
    }));
  }, [filteredData]);

  const radarData = selectedData ? [
    { subject: "景气度", value: selectedData.prosperity_score },
    { subject: "毛利率", value: Math.min(100, selectedData.avg_gross_margin) },
    { subject: "ROE", value: Math.min(100, Math.max(0, selectedData.avg_roe * 3)) },
    { subject: "增速", value: Math.min(100, Math.max(0, selectedData.avg_revenue_growth * 2 + 50)) },
    { subject: "综合评分", value: selectedData.avg_score },
  ] : [];

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
            <Layers className="w-5 h-5 text-purple-400" />
            <h1 className="text-lg font-bold">主营业务深度画像</h1>
          </div>
          <span className="text-sm text-gray-400">覆盖 {businessData.length} 个主营赛道 · {businessData.reduce((s, d) => s + d.company_count, 0)} 家企业</span>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* 概览卡片 */}
        <div className="grid grid-cols-5 gap-3">
          {enrichedData.map((d) => (
            <div
              key={d.track}
              className={`bg-gray-900 rounded-xl p-4 border cursor-pointer transition-all ${
                selectedTrack === d.track ? "border-purple-500" : "border-gray-800 hover:border-gray-700"
              }`}
              onClick={() => setSelectedTrack(selectedTrack === d.track ? null : d.track)}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold" style={{ color: SECTOR_COLORS[d.sector] }}>{d.sector}</span>
                <span className="text-xs text-gray-500">{d.company_count}家</span>
              </div>
              <div className="text-sm font-bold text-white mb-2 leading-tight">{d.track}</div>
              <div className="flex items-center gap-1 mb-2">
                <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${d.prosperity_score}%`,
                      backgroundColor: TREND_COLORS[d.growth_trend] || "#6366f1"
                    }}
                  />
                </div>
                <span className="text-xs font-bold" style={{ color: TREND_COLORS[d.growth_trend] }}>
                  {d.prosperity_score}
                </span>
              </div>
              <div className="text-xs" style={{ color: TREND_COLORS[d.growth_trend] }}>{d.growth_trend}</div>
            </div>
          ))}
        </div>

        {/* 标签页 */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {[
              { key: "heatmap", label: "赛道热度地图" },
              { key: "compare", label: "横向对比" },
              { key: "detail", label: "赛道详情" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.key ? "bg-purple-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {["全部", "医疗健康", "新能源", "人工智能"].map((s) => (
              <button
                key={s}
                onClick={() => setSelectedSector(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  selectedSector === s ? "text-white" : "bg-gray-800 text-gray-400 hover:text-white"
                }`}
                style={selectedSector === s ? { backgroundColor: s === "全部" ? "#4b5563" : SECTOR_COLORS[s] } : {}}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* 赛道热度地图 */}
        {activeTab === "heatmap" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-6">
              {/* 景气度热力图 */}
              <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
                <h3 className="text-sm font-semibold text-gray-300 mb-4">赛道景气度排行</h3>
                <div className="space-y-2">
                  {heatmapData.map((d, i) => (
                    <div key={d.track} className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 w-4">{i + 1}</span>
                      <div className="w-20 text-xs text-gray-300 truncate">{d.track}</div>
                      <div className="flex-1 h-5 bg-gray-800 rounded-md overflow-hidden relative">
                        <div
                          className="h-full rounded-md flex items-center pl-2"
                          style={{
                            width: `${d.prosperity_score}%`,
                            backgroundColor: `${TREND_COLORS[d.growth_trend]}40`,
                            borderLeft: `3px solid ${TREND_COLORS[d.growth_trend]}`,
                          }}
                        >
                          <span className="text-xs font-medium" style={{ color: TREND_COLORS[d.growth_trend] }}>
                            {d.prosperity_score}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs" style={{ color: TREND_COLORS[d.growth_trend] }}>{d.growth_trend}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 企业数量分布 */}
              <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
                <h3 className="text-sm font-semibold text-gray-300 mb-4">各赛道企业数量分布</h3>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={heatmapData} layout="vertical" margin={{ left: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis type="number" tick={{ fill: "#9ca3af", fontSize: 11 }} />
                    <YAxis type="category" dataKey="track" tick={{ fill: "#9ca3af", fontSize: 10 }} width={60} />
                    <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px" }} />
                    <Bar dataKey="company_count" name="企业数" radius={[0, 4, 4, 0]}>
                      {heatmapData.map((d, i) => (
                        <Cell key={i} fill={SECTOR_COLORS[d.sector] || "#6366f1"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 综合热度矩阵 */}
            <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
              <h3 className="text-sm font-semibold text-gray-300 mb-4">赛道综合画像矩阵</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800">
                      {["赛道", "所属行业", "企业数", "景气度", "毛利率", "ROE", "营收增速", "综合评分", "增长趋势"].map((h) => (
                        <th key={h} className="text-left py-2 px-3 text-gray-400 font-medium text-xs">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {heatmapData.map((d, i) => (
                      <tr
                        key={d.track}
                        className={`border-b border-gray-800/50 cursor-pointer hover:bg-gray-800/50 ${i % 2 === 0 ? "bg-gray-800/20" : ""}`}
                        onClick={() => { setSelectedTrack(d.track); setActiveTab("detail"); }}
                      >
                        <td className="py-2.5 px-3 font-medium text-white">{d.track}</td>
                        <td className="py-2.5 px-3">
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ color: SECTOR_COLORS[d.sector], backgroundColor: `${SECTOR_COLORS[d.sector]}20` }}>
                            {d.sector}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-gray-400">{d.company_count}</td>
                        <td className="py-2.5 px-3">
                          <span className="font-bold" style={{ color: TREND_COLORS[d.growth_trend] }}>{d.prosperity_score}</span>
                        </td>
                        <td className="py-2.5 px-3 text-emerald-400">{d.avg_gross_margin}%</td>
                        <td className="py-2.5 px-3 text-indigo-400">{d.avg_roe}%</td>
                        <td className="py-2.5 px-3 text-amber-400">{d.avg_revenue_growth}%</td>
                        <td className="py-2.5 px-3 text-cyan-400">{d.avg_score}</td>
                        <td className="py-2.5 px-3">
                          <span className="text-xs px-2 py-0.5 rounded-full border" style={{ color: TREND_COLORS[d.growth_trend], borderColor: `${TREND_COLORS[d.growth_trend]}50`, backgroundColor: `${TREND_COLORS[d.growth_trend]}15` }}>
                            {d.growth_trend}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 横向对比 */}
        {activeTab === "compare" && (
          <div className="grid grid-cols-2 gap-6">
            {[
              { key: "毛利率", color: "#10b981", unit: "%" },
              { key: "ROE", color: "#6366f1", unit: "%" },
              { key: "营收增速", color: "#f59e0b", unit: "%" },
              { key: "景气度", color: "#06b6d4", unit: "" },
            ].map((metric) => (
              <div key={metric.key} className="bg-gray-900 rounded-xl p-5 border border-gray-800">
                <h3 className="text-sm font-semibold text-gray-300 mb-4">{metric.key}横向对比</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={compareData} layout="vertical" margin={{ left: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis type="number" tick={{ fill: "#9ca3af", fontSize: 11 }} unit={metric.unit} />
                    <YAxis type="category" dataKey="name" tick={{ fill: "#9ca3af", fontSize: 10 }} width={60} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px" }}
                      formatter={(v: any) => [`${v}${metric.unit}`, metric.key]}
                    />
                    <Bar dataKey={metric.key} fill={metric.color} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ))}
          </div>
        )}

        {/* 赛道详情 */}
        {activeTab === "detail" && (
          <div className="grid grid-cols-3 gap-6">
            {/* 赛道选择列表 */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-300 mb-3">选择赛道</h3>
              {filteredData.map((d) => (
                <button
                  key={d.track}
                  onClick={() => setSelectedTrack(d.track)}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                    selectedTrack === d.track
                      ? "border-purple-500 bg-purple-900/20"
                      : "border-gray-800 bg-gray-900 hover:border-gray-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{d.track}</span>
                    <span className="text-xs" style={{ color: TREND_COLORS[d.growth_trend] }}>{d.prosperity_score}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{d.sector} · {d.company_count}家</div>
                </button>
              ))}
            </div>

            {/* 详情内容 */}
            <div className="col-span-2 space-y-4">
              {selectedData ? (
                <>
                  <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h2 className="text-xl font-bold text-white">{selectedData.track}</h2>
                        <p className="text-sm text-gray-400 mt-1">
                          {selectedData.sector} · {selectedData.company_count} 家企业 ·
                          <span className="ml-1" style={{ color: TREND_COLORS[selectedData.growth_trend] }}>
                            {selectedData.growth_trend}
                          </span>
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold" style={{ color: TREND_COLORS[selectedData.growth_trend] }}>
                          {selectedData.prosperity_score}
                        </div>
                        <div className="text-xs text-gray-400">景气度评分</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-3">
                      {[
                        { label: "平均毛利率", value: `${selectedData.avg_gross_margin}%`, color: "text-emerald-400" },
                        { label: "平均ROE", value: `${selectedData.avg_roe}%`, color: "text-indigo-400" },
                        { label: "营收增速", value: `${selectedData.avg_revenue_growth}%`, color: "text-amber-400" },
                        { label: "综合评分", value: `${selectedData.avg_score}`, color: "text-cyan-400" },
                      ].map((item) => (
                        <div key={item.label} className="bg-gray-800 rounded-lg p-3 text-center">
                          <div className={`text-lg font-bold ${item.color}`}>{item.value}</div>
                          <div className="text-xs text-gray-500 mt-1">{item.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* 雷达图 */}
                    <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
                      <h3 className="text-sm font-semibold text-gray-300 mb-3">综合能力雷达</h3>
                      <RadarChart width={220} height={180} data={radarData} cx={110} cy={90}>
                        <PolarGrid stroke="#374151" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: "#9ca3af", fontSize: 10 }} />
                        <Radar
                          dataKey="value"
                          stroke={SECTOR_COLORS[selectedData.sector]}
                          fill={SECTOR_COLORS[selectedData.sector]}
                          fillOpacity={0.2}
                        />
                      </RadarChart>
                    </div>

                    {/* 龙头企业 */}
                    <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
                      <h3 className="text-sm font-semibold text-gray-300 mb-3">赛道龙头 TOP5</h3>
                      <div className="space-y-2">
                        {selectedData.leaders.map((leader: any, i: number) => (
                          <div key={leader.code} className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2">
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center ${
                                i === 0 ? "bg-amber-500 text-black" : i === 1 ? "bg-gray-400 text-black" : "bg-amber-800 text-white"
                              }`}>{i + 1}</span>
                              <div>
                                <div className="text-xs font-medium">{leader.name}</div>
                                <div className="text-xs text-gray-500">{leader.code}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-amber-400 font-medium">{leader.score}分</div>
                              <div className="text-xs text-gray-500">毛利率 {leader.gross_margin}%</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-gray-900 rounded-xl p-12 border border-gray-800 text-center">
                  <Layers className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500">从左侧选择一个赛道查看详情</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
