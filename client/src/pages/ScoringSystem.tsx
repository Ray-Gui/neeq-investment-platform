import { useState, useMemo } from "react";
import { Star, Filter, Search } from "lucide-react";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from "recharts";
import scoringData from "../data/scoring-system-data.json";

interface ScoringItem {
  company_id: number;
  code: string;
  short_name: string;
  sector: string;
  industry: string;
  financial_health: number;
  growth_potential: number;
  market_competitiveness: number;
  risk_assessment: number;
  overall_score: number;
  rating: string;
  investment_advice: string;
  key_strengths: string[];
  key_risks: string[];
}

export default function ScoringSystem() {
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedSector, setSelectedSector] = useState<string>("全部");
  const [sortBy, setSortBy] = useState<"score" | "financial" | "growth">("score");
  const [selectedCompany, setSelectedCompany] = useState<ScoringItem | null>((scoringData as ScoringItem[])[0]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const sectors = ["全部", "医疗健康", "新能源", "人工智能"];

  const filteredData = useMemo(() => {
    let filtered = scoringData as ScoringItem[];
    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.short_name.toLowerCase().includes(keyword) ||
          d.code.includes(keyword) ||
          (d.industry && d.industry.toLowerCase().includes(keyword))
      );
    }
    if (selectedSector !== "全部") {
      filtered = filtered.filter((d) => d.sector === selectedSector);
    }
    filtered = [...filtered].sort((a, b) => {
      if (sortBy === "score") return b.overall_score - a.overall_score;
      if (sortBy === "financial") return b.financial_health - a.financial_health;
      if (sortBy === "growth") return b.growth_potential - a.growth_potential;
      return 0;
    });
    return filtered;
  }, [searchKeyword, selectedSector, sortBy]);

  const totalPages = Math.ceil(filteredData.length / pageSize);
  const pagedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-red-400";
    if (score >= 75) return "text-green-400";
    if (score >= 60) return "text-yellow-400";
    if (score >= 45) return "text-orange-400";
    return "text-gray-400";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 85) return "bg-red-500/10 border-red-500/30";
    if (score >= 75) return "bg-green-500/10 border-green-500/30";
    if (score >= 60) return "bg-yellow-500/10 border-yellow-500/30";
    if (score >= 45) return "bg-orange-500/10 border-orange-500/30";
    return "bg-gray-500/10 border-gray-500/30";
  };

  const getRatingColor = (rating: string) => {
    if (rating.startsWith("A")) return "text-green-400";
    if (rating.startsWith("B")) return "text-blue-400";
    if (rating.startsWith("C")) return "text-yellow-400";
    return "text-gray-400";
  };

  const getAdviceColor = (advice: string) => {
    if (advice === "强烈推荐" || advice === "推荐") return "bg-green-500/20 text-green-400";
    if (advice === "中性") return "bg-yellow-500/20 text-yellow-400";
    return "bg-red-500/20 text-red-400";
  };

  const radarData = selectedCompany
    ? [
        { dimension: "财务健康度", value: selectedCompany.financial_health },
        { dimension: "成长潜力", value: selectedCompany.growth_potential },
        { dimension: "市场竞争力", value: selectedCompany.market_competitiveness },
        { dimension: "风险评估", value: selectedCompany.risk_assessment },
        { dimension: "综合评分", value: selectedCompany.overall_score },
      ]
    : [];

  const sectorStats = useMemo(() => {
    const stats: Record<string, { count: number; avgScore: number }> = {};
    (scoringData as ScoringItem[]).forEach((d) => {
      if (!stats[d.sector]) stats[d.sector] = { count: 0, avgScore: 0 };
      stats[d.sector].count++;
      stats[d.sector].avgScore += d.overall_score;
    });
    return Object.entries(stats).map(([sector, data]) => ({
      sector,
      count: data.count,
      avgScore: Math.round((data.avgScore / data.count) * 10) / 10,
    }));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Star className="w-8 h-8 text-yellow-400" />
            评分系统
          </h1>
          <p className="text-slate-400">多维度评分与投资建议 · 共 {(scoringData as ScoringItem[]).length} 家企业</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {sectorStats.map((stat) => (
            <div key={stat.sector} className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-slate-400">{stat.sector}</p>
                  <p className="text-2xl font-bold text-white">{stat.count} 家</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">平均评分</p>
                  <p className={`text-xl font-bold ${getScoreColor(stat.avgScore)}`}>{stat.avgScore}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-4 mb-6 flex flex-wrap gap-4">
          <div className="flex-1 min-w-48 flex items-center gap-2">
            <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="搜索企业名称、代码或行业..."
              value={searchKeyword}
              onChange={(e) => { setSearchKeyword(e.target.value); setCurrentPage(1); }}
              className="flex-1 bg-slate-700 border border-slate-600 rounded px-4 py-2 text-white text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-slate-400" />
            <select
              value={selectedSector}
              onChange={(e) => { setSelectedSector(e.target.value); setCurrentPage(1); }}
              className="bg-slate-700 border border-slate-600 rounded px-4 py-2 text-white text-sm"
            >
              {sectors.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "score" | "financial" | "growth")}
            className="bg-slate-700 border border-slate-600 rounded px-4 py-2 text-white text-sm"
          >
            <option value="score">按综合评分</option>
            <option value="financial">按财务健康</option>
            <option value="growth">按成长潜力</option>
          </select>
          <div className="flex items-center text-sm text-slate-400">
            共 <span className="text-white font-bold mx-1">{filteredData.length}</span> 家企业
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-white mb-4">企业评分排名</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-3 px-3 text-gray-400">排名</th>
                      <th className="text-left py-3 px-3 text-gray-400">企业名称</th>
                      <th className="text-left py-3 px-3 text-gray-400">代码</th>
                      <th className="text-left py-3 px-3 text-gray-400">行业</th>
                      <th className="text-right py-3 px-3 text-gray-400">综合评分</th>
                      <th className="text-left py-3 px-3 text-gray-400">等级</th>
                      <th className="text-left py-3 px-3 text-gray-400">建议</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedData.map((item, index) => (
                      <tr
                        key={item.company_id}
                        className={`border-b border-slate-700 hover:bg-slate-700/30 transition-colors cursor-pointer ${
                          selectedCompany?.company_id === item.company_id ? "bg-slate-700/40" : ""
                        }`}
                        onClick={() => setSelectedCompany(item)}
                      >
                        <td className="py-3 px-3 text-gray-300 font-semibold">
                          #{(currentPage - 1) * pageSize + index + 1}
                        </td>
                        <td className="py-3 px-3 text-white font-semibold">{item.short_name}</td>
                        <td className="py-3 px-3 text-gray-400 text-xs">{item.code}</td>
                        <td className="py-3 px-3 text-gray-400 text-xs">{item.industry}</td>
                        <td className={`py-3 px-3 text-right font-bold ${getScoreColor(item.overall_score)}`}>
                          {item.overall_score.toFixed(1)}
                        </td>
                        <td className={`py-3 px-3 font-bold ${getRatingColor(item.rating)}`}>{item.rating}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${getAdviceColor(item.investment_advice)}`}>
                            {item.investment_advice}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-700">
                <span className="text-sm text-slate-400">
                  第 {currentPage} / {totalPages} 页，共 {filteredData.length} 条
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 bg-slate-700 text-white rounded text-sm disabled:opacity-50 hover:bg-slate-600"
                  >
                    上一页
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 bg-slate-700 text-white rounded text-sm disabled:opacity-50 hover:bg-slate-600"
                  >
                    下一页
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {selectedCompany && (
              <>
                <div className={`bg-slate-800/50 backdrop-blur-sm border rounded-lg p-6 ${getScoreBgColor(selectedCompany.overall_score)}`}>
                  <h3 className="text-lg font-semibold text-white mb-1">{selectedCompany.short_name}</h3>
                  <p className="text-sm text-slate-400 mb-4">{selectedCompany.code} | {selectedCompany.sector} · {selectedCompany.industry}</p>
                  <div className="text-center mb-4">
                    <div className={`text-5xl font-bold ${getScoreColor(selectedCompany.overall_score)}`}>
                      {selectedCompany.overall_score.toFixed(1)}
                    </div>
                    <p className="text-sm text-slate-400 mt-1">综合评分</p>
                    <div className="flex justify-center gap-3 mt-2">
                      <span className={`text-lg font-bold ${getRatingColor(selectedCompany.rating)}`}>{selectedCompany.rating}</span>
                      <span className={`px-2 py-0.5 rounded text-sm font-bold ${getAdviceColor(selectedCompany.investment_advice)}`}>
                        {selectedCompany.investment_advice}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {[
                      { label: "财务健康度", value: selectedCompany.financial_health, color: "bg-blue-500" },
                      { label: "成长潜力", value: selectedCompany.growth_potential, color: "bg-green-500" },
                      { label: "市场竞争力", value: selectedCompany.market_competitiveness, color: "bg-yellow-500" },
                      { label: "风险评估", value: selectedCompany.risk_assessment, color: "bg-purple-500" },
                    ].map(({ label, value, color }) => (
                      <div key={label}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm text-gray-300">{label}</span>
                          <span className="text-sm font-semibold text-white">{value.toFixed(1)}</span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-2">
                          <div
                            className={`${color} h-2 rounded-full transition-all`}
                            style={{ width: `${Math.min(100, value)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">多维度评分分析</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#475569" />
                      <PolarAngleAxis dataKey="dimension" stroke="#9ca3af" tick={{ fontSize: 11 }} />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#9ca3af" />
                      <Radar name="评分" dataKey="value" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.3} />
                      <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">投资分析</h3>
                  <div className="mb-3">
                    <p className="text-sm font-semibold text-green-400 mb-2">核心优势</p>
                    <ul className="space-y-1">
                      {selectedCompany.key_strengths.map((s, i) => (
                        <li key={i} className="text-sm text-gray-300 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-green-400 rounded-full flex-shrink-0" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-red-400 mb-2">主要风险</p>
                    <ul className="space-y-1">
                      {selectedCompany.key_risks.map((r, i) => (
                        <li key={i} className="text-sm text-gray-300 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-red-400 rounded-full flex-shrink-0" />
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
