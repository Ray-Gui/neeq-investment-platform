import { Search, TrendingUp, AlertCircle, Zap } from "lucide-react";
import React, { useState } from "react";
import marketData from "../data/market-making-data.json";

export default function DealerOpportunities() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRisk, setFilterRisk] = useState("all");

  const filtered = marketData
    .filter(c => c.short_name.includes(searchTerm) || c.code.includes(searchTerm))
    .filter(c => filterRisk === "all" || c.arbitrage_opportunity === filterRisk);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">做市机会识别</h1>
          <p className="text-slate-400">流动性和套利机会分析</p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-4 mb-6 flex gap-4">
          <div className="flex-1 flex items-center gap-2">
            <Search className="w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="搜索企业..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-slate-700 border border-slate-600 rounded px-4 py-2 text-white"
            />
          </div>
          <select
            value={filterRisk}
            onChange={(e) => setFilterRisk(e.target.value)}
            className="bg-slate-700 border border-slate-600 rounded px-4 py-2 text-white"
          >
            <option value="all">全部机会</option>
            <option value="高">高机会</option>
            <option value="中">中机会</option>
            <option value="低">低机会</option>
          </select>
        </div>

        <div className="space-y-4">
          {filtered.map((company) => (
            <div key={company.company_id} className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">{company.short_name}</h3>
                  <p className="text-sm text-slate-400">{company.code} | {company.sector}</p>
                </div>
                <div className={`px-3 py-1 rounded text-sm font-bold ${
                  company.arbitrage_opportunity === "高" ? "bg-red-500/20 text-red-400" :
                  company.arbitrage_opportunity === "中" ? "bg-yellow-500/20 text-yellow-400" :
                  "bg-green-500/20 text-green-400"
                }`}>
                  {company.arbitrage_opportunity}机会
                </div>
              </div>

              <div className="grid grid-cols-5 gap-4">
                <div className="bg-slate-700/50 rounded p-3">
                  <p className="text-xs text-slate-400">当前价格</p>
                  <p className="text-lg font-bold text-white">¥{company.current_price}</p>
                </div>
                <div className="bg-slate-700/50 rounded p-3">
                  <p className="text-xs text-slate-400">流动性评分</p>
                  <p className="text-lg font-bold text-blue-400">{company.liquidity_score}</p>
                </div>
                <div className="bg-slate-700/50 rounded p-3">
                  <p className="text-xs text-slate-400">波动率</p>
                  <p className="text-lg font-bold text-purple-400">{company.volatility}%</p>
                </div>
                <div className="bg-slate-700/50 rounded p-3">
                  <p className="text-xs text-slate-400">上升空间</p>
                  <p className="text-lg font-bold text-green-400">+{company.upside_potential}%</p>
                </div>
                <div className="bg-slate-700/50 rounded p-3">
                  <p className="text-xs text-slate-400">下行风险</p>
                  <p className="text-lg font-bold text-red-400">{company.downside_risk}%</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import React from "react";
