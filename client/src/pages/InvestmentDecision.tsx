import { useState, useMemo } from "react";
import { Search, TrendingUp, Target, AlertCircle, CheckCircle, Filter, Download } from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter, Cell } from "recharts";

interface InvestmentRecommendation {
  company_id: number;
  code: string;
  short_name: string;
  sector: string;
  
  // 综合评分
  overall_score: number;
  
  // 各维度评分
  financial_health: number;
  growth_potential: number;
  competitiveness: number;
  listing_potential: number;
  dealer_opportunity: number;
  
  // 投资建议
  recommendation: string;
  confidence_level: number; // 0-100
  investment_horizon: string; // 短期、中期、长期
  target_return: number; // 预期收益率 %
  
  // 投资组合配置
  portfolio_weight: number; // 建议配置比例 %
  risk_level: string; // 低、中、高
  
  // 投资理由
  investment_thesis: string[];
  
  // 风险提示
  risk_warnings: string[];
  
  // 进入和退出策略
  entry_strategy: string;
  exit_strategy: string;
}

// 模拟数据
const MOCK_RECOMMENDATIONS: InvestmentRecommendation[] = [
  {
    company_id: 1,
    code: "830938.OC",
    short_name: "可恩口腔",
    sector: "医疗健康",
    overall_score: 80.1,
    financial_health: 82,
    growth_potential: 81,
    competitiveness: 81,
    listing_potential: 72,
    dealer_opportunity: 64,
    recommendation: "强烈推荐",
    confidence_level: 85,
    investment_horizon: "中期 (1-2年)",
    target_return: 120,
    portfolio_weight: 15,
    risk_level: "低风险",
    investment_thesis: [
      "医疗器械行业高景气，市场需求旺盛",
      "企业盈利能力强，连续增长",
      "上市潜力高，预计 2025 年上市",
      "首日涨幅预期 45%，一年收益 120%",
    ],
    risk_warnings: [
      "医疗器械行业竞争加剧",
      "政策监管风险",
      "融资稀释风险",
    ],
    entry_strategy: "分批建仓，目标价格 8-9 元，建议配置 15% 资金",
    exit_strategy: "分阶段减仓：上市前减仓 30%，上市后首日减仓 40%，持有 30% 长期持仓",
  },
  {
    company_id: 6,
    code: "430737.OC",
    short_name: "斯达新能源",
    sector: "新能源",
    overall_score: 81.2,
    financial_health: 75,
    growth_potential: 88,
    competitiveness: 78,
    listing_potential: 85,
    dealer_opportunity: 72,
    recommendation: "推荐",
    confidence_level: 78,
    investment_horizon: "中长期 (2-3年)",
    target_return: 150,
    portfolio_weight: 12,
    risk_level: "中等风险",
    investment_thesis: [
      "新能源汽车产业快速发展，政策支持力度大",
      "企业成长性突出，营收利润快速增长",
      "上市潜力高，预计 2026 年上市",
      "首日涨幅预期 55%，一年收益 150%",
    ],
    risk_warnings: [
      "新能源政策不确定性",
      "技术进步风险",
      "成本压力和竞争加剧",
    ],
    entry_strategy: "分批建仓，目标价格 12-13 元，建议配置 12% 资金",
    exit_strategy: "分阶段减仓：上市前减仓 20%，上市后首日减仓 50%，持有 30% 长期持仓",
  },
];

const PORTFOLIO_ALLOCATION = [
  { name: "可恩口腔", value: 15, color: "#06b6d4" },
  { name: "斯达新能源", value: 12, color: "#10b981" },
  { name: "其他企业", value: 73, color: "#475569" },
];

