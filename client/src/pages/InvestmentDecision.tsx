import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { Award, Target, Filter, Search, ExternalLink, ChevronDown, ChevronUp, ArrowLeft } from "lucide-react";
import investmentData from "../data/investment-decision-data.json";

interface InvestmentItem {
  rank: number;
  code: string;
  short_name: string;
  sector: string;
  industry: string;
  investment_score: number;
  expected_return: number;
  recommendation: string;
  investment_period: string;
  total_score: number;
  listing_probability: number;
  liquidity_score: number;
  valuation_score: number;
  financial_health: number;
  growth_potential: number;
  market_competitiveness: number;
  roe?: number | null;
  gross_margin?: number | null;
  net_margin?: number | null;
  revenue_growth?: number | null;
  net_profit_growth?: number | null;
  revenue?: number | null;
  net_profit?: number | null;
  market_cap?: number | null;
  debt_ratio?: number | null;
  current_ratio?: number | null;
  fiscal_year?: number | null;
  score_explanation?: string;
}

export default function InvestmentDecision() {
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSector, setFilterSector] = useState("全部");
  const [filterRating, setFilterRating] = useState("全部");
  const [sortBy, setSortBy] = useState<"score" | "return" | "listing">("score");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedCode, setExpandedCode] = useState<string | null>(null);
  const pageSize = 15;

  const sectors = ["全部", "医疗健康", "新能源", "人工智能"];
  const ratings = ["全部", "强烈推荐", "推荐", "中性", "谨慎"];

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
      filtered = filtered.filter((d) => d.recommendation === filterRating);
    }
    filtered = [...filtered].sort((a, b) => {
      if (sortBy === "score") return b.investment_score - a.investment_score;
      if (sortBy === "return") return b.expected_return - a.expected_return;
      if (sortBy === "listing") return b.listing_probability - a.listing_probability;
      return 0;
    });
    return filtered;
  }, [searchTerm, filterSector, filterRating, sortBy]);

  const totalPages = Math.ceil(filteredData.length / pageSize);
  const pagedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const allData = investmentData as InvestmentItem[];
  const avgReturn = (allData.reduce((s, c) => s + c.expected_return, 0) / allData.length).toFixed(1);
  const avgScore = (allData.reduce((s, c) => s + c.investment_score, 0) / allData.length).toFixed(1);
  const recommendCount = allData.filter((c) => c.recommendation === "强烈推荐" || c.recommendation === "推荐").length;

  const getRatingColor = (rating: string) => {
    if (rating === "强烈推荐") return "bg-green-500/20 text-green-400 border border-green-500/30";
    if (rating === "推荐") return "bg-blue-500/20 text-blue-400 border border-blue-500/30";
    if (rating === "中性") return "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30";
    return "bg-red-500/20 text-red-400 border border-red-500/30";
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-green-400";
    if (score >= 55) return "text-blue-400";
    if (score >= 40) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-4">
          <button
            onClick={() => { if (window.history.length > 1) { window.history.back(); } else { navigate('/'); } }}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>返回</span>
          </button>
        </div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Target className="w-8 h-8 text-blue-400" />
            投资决策
          </h1>
          <p className="text-slate-400">基于真实财务数据的综合投资建议 · 共 {allData.length} 家企业</p>
        </div>

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
            onChange={(e) => setSortBy(e.target.value as "score" | "return" | "listing")}
            className="bg-slate-700 border border-slate-600 rounded px-4 py-2 text-white text-sm"
          >
            <option value="score">按投资评分</option>
            <option value="return">按预期收益</option>
            <option value="listing">按上市潜力</option>
          </select>
          <div className="flex items-center text-sm text-slate-400">
            共 <span className="text-white font-bold mx-1">{filteredData.length}</span> 家企业
          </div>
        </div>

        <div className="space-y-3">
          {pagedData.map((company, index) => (
            <div key={company.code} className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg hover:border-cyan-500/40 transition-colors">
              <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Award className="w-4 h-4 text-yellow-400" />
                      <span className="text-xs font-bold text-yellow-400">
                        #{(currentPage - 1) * pageSize + index + 1}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${getRatingColor(company.recommendation)}`}>
                        {company.recommendation}
                      </span>
                      <span className="px-2 py-0.5 bg-slate-700 text-slate-300 rounded text-xs">{company.investment_period}</span>
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
                    <p className="text-sm text-slate-400">{company.code} | {company.sector} · {company.industry}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-400">
                      +{company.expected_return.toFixed(1)}%
                    </div>
                    <p className="text-xs text-slate-400">预期收益</p>
                  </div>
                </div>

                {/* 四维度评分 */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                  <div className="bg-slate-700/50 rounded p-2">
                    <p className="text-xs text-slate-400">综合评分（×40%）</p>
                    <p className={`text-base font-bold ${getScoreColor(company.total_score)}`}>{company.total_score.toFixed(1)}</p>
                  </div>
                  <div className="bg-slate-700/50 rounded p-2">
                    <p className="text-xs text-slate-400">上市潜力（×30%）</p>
                    <p className={`text-base font-bold ${getScoreColor(company.listing_probability)}`}>{company.listing_probability.toFixed(1)}</p>
                  </div>
                  <div className="bg-slate-700/50 rounded p-2">
                    <p className="text-xs text-slate-400">做市机会（×20%）</p>
                    <p className={`text-base font-bold ${getScoreColor(company.liquidity_score)}`}>{company.liquidity_score.toFixed(1)}</p>
                  </div>
                  <div className="bg-slate-700/50 rounded p-2">
                    <p className="text-xs text-slate-400">估值评分（×10%）</p>
                    <p className={`text-base font-bold ${getScoreColor(company.valuation_score)}`}>{company.valuation_score.toFixed(1)}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-slate-400">投资评分：<span className={`font-bold ${getScoreColor(company.investment_score)}`}>{company.investment_score.toFixed(1)}</span></span>
                    <span className="text-slate-400">市値：<span className="text-white font-bold">{company.market_cap != null ? (company.market_cap >= 10000 ? (company.market_cap/10000).toFixed(1)+'亿' : company.market_cap.toFixed(0)+'万') : 'N/A'}</span></span>
                    <span className="text-slate-400">负债率：<span className="text-white font-bold">{company.debt_ratio != null ? company.debt_ratio.toFixed(1)+'%' : 'N/A'}</span></span>
                  </div>
                  <button
                    onClick={() => setExpandedCode(expandedCode === company.code ? null : company.code)}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
                  >
                    {expandedCode === company.code ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    {expandedCode === company.code ? '收起计算过程' : '查看计算过程'}
                  </button>
                </div>
              </div>

              {expandedCode === company.code && (
                <div className="border-t border-slate-700 p-5 bg-slate-900/30">
                  <h4 className="text-sm font-semibold text-cyan-400 mb-3">投资决策评分计算过程</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-400 mb-2">真实财务数据</p>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between bg-slate-700/50 rounded px-2 py-1">
                          <span className="text-slate-400">ROE</span>
                          <span className="text-white font-bold">{company.roe != null ? company.roe.toFixed(2) + '%' : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between bg-slate-700/50 rounded px-2 py-1">
                          <span className="text-slate-400">毛利率</span>
                          <span className="text-white font-bold">{company.gross_margin != null ? company.gross_margin.toFixed(2) + '%' : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between bg-slate-700/50 rounded px-2 py-1">
                          <span className="text-slate-400">营收增长率</span>
                          <span className={`font-bold ${(company.revenue_growth ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>{company.revenue_growth != null ? company.revenue_growth.toFixed(2) + '%' : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between bg-slate-700/50 rounded px-2 py-1">
                          <span className="text-slate-400">净利润增长率</span>
                          <span className={`font-bold ${(company.net_profit_growth ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>{company.net_profit_growth != null ? company.net_profit_growth.toFixed(2) + '%' : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between bg-slate-700/50 rounded px-2 py-1">
                          <span className="text-slate-400">市值</span>
                          <span className="text-white font-bold">{company.market_cap != null ? (company.market_cap >= 10000 ? (company.market_cap/10000).toFixed(1)+'亿' : company.market_cap.toFixed(0)+'万') : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between bg-slate-700/50 rounded px-2 py-1">
                          <span className="text-slate-400">净利率</span>
                          <span className="text-white font-bold">{company.net_margin != null ? company.net_margin.toFixed(1)+'%' : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between bg-slate-700/50 rounded px-2 py-1">
                          <span className="text-slate-400">负债率</span>
                          <span className={`font-bold ${(company.debt_ratio ?? 50) < 50 ? 'text-green-400' : (company.debt_ratio ?? 50) < 70 ? 'text-yellow-400' : 'text-red-400'}`}>{company.debt_ratio != null ? company.debt_ratio.toFixed(1)+'%' : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between bg-slate-700/50 rounded px-2 py-1">
                          <span className="text-slate-400">流动比率</span>
                          <span className="text-white font-bold">{company.current_ratio != null ? company.current_ratio.toFixed(2)+'x' : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between bg-slate-700/50 rounded px-2 py-1">
                          <span className="text-slate-400">财务年度</span>
                          <span className="text-white font-bold">{company.fiscal_year ?? 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      {company.score_explanation && (
                        <div className="space-y-2 text-xs mb-3">
                          <div className="bg-blue-500/10 border border-blue-500/20 rounded p-2">
                            <p className="text-blue-400 font-semibold mb-1">综合评分（×40%）= {(company.total_score * 0.4).toFixed(1)}</p>
                          </div>
                          <div className="bg-green-500/10 border border-green-500/20 rounded p-2">
                            <p className="text-green-400 font-semibold mb-1">上市潜力（×30%）= {(company.listing_probability * 0.3).toFixed(1)}</p>
                          </div>
                          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded p-2">
                            <p className="text-yellow-400 font-semibold mb-1">做市机会（×20%）= {(company.liquidity_score * 0.2).toFixed(1)}</p>
                          </div>
                          <div className="bg-purple-500/10 border border-purple-500/20 rounded p-2">
                            <p className="text-purple-400 font-semibold mb-1">估値评分（×10%）= {(company.valuation_score * 0.1).toFixed(1)}</p>
                          </div>
                          <div className="bg-slate-700/50 rounded p-2">
                            <p className="text-slate-300">{company.score_explanation}</p>
                          </div>
                        </div>
                      )}
                      <div className="bg-slate-700/50 rounded p-2 text-xs">
                        <p className="text-cyan-400 font-semibold mb-1">投资评分公式</p>
                        <p className="text-slate-300">
                          = 综合评分×40% + 上市潜力×30% + 做市机会×20% + 估值×10%<br/>
                          = {(company.total_score * 0.4).toFixed(1)} + {(company.listing_probability * 0.3).toFixed(1)} + {(company.liquidity_score * 0.2).toFixed(1)} + {(company.valuation_score * 0.1).toFixed(1)}<br/>
                          = <strong className="text-white">{company.investment_score.toFixed(1)}</strong>
                        </p>
                        <p className="text-slate-400 mt-2">预期收益 = <span className="text-green-400 font-bold">+{company.expected_return.toFixed(1)}%</span>（基于估值修复空间和成长溢价）</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

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
