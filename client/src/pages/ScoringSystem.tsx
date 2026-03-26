import { useState, useMemo } from "react";
import { Star, TrendingUp, Zap, Award, Target, BarChart3, Filter, Search } from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";

interface Company {
  id: number;
  code: string;
  short_name: string;
  sector: string;
  industry: string;
}

interface ScoringData {
  company: Company;
  financialHealth: number;
  growthPotential: number;
  competitiveness: number;
  listingPotential: number;
  dealerOpportunity: number;
  totalScore: number;
  rating: string;
  recommendation: string;
}

// 模拟评分数据
const MOCK_SCORING_DATA: ScoringData[] = [
  {
    company: { id: 1, code: "830938.OC", short_name: "可恩口腔", sector: "医疗健康", industry: "医疗器械" },
    financialHealth: 82,
    growthPotential: 81,
    competitiveness: 81,
    listingPotential: 72,
    dealerOpportunity: 64,
    totalScore: 80.1,
    rating: "⭐⭐⭐⭐ 良好",
    recommendation: "推荐 - 值得关注",
  },
  {
    company: { id: 2, code: "430737.OC", short_name: "斯达新能源", sector: "新能源", industry: "新能源汽车" },
    financialHealth: 75,
    growthPotential: 88,
    competitiveness: 78,
    listingPotential: 85,
    dealerOpportunity: 72,
    totalScore: 81.2,
    rating: "⭐⭐⭐⭐ 良好",
    recommendation: "推荐 - 值得关注",
  },
  {
    company: { id: 3, code: "833816.OC", short_name: "元聚变科技", sector: "人工智能", industry: "AI应用" },
    financialHealth: 68,
    growthPotential: 92,
    competitiveness: 85,
    listingPotential: 70,
    dealerOpportunity: 75,
    totalScore: 79.5,
    rating: "⭐⭐⭐⭐ 良好",
    recommendation: "推荐 - 值得关注",
  },
  {
    company: { id: 4, code: "874912.OC", short_name: "风和医疗", sector: "医疗健康", industry: "医疗器械" },
    financialHealth: 78,
    growthPotential: 75,
    competitiveness: 80,
    listingPotential: 68,
    dealerOpportunity: 60,
    totalScore: 75.8,
    rating: "⭐⭐⭐⭐ 良好",
    recommendation: "推荐 - 值得关注",
  },
  {
    company: { id: 5, code: "834599.OC", short_name: "华新能源", sector: "新能源", industry: "新能源" },
    financialHealth: 72,
    growthPotential: 80,
    competitiveness: 75,
    listingPotential: 62,
    dealerOpportunity: 58,
    totalScore: 72.4,
    rating: "⭐⭐⭐ 一般",
    recommendation: "中性 - 可考虑",
  },
];

