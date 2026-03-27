import { Search, Zap, Filter, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import React, { useState, useMemo } from "react";
import { useLocation } from "wouter";
import marketData from "../data/market-making-data.json";

interface MarketItem {
  rank: number;
  code: string;
  short_name: string;
  sector: string;
  industry: string;
  liquidity_score: number;
  opportunity_level: string;
  arbitrage_opportunity: string;
  upside: number;
  risk_level: string;
  pe_ttm?: number;
  pb?: number;
  market_cap?: number;
  roe?: number;
  gross_margin?: number;
  revenue_growth?: number;
  listing_date?: string;
  score_explanation?: {
    liquidity: string;
    arbitrage: string;
    risk: string;
  };
}

export default function DealerOpportunities() {
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterOpportunity, setFilterOpportunity] = useState("all");
  const [filterSector, setFilterSector] = useState("全部");
  const [sortBy, setSortBy] = useState<"liquidity" | "upside" | "opportunity">("liquidity");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedCode, setExpandedCode] = useState<string | null>(null);
  const pageSize = 15;

  const sectors = ["全部", "医疗健康", "新能源", "人工智能"];

  const filteredData = useMemo(() => {
    let filtered = marketData as MarketItem[];
    if (searchTerm) {
      const kw = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (c) => c.short_name.toLowerCase().includes(kw) || c.code.includes(kw)
      );
    }
    if (filterOpportunity !== "all") {
      filtered = filtered.filter((c) => c.arbitrage_opportunity === filterOpportunity);
    }
    if (filterSector !== "全部") {
      filtered = filtered.filter((c) => c.sector === filterSector);
    }
    filtered = [...filtered].sort((a, b) => {
      if (sortBy === "liquidity") return b.liquidity_score - a.liquidity_score;
      if (sortBy === "upside") return b.upside - a.upside;
      if (sortBy === "opportunity") return (b.arbitrage_opportunity === "高" ? 3 : b.arbitrage_opportunity === "中" ? 2 : 1) - (a.arbitrage_opportunity === "高" ? 3 : a.arbitrage_opportunity === "中" ? 2 : 1);
      return 0;
    });
    return filtered;
  }, [searchTerm, filterOpportunity, filterSector, sortBy]);

  const totalPages = Math.ceil(filteredData.length / pageSize);
  const pagedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const allData = marketData as MarketItem[];
  const highOppCount = allData.filter((c) => c.arbitrage_opportunity === "高").length;
  const avgLiquidity = (allData.reduce((s, c) => s + c.liquidity_score, 0) / allData.length).toFixed(1);

  const getOppColor = (opp: string) => {
    if (opp === "高") return "bg-red-500/20 text-red-400 border border-red-500/30";
    if (opp === "中") return "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30";
    return "bg-green-500/20 text-green-400 border border-green-500/30";
  };

  const getRiskColor = (risk: string) => {
    if (risk === "高") return "text-red-400";
    if (risk === "中") return "text-yellow-400";
    return "text-green-400";
  };

  const getLiquidityColor = (score: number) => {
    if (score >= 70) return "text-green-400";
    if (score >= 50) return "text-yellow-400";
    return "text-orange-400";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Zap className="w-8 h-8 text-yellow-400" />
            做市机会识别
          </h1>
          <p className="text-slate-400">基于真实财务数据分析流动性和套利机会 · 共 {allData.length} 家企业</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <p className="text-sm text-slate-400">覆盖企业数</p>
            <p className="text-2xl font-bold text-white">{allData.length} 家</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <p className="text-sm text-slate-400">高套利机会企业</p>
            <p className="text-2xl font-bold text-red-400">{highOppCount} 家</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <p className="text-sm text-slate-400">平均流动性评分</p>
            <p className="text-2xl font-bold text-blue-400">{avgLiquidity}</p>
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
            value={filterOpportunity}
            onChange={(e) => { setFilterOpportunity(e.target.value); setCurrentPage(1); }}
            className="bg-slate-700 border border-slate-600 rounded px-4 py-2 text-white text-sm"
          >
            <option value="all">全部机会</option>
            <option value="高">高套利机会</option>
            <option value="中">中套利机会</option>
            <option value="低">低套利机会</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "liquidity" | "upside" | "opportunity")}
            className="bg-slate-700 border border-slate-600 rounded px-4 py-2 text-white text-sm"
          >
            <option value="liquidity">按流动性评分</option>
            <option value="upside">按上升空间</option>
            <option value="opportunity">按套利机会</option>
          </select>
          <div className="flex items-center text-sm text-slate-400">
            共 <span className="text-white font-bold mx-1">{filteredData.length}</span> 家企业
          </div>
        </div>

        <div className="space-y-3">
          {pagedData.map((company) => (
            <div key={company.code} className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg hover:border-cyan-500/40 transition-colors">
              <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-bold text-white">{company.short_name}</h3>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${getOppColor(company.arbitrage_opportunity)}`}>
                        {company.arbitrage_opportunity}套利机会
                      </span>
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
                    <div className={`text-3xl font-bold ${getLiquidityColor(company.liquidity_score)}`}>
                      {company.liquidity_score.toFixed(1)}
                    </div>
                    <p className="text-sm text-slate-400">流动性评分</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                  <div className="bg-slate-700/50 rounded p-3">
                    <p className="text-xs text-slate-400">PB（市净率）</p>
                    <p className={`text-lg font-bold ${(company.pb ?? 1) < 1 ? 'text-red-400' : 'text-white'}`}>
                      {company.pb != null ? company.pb.toFixed(2) : 'N/A'}
                    </p>
                  </div>
                  <div className="bg-slate-700/50 rounded p-3">
                    <p className="text-xs text-slate-400">PE(TTM)</p>
                    <p className="text-lg font-bold text-white">{company.pe_ttm != null ? company.pe_ttm.toFixed(2) : 'N/A'}</p>
                  </div>
                  <div className="bg-slate-700/50 rounded p-3">
                    <p className="text-xs text-slate-400">上升空间</p>
                    <p className="text-lg font-bold text-green-400">+{company.upside.toFixed(1)}%</p>
                  </div>
                  <div className="bg-slate-700/50 rounded p-3">
                    <p className="text-xs text-slate-400">风险等级</p>
                    <p className={`text-lg font-bold ${getRiskColor(company.risk_level)}`}>{company.risk_level}</p>
                  </div>
                </div>

                <button
                  onClick={() => setExpandedCode(expandedCode === company.code ? null : company.code)}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
                >
                  {expandedCode === company.code ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  {expandedCode === company.code ? '收起评分依据' : '查看评分依据'}
                </button>
              </div>

              {expandedCode === company.code && (
                <div className="border-t border-slate-700 p-5 bg-slate-900/30">
                  <h4 className="text-sm font-semibold text-cyan-400 mb-3">做市机会评分计算过程</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-400 mb-2">真实财务数据</p>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between bg-slate-700/50 rounded px-2 py-1">
                          <span className="text-slate-400">市值</span>
                          <span className="text-white font-bold">{company.market_cap != null ? (company.market_cap >= 10000 ? (company.market_cap/10000).toFixed(1)+'亿' : company.market_cap.toFixed(0)+'万') : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between bg-slate-700/50 rounded px-2 py-1">
                          <span className="text-slate-400">PB（市净率）</span>
                          <span className={`font-bold ${(company.pb ?? 1) < 1 ? 'text-red-400' : 'text-white'}`}>{company.pb != null ? company.pb.toFixed(2) : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between bg-slate-700/50 rounded px-2 py-1">
                          <span className="text-slate-400">PE(TTM)</span>
                          <span className="text-white font-bold">{company.pe_ttm != null ? company.pe_ttm.toFixed(2) : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between bg-slate-700/50 rounded px-2 py-1">
                          <span className="text-slate-400">ROE</span>
                          <span className="text-white font-bold">{company.roe != null ? company.roe.toFixed(2) + '%' : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between bg-slate-700/50 rounded px-2 py-1">
                          <span className="text-slate-400">毛利率</span>
                          <span className="text-white font-bold">{company.gross_margin != null ? company.gross_margin.toFixed(2) + '%' : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between bg-slate-700/50 rounded px-2 py-1">
                          <span className="text-slate-400">营收增长</span>
                          <span className={`font-bold ${(company.revenue_growth ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>{company.revenue_growth != null ? company.revenue_growth.toFixed(2) + '%' : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between bg-slate-700/50 rounded px-2 py-1">
                          <span className="text-slate-400">挂牌日期</span>
                          <span className="text-white font-bold">{company.listing_date ?? 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      {company.score_explanation && (
                        <div className="space-y-2 text-xs">
                          <div className="bg-blue-500/10 border border-blue-500/20 rounded p-2">
                            <p className="text-blue-400 font-semibold mb-1">流动性评分 = {company.liquidity_score.toFixed(1)}</p>
                            <p className="text-slate-300">{company.score_explanation.liquidity}</p>
                          </div>
                          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded p-2">
                            <p className="text-yellow-400 font-semibold mb-1">套利机会判断：{company.arbitrage_opportunity}</p>
                            <p className="text-slate-300">{company.score_explanation.arbitrage}</p>
                          </div>
                          <div className="bg-green-500/10 border border-green-500/20 rounded p-2">
                            <p className="text-green-400 font-semibold mb-1">风险评级：{company.risk_level}</p>
                            <p className="text-slate-300">{company.score_explanation.risk}</p>
                          </div>
                        </div>
                      )}
                      <div className="mt-3 bg-slate-700/50 rounded p-2 text-xs">
                        <p className="text-cyan-400 font-semibold mb-1">上升空间计算</p>
                        <p className="text-slate-300">
                          {(company.pb ?? 1) < 1
                            ? `PB=${company.pb?.toFixed(2)}，低于净资产，理论上升空间 = (1/PB - 1) × 100% = +${company.upside.toFixed(1)}%`
                            : `基于行业平均PE估值，预计上升空间 = +${company.upside.toFixed(1)}%`
                          }
                        </p>
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
