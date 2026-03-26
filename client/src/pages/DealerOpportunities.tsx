import { useState, useMemo } from "react";
import { Search, TrendingUp, Zap, AlertCircle, BarChart3, DollarSign } from "lucide-react";
import { AreaChart, Area, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter } from "recharts";

interface DealerOpportunity {
  company_id: number;
  code: string;
  short_name: string;
  sector: string;
  
  // 流动性指标
  liquidity_score: number;
  trading_volume: number; // 月均成交量
  bid_ask_spread: number; // 买卖价差 %
  
  // 波动性指标
  volatility_score: number;
  price_volatility: number; // 价格波动率 %
  volume_volatility: number; // 成交量波动率 %
  
  // 融资需求
  financing_need_score: number;
  next_financing_round: string;
  estimated_financing_amount: number; // 万元
  
  // 做市机会评分
  opportunity_score: number;
  opportunity_level: string; // 高、中、低
  
  // 做市策略
  strategy: string;
  expected_profit_margin: number; // 预期利润率 %
  
  // 历史数据
  price_history: Array<{ date: string; price: number; volume: number }>;
}

// 模拟数据
const MOCK_DEALER_OPPORTUNITIES: DealerOpportunity[] = [
  {
    company_id: 1,
    code: "830938.OC",
    short_name: "可恩口腔",
    sector: "医疗健康",
    liquidity_score: 72,
    trading_volume: 150000,
    bid_ask_spread: 2.5,
    volatility_score: 68,
    price_volatility: 15,
    volume_volatility: 25,
    financing_need_score: 65,
    next_financing_round: "B 轮融资",
    estimated_financing_amount: 5000,
    opportunity_score: 75,
    opportunity_level: "中等机会",
    strategy: "双向做市 + 融资套利",
    expected_profit_margin: 3.5,
    price_history: [
      { date: "2024-01", price: 8.5, volume: 120000 },
      { date: "2024-02", price: 9.2, volume: 140000 },
      { date: "2024-03", price: 8.8, volume: 130000 },
      { date: "2024-04", price: 9.8, volume: 160000 },
      { date: "2024-05", price: 10.2, volume: 170000 },
      { date: "2024-06", price: 9.5, volume: 150000 },
    ],
  },
  {
    company_id: 6,
    code: "430737.OC",
    short_name: "斯达新能源",
    sector: "新能源",
    liquidity_score: 78,
    trading_volume: 200000,
    bid_ask_spread: 2.0,
    volatility_score: 82,
    price_volatility: 22,
    volume_volatility: 35,
    financing_need_score: 78,
    next_financing_round: "C 轮融资",
    estimated_financing_amount: 8000,
    opportunity_score: 85,
    opportunity_level: "高度机会",
    strategy: "高频做市 + 融资前布局",
    expected_profit_margin: 4.8,
    price_history: [
      { date: "2024-01", price: 12.0, volume: 180000 },
      { date: "2024-02", price: 13.5, volume: 210000 },
      { date: "2024-03", price: 12.8, volume: 190000 },
      { date: "2024-04", price: 14.2, volume: 230000 },
      { date: "2024-05", price: 15.5, volume: 250000 },
      { date: "2024-06", price: 14.8, volume: 220000 },
    ],
  },
];

