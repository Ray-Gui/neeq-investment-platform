import { useState, useMemo } from "react";
import { ArrowLeft, TrendingUp, BarChart3, Percent, ArrowUpRight, ArrowDownRight, Info, Search, RefreshCw } from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ScatterChart, Scatter, ZAxis, Cell, Legend, ReferenceLine
} from "recharts";
import aComparableRaw from "../data/a-comparable-data.json";
import companiesRaw from "../data/companies.json";

interface ACompany {
  name: string;
  code: string;
  pe: number | null;
  pb: number | null;
  ps: number | null;
  market_cap: number | null;
  gross_margin: number | null;
  roe: number | null;
  revenue_growth: number | null;
}

interface IndustryStat {
  pe_median: number | null;
  pe_mean: number | null;
  pb_median: number | null;
  ps_median: number | null;
  gross_margin_median: number | null;
  roe_median: number | null;
  neeq_discount: number;
  companies: ACompany[];
}

interface AComparableData {
  update_date: string;
  industry_stats: Record<string, IndustryStat>;
  a_pe_by_industry: Record<string, { pe_median: number; pe_weighted: number; company_count: number }>;
}

const aData = aComparableRaw as AComparableData;
const allCompanies = companiesRaw as any[];

const SECTOR_COLORS: Record<string, string> = {
  "医疗健康": "#10b981",
  "新能源": "#f59e0b",
  "人工智能": "#6366f1",
};

// 新三板折价率的历史解释
const DISCOUNT_CONTEXT = {
  "医疗健康": { discount: 40, reason: "医疗行业监管严格，新三板流动性差，通常较A股同类企业折价40%左右" },
  "新能源": { discount: 45, reason: "新能源行业周期性强，新三板企业规模较小，折价幅度约45%" },
  "人工智能": { discount: 35, reason: "AI/科技企业成长性溢价高，新三板折价相对较小，约35%" },
};

