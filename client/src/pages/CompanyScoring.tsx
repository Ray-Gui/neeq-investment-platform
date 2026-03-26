import React from "react";
import { Search, Filter, TrendingUp, TrendingDown, BarChart3, Info, ChevronDown, ChevronUp } from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { investmentScores } from "../data/investment-scores";
import { allCompanies } from "../data/all-companies";
import { financialDataByCompany } from "../data/financial-data";

interface Company {
  id: number;
  code: string;
  short_name: string;
  sector: string;
  industry: string;
}

interface FinancialData {
  fiscal_year: number;
  revenue: number;
  net_profit: number;
  gross_margin: number;
  net_margin: number;
  roe: number;
}

interface ScoringData {
  company: Company;
  financial_health: number;
  growth_potential: number;
  risk_assessment: number;
  market_competitiveness: number;
  overall_score: number;
  recommendation: string;
  recommendation_level: number;
  financials: FinancialData[];
}

// 从导入的数据生成评分数据
const generateScoringData = (): ScoringData[] => {
  return investmentScores.map(score => {
    const company = allCompanies.find(c => c.id === score.company_id);
    const financials = (financialDataByCompany[score.company_id] || [])
      .sort((a, b) => b.fiscal_year - a.fiscal_year)
      .slice(0, 5)
      .map(f => ({
        fiscal_year: f.fiscal_year,
        revenue: f.revenue,
        net_profit: f.net_profit,
        gross_margin: f.gross_margin * 100,
        net_margin: f.net_margin * 100,
        roe: f.roe * 100
      }));

    return {
      company: {
        id: company?.id || 0,
        code: company?.code || "",
        short_name: company?.short_name || "",
        sector: company?.sector || "",
        industry: company?.industry || ""
      },
      financial_health: score.financial_health,
      growth_potential: score.growth_potential,
      risk_assessment: score.risk_assessment,
      market_competitiveness: score.market_competitiveness,
      overall_score: score.overall_score,
      recommendation: score.recommendation,
      recommendation_level: score.recommendation_level,
      financials
    };
  });
};

const SCORING_DATA = generateScoringData();

