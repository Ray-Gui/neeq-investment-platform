import { useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft } from 'lucide-react';
import riskData from '../data/inventory-risk-data.json';

interface RiskRecord {
  code: string;
  name: string;
  industry: string;
  market_cap: number | null;
  revenue_yi: number | null;
  net_profit_yi: number | null;
  net_margin: number | null;
  roe: number | null;
  debt_ratio: number;
  estimated_beta: number;
  delisting_risk: number;
  risk_level: '高风险' | '中风险' | '低风险' | '安全';
  risk_factors: string[];
  revenue_trend: { year: number; revenue: number }[];
  loss_years: number;
  year: number;
}

const data = riskData as RiskRecord[];

const RISK_COLORS: Record<string, string> = {
  '高风险': 'text-red-400 bg-red-900/30 border-red-700',
  '中风险': 'text-yellow-400 bg-yellow-900/30 border-yellow-700',
  '低风险': 'text-blue-400 bg-blue-900/30 border-blue-700',
  '安全': 'text-green-400 bg-green-900/30 border-green-700',
};

const RISK_BAR_COLORS: Record<string, string> = {
  '高风险': 'bg-red-500',
  '中风险': 'bg-yellow-500',
  '低风险': 'bg-blue-500',
  '安全': 'bg-green-500',
};

