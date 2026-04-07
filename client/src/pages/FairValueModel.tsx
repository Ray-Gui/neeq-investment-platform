import { useState, useMemo } from 'react';
import { ArrowLeft, Scale, Info, ChevronDown, ChevronUp, TrendingUp, BarChart3, DollarSign, AlertTriangle } from 'lucide-react';
import industryBenchmarkData from '../data/industry-benchmark-data.json';

// ============================================================
// 类型定义
// ============================================================
interface CompanyInput {
  name: string;
  code: string;
  industry: '医疗健康' | '新能源' | '人工智能';
  revenue: string;        // 营收（万元）
  netProfit: string;      // 净利润（万元）
  grossMargin: string;    // 毛利率（%）
  roe: string;            // ROE（%）
  debtRatio: string;      // 负债率（%）
  bookValue: string;      // 净资产（万元）
  totalShares: string;    // 总股本（万股）
  revenueGrowth: string;  // 营收增速（%）
  netProfitGrowth: string;// 净利润增速（%）
}

interface ValuationResult {
  method: string;
  shortName: string;
  value: number | null;
  pricePerShare: number | null;
  description: string;
  formula: string;
  multiplier: number | null;
  benchmark: string;
  confidence: 'high' | 'medium' | 'low';
  warning?: string;
}

// ============================================================
// 行业市盈率/市净率/市销率基准（基于新三板历史数据）
// ============================================================
const INDUSTRY_MULTIPLES: Record<string, {
  pe: { low: number; mid: number; high: number };
  pb: { low: number; mid: number; high: number };
  ps: { low: number; mid: number; high: number };
  label: string;
}> = {
  '医疗健康': {
    pe: { low: 15, mid: 25, high: 40 },
    pb: { low: 1.5, mid: 2.8, high: 5.0 },
    ps: { low: 1.0, mid: 2.0, high: 4.0 },
    label: '医疗健康',
  },
  '新能源': {
    pe: { low: 12, mid: 20, high: 35 },
    pb: { low: 1.2, mid: 2.2, high: 4.0 },
    ps: { low: 0.8, mid: 1.5, high: 3.0 },
    label: '新能源',
  },
  '人工智能': {
    pe: { low: 20, mid: 35, high: 60 },
    pb: { low: 2.0, mid: 4.0, high: 8.0 },
    ps: { low: 2.0, mid: 4.0, high: 8.0 },
    label: '人工智能',
  },
};

// 做市价差建议（基于价差合规要求：≤5%）
const SPREAD_GUIDANCE = {
  high: { spread: '3%–4%', reason: '估值确定性高，可收窄价差' },
  medium: { spread: '4%–5%', reason: '估值存在一定不确定性，建议适中价差' },
  low: { spread: '4.5%–5%', reason: '估值不确定性较高，建议接近上限价差' },
};

