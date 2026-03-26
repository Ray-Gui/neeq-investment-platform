import { useState, useMemo } from "react";
import { Search, TrendingUp, CheckCircle, AlertCircle, Clock, Target } from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter } from "recharts";

interface ListingAssessment {
  company_id: number;
  code: string;
  short_name: string;
  sector: string;
  
  // 上市条件评估
  scale_score: number; // 规模达标度
  profitability_score: number; // 盈利能力
  compliance_score: number; // 合规性
  governance_score: number; // 公司治理
  
  // 上市时间预测
  estimated_listing_year: number;
  listing_probability: number; // 上市概率 0-100
  listing_readiness: string; // 上市就绪度
  
  // 上市后表现预测
  estimated_ipo_price: number;
  estimated_first_day_return: number;
  estimated_one_year_return: number;
  
  // 风险评估
  risk_level: string;
  risk_factors: string[];
  
  // 详细分析
  analysis: string;
}

// 模拟数据
const MOCK_LISTING_ASSESSMENTS: ListingAssessment[] = [
  {
    company_id: 1,
    code: "830938.OC",
    short_name: "可恩口腔",
    sector: "医疗健康",
    scale_score: 85,
    profitability_score: 88,
    compliance_score: 90,
    governance_score: 82,
    estimated_listing_year: 2025,
    listing_probability: 85,
    listing_readiness: "高度就绪",
    estimated_ipo_price: 28,
    estimated_first_day_return: 45,
    estimated_one_year_return: 120,
    risk_level: "低风险",
    risk_factors: ["市场竞争加剧", "政策变化风险"],
    analysis: "企业规模达标，盈利能力强，合规性好。建议在 2025 年上市，预期首日涨幅 45%，一年后收益 120%。",
  },
  {
    company_id: 6,
    code: "430737.OC",
    short_name: "斯达新能源",
    sector: "新能源",
    scale_score: 80,
    profitability_score: 75,
    compliance_score: 85,
    governance_score: 78,
    estimated_listing_year: 2026,
    listing_probability: 75,
    listing_readiness: "基本就绪",
    estimated_ipo_price: 32,
    estimated_first_day_return: 55,
    estimated_one_year_return: 150,
    risk_level: "中等风险",
    risk_factors: ["行业政策不确定性", "技术进步风险", "成本压力"],
    analysis: "企业成长性好，但盈利能力还需提升。建议在 2026 年上市，预期首日涨幅 55%，一年后收益 150%。",
  },
];

const LISTING_CONDITIONS = [
  { label: "规模达标度", key: "scale_score", description: "企业营收规模是否达到上市标准" },
  { label: "盈利能力", key: "profitability_score", description: "企业连续盈利能力和利润率水平" },
  { label: "合规性", key: "compliance_score", description: "企业是否符合监管要求和信息披露标准" },
  { label: "公司治理", key: "governance_score", description: "企业治理结构是否规范完善" },
];

