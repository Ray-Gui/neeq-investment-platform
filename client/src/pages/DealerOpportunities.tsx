import { Search, TrendingUp, AlertCircle, Zap, Filter } from "lucide-react";
import React, { useState, useMemo } from "react";
import marketData from "../data/market-making-data.json";

interface MarketItem {
  company_id: number;
  code: string;
  short_name: string;
  sector: string;
  liquidity_score: number;
  trading_volume_avg: number;
  bid_ask_spread: number;
  volatility: number;
  arbitrage_opportunity: string;
  maker_incentive: number;
  estimated_daily_volume: number;
  risk_level: string;
  opportunity_score: number;
  current_price: number;
  upside_potential: number;
  downside_risk: number;
}

export default function DealerOpportunities() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterOpportunity, setFilterOpportunity] = useState("all");
  const [filterSector, setFilterSector] = useState("全部");
  const [sortBy, setSortBy] = useState<"opportunity" | "liquidity" | "upside">("opportunity");
  const [currentPage, setCurrentPage] = useState(1);
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
      if (sortBy === "opportunity") return b.opportunity_score - a.opportunity_score;
      if (sortBy === "liquidity") return b.liquidity_score - a.liquidity_score;
      if (sortBy === "upside") return b.upside_potential - a.upside_potential;
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
    if (opp === "高") return "bg-red-500/20 text-red-400";
    if (opp === "中") return "bg-yellow-500/20 text-yellow-400";
    return "bg-green-500/20 text-green-400";
  };

  const getRiskColor = (risk: string) => {
    if (risk === "高") return "text-red-400";
    if (risk === "中") return "text-yellow-400";
    return "text-green-400";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Zap className="w-8 h-8 text-yellow-400" />
            做市机会识别
          </h1>
          <p className="text-slate-400">流动性和套利机会分析 · 共 {allData.length} 家企业</p>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <p className="text-sm text-slate-400">覆盖企业数</p>
            <p className="text-2xl font-bold text-white">{allData.length} 家</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <p className="text-sm text-slate-400">高机会企业</p>
            <p className="text-2xl font-bold text-red-400">{highOppCount} 家</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <p className="text-sm text-slate-400">平均流动性评分</p>
            <p className="text-2xl font-bold text-blue-400">{avgLiquidity}</p>
          </div>
        </div>

        {/* 筛选栏 */}
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
            <option value="高">高机会</option>
            <option value="中">中机会</option>
            <option value="低">低机会</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "opportunity" | "liquidity" | "upside")}
            className="bg-slate-700 border border-slate-600 rounded px-4 py-2 text-white text-sm"
          >
            <option value="opportunity">按机会评分</option>
            <option value="liquidity">按流动性</option>
            <option value="upside">按上升空间</option>
          </select>
          <div className="flex items-center text-sm text-slate-400">
            共 <span className="text-white font-bold mx-1">{filteredData.length}</span> 家企业
          </div>
        </div>

        {/* 企业列表 */}
        <div className="space-y-4">
          {pagedData.map((company) => (
            <div key={company.company_id} className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">{company.short_name}</h3>
                  <p className="text-sm text-slate-400">{company.code} | {company.sector}</p>
                </div>
                <div className={`px-3 py-1 rounded text-sm font-bold ${getOppColor(company.arbitrage_opportunity)}`}>
                  {company.arbitrage_opportunity}机会
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-slate-700/50 rounded p-3">
                  <p className="text-xs text-slate-400">当前价格</p>
                  <p className="text-lg font-bold text-white">¥{company.current_price.toFixed(2)}</p>
                </div>
                <div className="bg-slate-700/50 rounded p-3">
                  <p className="text-xs text-slate-400">流动性评分</p>
                  <p className="text-lg font-bold text-blue-400">{company.liquidity_score.toFixed(1)}</p>
                </div>
                <div className="bg-slate-700/50 rounded p-3">
                  <p className="text-xs text-slate-400">波动率</p>
                  <p className="text-lg font-bold text-purple-400">{company.volatility.toFixed(1)}%</p>
                </div>
                <div className="bg-slate-700/50 rounded p-3">
                  <p className="text-xs text-slate-400">上升空间</p>
                  <p className="text-lg font-bold text-green-400">+{company.upside_potential.toFixed(1)}%</p>
                </div>
                <div className="bg-slate-700/50 rounded p-3">
                  <p className="text-xs text-slate-400">下行风险</p>
                  <p className="text-lg font-bold text-red-400">-{company.downside_risk.toFixed(1)}%</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-700 flex justify-between items-center">
                <div className="flex gap-4 text-sm">
                  <span className="text-slate-400">风险等级：<span className={`font-bold ${getRiskColor(company.risk_level)}`}>{company.risk_level}</span></span>
                  <span className="text-slate-400">机会评分：<span className="text-white font-bold">{company.opportunity_score.toFixed(1)}</span></span>
                </div>
                <div className="text-xs text-slate-400">
                  日均成交量：{(company.estimated_daily_volume / 10000).toFixed(1)} 万
                </div>
              </div>
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
