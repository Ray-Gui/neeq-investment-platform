import { useState, useMemo } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, TrendingDown, DollarSign, Percent, Activity } from "lucide-react";

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
  total_assets: number;
  total_liabilities: number;
}

interface CompanyWithFinancials {
  company: Company;
  financials: FinancialData[];
}

const MOCK_DATA: CompanyWithFinancials[] = [
  {
    company: {
      id: 1,
      code: "830938.OC",
      short_name: "可恩口腔",
      sector: "医疗健康",
      industry: "医疗器械",
    },
    financials: [
      {
        fiscal_year: 2024,
        revenue: 25000,
        net_profit: 3500,
        gross_margin: 65,
        net_margin: 14,
        roe: 18,
        total_assets: 45000,
        total_liabilities: 15000,
      },
      {
        fiscal_year: 2023,
        revenue: 22000,
        net_profit: 2800,
        gross_margin: 62,
        net_margin: 12.7,
        roe: 16,
        total_assets: 42000,
        total_liabilities: 14000,
      },
      {
        fiscal_year: 2022,
        revenue: 18000,
        net_profit: 2000,
        gross_margin: 60,
        net_margin: 11.1,
        roe: 14,
        total_assets: 38000,
        total_liabilities: 12000,
      },
    ],
  },
  {
    company: {
      id: 3,
      code: "874912.OC",
      short_name: "风和医疗",
      sector: "医疗健康",
      industry: "医疗器械",
    },
    financials: [
      {
        fiscal_year: 2024,
        revenue: 52979,
        net_profit: 6800,
        gross_margin: 68,
        net_margin: 12.8,
        roe: 20,
        total_assets: 65000,
        total_liabilities: 20000,
      },
      {
        fiscal_year: 2023,
        revenue: 52300,
        net_profit: 6200,
        gross_margin: 67,
        net_margin: 11.8,
        roe: 18,
        total_assets: 62000,
        total_liabilities: 19000,
      },
      {
        fiscal_year: 2022,
        revenue: 48000,
        net_profit: 5200,
        gross_margin: 65,
        net_margin: 10.8,
        roe: 16,
        total_assets: 58000,
        total_liabilities: 18000,
      },
    ],
  },
  {
    company: {
      id: 6,
      code: "430737.OC",
      short_name: "斯达新能源",
      sector: "新能源",
      industry: "新能源汽车",
    },
    financials: [
      {
        fiscal_year: 2024,
        revenue: 28000,
        net_profit: 3200,
        gross_margin: 38,
        net_margin: 11,
        roe: 16,
        total_assets: 42000,
        total_liabilities: 14000,
      },
      {
        fiscal_year: 2023,
        revenue: 24000,
        net_profit: 2400,
        gross_margin: 36,
        net_margin: 10,
        roe: 14,
        total_assets: 38000,
        total_liabilities: 12000,
      },
      {
        fiscal_year: 2022,
        revenue: 20000,
        net_profit: 1800,
        gross_margin: 34,
        net_margin: 9,
        roe: 12,
        total_assets: 35000,
        total_liabilities: 11000,
      },
    ],
  },
];

