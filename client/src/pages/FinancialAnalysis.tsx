import { Search, TrendingUp, BarChart3, LineChart as LineChartIcon } from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import financialData from "../data/financial-analysis-data.json";

export default function FinancialAnalysis() {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedCompany, setSelectedCompany] = React.useState(null);

  const filtered = financialData.filter(c => 
    c.short_name.includes(searchTerm) || c.code.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">财务分析工具</h1>
          <p className="text-slate-400">对标分析、趋势展示，助力投资决策</p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="搜索企业..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-slate-700 border border-slate-600 rounded px-4 py-2 text-white placeholder-slate-400"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg overflow-hidden max-h-96 overflow-y-auto">
              {filtered.map((company) => (
                <button
                  key={company.company_id}
                  onClick={() => setSelectedCompany(company)}
                  className={`w-full text-left p-4 border-b border-slate-700 hover:bg-slate-700/50 transition ${
                    selectedCompany?.company_id === company.company_id ? "bg-slate-700 border-l-2 border-l-blue-500" : ""
                  }`}
                >
                  <div className="font-semibold text-white">{company.short_name}</div>
                  <div className="text-sm text-slate-400">{company.code}</div>
                  <div className="text-xs text-slate-500">{company.sector}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2">
            {selectedCompany ? (
              <div className="space-y-6">
                <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-6">
                  <h2 className="text-xl font-bold text-white mb-4">{selectedCompany.short_name} - 财务趋势</h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={selectedCompany.financial_data}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="year" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }} />
                      <Legend />
                      <Line type="monotone" dataKey="revenue" stroke="#3b82f6" name="营收" />
                      <Line type="monotone" dataKey="net_profit" stroke="#10b981" name="净利润" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-4">
                    <div className="text-sm text-slate-400">毛利率</div>
                    <div className="text-2xl font-bold text-blue-400">{selectedCompany.financial_data[selectedCompany.financial_data.length - 1]?.gross_margin || 0}%</div>
                  </div>
                  <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-4">
                    <div className="text-sm text-slate-400">净利率</div>
                    <div className="text-2xl font-bold text-green-400">{selectedCompany.financial_data[selectedCompany.financial_data.length - 1]?.net_margin || 0}%</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-12 text-center">
                <BarChart3 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">选择企业查看财务分析</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import React from "react";
