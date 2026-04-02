import { useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft } from 'lucide-react';
import spreadData from '../data/spread-analysis-data.json';

interface SpreadRecord {
  code: string;
  name: string;
  industry: string;
  layer: string;
  market_cap: number | null;
  market_cap_estimated: boolean;
  revenue_yi: number | null;
  net_profit_yi: number | null;
  roe: number;
  gross_margin: number;
  debt_ratio: number;
  estimated_spread: number;
  industry_avg_spread: number;
  spread_vs_avg: number;
  competition: string;
  opportunity: string;
  spread_score: number;
  year: number;
}

const data = spreadData as SpreadRecord[];

const OPP_COLORS: Record<string, string> = {
  '优质机会': 'text-green-400 bg-green-900/30 border-green-700',
  '潜在机会': 'text-blue-400 bg-blue-900/30 border-blue-700',
  '竞争激烈': 'text-yellow-400 bg-yellow-900/30 border-yellow-700',
  '风险较高': 'text-red-400 bg-red-900/30 border-red-700',
  '一般': 'text-gray-400 bg-gray-800 border-gray-600',
};

const COMP_COLORS: Record<string, string> = {
  '竞争激烈': 'text-red-400',
  '竞争较多': 'text-yellow-400',
  '适中': 'text-blue-400',
  '风险较高': 'text-red-500',
};

