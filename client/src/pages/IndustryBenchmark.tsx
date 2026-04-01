import { useState, useMemo } from 'react';
import benchmarkData from '../data/industry-benchmark-data.json';

interface CompanyRanking {
  code: string;
  name: string;
  year: number;
  revenue: number | null;
  net_profit: number | null;
  gross_margin: number | null;
  net_margin: number | null;
  roe: number | null;
  debt_ratio: number | null;
  market_cap: number | null;
  revenue_pct?: number;
  net_profit_pct?: number;
  gross_margin_pct?: number;
  net_margin_pct?: number;
  roe_pct?: number;
  debt_ratio_pct?: number;
}

interface IndustryStats {
  p10: number; p25: number; p50: number; p75: number; p90: number;
  mean: number; count: number;
}

interface GrowthTrend {
  year: number;
  growth_rate: number;
  avg_revenue_yi: number;
}

interface IndustryData {
  company_count: number;
  revenue_stats: IndustryStats;
  net_profit_stats: IndustryStats;
  gross_margin_stats: IndustryStats;
  net_margin_stats: IndustryStats;
  roe_stats: IndustryStats;
  debt_ratio_stats: IndustryStats;
  growth_trend: GrowthTrend[];
  companies: CompanyRanking[];
}

const data = benchmarkData as Record<string, IndustryData>;
const INDUSTRIES = Object.keys(data);

const INDUSTRY_COLORS: Record<string, string> = {
  '医疗健康': 'from-green-500 to-teal-600',
  '新能源': 'from-yellow-500 to-orange-600',
  '人工智能': 'from-blue-500 to-purple-600',
};

const INDUSTRY_ICONS: Record<string, string> = {
  '医疗健康': '🏥',
  '新能源': '⚡',
  '人工智能': '🤖',
};

function PercentileBar({ value, stats, higherIsBetter = true }: {
  value: number | null;
  stats: IndustryStats;
  higherIsBetter?: boolean;
}) {
  if (value === null || value === undefined) return <span className="text-gray-500 text-xs">无数据</span>;
  const pct = stats ? (
    [stats.p10, stats.p25, stats.p50, stats.p75, stats.p90].filter(p => value >= p).length / 5 * 100
  ) : 50;
  const color = higherIsBetter
    ? (pct >= 75 ? 'bg-green-500' : pct >= 50 ? 'bg-blue-500' : pct >= 25 ? 'bg-yellow-500' : 'bg-red-500')
    : (pct <= 25 ? 'bg-green-500' : pct <= 50 ? 'bg-blue-500' : pct <= 75 ? 'bg-yellow-500' : 'bg-red-500');
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-700 rounded-full h-1.5">
        <div className={`${color} h-1.5 rounded-full`} style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
      <span className="text-xs text-gray-400 w-8">{Math.round(pct)}%</span>
    </div>
  );
}

