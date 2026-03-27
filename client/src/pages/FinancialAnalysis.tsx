import React, { useState, useMemo } from "react";
import { Search, BarChart3, TrendingUp, AlertCircle } from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import financialData from "../data/financial-analysis-complete.json";

export default function FinancialAnalysis() {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedCompanies, setSelectedCompanies] = React.useState<any[]>([]);
  const [selectedSector, setSelectedSector] = React.useState("医疗健康");
  const [analysisMode, setAnalysisMode] = React.useState<"single" | "comparison" | "industry">("single");

  // 按行业分类
  const companiesBySector = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    financialData.forEach(company => {
      if (!grouped[company.sector]) {
        grouped[company.sector] = [];
      }
      grouped[company.sector].push(company);
    });
    return grouped;
  }, []);

  // 获取当前行业的企业列表
  const currentSectorCompanies = useMemo(() => {
    let companies = companiesBySector[selectedSector] || [];
    if (searchTerm) {
      companies = companies.filter(c =>
        c.short_name.includes(searchTerm) || c.code.includes(searchTerm)
      );
    }
    return companies;
  }, [selectedSector, searchTerm, companiesBySector]);

  // 获取行业平均值
  const industryAverage = useMemo(() => {
    if (selectedCompanies.length > 0) {
      return selectedCompanies[0].industry_avg;
    }
    return currentSectorCompanies[0]?.industry_avg || {};
  }, [selectedCompanies, currentSectorCompanies]);

  // 准备对标分析数据
  const benchmarkData = useMemo(() => {
    if (selectedCompanies.length === 0) return [];

    const companies = selectedCompanies.slice(0, 5); // 最多对比5家
    const metrics = ['gross_margin', 'net_margin', 'roe', 'debt_ratio'];
    const data: any[] = [];

    metrics.forEach(metric => {
      const item: any = { metric };
      companies.forEach(company => {
        const latestYear = company.financial_data[company.financial_data.length - 1];
        item[company.short_name] = latestYear[metric] || 0;
      });
      item['行业平均'] = industryAverage[metric] || 0;
      data.push(item);
    });

    return data;
  }, [selectedCompanies, industryAverage]);

  // 准备趋势分析数据
  const trendData = useMemo(() => {
    if (selectedCompanies.length === 0) return [];

    const company = selectedCompanies[0];
    return company.financial_data.map((year: any) => ({
      year: year.year,
      revenue: year.revenue / 1000, // 转换为千元
      net_profit: year.net_profit / 1000,
      gross_margin: year.gross_margin,
      net_margin: year.net_margin,
      roe: year.roe
    }));
  }, [selectedCompanies]);

  // 准备雷达图数据
  const radarData = useMemo(() => {
    if (selectedCompanies.length === 0) return [];

    const company = selectedCompanies[0];
    const latest = company.financial_data[company.financial_data.length - 1];

    return [
      {
        metric: '毛利率',
        value: latest.gross_margin || 0,
        industry: industryAverage.gross_margin || 0
      },
      {
        metric: '净利率',
        value: latest.net_margin || 0,
        industry: industryAverage.net_margin || 0
      },
      {
        metric: 'ROE',
        value: latest.roe || 0,
        industry: industryAverage.roe || 0
      },
      {
        metric: '流动比',
        value: (latest.current_ratio || 0) * 10, // 缩放以便显示
        industry: 15 // 行业平均约1.5
      },
      {
        metric: '资产周转',
        value: (latest.asset_turnover || 0) * 10, // 缩放以便显示
        industry: 12 // 行业平均约1.2
      }
    ];
  }, [selectedCompanies, industryAverage]);

  const toggleCompanySelection = (company: any) => {
    const index = selectedCompanies.findIndex(c => c.company_id === company.company_id);
    if (index >= 0) {
      setSelectedCompanies(selectedCompanies.filter((_, i) => i !== index));
    } else if (selectedCompanies.length < 5) {
      setSelectedCompanies([...selectedCompanies, company]);
    }
  };

  const isCompanySelected = (company: any) => {
    return selectedCompanies.some(c => c.company_id === company.company_id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">财务分析工具</h1>
          <p className="text-slate-400">对标分析、趋势展示、专业投资决策支持</p>
        </div>

        {/* Analysis Mode Selector */}
        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setAnalysisMode("single")}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                analysisMode === "single"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              单企业分析
            </button>
            <button
              onClick={() => setAnalysisMode("comparison")}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                analysisMode === "comparison"
                  ? "bg-green-600 text-white"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              多企业对比
            </button>
            <button
              onClick={() => setAnalysisMode("industry")}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                analysisMode === "industry"
                  ? "bg-purple-600 text-white"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              行业分析
            </button>
          </div>
        </div>

        {/* Sector Selector */}
        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {Object.keys(companiesBySector).map(sector => (
              <button
                key={sector}
                onClick={() => {
                  setSelectedSector(sector);
                  setSelectedCompanies([]);
                }}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  selectedSector === sector
                    ? "bg-cyan-600 text-white"
                    : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                }`}
              >
                {sector} ({companiesBySector[sector].length})
              </button>
            ))}
          </div>
        </div>

        {/* Search Bar */}
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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Company List */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg overflow-hidden">
              <div className="p-4 border-b border-slate-700">
                <h3 className="font-semibold text-white">
                  {selectedSector} ({currentSectorCompanies.length})
                </h3>
                {selectedCompanies.length > 0 && (
                  <p className="text-sm text-cyan-400 mt-2">已选择 {selectedCompanies.length} 家</p>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto">
                {currentSectorCompanies.map((company) => (
                  <button
                    key={company.company_id}
                    onClick={() => toggleCompanySelection(company)}
                    className={`w-full text-left p-4 border-b border-slate-700 hover:bg-slate-700/50 transition ${
                      isCompanySelected(company) ? "bg-slate-700 border-l-2 border-l-cyan-500" : ""
                    }`}
                  >
                    <div className="font-semibold text-white">{company.short_name}</div>
                    <div className="text-sm text-slate-400">{company.code}</div>
                    <div className="text-xs text-slate-500 mt-1">
                      PE: {company.valuation.pe_ratio} | PB: {company.valuation.pb_ratio}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Analysis Content */}
          <div className="lg:col-span-3">
            {selectedCompanies.length === 0 ? (
              <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-12 text-center">
                <BarChart3 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">选择企业开始分析</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Company Info */}
                <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-6">
                  <h2 className="text-xl font-bold text-white mb-4">
                    {selectedCompanies[0].short_name} - 企业概览
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-900/50 p-4 rounded-lg">
                      <div className="text-sm text-slate-400">PE 比率</div>
                      <div className="text-2xl font-bold text-blue-400">
                        {selectedCompanies[0].valuation.pe_ratio}
                      </div>
                    </div>
                    <div className="bg-slate-900/50 p-4 rounded-lg">
                      <div className="text-sm text-slate-400">PB 比率</div>
                      <div className="text-2xl font-bold text-green-400">
                        {selectedCompanies[0].valuation.pb_ratio}
                      </div>
                    </div>
                    <div className="bg-slate-900/50 p-4 rounded-lg">
                      <div className="text-sm text-slate-400">PS 比率</div>
                      <div className="text-2xl font-bold text-purple-400">
                        {selectedCompanies[0].valuation.ps_ratio}
                      </div>
                    </div>
                    <div className="bg-slate-900/50 p-4 rounded-lg">
                      <div className="text-sm text-slate-400">收入 CAGR</div>
                      <div className="text-2xl font-bold text-yellow-400">
                        {selectedCompanies[0].growth_metrics.revenue_cagr}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Financial Trend */}
                <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-6">
                  <h3 className="text-lg font-bold text-white mb-4">财务趋势 (2020-2024)</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="year" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }} />
                      <Legend />
                      <Line type="monotone" dataKey="revenue" stroke="#3b82f6" name="营收(千元)" />
                      <Line type="monotone" dataKey="net_profit" stroke="#10b981" name="净利润(千元)" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Profitability Metrics */}
                <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-6">
                  <h3 className="text-lg font-bold text-white mb-4">盈利能力对比</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={benchmarkData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="metric" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }} />
                      <Legend />
                      {selectedCompanies.slice(0, 5).map((company, idx) => (
                        <Bar key={idx} dataKey={company.short_name} fill={['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][idx]} />
                      ))}
                      <Bar dataKey="行业平均" fill="#6b7280" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Radar Chart */}
                {selectedCompanies.length > 0 && (
                  <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-6">
                    <h3 className="text-lg font-bold text-white mb-4">综合指标雷达图</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="#334155" />
                        <PolarAngleAxis dataKey="metric" stroke="#94a3b8" />
                        <PolarRadiusAxis stroke="#94a3b8" />
                        <Radar name={selectedCompanies[0].short_name} dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                        <Radar name="行业平均" dataKey="industry" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                        <Legend />
                        <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Detailed Metrics */}
                <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-6">
                  <h3 className="text-lg font-bold text-white mb-4">详细财务指标</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {selectedCompanies[0].financial_data[selectedCompanies[0].financial_data.length - 1] && (
                      <>
                        <div className="bg-slate-900/50 p-4 rounded-lg">
                          <div className="text-sm text-slate-400">毛利率</div>
                          <div className="text-2xl font-bold text-blue-400">
                            {selectedCompanies[0].financial_data[selectedCompanies[0].financial_data.length - 1].gross_margin}%
                          </div>
                          <div className="text-xs text-slate-500 mt-2">
                            行业均值: {industryAverage.gross_margin}%
                          </div>
                        </div>
                        <div className="bg-slate-900/50 p-4 rounded-lg">
                          <div className="text-sm text-slate-400">净利率</div>
                          <div className="text-2xl font-bold text-green-400">
                            {selectedCompanies[0].financial_data[selectedCompanies[0].financial_data.length - 1].net_margin}%
                          </div>
                          <div className="text-xs text-slate-500 mt-2">
                            行业均值: {industryAverage.net_margin}%
                          </div>
                        </div>
                        <div className="bg-slate-900/50 p-4 rounded-lg">
                          <div className="text-sm text-slate-400">ROE</div>
                          <div className="text-2xl font-bold text-purple-400">
                            {selectedCompanies[0].financial_data[selectedCompanies[0].financial_data.length - 1].roe}%
                          </div>
                          <div className="text-xs text-slate-500 mt-2">
                            行业均值: {industryAverage.roe}%
                          </div>
                        </div>
                        <div className="bg-slate-900/50 p-4 rounded-lg">
                          <div className="text-sm text-slate-400">债务比</div>
                          <div className="text-2xl font-bold text-yellow-400">
                            {selectedCompanies[0].financial_data[selectedCompanies[0].financial_data.length - 1].debt_ratio}%
                          </div>
                          <div className="text-xs text-slate-500 mt-2">
                            行业均值: {industryAverage.debt_ratio}%
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
