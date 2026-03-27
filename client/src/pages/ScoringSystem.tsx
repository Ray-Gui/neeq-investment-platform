import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { Star, Filter, Search, ExternalLink } from "lucide-react";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from "recharts";
import scoringData from "../data/scoring-system-data.json";

interface ScoringItem {
  rank: number;
  code: string;
  short_name: string;
  sector: string;
  industry: string;
  financial_health: number;
  growth_potential: number;
  market_competitiveness: number;
  risk_control: number;
  total_score: number;
  roe?: number;
  gross_margin?: number;
  net_margin?: number;
  revenue_growth?: number;
  net_profit_growth?: number;
  market_cap?: number;
  pe_ttm?: number;
  pb?: number;
  score_breakdown?: any;
}

export default function ScoringSystem() {
  const [, navigate] = useLocation();
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
      if (sortBy === "score") return b.total_score - a.total_score;
      if (sortBy === "financial") return b.financial_health - a.financial_health;
      if (sortBy === "growth") return b.growth_potential - a.growth_potential;
      return 0;
    });
    return filtered;
  }, [searchKeyword, selectedSector, sortBy]);

  const totalPages = Math.ceil(filteredData.length / pageSize);
  const pagedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const getScoreColor = (score: number) => {
    if (score >= 75) return "text-green-400";
    if (score >= 60) return "text-yellow-400";
    if (score >= 45) return "text-orange-400";
    return "text-gray-400";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 75) return "bg-green-500/10 border-green-500/30";
    if (score >= 60) return "bg-yellow-500/10 border-yellow-500/30";
    if (score >= 45) return "bg-orange-500/10 border-orange-500/30";
    return "bg-gray-500/10 border-gray-500/30";
  };

  const getRating = (score: number) => {
    if (score >= 70) return "A";
    if (score >= 60) return "B+";
    if (score >= 50) return "B";
    if (score >= 40) return "C+";
    return "C";
  };

  const getRatingColor = (score: number) => {
    if (score >= 70) return "text-green-400";
    if (score >= 55) return "text-blue-400";
    if (score >= 40) return "text-yellow-400";
    return "text-gray-400";
  };

  const getAdvice = (score: number) => {
    if (score >= 70) return "强烈推荐";
    if (score >= 55) return "推荐";
    if (score >= 40) return "中性";
    return "谨慎";
  };

  const getAdviceColor = (score: number) => {
    if (score >= 55) return "bg-green-500/20 text-green-400";
    if (score >= 40) return "bg-yellow-500/20 text-yellow-400";
    return "bg-red-500/20 text-red-400";
  };

  const radarData = selectedCompany
    ? [
        { dimension: "财务健康度", value: selectedCompany.financial_health },
        { dimension: "成长潜力", value: selectedCompany.growth_potential },
        { dimension: "市场竞争力", value: selectedCompany.market_competitiveness },
        { dimension: "风险控制", value: selectedCompany.risk_control },
        { dimension: "综合评分", value: selectedCompany.total_score },
      ]
    : [];

  const sectorStats = useMemo(() => {
    const stats: Record<string, { count: number; avgScore: number }> = {};
    (scoringData as ScoringItem[]).forEach((d) => {
      if (!stats[d.sector]) stats[d.sector] = { count: 0, avgScore: 0 };
      stats[d.sector].count++;
      stats[d.sector].avgScore += d.total_score;
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
                        key={item.code}
                        className={`border-b border-slate-700 hover:bg-slate-700/30 transition-colors cursor-pointer ${
                          selectedCompany?.code === item.code ? "bg-slate-700/40" : ""
                        }`}
                        onClick={() => setSelectedCompany(item)}
                      >
                        <td className="py-3 px-3 text-gray-300 font-semibold">
                          #{(currentPage - 1) * pageSize + index + 1}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1">
                            <span className="text-white font-semibold">{item.short_name}</span>
                            <button
                              onClick={(e) => { e.stopPropagation(); navigate(`/company/${encodeURIComponent(item.code)}`); }}
                              className="text-cyan-500 hover:text-cyan-300 transition-colors"
                              title="查看详情"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-gray-400 text-xs">{item.code}</td>
                        <td className="py-3 px-3 text-gray-400 text-xs">{item.industry}</td>
                        <td className={`py-3 px-3 text-right font-bold ${getScoreColor(item.total_score)}`}>
                          {item.total_score.toFixed(1)}
                        </td>
                        <td className={`py-3 px-3 font-bold ${getRatingColor(item.total_score)}`}>{getRating(item.total_score)}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${getAdviceColor(item.total_score)}`}>
                            {getAdvice(item.total_score)}
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
                <div className={`bg-slate-800/50 backdrop-blur-sm border rounded-lg p-6 ${getScoreBgColor(selectedCompany.total_score)}`}>
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="text-lg font-semibold text-white">{selectedCompany.short_name}</h3>
                    <button
                      onClick={() => navigate(`/company/${encodeURIComponent(selectedCompany.code)}`)}
                      className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 px-2 py-1 rounded transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />查看完整详情
                    </button>
                  </div>
                  <p className="text-sm text-slate-400 mb-4">{selectedCompany.code} | {selectedCompany.sector} · {selectedCompany.industry}</p>
                  <div className="text-center mb-4">
                    <div className={`text-5xl font-bold ${getScoreColor(selectedCompany.total_score)}`}>
                      {selectedCompany.total_score.toFixed(1)}
                    </div>
                    <p className="text-sm text-slate-400 mt-1">综合评分</p>
                    <div className="flex justify-center gap-3 mt-2">
                      <span className={`text-lg font-bold ${getRatingColor(selectedCompany.total_score)}`}>{getRating(selectedCompany.total_score)}</span>
                      <span className={`px-2 py-0.5 rounded text-sm font-bold ${getAdviceColor(selectedCompany.total_score)}`}>
                        {getAdvice(selectedCompany.total_score)}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {[
                      { label: "财务健康度", value: selectedCompany.financial_health, color: "bg-blue-500" },
                      { label: "成长潜力", value: selectedCompany.growth_potential, color: "bg-green-500" },
                      { label: "市场竞争力", value: selectedCompany.market_competitiveness, color: "bg-yellow-500" },
                      { label: "风险控制", value: selectedCompany.risk_control, color: "bg-purple-500" },
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
                  <h3 className="text-lg font-semibold text-white mb-4">评分计算依据</h3>
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-slate-300 mb-2">真实财务数据（来源：东方财富）</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-slate-700/50 rounded p-2">
                        <span className="text-slate-400">ROE</span>
                        <span className="text-white font-bold ml-2">{selectedCompany.score_breakdown?.financial_health?.components?.roe != null ? (selectedCompany.score_breakdown.financial_health.components.roe as number).toFixed(2) + '%' : 'N/A'}</span>
                      </div>
                      <div className="bg-slate-700/50 rounded p-2">
                        <span className="text-slate-400">毛利率</span>
                        <span className="text-white font-bold ml-2">{selectedCompany.score_breakdown?.financial_health?.components?.gross_margin != null ? (selectedCompany.score_breakdown.financial_health.components.gross_margin as number).toFixed(2) + '%' : 'N/A'}</span>
                      </div>
                      <div className="bg-slate-700/50 rounded p-2">
                        <span className="text-slate-400">净利率</span>
                        <span className="text-white font-bold ml-2">{selectedCompany.score_breakdown?.financial_health?.components?.net_margin != null ? (selectedCompany.score_breakdown.financial_health.components.net_margin as number).toFixed(2) + '%' : 'N/A'}</span>
                      </div>
                      <div className="bg-slate-700/50 rounded p-2">
                        <span className="text-slate-400">营收增长</span>
                        <span className={`font-bold ml-2 ${((selectedCompany.score_breakdown?.growth_potential?.components?.revenue_growth as number) ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>{selectedCompany.score_breakdown?.growth_potential?.components?.revenue_growth != null ? (selectedCompany.score_breakdown.growth_potential.components.revenue_growth as number).toFixed(2) + '%' : 'N/A'}</span>
                      </div>
                      <div className="bg-slate-700/50 rounded p-2">
                        <span className="text-slate-400">净利润增长</span>
                        <span className={`font-bold ml-2 ${((selectedCompany.score_breakdown?.growth_potential?.components?.net_profit_growth as number) ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>{selectedCompany.score_breakdown?.growth_potential?.components?.net_profit_growth != null ? (selectedCompany.score_breakdown.growth_potential.components.net_profit_growth as number).toFixed(2) + '%' : 'N/A'}</span>
                      </div>
                      <div className="bg-slate-700/50 rounded p-2">
                        <span className="text-slate-400">PE(TTM)</span>
                        <span className="text-white font-bold ml-2">{selectedCompany.score_breakdown?.risk_control?.components?.pe_ttm != null ? (selectedCompany.score_breakdown.risk_control.components.pe_ttm as number).toFixed(2) : 'N/A'}</span>
                      </div>
                      <div className="bg-slate-700/50 rounded p-2">
                        <span className="text-slate-400">PB</span>
                        <span className="text-white font-bold ml-2">{selectedCompany.score_breakdown?.financial_health?.components?.pb != null ? (selectedCompany.score_breakdown.financial_health.components.pb as number).toFixed(2) : 'N/A'}</span>
                      </div>
                      <div className="bg-slate-700/50 rounded p-2">
                        <span className="text-slate-400">市值</span>
                        <span className="text-white font-bold ml-2">{selectedCompany.score_breakdown?.market_competitiveness?.components?.market_cap != null ? ((selectedCompany.score_breakdown.market_competitiveness.components.market_cap as number) >= 10000 ? ((selectedCompany.score_breakdown.market_competitiveness.components.market_cap as number)/10000).toFixed(1)+'亿' : (selectedCompany.score_breakdown.market_competitiveness.components.market_cap as number).toFixed(0)+'万') : 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-cyan-400 mb-2">综合评分公式</p>
                    <p className="text-xs text-gray-400 bg-slate-700/50 rounded p-3 leading-relaxed">
                      综合评分 = 财务健康度 × 35% + 成长潜力 × 30% + 市场竞争力 × 25% + 风险控制 × 10%<br/>
                      = {selectedCompany.financial_health.toFixed(1)} × 35% + {selectedCompany.growth_potential.toFixed(1)} × 30% + {selectedCompany.market_competitiveness.toFixed(1)} × 25% + {selectedCompany.risk_control.toFixed(1)} × 10%<br/>
                      = {(selectedCompany.financial_health * 0.35).toFixed(1)} + {(selectedCompany.growth_potential * 0.30).toFixed(1)} + {(selectedCompany.market_competitiveness * 0.25).toFixed(1)} + {(selectedCompany.risk_control * 0.10).toFixed(1)}<br/>
                      = <strong className="text-white">{selectedCompany.total_score.toFixed(1)}</strong>
                    </p>
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
