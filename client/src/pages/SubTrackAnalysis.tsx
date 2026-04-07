import { useState, useMemo } from "react";
import { ArrowLeft, Zap, TrendingUp, TrendingDown, Minus, Award, BarChart2 } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, LineChart, Line, Legend,
} from "recharts";
import subTrackData from "../data/sub-track-data.json";

const SECTOR_COLORS: Record<string, string> = {
  "医疗健康": "#10b981",
  "新能源": "#f59e0b",
  "人工智能": "#6366f1",
};

const TREND_CONFIG: Record<string, { color: string; bg: string; icon: any; label: string }> = {
  "高速增长": { color: "text-emerald-400", bg: "bg-emerald-900/30 border-emerald-700/50", icon: TrendingUp, label: "高速增长" },
  "快速增长": { color: "text-cyan-400", bg: "bg-cyan-900/30 border-cyan-700/50", icon: TrendingUp, label: "快速增长" },
  "稳健增长": { color: "text-indigo-400", bg: "bg-indigo-900/30 border-indigo-700/50", icon: TrendingUp, label: "稳健增长" },
  "平稳": { color: "text-gray-400", bg: "bg-gray-800/50 border-gray-700/50", icon: Minus, label: "平稳" },
  "早期阶段": { color: "text-amber-400", bg: "bg-amber-900/30 border-amber-700/50", icon: Zap, label: "早期阶段" },
};

function ProsperityBar({ score }: { score: number }) {
  const color = score >= 80 ? "#10b981" : score >= 65 ? "#6366f1" : score >= 50 ? "#f59e0b" : "#ef4444";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, backgroundColor: color }} />
      </div>
      <span className="text-sm font-bold w-8" style={{ color }}>{score}</span>
    </div>
  );
}