function StatCard({ label, stats, unit = '', higherIsBetter = true }: {
  label: string; stats: IndustryStats; unit?: string; higherIsBetter?: boolean;
}) {
  if (!stats) return null;
  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="text-gray-400 text-xs mb-2">{label}</div>
      <div className="grid grid-cols-5 gap-1 text-center">
        {[
          { label: 'P10', value: stats.p10 },
          { label: 'P25', value: stats.p25 },
          { label: '中位', value: stats.p50 },
          { label: 'P75', value: stats.p75 },
          { label: 'P90', value: stats.p90 },
        ].map(({ label: l, value }) => (
          <div key={l}>
            <div className="text-gray-500 text-xs">{l}</div>
            <div className="text-white text-xs font-medium">
              {value !== undefined ? `${value.toFixed(1)}${unit}` : '-'}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 pt-2 border-t border-gray-700 flex justify-between text-xs">
        <span className="text-gray-400">均值: <span className="text-white">{stats.mean.toFixed(1)}{unit}</span></span>
        <span className="text-gray-400">样本: <span className="text-white">{stats.count}家</span></span>
      </div>
    </div>
  );
}

export default function IndustryBenchmark() {
  const [selectedIndustry, setSelectedIndustry] = useState(INDUSTRIES[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<string>('roe');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [activeTab, setActiveTab] = useState<'overview' | 'companies' | 'trend'>('overview');

  const industryData = data[selectedIndustry];

  const filteredCompanies = useMemo(() => {
    let list = [...(industryData?.companies || [])];
    if (searchQuery) {
      list = list.filter(c =>
        c.name.includes(searchQuery) || c.code.includes(searchQuery)
      );
    }
    list.sort((a, b) => {
      const av = (a as any)[sortField] ?? -Infinity;
      const bv = (b as any)[sortField] ?? -Infinity;
      return sortDir === 'desc' ? bv - av : av - bv;
    });
    return list;
  }, [industryData, searchQuery, sortField, sortDir]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const getPctColor = (pct: number | undefined, higherIsBetter = true) => {
    if (pct === undefined) return 'text-gray-400';
    const good = higherIsBetter ? pct >= 75 : pct <= 25;
    const ok = higherIsBetter ? pct >= 50 : pct <= 50;
    if (good) return 'text-green-400';
    if (ok) return 'text-blue-400';
    return 'text-red-400';
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* 标题 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">📊 行业对标分析</h1>
        <p className="text-gray-400 text-sm">同行业公司财务指标分位数排名 · 行业景气度趋势 · 龙头与尾部差距</p>
      </div>

      {/* 行业选择 */}
      <div className="flex gap-3 mb-6">
        {INDUSTRIES.map(ind => (
          <button
            key={ind}
            onClick={() => setSelectedIndustry(ind)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              selectedIndustry === ind
                ? `bg-gradient-to-r ${INDUSTRY_COLORS[ind] || 'from-blue-500 to-purple-600'} text-white`
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            <span>{INDUSTRY_ICONS[ind] || '📈'}</span>
            <span>{ind}</span>
            <span className="text-xs opacity-75">({data[ind]?.company_count || 0}家)</span>
          </button>
        ))}
      </div>

      {/* 标签页 */}
      <div className="flex gap-1 mb-6 bg-gray-800 rounded-lg p-1 w-fit">
        {[
          { key: 'overview', label: '行业概览' },
          { key: 'companies', label: '公司排名' },
          { key: 'trend', label: '景气趋势' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.key ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 行业概览 */}
      {activeTab === 'overview' && industryData && (
        <div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <StatCard label="营业收入（万元）" stats={industryData.revenue_stats} unit="" />
            <StatCard label="净利润（万元）" stats={industryData.net_profit_stats} unit="" />
            <StatCard label="毛利率（%）" stats={industryData.gross_margin_stats} unit="%" />
            <StatCard label="净利率（%）" stats={industryData.net_margin_stats} unit="%" />
            <StatCard label="ROE（%）" stats={industryData.roe_stats} unit="%" />
            <StatCard label="资产负债率（%）" stats={industryData.debt_ratio_stats} unit="%" higherIsBetter={false} />
          </div>

          {/* 龙头 vs 尾部对比 */}
          <div className="bg-gray-800 rounded-xl p-5">
            <h3 className="text-white font-semibold mb-4">龙头 vs 尾部财务差距（{selectedIndustry}）</h3>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: '营收（万元）', top: industryData.revenue_stats.p90, bottom: industryData.revenue_stats.p10, unit: '' },
                { label: '毛利率', top: industryData.gross_margin_stats.p90, bottom: industryData.gross_margin_stats.p10, unit: '%' },
                { label: 'ROE', top: industryData.roe_stats.p90, bottom: industryData.roe_stats.p10, unit: '%' },
              ].map(({ label, top, bottom, unit }) => (
                <div key={label} className="bg-gray-700 rounded-lg p-4">
                  <div className="text-gray-400 text-xs mb-3">{label}</div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-green-400">龙头(P90)</span>
                      <span className="text-green-400 font-bold">{top?.toFixed(1)}{unit}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-400">中位数</span>
                      <span className="text-white">{industryData.revenue_stats.p50?.toFixed(1)}{unit}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-red-400">尾部(P10)</span>
                      <span className="text-red-400 font-bold">{bottom?.toFixed(1)}{unit}</span>
                    </div>
                    <div className="pt-1 border-t border-gray-600">
                      <span className="text-xs text-yellow-400">
                        差距: {top && bottom ? (top / Math.max(Math.abs(bottom), 0.01)).toFixed(1) : '-'}x
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 公司排名 */}
      {activeTab === 'companies' && (
        <div>
          <div className="flex gap-3 mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="搜索公司名称或代码..."
              className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
            />
            <span className="text-gray-400 text-sm self-center">共 {filteredCompanies.length} 家</span>
          </div>

          <div className="bg-gray-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left text-gray-400 font-medium px-4 py-3">公司</th>
                    {[
                      { key: 'revenue', label: '营收(万)', tip: '越高越好' },
                      { key: 'gross_margin', label: '毛利率%', tip: '越高越好' },
                      { key: 'net_margin', label: '净利率%', tip: '越高越好' },
                      { key: 'roe', label: 'ROE%', tip: '越高越好' },
                      { key: 'debt_ratio', label: '负债率%', tip: '越低越好' },
                    ].map(col => (
                      <th
                        key={col.key}
                        className="text-right text-gray-400 font-medium px-3 py-3 cursor-pointer hover:text-white"
                        onClick={() => handleSort(col.key)}
                      >
                        {col.label} {sortField === col.key ? (sortDir === 'desc' ? '↓' : '↑') : ''}
                      </th>
                    ))}
                    <th className="text-right text-gray-400 font-medium px-4 py-3">ROE行业排名</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCompanies.slice(0, 100).map((c, i) => (
                    <tr key={c.code} className={`border-b border-gray-700/50 hover:bg-gray-700/30 ${i < 3 ? 'bg-yellow-900/10' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {i < 3 && <span className="text-yellow-400 text-xs">#{i+1}</span>}
                          <div>
                            <div className="text-white font-medium">{c.name}</div>
                            <div className="text-gray-500 text-xs">{c.code}</div>
                          </div>
                        </div>
                      </td>
                      <td className="text-right px-3 py-3 text-gray-300">
                        {c.revenue ? (c.revenue / 10000).toFixed(2) + '亿' : '-'}
                      </td>
                      <td className={`text-right px-3 py-3 ${getPctColor(c.gross_margin_pct)}`}>
                        {c.gross_margin !== null ? c.gross_margin.toFixed(1) + '%' : '-'}
                      </td>
                      <td className={`text-right px-3 py-3 ${getPctColor(c.net_margin_pct)}`}>
                        {c.net_margin !== null ? c.net_margin.toFixed(1) + '%' : '-'}
                      </td>
                      <td className={`text-right px-3 py-3 ${getPctColor(c.roe_pct)}`}>
                        {c.roe !== null ? c.roe.toFixed(1) + '%' : '-'}
                      </td>
                      <td className={`text-right px-3 py-3 ${getPctColor(c.debt_ratio_pct, false)}`}>
                        {c.debt_ratio !== null ? c.debt_ratio.toFixed(1) + '%' : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <PercentileBar
                          value={c.roe}
                          stats={industryData?.roe_stats}
                          higherIsBetter={true}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredCompanies.length > 100 && (
              <div className="text-center text-gray-500 text-xs py-3">
                仅显示前100家，请使用搜索筛选
              </div>
            )}
          </div>
        </div>
      )}

      {/* 景气趋势 */}
      {activeTab === 'trend' && industryData && (
        <div>
          {industryData.growth_trend.length > 0 ? (
            <div className="bg-gray-800 rounded-xl p-5">
              <h3 className="text-white font-semibold mb-4">{selectedIndustry} 行业景气度趋势（行业平均营收增速）</h3>
              <div className="space-y-4">
                {industryData.growth_trend.map(g => (
                  <div key={g.year} className="flex items-center gap-4">
                    <span className="text-gray-400 w-12">{g.year}</span>
                    <div className="flex-1 bg-gray-700 rounded-full h-6 relative overflow-hidden">
                      <div
                        className={`h-full rounded-full flex items-center justify-end pr-2 text-xs font-medium ${
                          g.growth_rate >= 10 ? 'bg-green-600' :
                          g.growth_rate >= 0 ? 'bg-blue-600' :
                          g.growth_rate >= -10 ? 'bg-yellow-600' : 'bg-red-600'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(5, Math.abs(g.growth_rate) * 2))}%` }}
                      >
                        {g.growth_rate >= 0 ? '+' : ''}{g.growth_rate}%
                      </div>
                    </div>
                    <span className="text-gray-400 text-xs w-24">均值 {g.avg_revenue_yi}亿</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-gray-800 rounded-xl p-8 text-center">
              <div className="text-gray-400 text-4xl mb-3">📊</div>
              <div className="text-gray-400">暂无足够的多年数据计算景气趋势</div>
              <div className="text-gray-500 text-sm mt-1">需要至少2年营收数据才能计算增速</div>
            </div>
          )}

          {/* 行业关键指标摘要 */}
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="bg-gray-800 rounded-xl p-4 text-center">
              <div className="text-gray-400 text-xs mb-1">行业公司数</div>
              <div className="text-2xl font-bold text-white">{industryData.company_count}</div>
              <div className="text-gray-500 text-xs">家</div>
            </div>
            <div className="bg-gray-800 rounded-xl p-4 text-center">
              <div className="text-gray-400 text-xs mb-1">行业中位ROE</div>
              <div className={`text-2xl font-bold ${industryData.roe_stats.p50 > 10 ? 'text-green-400' : industryData.roe_stats.p50 > 0 ? 'text-blue-400' : 'text-red-400'}`}>
                {industryData.roe_stats.p50?.toFixed(1)}%
              </div>
              <div className="text-gray-500 text-xs">P50</div>
            </div>
            <div className="bg-gray-800 rounded-xl p-4 text-center">
              <div className="text-gray-400 text-xs mb-1">行业中位毛利率</div>
              <div className={`text-2xl font-bold ${industryData.gross_margin_stats.p50 > 40 ? 'text-green-400' : industryData.gross_margin_stats.p50 > 20 ? 'text-blue-400' : 'text-yellow-400'}`}>
                {industryData.gross_margin_stats.p50?.toFixed(1)}%
              </div>
              <div className="text-gray-500 text-xs">P50</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