const COLORS = ["#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function FinancialAnalysis() {
  const [selectedCompanies, setSelectedCompanies] = useState<number[]>([1, 3, 6]);
  const [analysisType, setAnalysisType] = useState<"revenue" | "profit" | "margin" | "roe">("revenue");

  // 获取选中企业的财务数据
  const selectedData = useMemo(() => {
    return MOCK_DATA.filter((d) => selectedCompanies.includes(d.company.id));
  }, [selectedCompanies]);

  // 准备对标分析数据
  const comparisonData = useMemo(() => {
    if (selectedData.length === 0) return [];

    const latestYear = 2024;
    return selectedData.map((d) => {
      const latest = d.financials.find((f) => f.fiscal_year === latestYear);
      return {
        name: d.company.short_name,
        revenue: latest?.revenue || 0,
        netProfit: latest?.net_profit || 0,
        grossMargin: latest?.gross_margin || 0,
        netMargin: latest?.net_margin || 0,
        roe: latest?.roe || 0,
      };
    });
  }, [selectedData]);

  // 准备趋势分析数据
  const trendData = useMemo(() => {
    if (selectedData.length === 0) return [];

    const years = [2022, 2023, 2024];
    return years.map((year) => {
      const data: any = { year };
      selectedData.forEach((d) => {
        const fin = d.financials.find((f) => f.fiscal_year === year);
        data[d.company.short_name] = fin?.[analysisType === "revenue" ? "revenue" : analysisType === "profit" ? "net_profit" : analysisType === "margin" ? "gross_margin" : "roe"] || 0;
      });
      return data;
    });
  }, [selectedData, analysisType]);

  // 计算行业平均值
  const industryAverage = useMemo(() => {
    if (selectedData.length === 0) return null;

    const latest = selectedData[0].financials.find((f) => f.fiscal_year === 2024);
    if (!latest) return null;

    const avgRevenue = selectedData.reduce((sum, d) => {
      const fin = d.financials.find((f) => f.fiscal_year === 2024);
      return sum + (fin?.revenue || 0);
    }, 0) / selectedData.length;

    const avgNetProfit = selectedData.reduce((sum, d) => {
      const fin = d.financials.find((f) => f.fiscal_year === 2024);
      return sum + (fin?.net_profit || 0);
    }, 0) / selectedData.length;

    const avgGrossMargin = selectedData.reduce((sum, d) => {
      const fin = d.financials.find((f) => f.fiscal_year === 2024);
      return sum + (fin?.gross_margin || 0);
    }, 0) / selectedData.length;

    const avgNetMargin = selectedData.reduce((sum, d) => {
      const fin = d.financials.find((f) => f.fiscal_year === 2024);
      return sum + (fin?.net_margin || 0);
    }, 0) / selectedData.length;

    const avgRoe = selectedData.reduce((sum, d) => {
      const fin = d.financials.find((f) => f.fiscal_year === 2024);
      return sum + (fin?.roe || 0);
    }, 0) / selectedData.length;

    return {
      avgRevenue,
      avgNetProfit,
      avgGrossMargin,
      avgNetMargin,
      avgRoe,
    };
  }, [selectedData]);

  // 计算增长率
  const growthRate = useMemo(() => {
    if (selectedData.length === 0) return null;

    const latest = selectedData[0].financials.find((f) => f.fiscal_year === 2024);
    const previous = selectedData[0].financials.find((f) => f.fiscal_year === 2023);

    if (!latest || !previous) return null;

    return {
      revenue: ((latest.revenue - previous.revenue) / previous.revenue * 100).toFixed(2),
      profit: ((latest.net_profit - previous.net_profit) / previous.net_profit * 100).toFixed(2),
    };
  }, [selectedData]);

  const toggleCompany = (id: number) => {
    setSelectedCompanies((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
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
          <h1 className="text-4xl font-bold text-white mb-2">财务分析工具</h1>
          <p className="text-gray-400">企业财务对标分析、趋势分析、行业对比</p>
        </div>

        {/* 企业选择 */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">选择分析企业</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {MOCK_DATA.map((d) => (
              <label key={d.company.id} className="flex items-center p-3 bg-slate-700/30 rounded cursor-pointer hover:bg-slate-700/50 transition-colors">
                <input
                  type="checkbox"
                  checked={selectedCompanies.includes(d.company.id)}
                  onChange={() => toggleCompany(d.company.id)}
                  className="w-4 h-4 rounded"
                />
                <span className="ml-3 text-white">
                  {d.company.short_name}
                  <span className="text-xs text-gray-400 ml-2">({d.company.code})</span>
                </span>
              </label>
            ))}
          </div>
        </div>

        {selectedData.length > 0 && (
          <>
            {/* 关键指标卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              {/* 平均营收 */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-gray-400 text-sm">平均营收</p>
                  <DollarSign className="text-cyan-500" size={20} />
                </div>
                <p className="text-2xl font-bold text-white">
                  {industryAverage ? (industryAverage.avgRevenue / 1000).toFixed(1) : 0}K
                </p>
                <p className="text-xs text-gray-500 mt-1">万元</p>
              </div>

              {/* 平均净利润 */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-gray-400 text-sm">平均净利润</p>
                  <TrendingUp className="text-green-500" size={20} />
                </div>
                <p className="text-2xl font-bold text-green-400">
                  {industryAverage ? (industryAverage.avgNetProfit / 1000).toFixed(1) : 0}K
                </p>
                <p className="text-xs text-gray-500 mt-1">万元</p>
              </div>

              {/* 平均毛利率 */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-gray-400 text-sm">平均毛利率</p>
                  <Percent className="text-yellow-500" size={20} />
                </div>
                <p className="text-2xl font-bold text-yellow-400">
                  {industryAverage ? industryAverage.avgGrossMargin.toFixed(1) : 0}%
                </p>
                <p className="text-xs text-gray-500 mt-1">百分比</p>
              </div>

              {/* 平均净利率 */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-gray-400 text-sm">平均净利率</p>
                  <Activity className="text-blue-500" size={20} />
                </div>
                <p className="text-2xl font-bold text-blue-400">
                  {industryAverage ? industryAverage.avgNetMargin.toFixed(1) : 0}%
                </p>
                <p className="text-xs text-gray-500 mt-1">百分比</p>
              </div>

              {/* 平均ROE */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-gray-400 text-sm">平均ROE</p>
                  <TrendingUp className="text-purple-500" size={20} />
                </div>
                <p className="text-2xl font-bold text-purple-400">
                  {industryAverage ? industryAverage.avgRoe.toFixed(1) : 0}%
                </p>
                <p className="text-xs text-gray-500 mt-1">百分比</p>
              </div>
            </div>

            {/* 对标分析 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* 营收对比 */}
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">营收对比分析（2024）</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={comparisonData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }} />
                    <Bar dataKey="revenue" fill="#06b6d4" name="营收（万元）" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* 利润对比 */}
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">净利润对比分析（2024）</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={comparisonData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }} />
                    <Bar dataKey="netProfit" fill="#10b981" name="净利润（万元）" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 趋势分析 */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">趋势分析（2022-2024）</h3>
                <div className="flex gap-2">
                  {(["revenue", "profit", "margin", "roe"] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setAnalysisType(type)}
                      className={`px-3 py-1 rounded text-sm transition-colors ${
                        analysisType === type
                          ? "bg-cyan-600 text-white"
                          : "bg-slate-700 text-gray-300 hover:bg-slate-600"
                      }`}
                    >
                      {type === "revenue" ? "营收" : type === "profit" ? "利润" : type === "margin" ? "毛利率" : "ROE"}
                    </button>
                  ))}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="year" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }} />
                  <Legend />
                  {selectedData.map((d, idx) => (
                    <Line
                      key={d.company.id}
                      type="monotone"
                      dataKey={d.company.short_name}
                      stroke={COLORS[idx % COLORS.length]}
                      strokeWidth={2}
                      dot={{ fill: COLORS[idx % COLORS.length], r: 4 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* 财务指标详表 */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg overflow-hidden">
              <div className="p-6 border-b border-slate-700">
                <h3 className="text-lg font-semibold text-white">详细财务指标（2024）</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-700/50 border-b border-slate-600">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">企业</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">营收（万元）</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">净利润（万元）</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">毛利率（%）</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">净利率（%）</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">ROE（%）</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedData.map((d) => {
                      const fin = d.financials.find((f) => f.fiscal_year === 2024);
                      if (!fin) return null;
                      return (
                        <tr key={d.company.id} className="border-b border-slate-700 hover:bg-slate-700/30">
                          <td className="px-6 py-4 font-medium text-white">{d.company.short_name}</td>
                          <td className="px-6 py-4 text-cyan-400">{fin.revenue.toLocaleString()}</td>
                          <td className="px-6 py-4 text-green-400">{fin.net_profit.toLocaleString()}</td>
                          <td className="px-6 py-4 text-yellow-400">{fin.gross_margin.toFixed(1)}</td>
                          <td className="px-6 py-4 text-blue-400">{fin.net_margin.toFixed(1)}</td>
                          <td className="px-6 py-4 text-purple-400">{fin.roe.toFixed(1)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {selectedData.length === 0 && (
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-12 text-center">
            <p className="text-gray-400 text-lg">请选择至少一家企业进行分析</p>
          </div>
        )}
      </div>
    </div>
  );
}