export default function SubTrackAnalysis() {
  const [activeSector, setActiveSector] = useState<string>("全部");
  const [selectedTrack, setSelectedTrack] = useState<(typeof subTrackData)[0] | null>(null);
  const [sortBy, setSortBy] = useState<"prosperity_score" | "company_count" | "avg_gross_margin" | "avg_revenue_growth">("prosperity_score");

  const sectors = ["全部", "医疗健康", "新能源", "人工智能"];

  const filteredTracks = useMemo(() => {
    const data = activeSector === "全部" ? subTrackData : subTrackData.filter(t => t.sector === activeSector);
    return [...data].sort((a, b) => (b as any)[sortBy] - (a as any)[sortBy]);
  }, [activeSector, sortBy]);

  const sectorSummary = useMemo(() => {
    return ["医疗健康", "新能源", "人工智能"].map(sector => {
      const tracks = subTrackData.filter(t => t.sector === sector);
      const avgProsperity = Math.round(tracks.reduce((s, t) => s + t.prosperity_score, 0) / tracks.length * 10) / 10;
      const topTrack = [...tracks].sort((a, b) => b.prosperity_score - a.prosperity_score)[0];
      return { sector, track_count: tracks.length, avg_prosperity: avgProsperity, top_track: topTrack?.name };
    });
  }, []);

  // 雷达图数据（选中赛道）
  const radarData = selectedTrack ? [
    { subject: "景气度", value: selectedTrack.prosperity_score },
    { subject: "毛利率", value: Math.min(100, selectedTrack.avg_gross_margin) },
    { subject: "ROE", value: Math.min(100, Math.max(0, selectedTrack.avg_roe * 3)) },
    { subject: "营收增速", value: Math.min(100, Math.max(0, selectedTrack.avg_revenue_growth * 2 + 50)) },
    { subject: "综合评分", value: selectedTrack.avg_score },
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
            <BarChart2 className="w-5 h-5 text-amber-400" />
            <h1 className="text-lg font-bold">细分赛道景气度追踪</h1>
          </div>
          <span className="text-sm text-gray-400">覆盖 {subTrackData.length} 个细分赛道 · 三大行业</span>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* 行业概览卡片 */}
        <div className="grid grid-cols-3 gap-4">
          {sectorSummary.map((s) => (
            <div
              key={s.sector}
              className="bg-gray-900 rounded-xl p-4 border cursor-pointer transition-all"
              style={{ borderColor: activeSector === s.sector ? SECTOR_COLORS[s.sector] : "#374151" }}
              onClick={() => setActiveSector(activeSector === s.sector ? "全部" : s.sector)}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold" style={{ color: SECTOR_COLORS[s.sector] }}>{s.sector}</span>
                <span className="text-xs text-gray-500">{s.track_count} 个赛道</span>
              </div>
              <div className="text-2xl font-bold text-white mb-1">{s.avg_prosperity}</div>
              <div className="text-xs text-gray-400">平均景气度评分</div>
              <div className="mt-2 text-xs text-gray-500">景气赛道: <span className="text-gray-300">{s.top_track}</span></div>
            </div>
          ))}
        </div>

        {/* 筛选和排序 */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {sectors.map((s) => (
              <button
                key={s}
                onClick={() => setActiveSector(s)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeSector === s
                    ? "text-white"
                    : "bg-gray-800 text-gray-400 hover:text-white"
                }`}
                style={activeSector === s ? { backgroundColor: s === "全部" ? "#4b5563" : SECTOR_COLORS[s] } : {}}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">排序：</span>
            {[
              { key: "prosperity_score", label: "景气度" },
              { key: "company_count", label: "企业数" },
              { key: "avg_gross_margin", label: "毛利率" },
              { key: "avg_revenue_growth", label: "增速" },
            ].map((s) => (
              <button
                key={s.key}
                onClick={() => setSortBy(s.key as any)}
                className={`px-3 py-1 rounded text-xs transition-colors ${
                  sortBy === s.key ? "bg-amber-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* 赛道列表 + 详情面板 */}
        <div className="grid grid-cols-3 gap-6">
          {/* 赛道列表 */}
          <div className="col-span-2 space-y-2">
            {filteredTracks.map((track) => {
              const trendCfg = TREND_CONFIG[track.growth_trend] || TREND_CONFIG["平稳"];
              const TrendIcon = trendCfg.icon;
              const isSelected = selectedTrack?.id === track.id;

              return (
                <div
                  key={track.id}
                  className={`bg-gray-900 rounded-xl p-4 border cursor-pointer transition-all ${
                    isSelected ? "border-amber-500" : "border-gray-800 hover:border-gray-700"
                  }`}
                  onClick={() => setSelectedTrack(isSelected ? null : track)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-white">{track.name}</span>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ color: SECTOR_COLORS[track.sector], backgroundColor: `${SECTOR_COLORS[track.sector]}20` }}
                      >
                        {track.sector}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${trendCfg.bg} ${trendCfg.color}`}>
                        <TrendIcon className="w-3 h-3 inline mr-1" />
                        {trendCfg.label}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">{track.company_count} 家企业</span>
                  </div>

                  <div className="mb-2">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>景气度评分</span>
                    </div>
                    <ProsperityBar score={track.prosperity_score} />
                  </div>

                  <div className="grid grid-cols-4 gap-3 text-xs">
                    {[
                      { label: "毛利率", value: `${track.avg_gross_margin}%`, color: "text-emerald-400" },
                      { label: "ROE", value: `${track.avg_roe}%`, color: "text-indigo-400" },
                      { label: "营收增速", value: `${track.avg_revenue_growth}%`, color: "text-amber-400" },
                      { label: "综合评分", value: `${track.avg_score}`, color: "text-cyan-400" },
                    ].map((item) => (
                      <div key={item.label} className="bg-gray-800 rounded-lg p-2 text-center">
                        <div className={`font-medium ${item.color}`}>{item.value}</div>
                        <div className="text-gray-500 mt-0.5">{item.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 详情面板 */}
          <div className="space-y-4">
            {selectedTrack ? (
              <>
                <div className="bg-gray-900 rounded-xl p-5 border border-amber-700/50">
                  <h3 className="font-bold text-amber-400 mb-1">{selectedTrack.name}</h3>
                  <p className="text-xs text-gray-400 mb-4">{selectedTrack.sector} · {selectedTrack.company_count} 家企业</p>

                  {/* 雷达图 */}
                  <RadarChart width={220} height={180} data={radarData} cx={110} cy={90}>
                    <PolarGrid stroke="#374151" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: "#9ca3af", fontSize: 10 }} />
                    <Radar dataKey="value" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} />
                  </RadarChart>

                  {/* 增长趋势 */}
                  <div className="mt-4">
                    <h4 className="text-xs text-gray-400 mb-2">近3年营收增速趋势</h4>
                    <ResponsiveContainer width="100%" height={80}>
                      <LineChart data={selectedTrack.trend_data}>
                        <XAxis dataKey="year" tick={{ fill: "#9ca3af", fontSize: 10 }} />
                        <YAxis tick={{ fill: "#9ca3af", fontSize: 10 }} unit="%" />
                        <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px", fontSize: "11px" }} />
                        <Line type="monotone" dataKey="revenue_growth" stroke="#f59e0b" strokeWidth={2} dot={{ fill: "#f59e0b", r: 3 }} name="增速" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 龙头企业 */}
                <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
                  <h3 className="text-sm font-semibold text-gray-300 mb-3">赛道龙头企业</h3>
                  <div className="space-y-2">
                    {selectedTrack.leaders.map((leader, i) => (
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
              </>
            ) : (
              <div className="bg-gray-900 rounded-xl p-8 border border-gray-800 text-center">
                <BarChart2 className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                <p className="text-sm text-gray-500">点击左侧赛道</p>
                <p className="text-sm text-gray-500">查看详细分析</p>
              </div>
            )}

            {/* 景气度排行榜 */}
            <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
              <h3 className="text-sm font-semibold text-gray-300 mb-3">景气度 TOP5</h3>
              <div className="space-y-2">
                {[...subTrackData]
                  .sort((a, b) => b.prosperity_score - a.prosperity_score)
                  .slice(0, 5)
                  .map((t, i) => (
                    <div key={t.id} className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-4">{i + 1}</span>
                      <div className="flex-1">
                        <div className="flex justify-between text-xs mb-0.5">
                          <span className="text-gray-300">{t.name}</span>
                          <span style={{ color: SECTOR_COLORS[t.sector] }}>{t.prosperity_score}</span>
                        </div>
                        <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${t.prosperity_score}%`, backgroundColor: SECTOR_COLORS[t.sector] }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