export default function CompanyScoring() {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [filterSector, setFilterSector] = React.useState("全部");
  const [sortBy, setSortBy] = React.useState("overall_score");
  const [expandedCompany, setExpandedCompany] = React.useState<number | null>(null);
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;

  // 过滤和排序
  const filteredData = React.useMemo(() => {
    let result = SCORING_DATA;

    if (searchTerm) {
      result = result.filter(item =>
        item.company.short_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.company.code.includes(searchTerm)
      );
    }

    if (filterSector !== "全部") {
      result = result.filter(item => item.company.sector === filterSector);
    }

    // 排序
    result.sort((a, b) => {
      if (sortBy === "overall_score") return b.overall_score - a.overall_score;
      if (sortBy === "financial_health") return b.financial_health - a.financial_health;
      if (sortBy === "growth_potential") return b.growth_potential - a.growth_potential;
      return 0;
    });

    return result;
  }, [searchTerm, filterSector, sortBy]);

  // 分页
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const sectors = ["全部", ...new Set(SCORING_DATA.map(d => d.company.sector))];
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const getRatingColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 70) return "text-blue-500";
    if (score >= 60) return "text-yellow-500";
    if (score >= 50) return "text-orange-500";
    return "text-red-500";
  };

  const getRecommendationBg = (level: number) => {
    if (level === 5) return "bg-green-900/30 border-green-500";
    if (level === 4) return "bg-blue-900/30 border-blue-500";
    if (level === 3) return "bg-yellow-900/30 border-yellow-500";
    if (level === 2) return "bg-orange-900/30 border-orange-500";
    return "bg-red-900/30 border-red-500";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 标题 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">📊 企业评分系统</h1>
          <p className="text-slate-400">多维度评分，助力投资决策</p>
        </div>

        {/* 搜索和筛选 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="搜索企业名称或代码..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-green-500"
            />
          </div>

          <div className="flex gap-2">
            <Filter size={20} className="text-slate-400 mt-2" />
            <select
              value={filterSector}
              onChange={(e) => {
                setFilterSector(e.target.value);
                setCurrentPage(1);
              }}
              className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-green-500"
            >
              {sectors.map(sector => (
                <option key={sector} value={sector}>{sector}</option>
              ))}
            </select>
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-green-500"
          >
            <option value="overall_score">综合评分 (高到低)</option>
            <option value="financial_health">财务健康度</option>
            <option value="growth_potential">成长潜力</option>
          </select>
        </div>

        {/* 统计信息 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4">
            <p className="text-slate-400 text-sm">总企业数</p>
            <p className="text-2xl font-bold text-white">{SCORING_DATA.length}</p>
          </div>
          <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4">
            <p className="text-slate-400 text-sm">搜索结果</p>
            <p className="text-2xl font-bold text-white">{filteredData.length}</p>
          </div>
          <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4">
            <p className="text-slate-400 text-sm">平均评分</p>
            <p className="text-2xl font-bold text-green-500">
              {(filteredData.reduce((sum, d) => sum + d.overall_score, 0) / filteredData.length).toFixed(1)}
            </p>
          </div>
          <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4">
            <p className="text-slate-400 text-sm">强烈推荐</p>
            <p className="text-2xl font-bold text-green-500">
              {filteredData.filter(d => d.recommendation_level === 5).length}
            </p>
          </div>
        </div>

        {/* 企业评分列表 */}
        <div className="space-y-4">
          {paginatedData.map((item) => (
            <div
              key={item.company.id}
              className={`border rounded-lg p-4 cursor-pointer transition-all ${getRecommendationBg(item.recommendation_level)}`}
              onClick={() => setExpandedCompany(expandedCompany === item.company.id ? null : item.company.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-white">{item.company.short_name}</h3>
                    <span className="text-sm text-slate-400">{item.company.code}</span>
                    <span className="text-xs bg-slate-600 px-2 py-1 rounded">{item.company.industry}</span>
                  </div>
                  <p className="text-sm text-slate-400">{item.company.sector} | {item.recommendation}</p>
                </div>

                <div className="text-right mr-4">
                  <div className={`text-3xl font-bold ${getRatingColor(item.overall_score)}`}>
                    {item.overall_score.toFixed(1)}
                  </div>
                  <p className="text-xs text-slate-400">综合评分</p>
                </div>

                {expandedCompany === item.company.id ? (
                  <ChevronUp className="text-slate-400" />
                ) : (
                  <ChevronDown className="text-slate-400" />
                )}
              </div>

              {/* 展开详情 */}
              {expandedCompany === item.company.id && (
                <div className="mt-4 pt-4 border-t border-slate-600">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-slate-400 text-sm">财务健康度</p>
                      <p className="text-xl font-bold text-green-500">{item.financial_health}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">成长潜力</p>
                      <p className="text-xl font-bold text-blue-500">{item.growth_potential}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">市场竞争力</p>
                      <p className="text-xl font-bold text-purple-500">{item.market_competitiveness}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">风险评估</p>
                      <p className="text-xl font-bold text-orange-500">{item.risk_assessment}</p>
                    </div>
                  </div>

                  {/* 财务数据图表 */}
                  {item.financials.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-bold text-white mb-2">近年财务趋势</p>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={item.financials}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                          <XAxis dataKey="fiscal_year" stroke="#94a3b8" />
                          <YAxis stroke="#94a3b8" />
                          <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }} />
                          <Legend />
                          <Line type="monotone" dataKey="revenue" stroke="#10b981" name="收入" />
                          <Line type="monotone" dataKey="net_profit" stroke="#3b82f6" name="净利润" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 分页 */}
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white disabled:opacity-50"
          >
            上一页
          </button>
          <div className="flex items-center gap-2">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = Math.max(1, currentPage - 2) + i;
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-2 rounded-lg ${
                    currentPage === pageNum
                      ? "bg-green-600 text-white"
                      : "bg-slate-700 border border-slate-600 text-white"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white disabled:opacity-50"
          >
            下一页
          </button>
        </div>

        <p className="text-center text-slate-400 text-sm mt-4">
          第 {currentPage} / {totalPages} 页，共 {filteredData.length} 条结果
        </p>
      </div>
    </div>
  );
}
