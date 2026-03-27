import React from "react";
import { Search, Star, TrendingUp, AlertCircle } from "lucide-react";
import scoringData from "../data/scoring-system-data.json";

export default function CompanyScoring() {
  const [searchTerm, setSearchTerm] = React.useState("");;
  const [filterRating, setFilterRating] = React.useState("all");

  const filtered = scoringData
    .filter(c => c.short_name.includes(searchTerm) || c.code.includes(searchTerm))
    .filter(c => filterRating === "all" || c.rating === filterRating);

  const sorted = [...filtered].sort((a, b) => b.overall_score - a.overall_score);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">评分系统</h1>
          <p className="text-slate-400">多维度评分、投资建议</p>
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
            value={filterRating}
            onChange={(e) => setFilterRating(e.target.value)}
            className="bg-slate-700 border border-slate-600 rounded px-4 py-2 text-white"
          >
            <option value="all">全部评级</option>
            <option value="A+">A+</option>
            <option value="A">A</option>
            <option value="B+">B+</option>
            <option value="B">B</option>
          </select>
        </div>

        <div className="space-y-4">
          {sorted.map((company) => (
            <div key={company.company_id} className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">{company.short_name}</h3>
                  <p className="text-sm text-slate-400">{company.code} | {company.sector}</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-blue-400">{company.overall_score}</div>
                  <div className={`text-lg font-bold ${
                    company.rating === "A+" ? "text-green-400" :
                    company.rating === "A" ? "text-green-400" :
                    company.rating === "B+" ? "text-yellow-400" :
                    "text-orange-400"
                  }`}>{company.rating}</div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 mb-4">
                <div className="bg-slate-700/50 rounded p-3">
                  <p className="text-xs text-slate-400">财务健康</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 bg-slate-600 rounded h-2">
                      <div className="bg-blue-500 h-2 rounded" style={{width: `${company.financial_health}%`}}></div>
                    </div>
                    <span className="text-sm font-bold text-white">{company.financial_health}</span>
                  </div>
                </div>
                <div className="bg-slate-700/50 rounded p-3">
                  <p className="text-xs text-slate-400">成长潜力</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 bg-slate-600 rounded h-2">
                      <div className="bg-green-500 h-2 rounded" style={{width: `${company.growth_potential}%`}}></div>
                    </div>
                    <span className="text-sm font-bold text-white">{company.growth_potential}</span>
                  </div>
                </div>
                <div className="bg-slate-700/50 rounded p-3">
                  <p className="text-xs text-slate-400">市场竞争力</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 bg-slate-600 rounded h-2">
                      <div className="bg-purple-500 h-2 rounded" style={{width: `${company.market_competitiveness}%`}}></div>
                    </div>
                    <span className="text-sm font-bold text-white">{company.market_competitiveness}</span>
                  </div>
                </div>
                <div className="bg-slate-700/50 rounded p-3">
                  <p className="text-xs text-slate-400">风险评估</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 bg-slate-600 rounded h-2">
                      <div className="bg-red-500 h-2 rounded" style={{width: `${company.risk_assessment}%`}}></div>
                    </div>
                    <span className="text-sm font-bold text-white">{company.risk_assessment}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-700">
                <div className="flex flex-wrap gap-2">
                  {company.key_strengths.map((strength, i) => (
                    <span key={i} className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">✓ {strength}</span>
                  ))}
                </div>
                <div className={`px-3 py-1 rounded text-sm font-bold ${
                  company.investment_advice === "强烈推荐" ? "bg-green-500/20 text-green-400" :
                  company.investment_advice === "推荐" ? "bg-blue-500/20 text-blue-400" :
                  "bg-yellow-500/20 text-yellow-400"
                }`}>
                  {company.investment_advice}
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
