import { Search, TrendingUp, Filter, ExternalLink, ChevronDown, ChevronUp, ArrowLeft } from "lucide-react";
import React, { useState, useMemo } from "react";
import { useLocation } from "wouter";
import listingData from "../data/listing-potential-data.json";

interface ListingItem {
  rank: number;
  code: string;
  short_name: string;
  sector: string;
  industry: string;
  listing_probability: number;
  potential_level: string;
  recommendation: string;
  profitability_score: number;
  growth_score: number;
  market_potential_score: number;
  estimated_ipo_price?: number | null;
  estimated_pe?: number | null;
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

export default function ListingPotential() {
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("probability");
  const [filterSector, setFilterSector] = useState("全部");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedCode, setExpandedCode] = useState<string | null>(null);
  const pageSize = 15;

  const sectors = ["全部", "医疗健康", "新能源", "人工智能"];

  const filteredSorted = useMemo(() => {
    let filtered = listingData as ListingItem[];
    if (searchTerm) {
      const kw = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (c) => c.short_name.toLowerCase().includes(kw) || c.code.includes(kw)
      );
    }
    if (filterSector !== "全部") {
      filtered = filtered.filter((c) => c.sector === filterSector);
    }
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === "probability") return b.listing_probability - a.listing_probability;
      if (sortBy === "ipo_price") return b.estimated_ipo_price - a.estimated_ipo_price;
      if (sortBy === "profitability") return b.profitability_score - a.profitability_score;
      return 0;
    });
    return sorted;
  }, [searchTerm, filterSector, sortBy]);

  const totalPages = Math.ceil(filteredSorted.length / pageSize);
  const pagedData = filteredSorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const allData = listingData as ListingItem[];
  const highProbCount = allData.filter((c) => c.listing_probability >= 60).length;
  const avgProb = (allData.reduce((s, c) => s + c.listing_probability, 0) / allData.length).toFixed(1);

  const getProbColor = (prob: number) => {
    if (prob >= 70) return "text-green-400";
    if (prob >= 50) return "text-yellow-400";
    if (prob >= 30) return "text-orange-400";
    return "text-red-400";
  };

  const getProbBg = (prob: number) => {
    if (prob >= 70) return "bg-green-500";
    if (prob >= 50) return "bg-yellow-500";
    if (prob >= 30) return "bg-orange-500";
    return "bg-red-500";
  };

  const getLevelBadge = (level: string) => {
    if (level === "高") return "bg-green-500/20 text-green-400 border border-green-500/30";
    if (level === "中") return "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30";
    return "bg-red-500/20 text-red-400 border border-red-500/30";
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
            <TrendingUp className="w-8 h-8 text-blue-400" />
            上市潜力分析
          </h1>
          <p className="text-slate-400">基于真实财务数据预测企业上市潜力 · 共 {allData.length} 家企业</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <p className="text-sm text-slate-400">覆盖企业数</p>
            <p className="text-2xl font-bold text-white">{allData.length} 家</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <p className="text-sm text-slate-400">高潜力企业（≥60%）</p>
            <p className="text-2xl font-bold text-green-400">{highProbCount} 家</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <p className="text-sm text-slate-400">平均上市概率</p>
            <p className="text-2xl font-bold text-blue-400">{avgProb}%</p>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-4 mb-6 flex flex-wrap gap-4">
          <div className="flex-1 min-w-48 flex items-center gap-2">
            <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="搜索企业..."
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
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-slate-700 border border-slate-600 rounded px-4 py-2 text-white text-sm"
          >
            <option value="probability">按上市概率</option>
            <option value="ipo_price">按IPO价格</option>
            <option value="profitability">按盈利能力</option>
          </select>
          <div className="flex items-center text-sm text-slate-400">
            共 <span className="text-white font-bold mx-1">{filteredSorted.length}</span> 家企业
          </div>
        </div>

        <div className="space-y-3">
          {pagedData.map((company) => (
            <div key={company.code} className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg hover:border-cyan-500/40 transition-colors">
              {/* 主行 */}
              <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-bold text-white">{company.short_name}</h3>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${getLevelBadge(company.potential_level)}`}>
                        {company.potential_level}潜力
                      </span>
                      <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-400 rounded text-xs">{company.recommendation}</span>
                      <button
                        onClick={() => navigate(`/company/${encodeURIComponent(company.code)}`)}
                        className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 px-2 py-1 rounded transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />详情
                      </button>
                    </div>
                    <p className="text-sm text-slate-400 mt-1">{company.code} | {company.sector} · {company.industry}</p>
                  </div>
                  <div className="text-right">
                    <div className={`text-3xl font-bold ${getProbColor(company.listing_probability)}`}>
                      {company.listing_probability.toFixed(1)}%
                    </div>
                    <p className="text-sm text-slate-400">上市概率</p>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className={`${getProbBg(company.listing_probability)} h-2 rounded-full transition-all`}
                      style={{ width: `${Math.min(100, company.listing_probability)}%` }}
                    />
                  </div>
                </div>

                {/* 三项子分 */}
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div className="bg-slate-700/50 rounded p-3 text-center">
                    <p className="text-xs text-slate-400 mb-1">盈利能力（40%）</p>
                    <p className={`text-xl font-bold ${company.profitability_score >= 60 ? 'text-green-400' : company.profitability_score >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {company.profitability_score.toFixed(1)}
                    </p>
                  </div>
                  <div className="bg-slate-700/50 rounded p-3 text-center">
                    <p className="text-xs text-slate-400 mb-1">成长性（35%）</p>
                    <p className={`text-xl font-bold ${company.growth_score >= 60 ? 'text-green-400' : company.growth_score >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {company.growth_score.toFixed(1)}
                    </p>
                  </div>
                  <div className="bg-slate-700/50 rounded p-3 text-center">
                    <p className="text-xs text-slate-400 mb-1">市场潜力（25%）</p>
                    <p className={`text-xl font-bold ${company.market_potential_score >= 60 ? 'text-green-400' : company.market_potential_score >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {company.market_potential_score.toFixed(1)}
                    </p>
                  </div>
                </div>

                {/* 展开/收起按钮 */}
                <button
                  onClick={() => setExpandedCode(expandedCode === company.code ? null : company.code)}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
                >
                  {expandedCode === company.code ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  {expandedCode === company.code ? '收起评分依据' : '查看评分依据'}
                </button>
              </div>

              {/* 展开的评分依据 */}
              {expandedCode === company.code && (
                <div className="border-t border-slate-700 p-5 bg-slate-900/30">
                  <h4 className="text-sm font-semibold text-cyan-400 mb-3">上市潜力评分计算过程</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
                          <span className="text-slate-400">负债率</span>
                          <span className="text-white font-bold">{company.debt_ratio != null ? company.debt_ratio.toFixed(1) + '%' : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between bg-slate-700/50 rounded px-2 py-1">
                          <span className="text-slate-400">净利率</span>
                          <span className="text-white font-bold">{company.net_margin != null ? company.net_margin.toFixed(1) + '%' : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between bg-slate-700/50 rounded px-2 py-1">
                          <span className="text-slate-400">流动比率</span>
                          <span className="text-white font-bold">{company.current_ratio != null ? company.current_ratio.toFixed(2) + 'x' : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between bg-slate-700/50 rounded px-2 py-1">
                          <span className="text-slate-400">财务年度</span>
                          <span className="text-white font-bold">{company.fiscal_year ?? 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-2">评分说明</p>
                      {company.score_explanation && (
                        <div className="space-y-2 text-xs">
                          <div className="bg-blue-500/10 border border-blue-500/20 rounded p-2">
                            <p className="text-blue-400 font-semibold mb-1">盈利能力评分 = {company.profitability_score.toFixed(1)}</p>
                          </div>
                          <div className="bg-green-500/10 border border-green-500/20 rounded p-2">
                            <p className="text-green-400 font-semibold mb-1">成长性评分 = {company.growth_score.toFixed(1)}</p>
                          </div>
                          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded p-2">
                            <p className="text-yellow-400 font-semibold mb-1">市场潜力评分 = {company.market_potential_score.toFixed(1)}</p>
                          </div>
                          <div className="bg-slate-700/50 rounded p-2">
                            <p className="text-slate-300">{company.score_explanation}</p>
                          </div>
                        </div>
                      )}
                      <div className="mt-3 bg-slate-700/50 rounded p-2 text-xs">
                        <p className="text-cyan-400 font-semibold mb-1">上市概率公式</p>
                        <p className="text-slate-300">
                          = 盈利能力×40% + 成长性×35% + 市场潜力×25%<br/>
                          = {company.profitability_score.toFixed(1)}×40% + {company.growth_score.toFixed(1)}×35% + {company.market_potential_score.toFixed(1)}×25%<br/>
                          = {(company.profitability_score*0.4).toFixed(1)} + {(company.growth_score*0.35).toFixed(1)} + {(company.market_potential_score*0.25).toFixed(1)}<br/>
                          = <strong className="text-white">{company.listing_probability.toFixed(1)}%</strong>
                        </p>
                      </div>
                    </div>
                  </div>
                  {company.estimated_ipo_price != null && (
                    <div className="bg-slate-700/30 rounded p-3 text-xs">
                      <p className="text-slate-400">预计IPO价格：<span className="text-green-400 font-bold">¥{company.estimated_ipo_price.toFixed(2)}</span>
                      {company.estimated_pe && <span className="text-slate-500 ml-2">（基于{company.estimated_pe}x PE估算）</span>}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-700">
          <span className="text-sm text-slate-400">
            第 {currentPage} / {totalPages} 页，共 {filteredSorted.length} 条
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
