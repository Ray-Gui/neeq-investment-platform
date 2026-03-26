import { useState, useEffect, useMemo } from "react";
import { Search, Filter, TrendingUp, TrendingDown, BarChart3, Info, ChevronDown, ChevronUp } from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";

interface Company {
  id: number;
  code: string;
  short_name: string;
  sector: string;
  industry: string;
}

interface FinancialData {
  fiscal_year: number;
  revenue: number;
  net_profit: number;
  gross_margin: number;
  net_margin: number;
  roe: number;
}

interface ScoringData {
  company: Company;
  financial_health: number;
  growth_potential: number;
  competitiveness: number;
  listing_potential: number;
  dealer_opportunity: number;
  total_score: number;
  rating: string;
  recommendation: string;
  financials: FinancialData[];
  scoring_details: any;
}

// 模拟从数据库获取的评分数据
const MOCK_SCORING_DATA: ScoringData[] = [
  {
    company: { id: 1, code: "830938.OC", short_name: "可恩口腔", sector: "医疗健康", industry: "医疗器械" },
    financial_health: 82,
    growth_potential: 81,
    competitiveness: 81,
    listing_potential: 72,
    dealer_opportunity: 64,
    total_score: 80.1,
    rating: "⭐⭐⭐⭐ 良好",
    recommendation: "推荐 - 值得关注",
    financials: [
      { fiscal_year: 2024, revenue: 25000, net_profit: 3500, gross_margin: 65, net_margin: 14, roe: 18 },
      { fiscal_year: 2023, revenue: 22000, net_profit: 2800, gross_margin: 62, net_margin: 12.7, roe: 16 },
      { fiscal_year: 2022, revenue: 18000, net_profit: 2000, gross_margin: 60, net_margin: 11.1, roe: 14 },
    ],
    scoring_details: {
      financial_health_details: {
        net_margin_score: 75,
        roe_score: 80,
        gross_margin_score: 95,
        debt_ratio_score: 90,
      },
      growth_potential_details: {
        revenue_growth_rate: 18.3,
        revenue_growth_score: 80,
        profit_growth_rate: 32.1,
        profit_growth_score: 85,
      },
      competitiveness_details: {
        market_position: "行业前列",
        market_position_score: 85,
        product_differentiation_score: 75,
      },
      listing_potential_details: {
        scale_score: 70,
        profitability_score: 75,
        compliance_score: 75,
      },
      dealer_opportunity_details: {
        liquidity_score: 60,
        volatility_score: 60,
        financing_need_score: 80,
      },
    },
  },
  {
    company: { id: 2, code: "430737.OC", short_name: "斯达新能源", sector: "新能源", industry: "新能源汽车" },
    financial_health: 75,
    growth_potential: 88,
    competitiveness: 78,
    listing_potential: 85,
    dealer_opportunity: 72,
    total_score: 81.2,
    rating: "⭐⭐⭐⭐ 良好",
    recommendation: "推荐 - 值得关注",
    financials: [
      { fiscal_year: 2024, revenue: 28000, net_profit: 3200, gross_margin: 38, net_margin: 11, roe: 16 },
      { fiscal_year: 2023, revenue: 24000, net_profit: 2400, gross_margin: 36, net_margin: 10, roe: 14 },
      { fiscal_year: 2022, revenue: 20000, net_profit: 1800, gross_margin: 34, net_margin: 9, roe: 12 },
    ],
    scoring_details: {
      financial_health_details: {
        net_margin_score: 60,
        roe_score: 65,
        gross_margin_score: 60,
        debt_ratio_score: 85,
      },
      growth_potential_details: {
        revenue_growth_rate: 18.3,
        revenue_growth_score: 80,
        profit_growth_rate: 33.3,
        profit_growth_score: 85,
      },
      competitiveness_details: {
        market_position: "行业平均",
        market_position_score: 65,
        product_differentiation_score: 75,
      },
      listing_potential_details: {
        scale_score: 80,
        profitability_score: 85,
        compliance_score: 75,
      },
      dealer_opportunity_details: {
        liquidity_score: 70,
        volatility_score: 65,
        financing_need_score: 75,
      },
    },
  },
];

