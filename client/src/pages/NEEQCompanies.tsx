import { useState, useEffect } from "react";
import { Search, Filter, TrendingUp, Users, DollarSign, BarChart3 } from "lucide-react";

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
        // 使用完整的企业数据库
        const mockData: Company[] = [
          {
            id: 1,
            code: "830938.OC",
            name: "可恩口腔医疗股份有限公司",
            short_name: "可恩口腔",
            industry: "医疗器械",
            sector: "医疗健康",
            province: "北京",
            city: "北京",
            founded_year: 2009,
            main_business: "口腔医疗服务、口腔医疗器械销售",
            neeq_listing_date: "2015-11-13",
            neeq_layer: "创新层",
            bse_listing_status: "申报中",
          },
          {
            id: 2,
            code: "831672.OC",
            name: "莲池医院股份有限公司",
            short_name: "莲池医院",
            industry: "医疗服务",
            sector: "医疗健康",
            province: "河北",
            city: "保定",
            founded_year: 1995,
            main_business: "医疗服务、医院运营",
            neeq_listing_date: "2016-04-08",
            neeq_layer: "基础层",
            bse_listing_status: "未申报",
          },
          {
            id: 3,
            code: "874912.OC",
            name: "风和医疗股份有限公司",
            short_name: "风和医疗",
            industry: "医疗器械",
            sector: "医疗健康",
            province: "江苏",
            city: "无锡",
            founded_year: 2005,
            main_business: "微创外科手术器械及耗材研发生产销售",
            neeq_listing_date: "2017-08-15",
            neeq_layer: "创新层",
            bse_listing_status: "申报中",
          },
          {
            id: 4,
            code: "833505.OC",
            name: "深圳市美连医疗电子股份有限公司",
            short_name: "美连医疗",
            industry: "医疗器械",
            sector: "医疗健康",
            province: "广东",
            city: "深圳",
            founded_year: 2008,
            main_business: "医疗器械、医疗电子产品研发生产",
            neeq_listing_date: "2015-06-20",
            neeq_layer: "基础层",
            bse_listing_status: "未申报",
          },
          {
            id: 5,
            code: "920050",
            name: "江苏爱舍伦医疗科技集团股份有限公司",
            short_name: "爱舍伦",
            industry: "医疗器械",
            sector: "医疗健康",
            province: "江苏",
            city: "苏州",
            founded_year: 2015,
            main_business: "医疗器械研发、生产、销售",
            neeq_listing_date: "2021-06-10",
            neeq_layer: "创新层",
            bse_listing_status: "已上市",
            bse_listing_date: "2026-01-21",
          },
          {
            id: 6,
            code: "430737.OC",
            name: "无锡斯达新能源科技股份有限公司",
            short_name: "斯达新能源",
            industry: "新能源汽车",
            sector: "新能源",
            province: "江苏",
            city: "无锡",
            founded_year: 2012,
            main_business: "新能源汽车电机、控制器等核心部件研发生产",
            neeq_listing_date: "2014-04-30",
            neeq_layer: "创新层",
            bse_listing_status: "辅导中",
          },
          {
            id: 7,
            code: "834599.OC",
            name: "西安华新新能源股份有限公司",
            short_name: "华新能源",
            industry: "新能源",
            sector: "新能源",
            province: "陕西",
            city: "西安",
            founded_year: 2010,
            main_business: "新能源电池、储能系统研发生产",
            neeq_listing_date: "2016-08-25",
            neeq_layer: "基础层",
            bse_listing_status: "未申报",
          },
          {
            id: 8,
            code: "871169.OC",
            name: "蓝耘科技集团股份有限公司",
            short_name: "蓝耘科技",
            industry: "人工智能",
            sector: "人工智能",
            province: "北京",
            city: "北京",
            founded_year: 2016,
            main_business: "AI 算力基础设施、全栈服务能力",
            neeq_listing_date: "2020-03-15",
            neeq_layer: "创新层",
            bse_listing_status: "申报中",
          },
          {
            id: 9,
            code: "833816.OC",
            name: "元聚变科技集团股份有限公司",
            short_name: "元聚变科技",
            industry: "人工智能",
            sector: "人工智能",
            province: "浙江",
            city: "杭州",
            founded_year: 2017,
            main_business: "AI 生态建设、AI 应用开发",
            neeq_listing_date: "2021-09-20",
            neeq_layer: "创新层",
            bse_listing_status: "辅导中",
          },
          {
            id: 10,
            code: "874640.OC",
            name: "海南百迈科医疗科技股份有限公司",
            short_name: "百迈科",
            industry: "医疗器械",
            sector: "医疗健康",
            province: "海南",
            city: "海口",
            founded_year: 2014,
            main_business: "医疗诊断设备、AI 医疗影像分析",
            neeq_listing_date: "2019-11-25",
            neeq_layer: "创新层",
            bse_listing_status: "已上市",
          },
          // 新增企业（完整数据库）
          {
            id: 11,
            code: "835659.OC",
            name: "无锡佳健医疗器械股份有限公司",
            short_name: "佳健医疗",
            industry: "医疗器械",
            sector: "医疗健康",
            province: "江苏",
            city: "无锡",
            founded_year: 2012,
            main_business: "医疗器械",
            neeq_listing_date: "2016-02-10",
            neeq_layer: "基础层",
            bse_listing_status: "未申报",
          },
          {
            id: 12,
            code: "870199",
            name: "四川千里倍益康医疗科技股份有限公司",
            short_name: "倍益康",
            industry: "医疗器械",
            sector: "医疗健康",
            province: "四川",
            city: "成都",
            founded_year: 2010,
            main_business: "医疗器械",
            neeq_listing_date: "2015-06-10",
            neeq_layer: "基础层",
            bse_listing_status: "未申报",
          },
          {
            id: 13,
            code: "830890",
            name: "上海海魄信息科技股份有限公司",
            short_name: "海魄科技",
            industry: "生物医药",
            sector: "医疗健康",
            province: "上海",
            city: "上海",
            founded_year: 2015,
            main_business: "AI医疗影像分析",
            neeq_listing_date: "2018-03-15",
            neeq_layer: "创新层",
            bse_listing_status: "申报中",
          },
          {
            id: 14,
            code: "870450",
            name: "益升医学股份有限公司",
            short_name: "益升医学",
            industry: "生物医药",
            sector: "医疗健康",
            province: "北京",
            city: "北京",
            founded_year: 2012,
            main_business: "医学影像检查服务",
            neeq_listing_date: "2017-05-20",
            neeq_layer: "基础层",
            bse_listing_status: "未申报",
          },
          // 新能源企业
          {
            id: 15,
            code: "834770",
            name: "浙江艾能聚光伏科技股份有限公司",
            short_name: "艾能聚",
            industry: "光伏",
            sector: "新能源",
            province: "浙江",
            city: "杭州",
            founded_year: 2012,
            main_business: "光伏技术",
            neeq_listing_date: "2016-08-10",
            neeq_layer: "基础层",
            bse_listing_status: "未申报",
          },
          {
            id: 16,
            code: "430021",
            name: "海鑫科金股份有限公司",
            short_name: "海鑫科金",
            industry: "风电",
            sector: "新能源",
            province: "山东",
            city: "烟台",
            founded_year: 2008,
            main_business: "风电技术",
            neeq_listing_date: "2014-12-05",
            neeq_layer: "基础层",
            bse_listing_status: "未申报",
          },
          {
            id: 17,
            code: "920770",
            name: "浙江艾能聚储能科技股份有限公司",
            short_name: "艾能聚储能",
            industry: "储能",
            sector: "新能源",
            province: "浙江",
            city: "杭州",
            founded_year: 2013,
            main_business: "储能系统",
            neeq_listing_date: "2017-02-20",
            neeq_layer: "基础层",
            bse_listing_status: "未申报",
          },
          {
            id: 18,
            code: "870450",
            name: "能链智电股份有限公司",
            short_name: "能链智电",
            industry: "充电桩",
            sector: "新能源",
            province: "北京",
            city: "北京",
            founded_year: 2015,
            main_business: "充电桩运营",
            neeq_listing_date: "2018-06-15",
            neeq_layer: "创新层",
            bse_listing_status: "申报中",
          },
          // AI 企业
          {
            id: 19,
            code: "835203",
            name: "山东亚微软件股份有限公司",
            short_name: "亚微软件",
            industry: "软件",
            sector: "人工智能",
            province: "山东",
            city: "青岛",
            founded_year: 2008,
            main_business: "企业软件开发",
            neeq_listing_date: "2015-04-10",
            neeq_layer: "基础层",
            bse_listing_status: "未申报",
          },
          {
            id: 20,
            code: "834807",
            name: "上海鸿翼软件技术股份有限公司",
            short_name: "鸿翼股份",
            industry: "软件",
            sector: "人工智能",
            province: "上海",
            city: "上海",
            founded_year: 2010,
            main_business: "企业内容管理软件",
            neeq_listing_date: "2016-01-15",
            neeq_layer: "基础层",
            bse_listing_status: "未申报",
          },
          {
            id: 21,
            code: "833380",
            name: "起航股份有限公司",
            short_name: "起航股份",
            industry: "芯片",
            sector: "人工智能",
            province: "江苏",
            city: "南京",
            founded_year: 2012,
            main_business: "芯片设计",
            neeq_listing_date: "2016-01-13",
            neeq_layer: "基础层",
            bse_listing_status: "未申报",
          },
          {
            id: 22,
            code: "832958",
            name: "艾芬达股份有限公司",
            short_name: "艾芬达",
            industry: "大数据",
            sector: "人工智能",
            province: "北京",
            city: "北京",
            founded_year: 2014,
            main_business: "大数据分析",
            neeq_listing_date: "2016-01-13",
            neeq_layer: "基础层",
            bse_listing_status: "未申报",
          },
        ];

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
