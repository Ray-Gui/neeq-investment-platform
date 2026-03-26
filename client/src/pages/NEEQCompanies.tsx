import { useState, useEffect } from "react";
import { Search, Filter, TrendingUp, Users, DollarSign, BarChart3 } from "lucide-react";
import { NEEQ_COMPANIES_EXTENDED, companiesByIndustry, companiesStats } from "../data/neeq-companies-extended";

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
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedSector, setSelectedSector] = useState<string>("全部");
  const [selectedStatus, setSelectedStatus] = useState<string>("全部");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [companyDetails, setCompanyDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const itemsPerPage = 10;

  // 从数据库获取企业数据
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setLoading(true);
        // 使用扩展的企业数据库
        const mockData: Company[] = (NEEQ_COMPANIES_EXTENDED || []) as Company[];

        setCompanies(mockData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching companies:", error);
        setLoading(false);
      }
    };

    fetchCompanies();
  }, []);

  // 过滤和搜索
  useEffect(() => {
    let filtered = companies;

    // 按关键词搜索
    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(keyword) ||
          c.short_name.toLowerCase().includes(keyword) ||
          c.code.includes(keyword) ||
          c.main_business.toLowerCase().includes(keyword)
      );
    }

    // 按领域筛选
    if (selectedSector !== "全部") {
      filtered = filtered.filter((c) => c.sector === selectedSector);
    }

    // 按上市状态筛选
    if (selectedStatus !== "全部") {
      filtered = filtered.filter((c) => c.bse_listing_status === selectedStatus);
    }

    setFilteredCompanies(filtered);
    setTotalPages(Math.ceil(filtered.length / itemsPerPage));
    setPage(1);
  }, [companies, searchKeyword, selectedSector, selectedStatus]);

  // 获取企业详情
  const handleViewDetails = async (company: Company) => {
    setSelectedCompany(company);
    setLoadingDetails(true);
    // 这里应该从数据库获取详细信息
    // 现在使用模拟数据
    const mockDetails = {
      company,
      financialData: [
        {
          fiscal_year: 2024,
          revenue: 25000,
          net_profit: 3500,
          gross_margin: 65,
          net_margin: 14,
          roe: 18,
        },
        {
          fiscal_year: 2023,
          revenue: 22000,
          net_profit: 2800,
          gross_margin: 62,
          net_margin: 12.7,
          roe: 16,
        },
        {
          fiscal_year: 2022,
          revenue: 18000,
          net_profit: 2000,
          gross_margin: 60,
          net_margin: 11.1,
          roe: 14,
        },
      ],
    };
    setCompanyDetails(mockDetails);
    setLoadingDetails(false);
  };

  const paginatedCompanies = filteredCompanies.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const sectors = ["全部", "医疗健康", "新能源", "人工智能"];
  
  // 计算统计数据
  const stats = {
    total: companies.length,
    healthcare: companies.filter(c => c.sector === "医疗健康").length,
    energy: companies.filter(c => c.sector === "新能源").length,
    ai: companies.filter(c => c.sector === "人工智能").length,
  };
  const statuses = ["全部", "已上市", "申报中", "辅导中", "未申报"];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "已上市":
        return "bg-green-900 text-green-200";
      case "申报中":
        return "bg-blue-900 text-blue-200";
      case "辅导中":
        return "bg-yellow-900 text-yellow-200";
      default:
        return "bg-gray-700 text-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 导航栏 */}
        <div className="mb-6 flex items-center gap-2">
          <a href="/" className="text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1">
            <span>←</span>
            <span>返回主页</span>
          </a>
        </div>
        
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">新三板企业研究库</h1>
          <p className="text-gray-400">医疗健康、新能源、人工智能三大领域企业数据</p>
        </div>

        {/* 搜索和筛选区域 */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6 mb-6">
          {/* 搜索框 */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-500" size={20} />
              <input
                type="text"
                placeholder="搜索企业名称、代码或主营业务..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full bg-slate-700 text-white pl-10 pr-4 py-2 rounded border border-slate-600 focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          {/* 筛选选项 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 领域筛选 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Filter size={16} className="inline mr-2" />
                行业领域
              </label>
              <div className="flex flex-wrap gap-2">
                {sectors.map((sector) => (
                  <button
                    key={sector}
                    onClick={() => setSelectedSector(sector)}
                    className={`px-3 py-1 rounded text-sm transition-colors ${
                      selectedSector === sector
                        ? "bg-cyan-600 text-white"
                        : "bg-slate-700 text-gray-300 hover:bg-slate-600"
                    }`}
                  >
                    {sector}
                  </button>
                ))}
              </div>
            </div>

            {/* 上市状态筛选 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <TrendingUp size={16} className="inline mr-2" />
                上市状态
              </label>
              <div className="flex flex-wrap gap-2">
                {statuses.map((status) => (
                  <button
                    key={status}
                    onClick={() => setSelectedStatus(status)}
                    className={`px-3 py-1 rounded text-sm transition-colors ${
                      selectedStatus === status
                        ? "bg-amber-600 text-white"
                        : "bg-slate-700 text-gray-300 hover:bg-slate-600"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 统计信息 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">总企业数</p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
              </div>
              <Users className="text-cyan-500" size={32} />
            </div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">医疗健康</p>
                <p className="text-2xl font-bold text-cyan-400">{stats.healthcare}</p>
              </div>
              <Users className="text-cyan-500" size={32} />
            </div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">新能源</p>
                <p className="text-2xl font-bold text-green-400">{stats.energy}</p>
              </div>
              <Users className="text-green-500" size={32} />
            </div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">人工智能</p>
                <p className="text-2xl font-bold text-purple-400">{stats.ai}</p>
              </div>
              <Users className="text-purple-500" size={32} />
            </div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">搜索结果</p>
                <p className="text-2xl font-bold text-white">{filteredCompanies.length}</p>
              </div>
              <Search className="text-cyan-500" size={32} />
            </div>
          </div>

        </div>

        {/* 企业列表 */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-400">加载中...</div>
          ) : paginatedCompanies.length === 0 ? (
            <div className="p-8 text-center text-gray-400">没有找到匹配的企业</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-700/50 border-b border-slate-600">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">
                        企业名称
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">
                        代码
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">
                        领域
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">
                        地区
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">
                        上市状态
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedCompanies.map((company) => (
                      <tr
                        key={company.id}
                        className="border-b border-slate-700 hover:bg-slate-700/30 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-white">{company.short_name}</p>
                            <p className="text-xs text-gray-400">{company.name}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-300">{company.code}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className="px-2 py-1 bg-slate-700 text-cyan-300 rounded text-xs">
                            {company.industry}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-300">
                          {company.province} {company.city}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                              company.bse_listing_status
                            )}`}
                          >
                            {company.bse_listing_status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleViewDetails(company)}
                            className="text-cyan-400 hover:text-cyan-300 text-sm font-medium"
                          >
                            查看详情
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 分页 */}
              <div className="bg-slate-700/30 px-6 py-4 flex items-center justify-between">
                <p className="text-sm text-gray-400">
                  第 {page} / {totalPages} 页，共 {filteredCompanies.length} 条结果
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 bg-slate-700 text-gray-300 rounded disabled:opacity-50"
                  >
                    上一页
                  </button>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1 bg-slate-700 text-gray-300 rounded disabled:opacity-50"
                  >
                    下一页
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* 企业详情模态框 */}
        {selectedCompany && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 border border-slate-700 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-6 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">{selectedCompany.short_name}</h2>
                <button
                  onClick={() => setSelectedCompany(null)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {loadingDetails ? (
                <div className="p-8 text-center text-gray-400">加载详情中...</div>
              ) : companyDetails ? (
                <div className="p-6 space-y-6">
                  {/* 基本信息 */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">基本信息</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400">企业代码</p>
                        <p className="text-white font-medium">{selectedCompany.code}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">行业</p>
                        <p className="text-white font-medium">{selectedCompany.industry}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">地区</p>
                        <p className="text-white font-medium">
                          {selectedCompany.province} {selectedCompany.city}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400">成立年份</p>
                        <p className="text-white font-medium">{selectedCompany.founded_year}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-gray-400">主营业务</p>
                        <p className="text-white">{selectedCompany.main_business}</p>
                      </div>
                    </div>
                  </div>

                  {/* 财务数据 */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">财务数据（万元）</h3>
                    <div className="space-y-3">
                      {companyDetails.financialData.map((fd: FinancialData) => (
                        <div key={fd.fiscal_year} className="bg-slate-700/30 p-4 rounded">
                          <p className="font-semibold text-white mb-2">{fd.fiscal_year} 年</p>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <p className="text-gray-400">营业收入</p>
                              <p className="text-cyan-400 font-medium">{fd.revenue.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-gray-400">净利润</p>
                              <p className="text-green-400 font-medium">{fd.net_profit.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-gray-400">毛利率</p>
                              <p className="text-yellow-400 font-medium">{fd.gross_margin}%</p>
                            </div>
                            <div>
                              <p className="text-gray-400">净利率</p>
                              <p className="text-yellow-400 font-medium">{fd.net_margin}%</p>
                            </div>
                            <div>
                              <p className="text-gray-400">ROE</p>
                              <p className="text-blue-400 font-medium">{fd.roe}%</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