// ============================================================
// 辅助函数
// ============================================================
function parseNum(s: string): number | null {
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

function fmt(n: number | null, decimals = 2): string {
  if (n === null) return '—';
  return n.toFixed(decimals);
}

function fmtWan(n: number | null): string {
  if (n === null) return '—';
  if (Math.abs(n) >= 10000) return (n / 10000).toFixed(2) + ' 亿';
  return n.toFixed(0) + ' 万';
}

// ============================================================
// 子组件：输入表单
// ============================================================
function InputForm({ input, onChange }: { input: CompanyInput; onChange: (k: keyof CompanyInput, v: string) => void }) {
  const fields: { key: keyof CompanyInput; label: string; unit: string; hint: string }[] = [
    { key: 'name', label: '公司名称', unit: '', hint: '输入公司名称（可选）' },
    { key: 'code', label: '股票代码', unit: '', hint: '如：872691.OC' },
    { key: 'revenue', label: '最新年度营收', unit: '万元', hint: '来自年报营业收入' },
    { key: 'netProfit', label: '最新年度净利润', unit: '万元', hint: '归母净利润，亏损填负数' },
    { key: 'grossMargin', label: '毛利率', unit: '%', hint: '（营收-成本）/ 营收 × 100' },
    { key: 'roe', label: 'ROE（净资产收益率）', unit: '%', hint: '净利润 / 平均净资产 × 100' },
    { key: 'debtRatio', label: '负债率', unit: '%', hint: '总负债 / 总资产 × 100' },
    { key: 'bookValue', label: '净资产（账面价值）', unit: '万元', hint: '总资产 - 总负债' },
    { key: 'totalShares', label: '总股本', unit: '万股', hint: '公司发行的全部股份数量' },
    { key: 'revenueGrowth', label: '营收增速（最近一年）', unit: '%', hint: '（本年营收 - 上年营收）/ 上年营收 × 100' },
    { key: 'netProfitGrowth', label: '净利润增速（最近一年）', unit: '%', hint: '净利润同比增速，亏损转盈利填正数' },
  ];

  return (
    <div className="space-y-4">
      {/* 行业选择 */}
      <div>
        <label className="text-gray-300 text-sm font-medium block mb-2">所属行业</label>
        <div className="flex gap-2">
          {(['医疗健康', '新能源', '人工智能'] as const).map((ind) => (
            <button
              key={ind}
              onClick={() => onChange('industry', ind)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${input.industry === ind ? 'bg-blue-500 text-white' : 'bg-[#1a2535] text-gray-400 hover:text-white border border-[#2a3a4f]'}`}
            >
              {ind}
            </button>
          ))}
        </div>
      </div>

      {/* 其他字段 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map(({ key, label, unit, hint }) => (
          <div key={key}>
            <label className="text-gray-300 text-sm font-medium block mb-1.5">{label}{unit && <span className="text-gray-500 text-xs ml-1">（{unit}）</span>}</label>
            <input
              type={key === 'name' || key === 'code' ? 'text' : 'number'}
              value={input[key]}
              onChange={(e) => onChange(key, e.target.value)}
              placeholder={hint}
              className="w-full bg-[#0f1923] border border-[#2a3a4f] rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// 子组件：估值结果卡片
// ============================================================
function ValuationCard({ result, totalShares }: { result: ValuationResult; totalShares: number | null }) {
  const [expanded, setExpanded] = useState(false);
  const confColor = result.confidence === 'high' ? 'text-green-400 bg-green-400/10' : result.confidence === 'medium' ? 'text-yellow-400 bg-yellow-400/10' : 'text-red-400 bg-red-400/10';
  const confLabel = result.confidence === 'high' ? '高可信度' : result.confidence === 'medium' ? '中可信度' : '低可信度';

  return (
    <div className="bg-[#1a2535] border border-[#2a3a4f] rounded-xl overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-white font-bold text-base">{result.method}</h3>
            <p className="text-gray-400 text-xs mt-0.5">{result.description}</p>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${confColor}`}>{confLabel}</span>
        </div>

        {result.value !== null ? (
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="bg-[#0f1923] rounded-lg p-3">
              <p className="text-gray-500 text-xs mb-1">估算总市值</p>
              <p className="text-white font-bold text-lg">{fmtWan(result.value)}</p>
            </div>
            {result.pricePerShare !== null && (
              <div className="bg-[#0f1923] rounded-lg p-3">
                <p className="text-gray-500 text-xs mb-1">每股估值</p>
                <p className="text-blue-400 font-bold text-lg">¥{fmt(result.pricePerShare)}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-4 p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
            <p className="text-red-400 text-sm flex items-center gap-2"><AlertTriangle size={14} /> 数据不足，无法计算</p>
          </div>
        )}

        {result.multiplier !== null && (
          <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
            <span>使用倍数：<span className="text-white font-medium">{fmt(result.multiplier, 1)}x</span></span>
            <span>·</span>
            <span>行业基准：{result.benchmark}</span>
          </div>
        )}

        {result.warning && (
          <div className="mt-3 p-2.5 bg-yellow-500/5 border border-yellow-500/20 rounded-lg">
            <p className="text-yellow-400 text-xs flex items-center gap-1.5"><AlertTriangle size={12} /> {result.warning}</p>
          </div>
        )}

        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          {expanded ? '收起' : '查看计算公式'}
        </button>

        {expanded && (
          <div className="mt-3 p-3 bg-[#0f1923] rounded-lg border border-[#2a3a4f]">
            <p className="text-gray-400 text-xs font-mono leading-relaxed">{result.formula}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// 子组件：可比公司分析
// ============================================================
function ComparableAnalysis({ industry, input }: { industry: string; input: CompanyInput }) {
  const benchData = (industryBenchmarkData as any)[industry];
  if (!benchData) return null;

  const companies = benchData.companies as any[];
  const revenue = parseNum(input.revenue);
  const grossMargin = parseNum(input.grossMargin);
  const roe = parseNum(input.roe);

  // 找出最相似的5家可比公司（基于毛利率和ROE相似度）
  const scored = companies
    .filter((c) => c.gross_margin !== null && c.roe !== null && c.market_cap !== null && c.revenue !== null)
    .map((c) => {
      let score = 0;
      if (grossMargin !== null) score += Math.abs(c.gross_margin - grossMargin);
      if (roe !== null) score += Math.abs(c.roe - roe) * 2;
      return { ...c, similarityScore: score };
    })
    .sort((a, b) => a.similarityScore - b.similarityScore)
    .slice(0, 8);

  if (scored.length === 0) return null;

  // 计算可比公司的市销率（PS = 市值 / 营收）
  const psRatios = scored
    .filter((c) => c.revenue > 0 && c.market_cap > 0)
    .map((c) => c.market_cap / c.revenue);
  const medianPS = psRatios.length > 0 ? psRatios.sort((a, b) => a - b)[Math.floor(psRatios.length / 2)] : null;

  return (
    <div className="bg-[#1a2535] border border-[#2a3a4f] rounded-xl p-5">
      <h3 className="text-white font-bold text-sm mb-1 flex items-center gap-2">
        <BarChart3 size={14} className="text-purple-400" />
        可比公司分析（{industry}行业，按财务相似度排序）
      </h3>
      <p className="text-gray-500 text-xs mb-4">基于毛利率和ROE相似度，从{companies.length}家同行业企业中筛选最相似的8家</p>

      {medianPS !== null && revenue !== null && (
        <div className="mb-4 p-3 bg-purple-500/5 border border-purple-500/20 rounded-lg">
          <p className="text-gray-400 text-xs">可比公司中位市销率（PS）：<span className="text-purple-400 font-bold">{fmt(medianPS, 2)}x</span></p>
          <p className="text-gray-400 text-xs mt-1">按此PS估算目标公司市值：<span className="text-white font-bold">{fmtWan(medianPS * revenue)}</span></p>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-gray-500 border-b border-[#2a3a4f]">
              <th className="text-left py-2 pr-3">公司</th>
              <th className="text-right py-2 px-2">营收(万)</th>
              <th className="text-right py-2 px-2">毛利率</th>
              <th className="text-right py-2 px-2">ROE</th>
              <th className="text-right py-2 px-2">市值(万)</th>
              <th className="text-right py-2 pl-2">PS倍数</th>
            </tr>
          </thead>
          <tbody>
            {scored.map((c, i) => {
              const ps = c.revenue > 0 ? (c.market_cap / c.revenue) : null;
              return (
                <tr key={c.code} className={`border-b border-[#2a3a4f]/50 ${i === 0 ? 'bg-purple-500/5' : ''}`}>
                  <td className="py-2 pr-3">
                    <div className="text-white font-medium">{c.name}</div>
                    <div className="text-gray-500">{c.code}</div>
                  </td>
                  <td className="text-right py-2 px-2 text-gray-300">{c.revenue?.toFixed(0) ?? '—'}</td>
                  <td className="text-right py-2 px-2 text-gray-300">{c.gross_margin?.toFixed(1) ?? '—'}%</td>
                  <td className={`text-right py-2 px-2 ${(c.roe ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>{c.roe?.toFixed(1) ?? '—'}%</td>
                  <td className="text-right py-2 px-2 text-gray-300">{c.market_cap?.toFixed(0) ?? '—'}</td>
                  <td className="text-right py-2 pl-2 text-purple-400">{ps !== null ? fmt(ps, 2) + 'x' : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================
// 主页面
// ============================================================
export default function FairValueModel() {
  const [input, setInput] = useState<CompanyInput>({
    name: '',
    code: '',
    industry: '医疗健康',
    revenue: '',
    netProfit: '',
    grossMargin: '',
    roe: '',
    debtRatio: '',
    bookValue: '',
    totalShares: '',
    revenueGrowth: '',
    netProfitGrowth: '',
  });

  const [showResult, setShowResult] = useState(false);

  const handleChange = (k: keyof CompanyInput, v: string) => {
    setInput((prev) => ({ ...prev, [k]: v }));
    setShowResult(false);
  };

  // ============================================================
  // 估值计算
  // ============================================================
  const results = useMemo((): ValuationResult[] => {
    const revenue = parseNum(input.revenue);
    const netProfit = parseNum(input.netProfit);
    const bookValue = parseNum(input.bookValue);
    const totalShares = parseNum(input.totalShares);
    const roe = parseNum(input.roe);
    const grossMargin = parseNum(input.grossMargin);
    const revenueGrowth = parseNum(input.revenueGrowth);
    const netProfitGrowth = parseNum(input.netProfitGrowth);
    const multiples = INDUSTRY_MULTIPLES[input.industry];

    // 根据财务质量选择倍数档位
    const isHighQuality = (roe ?? 0) > 15 && (grossMargin ?? 0) > 40 && (netProfit ?? 0) > 0;
    const isLowQuality = (netProfit ?? 0) <= 0 || (roe ?? 0) < 5;
    const peMultiplier = isHighQuality ? multiples.pe.high : isLowQuality ? multiples.pe.low : multiples.pe.mid;
    const pbMultiplier = isHighQuality ? multiples.pb.high : isLowQuality ? multiples.pb.low : multiples.pb.mid;
    const psMultiplier = isHighQuality ? multiples.ps.high : isLowQuality ? multiples.ps.low : multiples.ps.mid;

    // 成长调整：高增速上浮10%–20%
    const growthAdj = (revenueGrowth ?? 0) > 30 ? 1.2 : (revenueGrowth ?? 0) > 15 ? 1.1 : 1.0;

    // 1. PE法（市盈率法）
    const peValue = netProfit !== null && netProfit > 0 ? netProfit * peMultiplier * growthAdj : null;
    const peResult: ValuationResult = {
      method: '市盈率法（PE法）',
      shortName: 'PE',
      value: peValue,
      pricePerShare: peValue !== null && totalShares !== null && totalShares > 0 ? (peValue / totalShares) * 10000 : null,
      description: '以净利润为基础，乘以行业市盈率倍数',
      formula: `估值 = 净利润 × PE倍数 × 成长调整系数\n= ${fmt(netProfit)} 万 × ${fmt(peMultiplier, 1)}x × ${growthAdj.toFixed(1)}\n= ${fmt(peValue)} 万元\n\n行业PE参考：低档${multiples.pe.low}x / 中档${multiples.pe.mid}x / 高档${multiples.pe.high}x\n当前使用：${fmt(peMultiplier, 1)}x（${isHighQuality ? '高质量' : isLowQuality ? '低质量' : '中等质量'}企业）`,
      multiplier: peMultiplier,
      benchmark: `${multiples.pe.low}x – ${multiples.pe.high}x`,
      confidence: netProfit !== null && netProfit > 0 ? (isHighQuality ? 'high' : 'medium') : 'low',
      warning: netProfit === null || netProfit <= 0 ? '企业亏损，PE法不适用，建议参考PS法或PB法' : undefined,
    };

    // 2. PB法（市净率法）
    const pbValue = bookValue !== null ? bookValue * pbMultiplier : null;
    const pbResult: ValuationResult = {
      method: '市净率法（PB法）',
      shortName: 'PB',
      value: pbValue,
      pricePerShare: pbValue !== null && totalShares !== null && totalShares > 0 ? (pbValue / totalShares) * 10000 : null,
      description: '以净资产账面价值为基础，乘以行业市净率倍数',
      formula: `估值 = 净资产 × PB倍数\n= ${fmt(bookValue)} 万 × ${fmt(pbMultiplier, 1)}x\n= ${fmt(pbValue)} 万元\n\n行业PB参考：低档${multiples.pb.low}x / 中档${multiples.pb.mid}x / 高档${multiples.pb.high}x\n当前使用：${fmt(pbMultiplier, 1)}x`,
      multiplier: pbMultiplier,
      benchmark: `${multiples.pb.low}x – ${multiples.pb.high}x`,
      confidence: bookValue !== null ? 'medium' : 'low',
      warning: (roe ?? 0) < 0 ? 'ROE为负，账面价值可能高估，PB法结果偏高' : undefined,
    };

    // 3. PS法（市销率法）
    const psValue = revenue !== null ? revenue * psMultiplier * growthAdj : null;
    const psResult: ValuationResult = {
      method: '市销率法（PS法）',
      shortName: 'PS',
      value: psValue,
      pricePerShare: psValue !== null && totalShares !== null && totalShares > 0 ? (psValue / totalShares) * 10000 : null,
      description: '以营业收入为基础，乘以行业市销率倍数，适合亏损或微利企业',
      formula: `估值 = 营收 × PS倍数 × 成长调整系数\n= ${fmt(revenue)} 万 × ${fmt(psMultiplier, 1)}x × ${growthAdj.toFixed(1)}\n= ${fmt(psValue)} 万元\n\n行业PS参考：低档${multiples.ps.low}x / 中档${multiples.ps.mid}x / 高档${multiples.ps.high}x\n当前使用：${fmt(psMultiplier, 1)}x`,
      multiplier: psMultiplier,
      benchmark: `${multiples.ps.low}x – ${multiples.ps.high}x`,
      confidence: revenue !== null ? (isHighQuality ? 'medium' : 'medium') : 'low',
    };

    // 4. 综合估值（三法加权平均）
    const validValues = [peValue, pbValue, psValue].filter((v) => v !== null) as number[];
    const weights = [
      netProfit !== null && netProfit > 0 ? 0.5 : 0.1,  // PE权重
      bookValue !== null ? 0.25 : 0,                      // PB权重
      revenue !== null ? 0.25 : 0,                        // PS权重
    ];
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let compositeValue: number | null = null;
    if (validValues.length >= 2 && totalWeight > 0) {
      compositeValue = 0;
      if (peValue !== null) compositeValue += peValue * (weights[0] / totalWeight);
      if (pbValue !== null) compositeValue += pbValue * (weights[1] / totalWeight);
      if (psValue !== null) compositeValue += psValue * (weights[2] / totalWeight);
    }

    const compositeResult: ValuationResult = {
      method: '综合估值（三法加权）',
      shortName: '综合',
      value: compositeValue,
      pricePerShare: compositeValue !== null && totalShares !== null && totalShares > 0 ? (compositeValue / totalShares) * 10000 : null,
      description: '综合PE/PB/PS三种方法，根据企业盈利状况动态分配权重',
      formula: `权重分配：PE ${(weights[0] / totalWeight * 100).toFixed(0)}% / PB ${(weights[1] / totalWeight * 100).toFixed(0)}% / PS ${(weights[2] / totalWeight * 100).toFixed(0)}%\n综合估值 = PE估值×${(weights[0] / totalWeight).toFixed(2)} + PB估值×${(weights[1] / totalWeight).toFixed(2)} + PS估值×${(weights[2] / totalWeight).toFixed(2)}\n= ${fmt(compositeValue)} 万元\n\n注：PE权重在企业盈利时较高（50%），亏损时降低至10%`,
      multiplier: null,
      benchmark: '—',
      confidence: compositeValue !== null ? (isHighQuality ? 'high' : 'medium') : 'low',
    };

    return [compositeResult, peResult, pbResult, psResult];
  }, [input]);

  // ============================================================
  // 做市报价区间建议
  // ============================================================
  const quoteGuidance = useMemo(() => {
    const composite = results[0];
    if (!composite.pricePerShare) return null;
    const price = composite.pricePerShare;
    const conf = composite.confidence;
    const spread = SPREAD_GUIDANCE[conf];
    const spreadRate = conf === 'high' ? 0.035 : conf === 'medium' ? 0.045 : 0.049;
    const buyPrice = price * (1 - spreadRate / 2);
    const sellPrice = price * (1 + spreadRate / 2);
    return { price, buyPrice, sellPrice, spread: spread.spread, reason: spread.reason, conf };
  }, [results]);

  const hasEnoughData = input.revenue || input.netProfit || input.bookValue;

  return (
    <div className="min-h-screen bg-[#0f1923] text-white">
      {/* 顶部导航 */}
      <div className="border-b border-[#1a2535] px-6 py-4 flex items-center gap-4">
        <button
          onClick={() => window.history.length > 1 ? window.history.back() : (window.location.href = '/')}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
        >
          <ArrowLeft size={16} /> 返回
        </button>
        <div className="flex items-center gap-2">
          <Scale size={18} className="text-yellow-400" />
          <span className="font-bold text-white">公允价值定价模型</span>
        </div>
        <span className="text-gray-500 text-sm">PE / PB / PS 三法估值 · 可比公司法 · 做市报价区间建议</span>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* 说明横幅 */}
        <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4 mb-6 flex items-start gap-3">
          <Info size={16} className="text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-gray-300 leading-relaxed">
            <span className="text-yellow-400 font-semibold">使用说明：</span>
            本模型基于新三板市场历史财务数据和行业估值倍数，通过 PE/PB/PS 三种方法估算企业公允价值，并给出做市报价区间建议。
            由于新三板股票流动性较低，估值结果仅供参考，实际报价还需结合最新成交价格、市场情绪和个股特殊情况综合判断。
            <span className="text-yellow-400"> 报价价差须符合监管要求（≤5%）。</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* 左侧：输入表单 */}
          <div className="lg:col-span-2">
            <div className="bg-[#1a2535] border border-[#2a3a4f] rounded-xl p-5 sticky top-6">
              <h2 className="text-white font-bold text-base mb-4 flex items-center gap-2">
                <DollarSign size={16} className="text-yellow-400" />
                输入财务数据
              </h2>
              <InputForm input={input} onChange={handleChange} />
              <button
                onClick={() => setShowResult(true)}
                disabled={!hasEnoughData}
                className={`w-full mt-5 py-3 rounded-xl font-semibold text-sm transition-all ${hasEnoughData ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:from-yellow-400 hover:to-orange-400' : 'bg-[#2a3a4f] text-gray-500 cursor-not-allowed'}`}
              >
                计算公允价值
              </button>
              {!hasEnoughData && (
                <p className="text-gray-500 text-xs text-center mt-2">请至少填写营收、净利润或净资产之一</p>
              )}
            </div>
          </div>

          {/* 右侧：估值结果 */}
          <div className="lg:col-span-3 space-y-5">
            {showResult && hasEnoughData ? (
              <>
                {/* 做市报价区间 */}
                {quoteGuidance && (
                  <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl p-5">
                    <h3 className="text-white font-bold text-base mb-4 flex items-center gap-2">
                      <TrendingUp size={16} className="text-yellow-400" />
                      做市报价区间建议
                    </h3>
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="bg-[#0f1923]/50 rounded-lg p-3 text-center">
                        <p className="text-gray-500 text-xs mb-1">建议买入报价</p>
                        <p className="text-green-400 font-bold text-xl">¥{fmt(quoteGuidance.buyPrice)}</p>
                      </div>
                      <div className="bg-[#0f1923]/50 rounded-lg p-3 text-center">
                        <p className="text-gray-500 text-xs mb-1">公允价值中枢</p>
                        <p className="text-yellow-400 font-bold text-xl">¥{fmt(quoteGuidance.price)}</p>
                      </div>
                      <div className="bg-[#0f1923]/50 rounded-lg p-3 text-center">
                        <p className="text-gray-500 text-xs mb-1">建议卖出报价</p>
                        <p className="text-red-400 font-bold text-xl">¥{fmt(quoteGuidance.sellPrice)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span>建议价差：<span className="text-white font-medium">{quoteGuidance.spread}</span></span>
                      <span>·</span>
                      <span>{quoteGuidance.reason}</span>
                      <span>·</span>
                      <span className="text-yellow-400">合规上限：5%</span>
                    </div>
                  </div>
                )}

                {/* 四种估值方法结果 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {results.map((r) => (
                    <ValuationCard key={r.shortName} result={r} totalShares={parseNum(input.totalShares)} />
                  ))}
                </div>

                {/* 可比公司分析 */}
                <ComparableAnalysis industry={input.industry} input={input} />

                {/* 估值说明 */}
                <div className="bg-[#1a2535] border border-[#2a3a4f] rounded-xl p-5">
                  <h3 className="text-white font-semibold text-sm mb-3">估值方法说明</h3>
                  <div className="space-y-2 text-xs text-gray-400 leading-relaxed">
                    <p><span className="text-white font-medium">PE法（市盈率法）：</span>适合盈利稳定的成熟企业。用净利润乘以行业平均市盈率，高成长企业给予更高倍数。亏损企业不适用。</p>
                    <p><span className="text-white font-medium">PB法（市净率法）：</span>适合资产密集型企业（如制造业）。用净资产账面价值乘以市净率。ROE越高，PB倍数越高。</p>
                    <p><span className="text-white font-medium">PS法（市销率法）：</span>适合高成长但尚未盈利的企业（如AI、新能源初创）。用营收乘以市销率，不受亏损影响。</p>
                    <p><span className="text-white font-medium">综合法：</span>根据企业盈利状况动态分配三种方法的权重，盈利企业PE权重最高（50%），亏损企业PS权重最高。</p>
                    <p className="text-gray-500 pt-2 border-t border-[#2a3a4f]">行业倍数基准来源：新三板历史成交数据及A股同行业可比公司估值，已根据新三板流动性折价调整（较A股折价约20%–30%）。</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-96 text-gray-500">
                <Scale size={48} className="mb-4 opacity-20" />
                <p className="text-base">在左侧填入财务数据</p>
                <p className="text-sm mt-1">系统将自动计算 PE / PB / PS 三种估值</p>
                <p className="text-xs mt-3 text-gray-600">支持医疗健康 · 新能源 · 人工智能三大行业</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