export default function SpreadAnalysis() {
  const [filterOpp, setFilterOpp] = useState<string>('全部');
  const [filterIndustry, setFilterIndustry] = useState<string>('全部');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<string>('spread_score');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [expandedCode, setExpandedCode] = useState<string | null>(null);

  const industries = useMemo(() => ['全部', ...Array.from(new Set(data.map(r => r.industry)))], []);
  const opportunities = ['全部', '优质机会', '潜在机会', '竞争激烈', '风险较高', '一般'];

  const oppDist = useMemo(() => {
    const dist: Record<string, number> = {};
    data.forEach(r => { dist[r.opportunity] = (dist[r.opportunity] || 0) + 1; });
    return dist;
  }, []);

  const industryStats = useMemo(() => {
    const stats: Record<string, { count: number; avgScore: number; avgSpread: number }> = {};
    data.forEach(r => {
      if (!stats[r.industry]) stats[r.industry] = { count: 0, avgScore: 0, avgSpread: 0 };
      stats[r.industry].count++;
      stats[r.industry].avgScore += r.spread_score;
      stats[r.industry].avgSpread += r.estimated_spread;
    });
    Object.keys(stats).forEach(ind => {
      stats[ind].avgScore = Math.round(stats[ind].avgScore / stats[ind].count);
      stats[ind].avgSpread = Math.round(stats[ind].avgSpread / stats[ind].count * 10) / 10;
    });
    return stats;
  }, []);

  const filtered = useMemo(() => {
    let list = [...data];
    if (filterOpp !== '全部') list = list.filter(r => r.opportunity === filterOpp);
    if (filterIndustry !== '全部') list = list.filter(r => r.industry === filterIndustry);
    if (searchQuery) list = list.filter(r => r.name.includes(searchQuery) || r.code.includes(searchQuery));
    list.sort((a, b) => {
      const av = (a as any)[sortField] ?? -Infinity;
      const bv = (b as any)[sortField] ?? -Infinity;
      return sortDir === 'desc' ? bv - av : av - bv;
    });
    return list;
  }, [filterOpp, filterIndustry, searchQuery, sortField, sortDir]);

  const handleSort = (field: string) => {
    if (sortField === field) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* 返回按钮 */}
      <div className="mb-4">
        <button
          onClick={() => { if (window.history.length > 1) { window.history.back(); } else { navigate('/'); } }}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={18} />
          <span>返回</span>
        </button>
      </div>
      {/* 标题 */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-white mb-1">📐 做市价差分析仪</h1>
        <p className="text-gray-400 text-sm">价差空间估算 · 做市机会识别 · 竞争程度评估 · 收益潜力评分</p>
        <div className="mt-2 bg-blue-900/30 border border-blue-700 rounded-lg px-3 py-2 text-xs text-blue-300">
          <strong>说明：</strong>由于新三板协议转让股票无公开实时买卖价差数据，本页面采用财务指标代理法估算价差空间：
          市值越小→价差越大；盈利质量越高→竞争越激烈→价差收窄；亏损公司→风险溢价→价差扩大但风险高。
          估算仅供参考，实际价差需结合实时行情判断。
        </div>
      </div>

      {/* 机会分布概览 */}
      <div className="grid grid-cols-5 gap-3 mb-5">
        {[
          { opp: '优质机会', icon: '⭐', color: 'border-green-700 bg-green-900/20', textColor: 'text-green-400' },
          { opp: '潜在机会', icon: '💡', color: 'border-blue-700 bg-blue-900/20', textColor: 'text-blue-400' },
          { opp: '竞争激烈', icon: '⚔️', color: 'border-yellow-700 bg-yellow-900/20', textColor: 'text-yellow-400' },
          { opp: '风险较高', icon: '⚠️', color: 'border-red-700 bg-red-900/20', textColor: 'text-red-400' },
          { opp: '一般', icon: '➖', color: 'border-gray-700 bg-gray-800', textColor: 'text-gray-400' },
        ].map(({ opp, icon, color, textColor }) => (
          <div
            key={opp}
            className={`rounded-xl p-4 border ${color} cursor-pointer hover:opacity-80`}
            onClick={() => setFilterOpp(filterOpp === opp ? '全部' : opp)}
          >
            <div className="flex items-center gap-2 mb-1">
              <span>{icon}</span>
              <span className={`text-xs font-medium ${textColor}`}>{opp}</span>
            </div>
            <div className={`text-2xl font-bold ${textColor}`}>{oppDist[opp] || 0}</div>
            <div className="text-gray-500 text-xs">家</div>
          </div>
        ))}
      </div>

      {/* 行业价差对比 */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {Object.entries(industryStats).map(([ind, stats]) => (
          <div key={ind} className="bg-gray-800 rounded-xl p-4">
            <div className="flex justify-between items-center mb-3">
              <span className="text-white font-medium">{ind}</span>
              <span className="text-gray-400 text-xs">{stats.count}家</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-gray-400 text-xs">平均评分</div>
                <div className={`text-xl font-bold ${stats.avgScore >= 60 ? 'text-green-400' : stats.avgScore >= 40 ? 'text-blue-400' : 'text-yellow-400'}`}>
                  {stats.avgScore}
                </div>
              </div>
              <div>
                <div className="text-gray-400 text-xs">估算价差</div>
                <div className="text-xl font-bold text-white">{stats.avgSpread}%</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 筛选器 */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="搜索公司..."
          className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 w-48"
        />
        <select
          value={filterOpp}
          onChange={e => setFilterOpp(e.target.value)}
          className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none"
        >
          {opportunities.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <select
          value={filterIndustry}
          onChange={e => setFilterIndustry(e.target.value)}
          className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none"
        >
          {industries.map(i => <option key={i} value={i}>{i}</option>)}
        </select>
        <span className="text-gray-400 text-sm self-center">共 {filtered.length} 家</span>
      </div>

      {/* 表格 */}
      <div className="bg-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left text-gray-400 font-medium px-4 py-3">公司</th>
                <th className="text-center text-gray-400 font-medium px-3 py-3">机会类型</th>
                <th
                  className="text-right text-gray-400 font-medium px-3 py-3 cursor-pointer hover:text-white"
                  onClick={() => handleSort('spread_score')}
                >
                  评分 {sortField === 'spread_score' ? (sortDir === 'desc' ? '↓' : '↑') : ''}
                </th>
                <th
                  className="text-right text-gray-400 font-medium px-3 py-3 cursor-pointer hover:text-white"
                  onClick={() => handleSort('estimated_spread')}
                >
                  估算价差% {sortField === 'estimated_spread' ? (sortDir === 'desc' ? '↓' : '↑') : ''}
                </th>
                <th className="text-right text-gray-400 font-medium px-3 py-3">vs行业均值</th>
                <th className="text-center text-gray-400 font-medium px-3 py-3">竞争程度</th>
                <th
                  className="text-right text-gray-400 font-medium px-3 py-3 cursor-pointer hover:text-white"
                  onClick={() => handleSort('market_cap')}
                >
                  市值(亿) {sortField === 'market_cap' ? (sortDir === 'desc' ? '↓' : '↑') : ''}
                </th>
                <th className="text-right text-gray-400 font-medium px-3 py-3">ROE%</th>
                <th className="text-center text-gray-400 font-medium px-4 py-3">详情</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 100).map(r => (
                <>
                  <tr
                    key={r.code}
                    className="border-b border-gray-700/50 hover:bg-gray-700/30 cursor-pointer"
                    onClick={() => setExpandedCode(expandedCode === r.code ? null : r.code)}
                  >
                    <td className="px-4 py-3">
                      <div className="text-white font-medium">{r.name}</div>
                      <div className="text-gray-500 text-xs">{r.code} · {r.layer || '基础层'}</div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs border ${OPP_COLORS[r.opportunity]}`}>
                        {r.opportunity}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-12 bg-gray-700 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full ${r.spread_score >= 70 ? 'bg-green-500' : r.spread_score >= 50 ? 'bg-blue-500' : 'bg-gray-500'}`}
                            style={{ width: `${r.spread_score}%` }}
                          />
                        </div>
                        <span className={r.spread_score >= 70 ? 'text-green-400' : r.spread_score >= 50 ? 'text-blue-400' : 'text-gray-400'}>
                          {r.spread_score}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <span className={r.estimated_spread >= 2.5 ? 'text-green-400' : r.estimated_spread >= 1.5 ? 'text-blue-400' : 'text-gray-400'}>
                        {r.estimated_spread}%
                      </span>
                    </td>
                    <td className={`px-3 py-3 text-right ${r.spread_vs_avg > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {r.spread_vs_avg > 0 ? '+' : ''}{r.spread_vs_avg}%
                    </td>
                    <td className={`px-3 py-3 text-center text-xs ${COMP_COLORS[r.competition] || 'text-gray-400'}`}>
                      {r.competition}
                    </td>
                    <td className="px-3 py-3 text-right text-gray-300">
                      {r.market_cap ? (r.market_cap / 10000).toFixed(2) : '-'}
                      {r.market_cap_estimated && <span className="text-yellow-500 text-xs ml-1" title="估算市值">*</span>}
                    </td>
                    <td className={`px-3 py-3 text-right ${r.roe > 15 ? 'text-green-400' : r.roe > 8 ? 'text-blue-400' : r.roe > 0 ? 'text-gray-300' : 'text-red-400'}`}>
                      {r.roe.toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 text-center text-gray-400 text-xs">
                      {expandedCode === r.code ? '▲' : '▼'}
                    </td>
                  </tr>
                  {expandedCode === r.code && (
                    <tr key={`${r.code}-detail`} className="bg-gray-700/20">
                      <td colSpan={9} className="px-4 py-4">
                        <div className="grid grid-cols-4 gap-4 text-xs">
                          <div>
                            <div className="text-gray-400 mb-1">财务指标</div>
                            <div className="space-y-1 text-gray-300">
                              <div>营收: {r.revenue_yi !== null ? r.revenue_yi.toFixed(2) + '亿' : '-'}</div>
                              <div>净利润: {r.net_profit_yi !== null ? r.net_profit_yi.toFixed(2) + '亿' : '-'}</div>
                              <div>毛利率: {r.gross_margin.toFixed(1)}%</div>
                              <div>负债率: {r.debt_ratio.toFixed(1)}%</div>
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-400 mb-1">价差分析</div>
                            <div className="space-y-1 text-gray-300">
                              <div>估算价差: <span className="text-green-400">{r.estimated_spread}%</span></div>
                              <div>行业均值: {r.industry_avg_spread}%</div>
                              <div>超额价差: <span className={r.spread_vs_avg > 0 ? 'text-green-400' : 'text-red-400'}>{r.spread_vs_avg > 0 ? '+' : ''}{r.spread_vs_avg}%</span></div>
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-400 mb-1">做市评估</div>
                            <div className="space-y-1 text-gray-300">
                              <div>机会类型: <span className={OPP_COLORS[r.opportunity]?.split(' ')[0]}>{r.opportunity}</span></div>
                              <div>竞争程度: <span className={COMP_COLORS[r.competition]}>{r.competition}</span></div>
                              <div>挂牌层次: {r.layer || '基础层'}</div>
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-400 mb-1">市值信息</div>
                            <div className="space-y-1 text-gray-300">
                              <div>市值: {r.market_cap ? (r.market_cap / 10000).toFixed(2) + '亿' : '无数据'}</div>
                              {r.market_cap_estimated && (
                                <div className="text-yellow-400">⚠ 市值为估算值</div>
                              )}
                              <div>数据年份: {r.year}</div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length > 100 && (
          <div className="text-center text-gray-500 text-xs py-3">仅显示前100家，请使用筛选缩小范围</div>
        )}
      </div>
    </div>
  );
}