export default function InventoryRisk() {
  const [filterLevel, setFilterLevel] = useState<string>('全部');
  const [filterIndustry, setFilterIndustry] = useState<string>('全部');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<string>('delisting_risk');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [expandedCode, setExpandedCode] = useState<string | null>(null);

  const industries = useMemo(() => ['全部', ...Array.from(new Set(data.map(r => r.industry)))], []);
  const riskLevels = ['全部', '高风险', '中风险', '低风险', '安全'];

  const riskDist = useMemo(() => {
    const dist: Record<string, number> = {};
    data.forEach(r => { dist[r.risk_level] = (dist[r.risk_level] || 0) + 1; });
    return dist;
  }, []);

  const filtered = useMemo(() => {
    let list = [...data];
    if (filterLevel !== '全部') list = list.filter(r => r.risk_level === filterLevel);
    if (filterIndustry !== '全部') list = list.filter(r => r.industry === filterIndustry);
    if (searchQuery) list = list.filter(r => r.name.includes(searchQuery) || r.code.includes(searchQuery));
    list.sort((a, b) => {
      const av = (a as any)[sortField] ?? -Infinity;
      const bv = (b as any)[sortField] ?? -Infinity;
      return sortDir === 'desc' ? bv - av : av - bv;
    });
    return list;
  }, [filterLevel, filterIndustry, searchQuery, sortField, sortDir]);

  const handleSort = (field: string) => {
    if (sortField === field) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const avgBeta = useMemo(() => {
    const betas = data.map(r => r.estimated_beta).filter(b => b > 0);
    return betas.length ? (betas.reduce((a, b) => a + b, 0) / betas.length).toFixed(2) : '-';
  }, []);

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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">🛡️ 库存风险监控</h1>
        <p className="text-gray-400 text-sm">退市风险评分 · Beta值估算 · 行业集中度风险 · 连续亏损预警</p>
        <p className="text-yellow-500 text-xs mt-1">⚠️ Beta值为基于行业特征的估算值，非实际交易Beta；退市风险评分基于公开财务数据计算</p>
      </div>

      {/* 风险概览卡片 */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        {[
          { level: '高风险', color: 'border-red-700 bg-red-900/20', textColor: 'text-red-400', icon: '🔴' },
          { level: '中风险', color: 'border-yellow-700 bg-yellow-900/20', textColor: 'text-yellow-400', icon: '🟡' },
          { level: '低风险', color: 'border-blue-700 bg-blue-900/20', textColor: 'text-blue-400', icon: '🔵' },
          { level: '安全', color: 'border-green-700 bg-green-900/20', textColor: 'text-green-400', icon: '🟢' },
        ].map(({ level, color, textColor, icon }) => (
          <div key={level} className={`rounded-xl p-4 border ${color} cursor-pointer hover:opacity-80`}
            onClick={() => setFilterLevel(filterLevel === level ? '全部' : level)}>
            <div className="flex items-center gap-2 mb-1">
              <span>{icon}</span>
              <span className={`text-sm font-medium ${textColor}`}>{level}</span>
            </div>
            <div className={`text-2xl font-bold ${textColor}`}>{riskDist[level] || 0}</div>
            <div className="text-gray-500 text-xs">家公司</div>
          </div>
        ))}
        <div className="rounded-xl p-4 border border-gray-700 bg-gray-800">
          <div className="text-gray-400 text-xs mb-1">平均Beta</div>
          <div className="text-2xl font-bold text-white">{avgBeta}</div>
          <div className="text-gray-500 text-xs">估算值</div>
        </div>
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
          value={filterLevel}
          onChange={e => setFilterLevel(e.target.value)}
          className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none"
        >
          {riskLevels.map(l => <option key={l} value={l}>{l}</option>)}
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
                <th className="text-center text-gray-400 font-medium px-3 py-3">风险等级</th>
                <th
                  className="text-right text-gray-400 font-medium px-3 py-3 cursor-pointer hover:text-white"
                  onClick={() => handleSort('delisting_risk')}
                >
                  退市风险分 {sortField === 'delisting_risk' ? (sortDir === 'desc' ? '↓' : '↑') : ''}
                </th>
                <th
                  className="text-right text-gray-400 font-medium px-3 py-3 cursor-pointer hover:text-white"
                  onClick={() => handleSort('estimated_beta')}
                >
                  Beta估算 {sortField === 'estimated_beta' ? (sortDir === 'desc' ? '↓' : '↑') : ''}
                </th>
                <th className="text-right text-gray-400 font-medium px-3 py-3">营收(亿)</th>
                <th className="text-right text-gray-400 font-medium px-3 py-3">净利润(亿)</th>
                <th className="text-right text-gray-400 font-medium px-3 py-3">负债率%</th>
                <th
                  className="text-right text-gray-400 font-medium px-3 py-3 cursor-pointer hover:text-white"
                  onClick={() => handleSort('loss_years')}
                >
                  连亏年数 {sortField === 'loss_years' ? (sortDir === 'desc' ? '↓' : '↑') : ''}
                </th>
                <th className="text-center text-gray-400 font-medium px-4 py-3">操作</th>
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
                      <div className="text-gray-500 text-xs">{r.code} · {r.industry}</div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs border ${RISK_COLORS[r.risk_level]}`}>
                        {r.risk_level}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 bg-gray-700 rounded-full h-1.5">
                          <div
                            className={`${RISK_BAR_COLORS[r.risk_level]} h-1.5 rounded-full`}
                            style={{ width: `${r.delisting_risk}%` }}
                          />
                        </div>
                        <span className={r.delisting_risk >= 60 ? 'text-red-400' : r.delisting_risk >= 35 ? 'text-yellow-400' : 'text-green-400'}>
                          {r.delisting_risk}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <span className={r.estimated_beta > 1.5 ? 'text-red-400' : r.estimated_beta > 1.2 ? 'text-yellow-400' : 'text-green-400'}>
                        β {r.estimated_beta}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right text-gray-300">
                      {r.revenue_yi !== null ? r.revenue_yi.toFixed(2) : '-'}
                    </td>
                    <td className={`px-3 py-3 text-right ${r.net_profit_yi !== null && r.net_profit_yi < 0 ? 'text-red-400' : 'text-green-400'}`}>
                      {r.net_profit_yi !== null ? r.net_profit_yi.toFixed(2) : '-'}
                    </td>
                    <td className={`px-3 py-3 text-right ${r.debt_ratio > 80 ? 'text-red-400' : r.debt_ratio > 60 ? 'text-yellow-400' : 'text-gray-300'}`}>
                      {r.debt_ratio.toFixed(1)}%
                    </td>
                    <td className={`px-3 py-3 text-right ${r.loss_years >= 3 ? 'text-red-400' : r.loss_years >= 2 ? 'text-yellow-400' : 'text-gray-300'}`}>
                      {r.loss_years > 0 ? `${r.loss_years}年` : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-gray-400 text-xs">{expandedCode === r.code ? '▲' : '▼'}</span>
                    </td>
                  </tr>
                  {expandedCode === r.code && (
                    <tr key={`${r.code}-detail`} className="bg-gray-700/20">
                      <td colSpan={9} className="px-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-gray-400 text-xs font-medium mb-2">风险因素</div>
                            {r.risk_factors.length > 0 ? (
                              <div className="space-y-1">
                                {r.risk_factors.map((f, i) => (
                                  <div key={i} className="flex items-center gap-2 text-xs">
                                    <span className="text-red-400">⚠</span>
                                    <span className="text-gray-300">{f}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-green-400 text-xs">✓ 无明显风险因素</div>
                            )}
                          </div>
                          <div>
                            <div className="text-gray-400 text-xs font-medium mb-2">营收趋势</div>
                            {r.revenue_trend.length > 0 ? (
                              <div className="flex items-end gap-2 h-12">
                                {r.revenue_trend.map((t, i) => {
                                  const maxRev = Math.max(...r.revenue_trend.map(x => x.revenue));
                                  const height = maxRev > 0 ? (t.revenue / maxRev * 100) : 0;
                                  return (
                                    <div key={i} className="flex flex-col items-center gap-1 flex-1">
                                      <div
                                        className="w-full bg-blue-600 rounded-t"
                                        style={{ height: `${height}%`, minHeight: '4px' }}
                                        title={`${t.year}: ${t.revenue.toFixed(2)}亿`}
                                      />
                                      <span className="text-gray-500 text-xs">{t.year}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="text-gray-500 text-xs">无趋势数据</div>
                            )}
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-600">
                          <div className="text-gray-400 text-xs">
                            <span className="mr-4">市值: {r.market_cap ? (r.market_cap / 10000).toFixed(2) + '亿' : '无数据'}</span>
                            <span className="mr-4">ROE: {r.roe !== null ? r.roe.toFixed(1) + '%' : '-'}</span>
                            <span className="mr-4">净利率: {r.net_margin !== null ? r.net_margin.toFixed(1) + '%' : '-'}</span>
                            <span>数据年份: {r.year}</span>
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