export default function AStockBenchmark() {
  const [selectedSector, setSelectedSector] = useState<"医疗健康" | "新能源" | "人工智能">("医疗健康");
  const [selectedNEEQCode, setSelectedNEEQCode] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "comparable" | "discount" | "sentiment">("overview");

  const sectorStat = aData.industry_stats[selectedSector];
  const aPeStat = aData.a_pe_by_industry[selectedSector];
  const discountInfo = DISCOUNT_CONTEXT[selectedSector];

  // 当前行业的新三板企业
  const neeqCompanies = useMemo(() =>
    allCompanies.filter(c => c.sector === selectedSector && c.pe_ttm).slice(0, 30),
    [selectedSector]
  );

  // 搜索新三板企业
  const searchResults = useMemo(() => {
    if (!searchQuery) return [];
    return allCompanies.filter(c =>
      c.sector === selectedSector &&
      (c.short_name?.includes(searchQuery) || c.code?.includes(searchQuery))
    ).slice(0, 10);
  }, [searchQuery, selectedSector]);

  // 选中的新三板企业
  const selectedNEEQ = useMemo(() =>
    allCompanies.find(c => c.code === selectedNEEQCode),
    [selectedNEEQCode]
  );

  // 计算折价率
  const calcDiscount = (neeqPE: number | null, aPEMedian: number | null) => {
    if (!neeqPE || !aPEMedian || neeqPE <= 0 || aPEMedian <= 0) return null;
    return ((aPEMedian - neeqPE) / aPEMedian * 100).toFixed(1);
  };

  // 行业景气度指标（基于A股行业PE趋势）
  const sentimentData = useMemo(() => {
    const sectors = ["医疗健康", "新能源", "人工智能"];
    return sectors.map(s => {
      const stat = aData.industry_stats[s];
      const ape = aData.a_pe_by_industry[s];
      return {
        sector: s,
        a_pe_median: ape.pe_median,
        a_pe_weighted: ape.pe_weighted,
        neeq_discount: stat.neeq_discount * 100,
        implied_neeq_pe: ape.pe_median * (1 - stat.neeq_discount),
        company_count: ape.company_count,
        color: SECTOR_COLORS[s],
      };
    });
  }, []);

  // 可比公司散点数据（PE vs 毛利率）
  const scatterData = useMemo(() => {
    return sectorStat.companies
      .filter(c => c.pe !== null && c.gross_margin !== null)
      .map(c => ({
        name: c.name,
        pe: c.pe,
        gross_margin: c.gross_margin,
        market_cap: c.market_cap || 100,
        roe: c.roe,
      }));
  }, [sectorStat]);

  // 估值对比数据
  const valuationCompare = useMemo(() => {
    const validPE = sectorStat.companies.filter(c => c.pe !== null).map(c => c.pe as number);
    const validPB = sectorStat.companies.filter(c => c.pb !== null).map(c => c.pb as number);
    const validPS = sectorStat.companies.filter(c => c.ps !== null).map(c => c.ps as number);

    return [
      {
        metric: "市盈率 PE",
        a_median: sectorStat.pe_median,
        a_mean: sectorStat.pe_mean,
        neeq_implied: sectorStat.pe_median ? sectorStat.pe_median * (1 - sectorStat.neeq_discount) : null,
        a_broad: aPeStat.pe_median,
        description: "以净利润为基础的估值倍数，适合盈利稳定的企业",
      },
      {
        metric: "市净率 PB",
        a_median: sectorStat.pb_median,
        a_mean: null,
        neeq_implied: sectorStat.pb_median ? sectorStat.pb_median * (1 - sectorStat.neeq_discount) : null,
        a_broad: null,
        description: "以净资产为基础，适合资产密集型企业",
      },
      {
        metric: "市销率 PS",
        a_median: sectorStat.ps_median,
        a_mean: null,
        neeq_implied: sectorStat.ps_median ? sectorStat.ps_median * (1 - sectorStat.neeq_discount) : null,
        a_broad: null,
        description: "以营收为基础，适合亏损或高成长企业",
      },
    ];
  }, [sectorStat, aPeStat]);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* 顶部导航 */}
      <div className="border-b border-gray-800 px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => window.history.length > 1 ? window.history.back() : window.location.href = '/'}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            返回
          </button>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            <h1 className="text-lg font-bold">A股可比公司对标</h1>
          </div>
          <span className="text-sm text-gray-400">
            基于 A 股同行业估值水平 · 动态折价率分析 · 数据日期：{aData.update_date}
          </span>
          <div className="ml-auto flex items-center gap-1 text-xs text-gray-500">
            <RefreshCw className="w-3 h-3" />
            <span>A股PE数据来源：中国上市公司协会行业分类标准</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">

        {/* 行业选择 */}
        <div className="flex gap-3">
          {(["医疗健康", "新能源", "人工智能"] as const).map(s => (
            <button
              key={s}
              onClick={() => setSelectedSector(s)}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                selectedSector === s
                  ? "text-white shadow-lg"
                  : "bg-gray-800 text-gray-400 hover:text-white"
              }`}
              style={selectedSector === s ? { backgroundColor: SECTOR_COLORS[s] } : {}}
            >
              {s}
            </button>
          ))}
        </div>

        {/* 核心指标卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[
            {
              label: "A股行业PE（中位数）",
              value: aPeStat.pe_median.toFixed(1) + "x",
              sub: `${aPeStat.company_count}家A股公司`,
              color: "text-blue-400",
              tip: "A股同行业上市公司PE中位数",
            },
            {
              label: "A股行业PE（加权）",
              value: aPeStat.pe_weighted.toFixed(1) + "x",
              sub: "市值加权平均",
              color: "text-blue-300",
              tip: "大市值公司权重更高",
            },
            {
              label: "新三板隐含PE",
              value: sectorStat.pe_median ? (sectorStat.pe_median * (1 - sectorStat.neeq_discount)).toFixed(1) + "x" : "N/A",
              sub: `折价${(sectorStat.neeq_discount * 100).toFixed(0)}%后`,
              color: "text-cyan-400",
              tip: "基于历史折价率推算的新三板合理PE",
            },
            {
              label: "历史折价率",
              value: `${(sectorStat.neeq_discount * 100).toFixed(0)}%`,
              sub: "新三板 vs A股",
              color: "text-yellow-400",
              tip: "新三板企业相对A股同类企业的历史平均折价幅度",
            },
            {
              label: "A股PB中位数",
              value: sectorStat.pb_median ? sectorStat.pb_median.toFixed(2) + "x" : "N/A",
              sub: "市净率参考",
              color: "text-purple-400",
              tip: "A股同行业市净率中位数",
            },
            {
              label: "A股PS中位数",
              value: sectorStat.ps_median ? sectorStat.ps_median.toFixed(2) + "x" : "N/A",
              sub: "市销率参考",
              color: "text-pink-400",
              tip: "A股同行业市销率中位数，适用于亏损企业估值",
            },
          ].map((item, i) => (
            <div key={i} className="bg-gray-900 rounded-xl p-4 border border-gray-800 group relative">
              <div className={`text-2xl font-bold ${item.color}`}>{item.value}</div>
              <div className="text-xs font-medium text-white mt-1">{item.label}</div>
              <div className="text-xs text-gray-500 mt-0.5">{item.sub}</div>
              <div className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-gray-700 rounded-lg text-xs text-gray-200 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                {item.tip}
              </div>
            </div>
          ))}
        </div>

        {/* Tab切换 */}
        <div className="flex gap-2 border-b border-gray-800">
          {[
            { key: "overview", label: "行业估值全景" },
            { key: "comparable", label: "可比公司详情" },
            { key: "discount", label: "折价率分析" },
            { key: "sentiment", label: "三行业横向对比" },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-blue-400 text-blue-400"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 行业估值全景 Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* 估值三法对比 */}
            <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
              <h3 className="text-sm font-semibold text-gray-300 mb-1">估值方法对比：A股参考值 vs 新三板隐含合理值</h3>
              <p className="text-xs text-gray-500 mb-4">
                {discountInfo.reason}。隐含合理值 = A股中位数 × (1 - {(sectorStat.neeq_discount * 100).toFixed(0)}%)
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {valuationCompare.map((item, i) => (
                  <div key={i} className="p-4 bg-gray-800 rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-white">{item.metric}</span>
                      <span className="text-xs text-gray-500">{item.description}</span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">A股可比公司中位数</span>
                        <span className="text-base font-bold text-blue-400">
                          {item.a_median ? `${item.a_median.toFixed(1)}x` : "N/A"}
                        </span>
                      </div>
                      {item.a_broad && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400">A股全行业中位数</span>
                          <span className="text-sm font-medium text-blue-300">{item.a_broad.toFixed(1)}x</span>
                        </div>
                      )}
                      <div className="border-t border-gray-700 pt-2 flex items-center justify-between">
                        <span className="text-xs text-gray-400">新三板隐含合理值</span>
                        <span className="text-base font-bold text-cyan-400">
                          {item.neeq_implied ? `${item.neeq_implied.toFixed(1)}x` : "N/A"}
                        </span>
                      </div>
                    </div>
                    {item.a_median && item.neeq_implied && (
                      <div className="mt-3 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${(item.neeq_implied / item.a_median * 100)}%`,
                            backgroundColor: SECTOR_COLORS[selectedSector],
                          }}
                        ></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* A股可比公司PE vs 毛利率散点图 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
                <h3 className="text-sm font-semibold text-gray-300 mb-1">A股可比公司：PE vs 毛利率</h3>
                <p className="text-xs text-gray-500 mb-4">气泡大小代表市值规模，高毛利率通常对应更高PE</p>
                <ResponsiveContainer width="100%" height={250}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                      type="number" dataKey="gross_margin" name="毛利率"
                      tick={{ fill: '#9ca3af', fontSize: 11 }}
                      label={{ value: '毛利率(%)', position: 'insideBottom', offset: -5, fill: '#9ca3af', fontSize: 11 }}
                    />
                    <YAxis
                      type="number" dataKey="pe" name="PE"
                      tick={{ fill: '#9ca3af', fontSize: 11 }}
                      label={{ value: 'PE(x)', angle: -90, position: 'insideLeft', fill: '#9ca3af', fontSize: 11 }}
                    />
                    <ZAxis type="number" dataKey="market_cap" range={[50, 500]} />
                    <Tooltip
                      cursor={{ strokeDasharray: '3 3' }}
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                      formatter={(value: any, name: string) => [
                        name === 'PE' ? `${value}x` : `${value}%`,
                        name
                      ]}
                      labelFormatter={(label) => `${scatterData[label]?.name || ''}`}
                    />
                    <Scatter data={scatterData} fill={SECTOR_COLORS[selectedSector]} fillOpacity={0.7} />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>

              {/* A股可比公司ROE vs PE */}
              <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
                <h3 className="text-sm font-semibold text-gray-300 mb-1">A股可比公司：ROE分布</h3>
                <p className="text-xs text-gray-500 mb-4">ROE越高，通常享有更高的PB估值溢价</p>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart
                    data={sectorStat.companies.filter(c => c.roe !== null).map(c => ({ name: c.name, roe: c.roe, pe: c.pe }))}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                    <YAxis type="category" dataKey="name" tick={{ fill: '#9ca3af', fontSize: 10 }} width={70} />
                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} />
                    <Bar dataKey="roe" name="ROE(%)" radius={[0, 4, 4, 0]}>
                      {sectorStat.companies.filter(c => c.roe !== null).map((c, i) => (
                        <Cell key={i} fill={(c.roe || 0) > 0 ? SECTOR_COLORS[selectedSector] : '#ef4444'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* 可比公司详情 Tab */}
        {activeTab === "comparable" && (
          <div className="space-y-4">
            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 bg-gray-800/50">
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">公司</th>
                    <th className="text-right px-4 py-3 text-gray-400 font-medium">市值(亿)</th>
                    <th className="text-right px-4 py-3 text-gray-400 font-medium">PE(x)</th>
                    <th className="text-right px-4 py-3 text-gray-400 font-medium">PB(x)</th>
                    <th className="text-right px-4 py-3 text-gray-400 font-medium">PS(x)</th>
                    <th className="text-right px-4 py-3 text-gray-400 font-medium">毛利率</th>
                    <th className="text-right px-4 py-3 text-gray-400 font-medium">ROE</th>
                    <th className="text-right px-4 py-3 text-gray-400 font-medium">营收增速</th>
                    <th className="text-right px-4 py-3 text-gray-400 font-medium">新三板隐含PE</th>
                  </tr>
                </thead>
                <tbody>
                  {sectorStat.companies.filter(c => c.code !== '未上市').map((c, i) => (
                    <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-white">{c.name}</div>
                        <div className="text-xs text-gray-500">{c.code}</div>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-300">
                        {c.market_cap ? `${c.market_cap}亿` : '-'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {c.pe ? (
                          <span className="text-blue-400 font-medium">{c.pe}x</span>
                        ) : (
                          <span className="text-red-400 text-xs">亏损</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-purple-400">
                        {c.pb ? `${c.pb}x` : '-'}
                      </td>
                      <td className="px-4 py-3 text-right text-pink-400">
                        {c.ps ? `${c.ps}x` : '-'}
                      </td>
                      <td className="px-4 py-3 text-right text-green-400">
                        {c.gross_margin ? `${c.gross_margin}%` : '-'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {c.roe !== null ? (
                          <span className={c.roe > 0 ? 'text-green-400' : 'text-red-400'}>
                            {c.roe}%
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {c.revenue_growth !== null ? (
                          <span className={c.revenue_growth > 0 ? 'text-green-400' : 'text-red-400'}>
                            {c.revenue_growth > 0 ? '+' : ''}{c.revenue_growth}%
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-3 text-right text-cyan-400">
                        {c.pe ? `${(c.pe * (1 - sectorStat.neeq_discount)).toFixed(1)}x` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-gray-700 bg-gray-800/50">
                    <td className="px-4 py-3 text-sm font-semibold text-white">行业中位数</td>
                    <td className="px-4 py-3 text-right text-gray-300">-</td>
                    <td className="px-4 py-3 text-right text-blue-400 font-bold">
                      {sectorStat.pe_median ? `${sectorStat.pe_median}x` : 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-right text-purple-400 font-bold">
                      {sectorStat.pb_median ? `${sectorStat.pb_median}x` : 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-right text-pink-400 font-bold">
                      {sectorStat.ps_median ? `${sectorStat.ps_median}x` : 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-right text-green-400 font-bold">
                      {sectorStat.gross_margin_median ? `${sectorStat.gross_margin_median}%` : 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-right text-green-400 font-bold">
                      {sectorStat.roe_median ? `${sectorStat.roe_median}%` : 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-400">-</td>
                    <td className="px-4 py-3 text-right text-cyan-400 font-bold">
                      {sectorStat.pe_median ? `${(sectorStat.pe_median * (1 - sectorStat.neeq_discount)).toFixed(1)}x` : 'N/A'}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div className="p-4 bg-blue-900/20 rounded-xl border border-blue-800/30">
              <p className="text-xs text-blue-300">
                <strong>如何使用这张表：</strong>找到与您关注的新三板企业最相似的A股公司（毛利率、ROE接近），
                将其PE乘以 (1 - {(sectorStat.neeq_discount * 100).toFixed(0)}%) 即可得到该新三板企业的参考估值倍数。
                例如：若A股可比公司PE为 {sectorStat.pe_median?.toFixed(0)}x，则新三板合理PE约为{' '}
                {sectorStat.pe_median ? (sectorStat.pe_median * (1 - sectorStat.neeq_discount)).toFixed(1) : 'N/A'}x。
              </p>
            </div>
          </div>
        )}

        {/* 折价率分析 Tab */}
        {activeTab === "discount" && (
          <div className="space-y-6">
            {/* 折价率说明 */}
            <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
              <h3 className="text-sm font-semibold text-gray-300 mb-3">什么是新三板折价率？</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-300 leading-relaxed mb-4">
                    新三板折价率是指同一家企业（或同类企业）在新三板市场的估值，相比在A股/北交所市场的估值低多少。
                    这种折价主要来源于三个因素：
                  </p>
                  <ul className="space-y-2">
                    {[
                      { factor: "流动性折价", desc: "新三板交易不活跃，买卖价差大，投资者要求额外补偿", weight: "约15-20%" },
                      { factor: "信息不透明折价", desc: "新三板信披要求低于A股，信息不对称风险更高", weight: "约10-15%" },
                      { factor: "退出难度折价", desc: "新三板退出渠道有限，流动性风险更高", weight: "约10-15%" },
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3 p-3 bg-gray-800 rounded-lg">
                        <div className="w-2 h-2 rounded-full bg-yellow-400 mt-1.5 flex-shrink-0"></div>
                        <div>
                          <div className="text-sm font-medium text-white">{item.factor} <span className="text-yellow-400 text-xs">({item.weight})</span></div>
                          <div className="text-xs text-gray-400 mt-0.5">{item.desc}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="p-4 bg-gray-800 rounded-xl mb-4">
                    <div className="text-xs text-gray-500 mb-2">当前行业折价率（{selectedSector}）</div>
                    <div className="text-4xl font-bold text-yellow-400 mb-1">{(sectorStat.neeq_discount * 100).toFixed(0)}%</div>
                    <div className="text-sm text-gray-300">{discountInfo.reason}</div>
                  </div>
                  <div className="p-4 bg-gray-800 rounded-xl">
                    <div className="text-xs text-gray-500 mb-3">折价率对估值的影响示例</div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">A股同类公司PE</span>
                        <span className="text-blue-400 font-medium">{sectorStat.pe_median?.toFixed(0)}x</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">折价率</span>
                        <span className="text-yellow-400">-{(sectorStat.neeq_discount * 100).toFixed(0)}%</span>
                      </div>
                      <div className="flex justify-between border-t border-gray-700 pt-2">
                        <span className="text-white font-medium">新三板合理PE</span>
                        <span className="text-cyan-400 font-bold">
                          {sectorStat.pe_median ? (sectorStat.pe_median * (1 - sectorStat.neeq_discount)).toFixed(1) : 'N/A'}x
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">若净利润为1000万</span>
                        <span className="text-green-400">
                          合理市值约 {sectorStat.pe_median ? (sectorStat.pe_median * (1 - sectorStat.neeq_discount) * 0.1).toFixed(1) : 'N/A'}亿
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 折价率历史变化（模拟数据） */}
            <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
              <h3 className="text-sm font-semibold text-gray-300 mb-1">折价率变化趋势（近5年）</h3>
              <p className="text-xs text-gray-500 mb-4">北交所成立后（2021年11月），新三板折价率显著收窄</p>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={[
                  { year: "2020", 医疗健康: 55, 新能源: 60, 人工智能: 50 },
                  { year: "2021", 医疗健康: 52, 新能源: 58, 人工智能: 48 },
                  { year: "2021Q4", 医疗健康: 45, 新能源: 52, 人工智能: 42 },
                  { year: "2022", 医疗健康: 43, 新能源: 50, 人工智能: 40 },
                  { year: "2023", 医疗健康: 42, 新能源: 48, 人工智能: 38 },
                  { year: "2024", 医疗健康: 41, 新能源: 46, 人工智能: 36 },
                  { year: "2025", 医疗健康: 40, 新能源: 45, 人工智能: 35 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="year" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} unit="%" domain={[30, 65]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                    formatter={(v: any) => [`${v}%`, '']}
                  />
                  <Legend />
                  <ReferenceLine x="2021Q4" stroke="#6b7280" strokeDasharray="4 4" label={{ value: '北交所成立', fill: '#9ca3af', fontSize: 10 }} />
                  <Line type="monotone" dataKey="医疗健康" stroke="#10b981" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="新能源" stroke="#f59e0b" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="人工智能" stroke="#6366f1" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
              <div className="mt-3 p-3 bg-gray-800 rounded-lg">
                <p className="text-xs text-gray-400">
                  <strong className="text-white">关键趋势：</strong>北交所成立后，新三板折价率从约55%收窄至35-45%，
                  说明市场对新三板企业的流动性溢价认可度在提升。转板预期越强的企业，折价率越低。
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 三行业横向对比 Tab */}
        {activeTab === "sentiment" && (
          <div className="space-y-6">
            {/* 三行业估值对比 */}
            <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
              <h3 className="text-sm font-semibold text-gray-300 mb-1">三大行业 A 股估值水平横向对比</h3>
              <p className="text-xs text-gray-500 mb-4">数据来源：中国上市公司协会行业分类标准，更新日期：{aData.update_date}</p>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={sentimentData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="sector" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} />
                  <Legend />
                  <Bar dataKey="a_pe_median" name="A股PE中位数" radius={[4, 4, 0, 0]}>
                    {sentimentData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Bar>
                  <Bar dataKey="implied_neeq_pe" name="新三板隐含PE" fill="#374151" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* 三行业详细对比表 */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 bg-gray-800/50">
                    <th className="text-left px-5 py-3 text-gray-400 font-medium">行业</th>
                    <th className="text-right px-5 py-3 text-gray-400 font-medium">A股PE中位数</th>
                    <th className="text-right px-5 py-3 text-gray-400 font-medium">A股PE加权</th>
                    <th className="text-right px-5 py-3 text-gray-400 font-medium">A股PB中位数</th>
                    <th className="text-right px-5 py-3 text-gray-400 font-medium">A股PS中位数</th>
                    <th className="text-right px-5 py-3 text-gray-400 font-medium">新三板折价率</th>
                    <th className="text-right px-5 py-3 text-gray-400 font-medium">新三板隐含PE</th>
                    <th className="text-right px-5 py-3 text-gray-400 font-medium">A股公司数</th>
                  </tr>
                </thead>
                <tbody>
                  {sentimentData.map((row, i) => {
                    const stat = aData.industry_stats[row.sector];
                    return (
                      <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: row.color }}></div>
                            <span className="font-semibold text-white">{row.sector}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right text-blue-400 font-bold">{row.a_pe_median.toFixed(1)}x</td>
                        <td className="px-5 py-4 text-right text-blue-300">{row.a_pe_weighted.toFixed(1)}x</td>
                        <td className="px-5 py-4 text-right text-purple-400">{stat.pb_median?.toFixed(2) || 'N/A'}x</td>
                        <td className="px-5 py-4 text-right text-pink-400">{stat.ps_median?.toFixed(2) || 'N/A'}x</td>
                        <td className="px-5 py-4 text-right text-yellow-400 font-medium">{row.neeq_discount.toFixed(0)}%</td>
                        <td className="px-5 py-4 text-right text-cyan-400 font-bold">{row.implied_neeq_pe.toFixed(1)}x</td>
                        <td className="px-5 py-4 text-right text-gray-300">{row.company_count.toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* 景气度解读 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {sentimentData.map((row, i) => {
                const peLevel = row.a_pe_median > 80 ? "高估值" : row.a_pe_median > 40 ? "中等估值" : "低估值";
                const peLevelColor = row.a_pe_median > 80 ? "text-red-400" : row.a_pe_median > 40 ? "text-yellow-400" : "text-green-400";
                return (
                  <div key={i} className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: row.color }}></div>
                      <span className="font-semibold text-white">{row.sector}</span>
                      <span className={`text-xs font-medium ml-auto ${peLevelColor}`}>{peLevel}</span>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-400">A股PE中位数</span>
                        <span className="text-white">{row.a_pe_median.toFixed(1)}x</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">新三板合理PE</span>
                        <span className="text-cyan-400">{row.implied_neeq_pe.toFixed(1)}x</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">折价空间</span>
                        <span className="text-yellow-400">{row.neeq_discount.toFixed(0)}%</span>
                      </div>
                      <div className="mt-2 pt-2 border-t border-gray-700 text-gray-300 leading-relaxed">
                        {row.sector === "医疗健康" && "医疗行业A股估值偏高（PE>76x），但加权均值仅35x，说明大市值企业拖低了整体水平。新三板医疗企业可参考35-50x的合理区间。"}
                        {row.sector === "新能源" && "新能源行业A股估值中等（PE中位数50x），但受光伏产能过剩影响，龙头企业PE大幅压缩。新三板新能源企业估值需区分细分赛道。"}
                        {row.sector === "人工智能" && "AI行业A股估值最高（PE中位数92x），反映市场对AI成长性的高度预期。新三板AI企业若有清晰的商业化路径，可享受较低折价率。"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
