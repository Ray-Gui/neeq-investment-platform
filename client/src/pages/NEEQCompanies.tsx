import React, { useState, useEffect, useMemo } from "react";
import { Search, Filter, TrendingUp, Users, DollarSign, BarChart3, ChevronDown, ChevronUp } from "lucide-react";
import { allCompanies } from "../data/all-companies";
import { investmentScores } from "../data/investment-scores";
import { financialDataByCompany } from "../data/financial-data";

interface Company {
  id: number;
  code: string;
  name: string;
  short_name: string;
  industry: string;
  sector: string;
  province: string;
  city: string;
  founded_year: number;
  main_business: string;
  neeq_listing_date: string;
  neeq_layer: string;
  bse_listing_status: string;
  bse_listing_date?: string;
}

interface FinancialData {
  fiscal_year: number;
  revenue: number;
  net_profit: number;
  gross_margin: number;
  net_margin: number;
  roe: number;
}

export default function NEEQCompanies() {
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedSector, setSelectedSector] = useState<string>("全部");
  const [selectedStatus, setSelectedStatus] = useState<string>("全部");
  const [page, setPage] = useState(1);
  const [expandedCompany, setExpandedCompany] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<string>("name");

  const itemsPerPage = 10;

  // 获取所有行业和状态
  const sectors = useMemo(() => {
    const unique = new Set(allCompanies.map(c => c.sector));
    return ["全部", ...Array.from(unique).sort()];
  }, []);

  const statuses = useMemo(() => {
    const unique = new Set(allCompanies.map(c => c.bse_listing_status));
    return ["全部", ...Array.from(unique).sort()];
  }, []);

  // 过滤和排序企业
  const filteredCompanies = useMemo(() => {
    let result = allCompanies;

    // 按关键词搜索
    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase();
      result = result.filter(
        c =>
          c.short_name.toLowerCase().includes(keyword) ||
          c.name.toLowerCase().includes(keyword) ||
          c.code.includes(keyword) ||
          c.industry.toLowerCase().includes(keyword)
      );
    }

    // 按行业筛选
    if (selectedSector !== "全部") {
      result = result.filter(c => c.sector === selectedSector);
    }

    // 按上市状态筛选
    if (selectedStatus !== "全部") {
      result = result.filter(c => c.bse_listing_status === selectedStatus);
    }

    // 排序
    result.sort((a, b) => {
      if (sortBy === "name") return a.short_name.localeCompare(b.short_name);
      if (sortBy === "founded") return b.founded_year - a.founded_year;
      if (sortBy === "code") return a.code.localeCompare(b.code);
      return 0;
    });

    return result;
  }, [searchKeyword, selectedSector, selectedStatus, sortBy]);

  // 分页
  const totalPages = Math.ceil(filteredCompanies.length / itemsPerPage);
  const paginatedCompanies = filteredCompanies.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  // 获取企业评分
  const getCompanyScore = (companyId: number) => {
    return investmentScores.find(s => s.company_id === companyId);
  };

  // 获取企业财务数据
  const getCompanyFinancials = (companyId: number) => {
    return financialDataByCompany[companyId] || [];
  };

  // 统计信息
  const stats = useMemo(() => {
    const sectorStats: Record<string, number> = {};
    const statusStats: Record<string, number> = {};

    allCompanies.forEach(c => {
      sectorStats[c.sector] = (sectorStats[c.sector] || 0) + 1;
      statusStats[c.bse_listing_status] = (statusStats[c.bse_listing_status] || 0) + 1;
    });

    return { sectorStats, statusStats };
  }, []);

  const handleReset = () => {
    setSearchKeyword("");
    setSelectedSector("全部");
    setSelectedStatus("全部");
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 标题 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">📈 新三板企业库</h1>
          <p className="text-slate-400">
            {filteredCompanies.length} 家企业 | 共 {allCompanies.length} 家
          </p>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4">
            <p className="text-slate-400 text-sm">总企业数</p>
            <p className="text-2xl font-bold text-white">{allCompanies.length}</p>
          </div>
          <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4">
            <p className="text-slate-400 text-sm">医疗健康</p>
            <p className="text-2xl font-bold text-green-500">{stats.sectorStats["医疗健康"] || 0}</p>
          </div>
          <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4">
            <p className="text-slate-400 text-sm">新能源</p>
            <p className="text-2xl font-bold text-yellow-500">{stats.sectorStats["新能源"] || 0}</p>
          </div>
          <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4">
            <p className="text-slate-400 text-sm">人工智能</p>
            <p className="text-2xl font-bold text-purple-500">{stats.sectorStats["人工智能"] || 0}</p>
          </div>
        </div>

        {/* 搜索和筛选 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="搜索企业名称或代码..."
              value={searchKeyword}
              onChange={(e) => {
                setSearchKeyword(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-green-500"
            />
          </div>

          <select
            value={selectedSector}
            onChange={(e) => {
              setSelectedSector(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-green-500"
          >
            {sectors.map(sector => (
              <option key={sector} value={sector}>
                {sector}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-green-500"
          >
            {statuses.map(status => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          <button
            onClick={handleReset}
            className="px-4 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white hover:bg-slate-500 transition"
          >
            重置筛选
          </button>
        </div>

        {/* 排序选项 */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setSortBy("name")}
            className={`px-4 py-2 rounded-lg transition ${
              sortBy === "name"
                ? "bg-green-600 text-white"
                : "bg-slate-700 border border-slate-600 text-white"
            }`}
          >
            按名称
          </button>
          <button
            onClick={() => setSortBy("founded")}
            className={`px-4 py-2 rounded-lg transition ${
              sortBy === "founded"
                ? "bg-green-600 text-white"
                : "bg-slate-700 border border-slate-600 text-white"
            }`}
          >
            按成立年份
          </button>
          <button
            onClick={() => setSortBy("code")}
            className={`px-4 py-2 rounded-lg transition ${
              sortBy === "code"
                ? "bg-green-600 text-white"
                : "bg-slate-700 border border-slate-600 text-white"
            }`}
          >
            按代码
          </button>
        </div>

        {/* 企业列表 */}
        <div className="space-y-3">
          {paginatedCompanies.length > 0 ? (
            paginatedCompanies.map((company) => {
              const score = getCompanyScore(company.id);
              const financials = getCompanyFinancials(company.id);
              const isExpanded = expandedCompany === company.id;

              return (
                <div
                  key={company.id}
                  className="bg-slate-700/50 border border-slate-600 rounded-lg p-4 hover:border-slate-500 transition"
                >
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => setExpandedCompany(isExpanded ? null : company.id)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-white">{company.short_name}</h3>
                        <span className="text-sm text-slate-400">{company.code}</span>
                        <span className="text-xs bg-slate-600 px-2 py-1 rounded text-slate-200">
                          {company.industry}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          company.sector === "医疗健康" ? "bg-green-900/30 text-green-300" :
                          company.sector === "新能源" ? "bg-yellow-900/30 text-yellow-300" :
                          "bg-purple-900/30 text-purple-300"
                        }`}>
                          {company.sector}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400">
                        {company.province} {company.city} | 成立于 {company.founded_year} | {company.bse_listing_status}
                      </p>
                    </div>

                    {score && (
                      <div className="text-right mr-4">
                        <div className="text-2xl font-bold text-green-500">{score.overall_score.toFixed(1)}</div>
                        <p className="text-xs text-slate-400">综合评分</p>
                      </div>
                    )}

                    {isExpanded ? (
                      <ChevronUp className="text-slate-400" />
                    ) : (
                      <ChevronDown className="text-slate-400" />
                    )}
                  </div>

                  {/* 展开详情 */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-slate-600">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-slate-400 text-sm">企业名称</p>
                          <p className="text-white font-semibold">{company.name}</p>
                        </div>
                        <div>
                          <p className="text-slate-400 text-sm">新三板层级</p>
                          <p className="text-white font-semibold">{company.neeq_layer}</p>
                        </div>
                        <div>
                          <p className="text-slate-400 text-sm">挂牌日期</p>
                          <p className="text-white font-semibold">{company.neeq_listing_date}</p>
                        </div>
                        <div>
                          <p className="text-slate-400 text-sm">北交所状态</p>
                          <p className="text-white font-semibold">{company.bse_listing_status}</p>
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-slate-400 text-sm mb-2">主营业务</p>
                        <p className="text-white text-sm">{company.main_business}</p>
                      </div>

                      {score && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div>
                            <p className="text-slate-400 text-sm">财务健康度</p>
                            <p className="text-green-500 font-bold">{score.financial_health}</p>
                          </div>
                          <div>
                            <p className="text-slate-400 text-sm">成长潜力</p>
                            <p className="text-blue-500 font-bold">{score.growth_potential}</p>
                          </div>
                          <div>
                            <p className="text-slate-400 text-sm">市场竞争力</p>
                            <p className="text-purple-500 font-bold">{score.market_competitiveness}</p>
                          </div>
                          <div>
                            <p className="text-slate-400 text-sm">风险评估</p>
                            <p className="text-orange-500 font-bold">{score.risk_assessment}</p>
                          </div>
                        </div>
                      )}

                      {financials.length > 0 && (
                        <div>
                          <p className="text-slate-400 text-sm mb-2">近年财务数据</p>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-slate-600">
                                  <th className="text-left text-slate-400 py-2">年份</th>
                                  <th className="text-right text-slate-400 py-2">收入 (万元)</th>
                                  <th className="text-right text-slate-400 py-2">净利润 (万元)</th>
                                  <th className="text-right text-slate-400 py-2">毛利率</th>
                                  <th className="text-right text-slate-400 py-2">净利率</th>
                                </tr>
                              </thead>
                              <tbody>
                                {financials.slice(0, 3).map((f) => (
                                  <tr key={f.fiscal_year} className="border-b border-slate-700">
                                    <td className="text-white py-2">{f.fiscal_year}</td>
                                    <td className="text-right text-green-500">{(f.revenue / 10000).toFixed(0)}</td>
                                    <td className="text-right text-blue-500">{(f.net_profit / 10000).toFixed(0)}</td>
                                    <td className="text-right text-yellow-500">{(f.gross_margin * 100).toFixed(1)}%</td>
                                    <td className="text-right text-purple-500">{(f.net_margin * 100).toFixed(1)}%</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-400">未找到匹配的企业</p>
            </div>
          )}
        </div>

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white disabled:opacity-50"
            >
              上一页
            </button>
            <div className="flex items-center gap-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, page - 2) + i;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`px-3 py-2 rounded-lg ${
                      page === pageNum
                        ? "bg-green-600 text-white"
                        : "bg-slate-700 border border-slate-600 text-white"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white disabled:opacity-50"
            >
              下一页
            </button>
          </div>
        )}

        <p className="text-center text-slate-400 text-sm mt-4">
          第 {page} / {totalPages} 页，共 {filteredCompanies.length} 条结果
        </p>
      </div>
    </div>
  );
}
