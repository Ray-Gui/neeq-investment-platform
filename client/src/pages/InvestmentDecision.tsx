import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { Award, TrendingUp, Target, Filter, Search, ExternalLink } from "lucide-react";
import investmentData from "../data/investment-decision-data.json";

interface InvestmentItem {
  company_id: number;
  code: string;
  short_name: string;
  sector: string;
  overall_score: number;
  investment_rating: string;
  entry_price_range: number[];
  target_price: number;
  expected_return: number;
  risk_rating: string;
  holding_period: string;
  key_catalysts: string[];
  portfolio_allocation: number;
}

export default function InvestmentDecision() {
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSector, setFilterSector] = useState("全部");
  const [filterRating, setFilterRating] = useState("全部");
  const [sortBy, setSortBy] = useState<"score" | "return" | "allocation">("score");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const sectors = ["全部", "医疗健康", "新能源", "人工智能"];
  const ratings = ["全部", "强烈推荐", "推荐", "中性", "避免"];

  const filteredData = useMemo(() => {
    let filtered = investmentData as InvestmentItem[];
    if (searchTerm) {
      const kw = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (d) => d.short_name.toLowerCase().includes(kw) || d.code.includes(kw)
      );
    }
    if (filterSector !== "全部") {
      filtered = filtered.filter((d) => d.sector === filterSector);
    }
    if (filterRating !== "全部") {
      filtered = filtered.filter((d) => d.investment_rating === filterRating);
    }
    filtered = [...filtered].sort((a, b) => {
      if (sortBy === "score") return b.overall_score - a.overall_score;
      if (sortBy === "return") return b.expected_return - a.expected_return;
      if (sortBy === "allocation") return b.portfolio_allocation - a.portfolio_allocation;
      return 0;
    });
    return filtered;
  }, [searchTerm, filterSector, filterRating, sortBy]);

  const totalPages = Math.ceil(filteredData.length / pageSize);
  const pagedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const allData = investmentData as InvestmentItem[];
  const avgReturn = (allData.reduce((s, c) => s + c.expected_return, 0) / allData.length * 100).toFixed(1);
  const avgScore = (allData.reduce((s, c) => s + c.overall_score, 0) / allData.length).toFixed(1);
  const recommendCount = allData.filter((c) => c.investment_rating === "强烈推荐" || c.investment_rating === "推荐").length;

  const getRatingColor = (rating: string) => {
    if (rating === "强烈推荐") return "bg-green-500/20 text-green-400";
    if (rating === "推荐") return "bg-blue-500/20 text-blue-400";
    if (rating === "中性") return "bg-yellow-500/20 text-yellow-400";
    return "bg-red-500/20 text-red-400";
  };

  const getRiskColor = (risk: string) => {
    if (risk === "低风险") return "text-green-400";
    if (risk === "中风险") return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Target className="w-8 h-8 text-blue-400" />
            投资决策
          </h1>
          <p className="text-slate-400">综合投资建议和组合配置 · 共 {allData.length} 家企业</p>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-lg p-4">
            <p className="text-sm text-slate-400">覆盖企业数</p>
            <p className="text-2xl font-bold text-white">{allData.length} 家</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <p className="text-sm text-slate-400">平均预期收益</p>
            <p className="text-2xl font-bold text-green-400">+{avgReturn}%</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <p className="text-sm text-slate-400">平均投资评分</p>
            <p className="text-2xl font-bold text-blue-400">{avgScore}</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <p className="text-sm text-slate-400">推荐企业数</p>
            <p className="text-2xl font-bold text-purple-400">{recommendCount} 家</p>
          </div>
        </div>

        {/* 筛选栏 */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-4 mb-6 flex flex-wrap gap-4">
          <div className="flex-1 min-w-48 flex items-center gap-2">
            <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="搜索企业名称或代码..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="flex-1 bg-slate-700 border border-slate-600 rounded px-4 py-2 text-white text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-slate-400" />
            <select
              value={filterSector}
              onChange={(e) => { setFilterSector(e.target.value); setCurrentPage(1); }}
              className="bg-slate-700 border border-slate-600 rounded px-4 py-2 text-white text-sm"
            >
              {sectors.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <select
            value={filterRating}
            onChange={(e) => { setFilterRating(e.target.value); setCurrentPage(1); }}
            className="bg-slate-700 border border-slate-600 rounded px-4 py-2 text-white text-sm"
          >
            {ratings.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "score" | "return" | "allocation")}
            className="bg-slate-700 border border-slate-600 rounded px-4 py-2 text-white text-sm"
          >
            <option value="score">按投资评分</option>
            <option value="return">按预期收益</option>
            <option value="allocation">按配置权重</option>
          </select>
          <div className="flex items-center text-sm text-slate-400">
            共 <span className="text-white font-bold mx-1">{filteredData.length}</span> 家企业
          </div>
        </div>

        {/* 企业列表 */}
        <div className="space-y-3">
          {pagedData.map((company, index) => (
            <div key={company.company_id} className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-5 hover:border-cyan-500/40 transition-colors">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Award className="w-4 h-4 text-yellow-400" />
                    <span className="text-xs font-bold text-yellow-400">
                      #{(currentPage - 1) * pageSize + index + 1}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${getRatingColor(company.investment_rating)}`}>
                      {company.investment_rating}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white">{company.short_name}</h3>
                    <button
                      onClick={() => navigate(`/company/${encodeURIComponent(company.code)}`)}
                      className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 px-2 py-1 rounded transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />详情
                    </button>
                  </div>
                  <p className="text-sm text-slate-400">{company.code} | {company.sector}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-400">
                    +{(company.expected_return * 100).toFixed(1)}%
                  </div>
                  <p className="text-xs text-slate-400">预期收益</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="bg-slate-700/50 rounded p-2">
                  <p className="text-xs text-slate-400">投资评分</p>
                  <p className="text-base font-bold text-blue-400">{company.overall_score.toFixed(1)}</p>
                </div>
                <div className="bg-slate-700/50 rounded p-2">
                  <p className="text-xs text-slate-400">目标价格</p>
                  <p className="text-base font-bold text-green-400">¥{company.target_price.toFixed(2)}</p>
                </div>
                <div className="bg-slate-700/50 rounded p-2">
                  <p className="text-xs text-slate-400">风险等级</p>
                  <p className={`text-base font-bold ${getRiskColor(company.risk_rating)}`}>{company.risk_rating}</p>
                </div>
                <div className="bg-slate-700/50 rounded p-2">
                  <p className="text-xs text-slate-400">持仓周期</p>
                  <p className="text-base font-bold text-white">{company.holding_period}</p>
                </div>
                <div className="bg-slate-700/50 rounded p-2">
                  <p className="text-xs text-slate-400">配置权重</p>
                  <p className="text-base font-bold text-purple-400">{(company.portfolio_allocation * 100).toFixed(1)}%</p>
                </div>
              </div>
              {company.key_catalysts && company.key_catalysts.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-700">
                  <span className="text-xs text-slate-400">关键催化剂：</span>
                  <span className="text-xs text-slate-300 ml-1">{company.key_catalysts.join(" · ")}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 分页 */}
        <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-700">
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
  );
}