export default function InvestmentDecision() {
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<InvestmentRecommendation | null>(MOCK_RECOMMENDATIONS[0]);
  const [filterRisk, setFilterRisk] = useState<string>("全部");

  const filteredData = useMemo(() => {
    let filtered = MOCK_RECOMMENDATIONS.filter(
      (d) =>
        d.short_name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        d.code.includes(searchKeyword)
    );

    if (filterRisk !== "全部") {
      filtered = filtered.filter((d) => d.risk_level === filterRisk);
    }

    return filtered.sort((a, b) => b.overall_score - a.overall_score);
  }, [searchKeyword, filterRisk]);

  const getRecommendationColor = (recommendation: string) => {
    if (recommendation === "强烈推荐") return "bg-red-500/20 text-red-400 border-red-500/30";
    if (recommendation === "推荐") return "bg-green-500/20 text-green-400 border-green-500/30";
    if (recommendation === "中性") return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    return "bg-orange-500/20 text-orange-400 border-orange-500/30";
  };

  const getRiskColor = (risk: string) => {
    if (risk === "低风险") return "bg-green-500/20 text-green-400 border-green-500/30";
    if (risk === "中等风险") return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    return "bg-red-500/20 text-red-400 border-red-500/30";
  };

  const scoreData = selectedCompany
    ? [
        { dimension: "财务健康度", score: selectedCompany.financial_health },
        { dimension: "成长潜力", score: selectedCompany.growth_potential },
        { dimension: "竞争力", score: selectedCompany.competitiveness },
        { dimension: "上市潜力", score: selectedCompany.listing_potential },
        { dimension: "做市商机会", score: selectedCompany.dealer_opportunity },
      ]
    : [];

  const riskReturnData = MOCK_RECOMMENDATIONS.map((r) => ({
    name: r.short_name,
    risk: r.risk_level === "低风险" ? 1 : r.risk_level === "中等风险" ? 2 : 3,
    return: r.target_return,
    score: r.overall_score,
  }));

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
          <h1 className="text-4xl font-bold text-white mb-2">投资决策支持系统</h1>
          <p className="text-gray-400">基于多维度分析的投资建议和投资组合配置</p>
        </div>

        {/* 搜索和筛选 */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-4 mb-6">
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
              value={filterRisk}
              onChange={(e) => setFilterRisk(e.target.value)}
              className="bg-slate-700 text-white px-4 py-2 rounded border border-slate-600 focus:border-cyan-500 focus:outline-none"
            >
              <option value="全部">全部风险等级</option>
              <option value="低风险">低风险</option>
              <option value="中等风险">中等风险</option>
              <option value="高风险">高风险</option>
            </select>
          </div>
        </div>

        {/* 主要内容 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：企业列表 */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-4 space-y-2 max-h-[600px] overflow-y-auto">
              <h2 className="text-lg font-semibold text-white mb-4 sticky top-0 bg-slate-800/50">投资建议</h2>
              {filteredData.map((data) => (
                <button
                  key={data.company_id}
                  onClick={() => setSelectedCompany(data)}
                  className={`w-full text-left p-3 rounded transition-colors ${
                    selectedCompany?.company_id === data.company_id
                      ? "bg-cyan-500/20 border border-cyan-500/50"
                      : "bg-slate-700/30 border border-slate-700 hover:bg-slate-700/50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-white">{data.short_name}</span>
                    <span className="text-sm font-bold text-cyan-400">{data.overall_score.toFixed(1)}</span>
                  </div>
                  <div className="text-xs text-gray-400 mb-2">{data.code}</div>
                  <div className={`text-xs px-2 py-1 rounded inline-block border ${getRecommendationColor(data.recommendation)}`}>
                    {data.recommendation}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 右侧：详细信息 */}
          <div className="lg:col-span-2 space-y-4">
            {selectedCompany && (
              <>
                {/* 基本信息和建议 */}
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-1">{selectedCompany.short_name}</h2>
                      <p className="text-gray-400">{selectedCompany.code} · {selectedCompany.sector}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-cyan-400">{selectedCompany.overall_score.toFixed(1)}</div>
                      <div className="text-sm text-gray-400 mt-1">综合评分</div>
                    </div>
                  </div>

                  {/* 投资建议和风险等级 */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className={`rounded-lg p-4 border ${getRecommendationColor(selectedCompany.recommendation)}`}>
                      <p className="text-xs text-gray-300 mb-1">投资建议</p>
                      <p className="text-lg font-semibold">{selectedCompany.recommendation}</p>
                    </div>
                    <div className={`rounded-lg p-4 border ${getRiskColor(selectedCompany.risk_level)}`}>
                      <p className="text-xs text-gray-300 mb-1">风险等级</p>
                      <p className="text-lg font-semibold">{selectedCompany.risk_level}</p>
                    </div>
                  </div>

                  {/* 关键指标 */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-slate-900/50 p-3 rounded border border-slate-700 text-center">
                      <p className="text-xs text-gray-400 mb-1">信心度</p>
                      <p className="text-lg font-bold text-cyan-400">{selectedCompany.confidence_level}%</p>
                    </div>
                    <div className="bg-slate-900/50 p-3 rounded border border-slate-700 text-center">
                      <p className="text-xs text-gray-400 mb-1">预期收益</p>
                      <p className="text-lg font-bold text-green-400">+{selectedCompany.target_return}%</p>
                    </div>
                    <div className="bg-slate-900/50 p-3 rounded border border-slate-700 text-center">
                      <p className="text-xs text-gray-400 mb-1">投资周期</p>
                      <p className="text-lg font-bold text-yellow-400">{selectedCompany.investment_horizon}</p>
                    </div>
                  </div>
                </div>

                {/* 五维度评分 */}
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">多维度评分分析</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={scoreData}>
                      <CartesianGrid stroke="#475569" />
                      <XAxis dataKey="dimension" stroke="#9ca3af" angle={-45} textAnchor="end" height={80} />
                      <YAxis domain={[0, 100]} stroke="#9ca3af" />
                      <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }} />
                      <Bar dataKey="score" fill="#06b6d4" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* 投资理由 */}
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle className="text-green-400" size={20} />
                    <h3 className="text-lg font-semibold text-white">投资理由</h3>
                  </div>
                  <div className="space-y-2">
                    {selectedCompany.investment_thesis.map((thesis, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-slate-900/50 rounded border border-slate-700">
                        <span className="text-green-400 mt-1">✓</span>
                        <span className="text-gray-300">{thesis}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 风险提示 */}
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertCircle className="text-orange-400" size={20} />
                    <h3 className="text-lg font-semibold text-white">风险提示</h3>
                  </div>
                  <div className="space-y-2">
                    {selectedCompany.risk_warnings.map((warning, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-slate-900/50 rounded border border-slate-700">
                        <span className="text-orange-400 mt-1">⚠️</span>
                        <span className="text-gray-300">{warning}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 进入策略 */}
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">进入策略</h3>
                  <div className="bg-slate-900/50 p-4 rounded border border-slate-700">
                    <p className="text-gray-300">{selectedCompany.entry_strategy}</p>
                  </div>
                </div>

                {/* 退出策略 */}
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">退出策略</h3>
                  <div className="bg-slate-900/50 p-4 rounded border border-slate-700">
                    <p className="text-gray-300">{selectedCompany.exit_strategy}</p>
                  </div>
                </div>

                {/* 投资组合配置 */}
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">建议投资组合配置</h3>
                  <div className="bg-slate-900/50 p-4 rounded border border-slate-700 text-center mb-4">
                    <p className="text-xs text-gray-400 mb-2">建议配置比例</p>
                    <p className="text-2xl font-bold text-cyan-400">{selectedCompany.portfolio_weight}%</p>
                  </div>
                  <p className="text-sm text-gray-300">
                    建议在投资组合中配置 {selectedCompany.portfolio_weight}% 的资金用于投资该企业，以平衡风险和收益。
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 投资组合总览 */}
        <div className="mt-8 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-white mb-6">投资组合总览</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 配置比例 */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">资金配置</h3>
              <div className="space-y-3">
                {PORTFOLIO_ALLOCATION.map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: item.color }} />
                    <span className="text-gray-300">{item.name}</span>
                    <span className="ml-auto text-white font-semibold">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 风险收益分析 */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">风险-收益分析</h3>
              <ResponsiveContainer width="100%" height={250}>
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid stroke="#475569" />
                  <XAxis type="number" dataKey="risk" name="风险等级" stroke="#9ca3af" />
                  <YAxis type="number" dataKey="return" name="预期收益" stroke="#9ca3af" />
                  <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }} cursor={{ strokeDasharray: "3 3" }} />
                  <Scatter name="投资机会" data={riskReturnData} fill="#06b6d4" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