export default function ScoringSystem() {
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedSector, setSelectedSector] = useState<string>("全部");
  const [sortBy, setSortBy] = useState<"score" | "financial" | "growth">("score");
  const [selectedCompany, setSelectedCompany] = useState<ScoringData | null>(MOCK_SCORING_DATA[0]);

  const sectors = ["全部", "医疗健康", "新能源", "人工智能"];

  // 筛选和排序数据
  const filteredData = useMemo(() => {
    let filtered = MOCK_SCORING_DATA;

    // 按关键词搜索
    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.company.short_name.toLowerCase().includes(keyword) ||
          d.company.code.includes(keyword) ||
          d.company.industry.toLowerCase().includes(keyword)
      );
    }

    // 按行业筛选
    if (selectedSector !== "全部") {
      filtered = filtered.filter((d) => d.company.sector === selectedSector);
    }

    // 排序
    filtered.sort((a, b) => {
      if (sortBy === "score") return b.totalScore - a.totalScore;
      if (sortBy === "financial") return b.financialHealth - a.financialHealth;
      if (sortBy === "growth") return b.growthPotential - a.growthPotential;
      return 0;
    });

    return filtered;
  }, [searchKeyword, selectedSector, sortBy]);

  // 获取评分颜色
  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-red-400";
    if (score >= 75) return "text-green-400";
    if (score >= 60) return "text-yellow-400";
    if (score >= 45) return "text-orange-400";
    return "text-gray-400";
  };

  // 获取评分背景色
  const getScoreBgColor = (score: number) => {
    if (score >= 90) return "bg-red-500/10 border-red-500/30";
    if (score >= 75) return "bg-green-500/10 border-green-500/30";
    if (score >= 60) return "bg-yellow-500/10 border-yellow-500/30";
    if (score >= 45) return "bg-orange-500/10 border-orange-500/30";
    return "bg-gray-500/10 border-gray-500/30";
  };

  // 雷达图数据
  const radarData = selectedCompany
    ? [
        { dimension: "财务健康度", value: selectedCompany.financialHealth },
        { dimension: "成长潜力", value: selectedCompany.growthPotential },
        { dimension: "竞争力", value: selectedCompany.competitiveness },
        { dimension: "上市潜力", value: selectedCompany.listingPotential },
        { dimension: "做市商机会", value: selectedCompany.dealerOpportunity },
      ]
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
          <p className="text-gray-400">多维度综合评分，识别优质投资标的</p>
        </div>

        {/* 搜索和筛选 */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* 搜索框 */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 text-gray-500" size={20} />
                <input
                  type="text"
                  placeholder="搜索企业名称、代码或行业..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="w-full bg-slate-700 text-white pl-10 pr-4 py-2 rounded border border-slate-600 focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            {/* 行业筛选 */}
            <div>
              <select
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
                className="w-full bg-slate-700 text-white px-4 py-2 rounded border border-slate-600 focus:border-cyan-500 focus:outline-none"
              >
                {sectors.map((sector) => (
                  <option key={sector} value={sector}>
                    {sector}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 排序选项 */}
          <div className="flex gap-2">
            <button
              onClick={() => setSortBy("score")}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                sortBy === "score"
                  ? "bg-cyan-500 text-white"
                  : "bg-slate-700 text-gray-300 hover:bg-slate-600"
              }`}
            >
              按总分排序
            </button>
            <button
              onClick={() => setSortBy("financial")}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                sortBy === "financial"
                  ? "bg-cyan-500 text-white"
                  : "bg-slate-700 text-gray-300 hover:bg-slate-600"
              }`}
            >
              按财务健康度排序
            </button>
            <button
              onClick={() => setSortBy("growth")}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                sortBy === "growth"
                  ? "bg-cyan-500 text-white"
                  : "bg-slate-700 text-gray-300 hover:bg-slate-600"
              }`}
            >
              按成长潜力排序
            </button>
          </div>
        </div>

        {/* 主要内容区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
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
                    <span className={`text-lg font-bold ${getScoreColor(data.totalScore)}`}>
                      {data.totalScore.toFixed(1)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">{data.company.code}</div>
                  <div className="text-xs text-gray-500 mt-1">{data.rating}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 右侧：详细信息 */}
          <div className="lg:col-span-2 space-y-4">
            {selectedCompany && (
              <>
                {/* 企业基本信息 */}
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-1">{selectedCompany.company.short_name}</h2>
                      <p className="text-gray-400">{selectedCompany.company.code} · {selectedCompany.company.industry}</p>
                    </div>
                    <div className="text-right">
                      <div className={`text-4xl font-bold ${getScoreColor(selectedCompany.totalScore)}`}>
                        {selectedCompany.totalScore.toFixed(1)}
                      </div>
                      <div className="text-sm text-gray-400 mt-1">{selectedCompany.rating}</div>
                    </div>
                  </div>

                  <div className={`p-4 rounded-lg border ${getScoreBgColor(selectedCompany.totalScore)} mb-4`}>
                    <p className="text-white font-semibold mb-2">投资建议</p>
                    <p className="text-gray-300">{selectedCompany.recommendation}</p>
                  </div>

                  {/* 五维度评分条 */}
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-gray-300">财务健康度</span>
                        <span className="text-sm font-semibold text-cyan-400">{selectedCompany.financialHealth}</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div
                          className="bg-cyan-500 h-2 rounded-full transition-all"
                          style={{ width: `${selectedCompany.financialHealth}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-gray-300">成长潜力</span>
                        <span className="text-sm font-semibold text-green-400">{selectedCompany.growthPotential}</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full transition-all"
                          style={{ width: `${selectedCompany.growthPotential}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-gray-300">竞争力</span>
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
                        <span className="text-sm text-gray-300">上市潜力</span>
                        <span className="text-sm font-semibold text-purple-400">{selectedCompany.listingPotential}</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div
                          className="bg-purple-500 h-2 rounded-full transition-all"
                          style={{ width: `${selectedCompany.listingPotential}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-gray-300">做市商机会</span>
                        <span className="text-sm font-semibold text-orange-400">{selectedCompany.dealerOpportunity}</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div
                          className="bg-orange-500 h-2 rounded-full transition-all"
                          style={{ width: `${selectedCompany.dealerOpportunity}%` }}
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
              </>
            )}
          </div>
        </div>

        {/* 排名表格 */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">企业排名</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-gray-400">排名</th>
                  <th className="text-left py-3 px-4 text-gray-400">企业名称</th>
                  <th className="text-left py-3 px-4 text-gray-400">代码</th>
                  <th className="text-left py-3 px-4 text-gray-400">行业</th>
                  <th className="text-right py-3 px-4 text-gray-400">总分</th>
                  <th className="text-left py-3 px-4 text-gray-400">等级</th>
                  <th className="text-left py-3 px-4 text-gray-400">建议</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((data, index) => (
                  <tr
                    key={data.company.id}
                    className="border-b border-slate-700 hover:bg-slate-700/20 transition-colors cursor-pointer"
                    onClick={() => setSelectedCompany(data)}
                  >
                    <td className="py-3 px-4 text-gray-300 font-semibold">#{index + 1}</td>
                    <td className="py-3 px-4 text-white font-semibold">{data.company.short_name}</td>
                    <td className="py-3 px-4 text-gray-400">{data.company.code}</td>
                    <td className="py-3 px-4 text-gray-400">{data.company.industry}</td>
                    <td className={`py-3 px-4 text-right font-bold ${getScoreColor(data.totalScore)}`}>
                      {data.totalScore.toFixed(1)}
                    </td>
                    <td className="py-3 px-4 text-gray-300">{data.rating}</td>
                    <td className="py-3 px-4 text-gray-400 text-xs">{data.recommendation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
