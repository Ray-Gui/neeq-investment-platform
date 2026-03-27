import { TrendingUp, Award, Target, AlertCircle } from "lucide-react";
import portfolioData from "../data/investment-portfolio-data.json";

export default function InvestmentDecision() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">投资决策</h1>
          <p className="text-slate-400">综合投资建议和组合配置</p>
        </div>

        <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">优选投资组合</h2>
          <p className="text-slate-300 mb-4">基于多维度评分和风险评估，精选 {portfolioData.length} 家优质企业</p>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-800/50 rounded p-4">
              <p className="text-sm text-slate-400">平均预期收益</p>
              <p className="text-2xl font-bold text-green-400">{(portfolioData.reduce((sum, c) => sum + c.expected_return, 0) / portfolioData.length).toFixed(1)}%</p>
            </div>
            <div className="bg-slate-800/50 rounded p-4">
              <p className="text-sm text-slate-400">平均投资评分</p>
              <p className="text-2xl font-bold text-blue-400">{(portfolioData.reduce((sum, c) => sum + c.investment_score, 0) / portfolioData.length).toFixed(1)}</p>
            </div>
            <div className="bg-slate-800/50 rounded p-4">
              <p className="text-sm text-slate-400">组合企业数</p>
              <p className="text-2xl font-bold text-purple-400">{portfolioData.length}</p>
            </div>
            <div className="bg-slate-800/50 rounded p-4">
              <p className="text-sm text-slate-400">平均风险等级</p>
              <p className="text-2xl font-bold text-yellow-400">中低</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {portfolioData.map((company) => (
            <div key={company.company_id} className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="w-5 h-5 text-yellow-400" />
                    <span className="text-sm font-bold text-yellow-400">排名 #{company.rank}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white">{company.short_name}</h3>
                  <p className="text-sm text-slate-400">{company.code} | {company.sector}</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-green-400">+{company.expected_return}%</div>
                  <p className="text-sm text-slate-400">预期收益</p>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-4 mb-4">
                <div className="bg-slate-700/50 rounded p-3">
                  <p className="text-xs text-slate-400">投资评分</p>
                  <p className="text-lg font-bold text-blue-400">{company.investment_score}</p>
                </div>
                <div className="bg-slate-700/50 rounded p-3">
                  <p className="text-xs text-slate-400">财务健康</p>
                  <p className="text-lg font-bold text-green-400">{company.financial_health}</p>
                </div>
                <div className="bg-slate-700/50 rounded p-3">
                  <p className="text-xs text-slate-400">成长潜力</p>
                  <p className="text-lg font-bold text-purple-400">{company.growth_potential}</p>
                </div>
                <div className="bg-slate-700/50 rounded p-3">
                  <p className="text-xs text-slate-400">市场竞争力</p>
                  <p className="text-lg font-bold text-orange-400">{company.market_competitiveness}</p>
                </div>
                <div className="bg-slate-700/50 rounded p-3">
                  <p className="text-xs text-slate-400">配置权重</p>
                  <p className="text-lg font-bold text-white">{company.allocation_weight}%</p>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-700">
                <div>
                  <span className="text-xs text-slate-400">投资期限: </span>
                  <span className="text-sm font-bold text-white">{company.investment_period}</span>
                </div>
                <div className={`px-3 py-1 rounded text-sm font-bold ${
                  company.recommendation === "强烈推荐" ? "bg-green-500/20 text-green-400" : "bg-blue-500/20 text-blue-400"
                }`}>
                  {company.recommendation}
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