export default function CompanyScoring() {
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedSector, setSelectedSector] = useState<string>("全部");
  const [selectedCompany, setSelectedCompany] = useState<ScoringData | null>(MOCK_SCORING_DATA[0]);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    financial: true,
    growth: false,
    competitiveness: false,
    listing: false,
    dealer: false,
  });

  const sectors = ["全部", "医疗健康", "新能源", "人工智能"];

  // 筛选数据
  const filteredData = useMemo(() => {
    let filtered = MOCK_SCORING_DATA;

    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.company.short_name.toLowerCase().includes(keyword) ||
          d.company.code.includes(keyword)
      );
    }

    if (selectedSector !== "全部") {
      filtered = filtered.filter((d) => d.company.sector === selectedSector);
    }

    return filtered.sort((a, b) => b.total_score - a.total_score);
  }, [searchKeyword, selectedSector]);

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-red-400";
    if (score >= 75) return "text-green-400";
    if (score >= 60) return "text-yellow-400";
    if (score >= 45) return "text-orange-400";
    return "text-gray-400";
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const radarData = selectedCompany
    ? [
        { dimension: "财务健康度", value: selectedCompany.financial_health },
        { dimension: "成长潜力", value: selectedCompany.growth_potential },
        { dimension: "竞争力", value: selectedCompany.competitiveness },
        { dimension: "上市潜力", value: selectedCompany.listing_potential },
        { dimension: "做市商机会", value: selectedCompany.dealer_opportunity },
      ]
    : [];

  const financialTrendData = selectedCompany
    ? selectedCompany.financials
        .slice()
        .reverse()
        .map((f) => ({
          year: f.fiscal_year,
          营收: f.revenue,
          净利润: f.net_profit,
          毛利率: f.gross_margin,
          净利率: f.net_margin,
        }))
    : [];

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
          <h1 className="text-4xl font-bold text-white mb-2">企业评分系统</h1>
          <p className="text-gray-400">基于真实财务数据的多维度综合评分 · 完全透明的计算过程</p>
        </div>

        {/* 搜索和筛选 */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 text-gray-500" size={20} />
                <input
                  type="text"
                  placeholder="搜索企业名称或代码..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="w-full bg-slate-700 text-white pl-10 pr-4 py-2 rounded border border-slate-600 focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="bg-slate-700 text-white px-4 py-2 rounded border border-slate-600 focus:border-cyan-500 focus:outline-none"
            >
              {sectors.map((sector) => (
                <option key={sector} value={sector}>
                  {sector}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 主要内容区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：企业列表 */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-4 space-y-2 max-h-[600px] overflow-y-auto">
              <h2 className="text-lg font-semibold text-white mb-4 sticky top-0 bg-slate-800/50">企业列表</h2>
              {filteredData.map((data) => (
                <button
                  key={data.company.id}
                  onClick={() => setSelectedCompany(data)}
                  className={`w-full text-left p-3 rounded transition-colors ${
                    selectedCompany?.company.id === data.company.id
                      ? "bg-cyan-500/20 border border-cyan-500/50"
                      : "bg-slate-700/30 border border-slate-700 hover:bg-slate-700/50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-white">{data.company.short_name}</span>
                    <span className={`text-lg font-bold ${getScoreColor(data.total_score)}`}>
                      {data.total_score.toFixed(1)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">{data.company.code}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 右侧：详细信息 */}
          <div className="lg:col-span-2 space-y-4">
            {selectedCompany && (
              <>
                {/* 企业基本信息和总分 */}
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-1">{selectedCompany.company.short_name}</h2>
                      <p className="text-gray-400">{selectedCompany.company.code} · {selectedCompany.company.industry}</p>
                    </div>
                    <div className="text-right">
                      <div className={`text-4xl font-bold ${getScoreColor(selectedCompany.total_score)}`}>
                        {selectedCompany.total_score.toFixed(1)}
                      </div>
                      <div className="text-sm text-gray-400 mt-1">{selectedCompany.rating}</div>
                    </div>
                  </div>

                  {/* 投资建议 */}
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-6">
                    <p className="text-white font-semibold mb-2">💡 投资建议</p>
                    <p className="text-gray-300">{selectedCompany.recommendation}</p>
                  </div>

                  {/* 五维度评分条 */}
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-gray-300">财务健康度 (30%)</span>
                        <span className="text-sm font-semibold text-cyan-400">{selectedCompany.financial_health}</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div
                          className="bg-cyan-500 h-2 rounded-full transition-all"
                          style={{ width: `${selectedCompany.financial_health}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-gray-300">成长潜力 (25%)</span>
                        <span className="text-sm font-semibold text-green-400">{selectedCompany.growth_potential}</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full transition-all"
                          style={{ width: `${selectedCompany.growth_potential}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-gray-300">竞争力 (20%)</span>
                        <span className="text-sm font-semibold text-yellow-400">{selectedCompany.competitiveness}</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div
                          className="bg-yellow-500 h-2 rounded-full transition-all"
                          style={{ width: `${selectedCompany.competitiveness}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-gray-300">上市潜力 (15%)</span>
                        <span className="text-sm font-semibold text-purple-400">{selectedCompany.listing_potential}</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div
                          className="bg-purple-500 h-2 rounded-full transition-all"
                          style={{ width: `${selectedCompany.listing_potential}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-gray-300">做市商机会 (10%)</span>
                        <span className="text-sm font-semibold text-orange-400">{selectedCompany.dealer_opportunity}</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div
                          className="bg-orange-500 h-2 rounded-full transition-all"
                          style={{ width: `${selectedCompany.dealer_opportunity}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 雷达图 */}
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">多维度评分分析</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#475569" />
                      <PolarAngleAxis dataKey="dimension" stroke="#9ca3af" />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#9ca3af" />
                      <Radar name="评分" dataKey="value" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.3} />
                      <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                {/* 财务趋势 */}
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">3年财务趋势</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={financialTrendData}>
                      <CartesianGrid stroke="#475569" />
                      <XAxis dataKey="year" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }} />
                      <Legend />
                      <Line type="monotone" dataKey="营收" stroke="#06b6d4" strokeWidth={2} />
                      <Line type="monotone" dataKey="净利润" stroke="#10b981" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* 评分详情 - 财务健康度 */}
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg">
                  <button
                    onClick={() => toggleSection("financial")}
                    className="w-full p-6 flex items-center justify-between hover:bg-slate-700/20 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">💰</span>
                      <div className="text-left">
                        <h3 className="text-lg font-semibold text-white">财务健康度</h3>
                        <p className="text-sm text-gray-400">评分: {selectedCompany.financial_health} (权重: 30%)</p>
                      </div>
                    </div>
                    {expandedSections.financial ? <ChevronUp /> : <ChevronDown />}
                  </button>

                  {expandedSections.financial && (
                    <div className="px-6 pb-6 border-t border-slate-700 space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-900/50 p-3 rounded">
                          <p className="text-xs text-gray-400 mb-1">净利率</p>
                          <p className="text-lg font-semibold text-white">
                            {selectedCompany.financials[0].net_margin}%
                          </p>
                          <p className="text-xs text-cyan-400">评分: {selectedCompany.scoring_details.financial_health_details.net_margin_score}</p>
                        </div>
                        <div className="bg-slate-900/50 p-3 rounded">
                          <p className="text-xs text-gray-400 mb-1">ROE</p>
                          <p className="text-lg font-semibold text-white">
                            {selectedCompany.financials[0].roe}%
                          </p>
                          <p className="text-xs text-cyan-400">评分: {selectedCompany.scoring_details.financial_health_details.roe_score}</p>
                        </div>
                        <div className="bg-slate-900/50 p-3 rounded">
                          <p className="text-xs text-gray-400 mb-1">毛利率</p>
                          <p className="text-lg font-semibold text-white">
                            {selectedCompany.financials[0].gross_margin}%
                          </p>
                          <p className="text-xs text-cyan-400">评分: {selectedCompany.scoring_details.financial_health_details.gross_margin_score}</p>
                        </div>
                        <div className="bg-slate-900/50 p-3 rounded">
                          <p className="text-xs text-gray-400 mb-1">资产负债率</p>
                          <p className="text-lg font-semibold text-white">50%</p>
                          <p className="text-xs text-cyan-400">评分: {selectedCompany.scoring_details.financial_health_details.debt_ratio_score}</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-300 bg-slate-900/30 p-3 rounded">
                        💡 <strong>分析:</strong> 企业净利率为 {selectedCompany.financials[0].net_margin}%，ROE 为 {selectedCompany.financials[0].roe}%，毛利率为 {selectedCompany.financials[0].gross_margin}%，整体财务健康度良好。
                      </p>
                    </div>
                  )}
                </div>

                {/* 评分详情 - 成长潜力 */}
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg">
                  <button
                    onClick={() => toggleSection("growth")}
                    className="w-full p-6 flex items-center justify-between hover:bg-slate-700/20 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">📈</span>
                      <div className="text-left">
                        <h3 className="text-lg font-semibold text-white">成长潜力</h3>
                        <p className="text-sm text-gray-400">评分: {selectedCompany.growth_potential} (权重: 25%)</p>
                      </div>
                    </div>
                    {expandedSections.growth ? <ChevronUp /> : <ChevronDown />}
                  </button>

                  {expandedSections.growth && (
                    <div className="px-6 pb-6 border-t border-slate-700 space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-900/50 p-3 rounded">
                          <p className="text-xs text-gray-400 mb-1">营收增速 (CAGR)</p>
                          <p className="text-lg font-semibold text-white">
                            {selectedCompany.scoring_details.growth_potential_details.revenue_growth_rate}%
                          </p>
                          <p className="text-xs text-green-400">评分: {selectedCompany.scoring_details.growth_potential_details.revenue_growth_score}</p>
                        </div>
                        <div className="bg-slate-900/50 p-3 rounded">
                          <p className="text-xs text-gray-400 mb-1">利润增速 (CAGR)</p>
                          <p className="text-lg font-semibold text-white">
                            {selectedCompany.scoring_details.growth_potential_details.profit_growth_rate}%
                          </p>
                          <p className="text-xs text-green-400">评分: {selectedCompany.scoring_details.growth_potential_details.profit_growth_score}</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-300 bg-slate-900/30 p-3 rounded">
                        💡 <strong>分析:</strong> 企业过去3年营收增速为 {selectedCompany.scoring_details.growth_potential_details.revenue_growth_rate}%，利润增速为 {selectedCompany.scoring_details.growth_potential_details.profit_growth_rate}%，成长动力充足。
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