export default function DealerOpportunities() {
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<DealerOpportunity | null>(MOCK_DEALER_OPPORTUNITIES[0]);
  const [sortBy, setSortBy] = useState<"opportunity" | "liquidity" | "volatility">("opportunity");

  const filteredData = useMemo(() => {
    let filtered = MOCK_DEALER_OPPORTUNITIES.filter(
      (d) =>
        d.short_name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        d.code.includes(searchKeyword)
    );

    if (sortBy === "opportunity") {
      filtered.sort((a, b) => b.opportunity_score - a.opportunity_score);
    } else if (sortBy === "liquidity") {
      filtered.sort((a, b) => b.liquidity_score - a.liquidity_score);
    } else if (sortBy === "volatility") {
      filtered.sort((a, b) => b.volatility_score - a.volatility_score);
    }

    return filtered;
  }, [searchKeyword, sortBy]);

  const getOpportunityColor = (level: string) => {
    if (level === "高度机会") return "bg-red-500/20 text-red-400 border-red-500/30";
    if (level === "中等机会") return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    return "bg-green-500/20 text-green-400 border-green-500/30";
  };

  const riskRewardData = [
    { name: "波动性", value: selectedCompany?.volatility_score || 0 },
    { name: "流动性", value: selectedCompany?.liquidity_score || 0 },
    { name: "融资需求", value: selectedCompany?.financing_need_score || 0 },
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
          <h1 className="text-4xl font-bold text-white mb-2">做市商机会识别</h1>
          <p className="text-gray-400">识别高价值的做市商交易机会和套利机会</p>
        </div>

        {/* 搜索和排序 */}
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
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-700 text-white px-4 py-2 rounded border border-slate-600 focus:border-cyan-500 focus:outline-none"
            >
              <option value="opportunity">按机会评分排序</option>
              <option value="liquidity">按流动性排序</option>
              <option value="volatility">按波动性排序</option>
            </select>
          </div>
        </div>

        {/* 主要内容 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：企业列表 */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-4 space-y-2 max-h-[600px] overflow-y-auto">
              <h2 className="text-lg font-semibold text-white mb-4 sticky top-0 bg-slate-800/50">机会列表</h2>
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
                    <span className="text-sm font-bold text-cyan-400">{data.opportunity_score}</span>
                  </div>
                  <div className="text-xs text-gray-400 mb-1">{data.code}</div>
                  <div className={`text-xs px-2 py-1 rounded inline-block border ${getOpportunityColor(data.opportunity_level)}`}>
                    {data.opportunity_level}
                  </div>
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
                      <div className="text-3xl font-bold text-cyan-400">{selectedCompany.opportunity_score}</div>
                      <div className="text-sm text-gray-400 mt-1">机会评分</div>
                    </div>
                  </div>

                  {/* 机会等级和预期利润 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className={`rounded-lg p-4 border ${getOpportunityColor(selectedCompany.opportunity_level)}`}>
                      <p className="text-xs text-gray-300 mb-1">机会等级</p>
                      <p className="text-lg font-semibold">{selectedCompany.opportunity_level}</p>
                    </div>
                    <div className="bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg p-4">
                      <p className="text-xs text-gray-300 mb-1">预期利润率</p>
                      <p className="text-lg font-semibold">{selectedCompany.expected_profit_margin}%</p>
                    </div>
                  </div>
                </div>

                {/* 做市策略 */}
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Zap className="text-yellow-400" size={20} />
                    <h3 className="text-lg font-semibold text-white">做市策略</h3>
                  </div>
                  <div className="bg-slate-900/50 p-4 rounded border border-slate-700">
                    <p className="text-gray-300">{selectedCompany.strategy}</p>
                  </div>
                </div>

                {/* 流动性分析 */}
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">流动性分析</h3>
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-slate-900/50 p-4 rounded border border-slate-700 text-center">
                      <p className="text-xs text-gray-400 mb-2">流动性评分</p>
                      <p className="text-2xl font-bold text-cyan-400">{selectedCompany.liquidity_score}</p>
                    </div>
                    <div className="bg-slate-900/50 p-4 rounded border border-slate-700 text-center">
                      <p className="text-xs text-gray-400 mb-2">月均成交量</p>
                      <p className="text-2xl font-bold text-green-400">{(selectedCompany.trading_volume / 10000).toFixed(0)}万</p>
                    </div>
                    <div className="bg-slate-900/50 p-4 rounded border border-slate-700 text-center">
                      <p className="text-xs text-gray-400 mb-2">买卖价差</p>
                      <p className="text-2xl font-bold text-yellow-400">{selectedCompany.bid_ask_spread}%</p>
                    </div>
                  </div>
                </div>

                {/* 波动性分析 */}
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">波动性分析</h3>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-slate-900/50 p-4 rounded border border-slate-700 text-center">
                      <p className="text-xs text-gray-400 mb-2">波动性评分</p>
                      <p className="text-2xl font-bold text-orange-400">{selectedCompany.volatility_score}</p>
                    </div>
                    <div className="bg-slate-900/50 p-4 rounded border border-slate-700 text-center">
                      <p className="text-xs text-gray-400 mb-2">价格波动率</p>
                      <p className="text-2xl font-bold text-red-400">{selectedCompany.price_volatility}%</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-400 mb-4">成交量波动率: {selectedCompany.volume_volatility}%</p>
                </div>

                {/* 价格趋势 */}
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">6个月价格趋势</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={selectedCompany.price_history}>
                      <defs>
                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#475569" />
                      <XAxis dataKey="date" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }} />
                      <Area type="monotone" dataKey="price" stroke="#06b6d4" fillOpacity={1} fill="url(#colorPrice)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* 融资需求 */}
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <DollarSign className="text-green-400" size={20} />
                    <h3 className="text-lg font-semibold text-white">融资需求</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-900/50 p-4 rounded border border-slate-700">
                      <p className="text-xs text-gray-400 mb-2">下一轮融资</p>
                      <p className="text-lg font-semibold text-white">{selectedCompany.next_financing_round}</p>
                    </div>
                    <div className="bg-slate-900/50 p-4 rounded border border-slate-700">
                      <p className="text-xs text-gray-400 mb-2">融资规模</p>
                      <p className="text-lg font-semibold text-green-400">{selectedCompany.estimated_financing_amount}万元</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-300 mt-4 p-3 bg-slate-900/30 rounded">
                    💡 <strong>融资套利机会：</strong>融资前布局，融资后获得增值收益。预期融资后估值增长 20-30%。
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