export default function ListingPotential() {
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<ListingAssessment | null>(MOCK_LISTING_ASSESSMENTS[0]);

  const filteredData = useMemo(() => {
    return MOCK_LISTING_ASSESSMENTS.filter(
      (d) =>
        d.short_name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        d.code.includes(searchKeyword)
    ).sort((a, b) => b.listing_probability - a.listing_probability);
  }, [searchKeyword]);

  const getReadinessColor = (readiness: string) => {
    if (readiness === "高度就绪") return "bg-green-500/20 text-green-400 border-green-500/30";
    if (readiness === "基本就绪") return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    return "bg-orange-500/20 text-orange-400 border-orange-500/30";
  };

  const getRiskColor = (risk: string) => {
    if (risk === "低风险") return "bg-green-500/20 text-green-400 border-green-500/30";
    if (risk === "中等风险") return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    return "bg-red-500/20 text-red-400 border-red-500/30";
  };

  const conditionData = selectedCompany
    ? [
        { condition: "规模达标度", score: selectedCompany.scale_score },
        { condition: "盈利能力", score: selectedCompany.profitability_score },
        { condition: "合规性", score: selectedCompany.compliance_score },
        { condition: "公司治理", score: selectedCompany.governance_score },
      ]
    : [];

  const performanceData = [
    { metric: "IPO价格", value: selectedCompany?.estimated_ipo_price || 0, benchmark: 25 },
    { metric: "首日涨幅", value: selectedCompany?.estimated_first_day_return || 0, benchmark: 40 },
    { metric: "一年收益", value: selectedCompany?.estimated_one_year_return || 0, benchmark: 100 },
  ];

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
          <h1 className="text-4xl font-bold text-white mb-2">上市潜力评估</h1>
          <p className="text-gray-400">预测企业上市可能性、时间窗口和上市后表现</p>
        </div>

        {/* 搜索 */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-4 mb-6">
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

        {/* 主要内容 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：企业列表 */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-4 space-y-2 max-h-[600px] overflow-y-auto">
              <h2 className="text-lg font-semibold text-white mb-4 sticky top-0 bg-slate-800/50">企业列表</h2>
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
                    <span className="text-sm font-bold text-green-400">{data.listing_probability}%</span>
                  </div>
                  <div className="text-xs text-gray-400 mb-1">{data.code}</div>
                  <div className="text-xs text-cyan-400">预计 {data.estimated_listing_year} 年上市</div>
                </button>
              ))}
            </div>
          </div>

          {/* 右侧：详细信息 */}
          <div className="lg:col-span-2 space-y-4">
            {selectedCompany && (
              <>
                {/* 基本信息 */}
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-1">{selectedCompany.short_name}</h2>
                      <p className="text-gray-400">{selectedCompany.code} · {selectedCompany.sector}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-green-400">{selectedCompany.listing_probability}%</div>
                      <div className="text-sm text-gray-400 mt-1">上市概率</div>
                    </div>
                  </div>

                  {/* 上市就绪度和风险等级 */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className={`rounded-lg p-4 border ${getReadinessColor(selectedCompany.listing_readiness)}`}>
                      <p className="text-xs text-gray-300 mb-1">上市就绪度</p>
                      <p className="text-lg font-semibold">{selectedCompany.listing_readiness}</p>
                    </div>
                    <div className={`rounded-lg p-4 border ${getRiskColor(selectedCompany.risk_level)}`}>
                      <p className="text-xs text-gray-300 mb-1">风险等级</p>
                      <p className="text-lg font-semibold">{selectedCompany.risk_level}</p>
                    </div>
                  </div>

                  {/* 上市时间预测 */}
                  <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="text-cyan-400" size={20} />
                      <h3 className="font-semibold text-white">上市时间预测</h3>
                    </div>
                    <p className="text-2xl font-bold text-cyan-400 mb-1">{selectedCompany.estimated_listing_year} 年</p>
                    <p className="text-sm text-gray-400">基于企业发展进度和市场条件的预测</p>
                  </div>
                </div>

                {/* 上市条件评估 */}
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">上市条件评估</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={conditionData}>
                      <CartesianGrid stroke="#475569" />
                      <XAxis dataKey="condition" stroke="#9ca3af" />
                      <YAxis domain={[0, 100]} stroke="#9ca3af" />
                      <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }} />
                      <Bar dataKey="score" fill="#06b6d4" />
                    </BarChart>
                  </ResponsiveContainer>

                  {/* 条件详情 */}
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    {LISTING_CONDITIONS.map((condition) => (
                      <div key={condition.key} className="bg-slate-900/50 p-3 rounded border border-slate-700">
                        <p className="text-xs text-gray-400 mb-1">{condition.label}</p>
                        <p className="text-lg font-semibold text-white">
                          {selectedCompany[condition.key as keyof ListingAssessment] as number}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 上市后表现预测 */}
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">上市后表现预测</h3>
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-slate-900/50 p-4 rounded border border-slate-700 text-center">
                      <p className="text-xs text-gray-400 mb-2">预期 IPO 价格</p>
                      <p className="text-2xl font-bold text-cyan-400">¥{selectedCompany.estimated_ipo_price}</p>
                    </div>
                    <div className="bg-slate-900/50 p-4 rounded border border-slate-700 text-center">
                      <p className="text-xs text-gray-400 mb-2">首日涨幅</p>
                      <p className="text-2xl font-bold text-green-400">+{selectedCompany.estimated_first_day_return}%</p>
                    </div>
                    <div className="bg-slate-900/50 p-4 rounded border border-slate-700 text-center">
                      <p className="text-xs text-gray-400 mb-2">一年收益</p>
                      <p className="text-2xl font-bold text-yellow-400">+{selectedCompany.estimated_one_year_return}%</p>
                    </div>
                  </div>

                  {/* 性能对比图 */}
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={performanceData}>
                      <CartesianGrid stroke="#475569" />
                      <XAxis dataKey="metric" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }} />
                      <Legend />
                      <Bar dataKey="value" fill="#06b6d4" name="预测值" />
                      <Bar dataKey="benchmark" fill="#475569" name="行业平均" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* 风险因素 */}
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertCircle className="text-orange-400" size={20} />
                    <h3 className="text-lg font-semibold text-white">风险因素</h3>
                  </div>
                  <div className="space-y-2">
                    {selectedCompany.risk_factors.map((factor, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-slate-900/50 rounded border border-slate-700">
                        <span className="text-orange-400 mt-1">⚠️</span>
                        <span className="text-gray-300">{factor}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 综合分析 */}
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Target className="text-cyan-400" size={20} />
                    <h3 className="text-lg font-semibold text-white">综合分析</h3>
                  </div>
                  <p className="text-gray-300 leading-relaxed">{selectedCompany.analysis}</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
