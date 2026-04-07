import { useState, useMemo } from "react";
import { Link } from "wouter";
import { ArrowLeft, TrendingUp, Building2, Calendar, Award, Search, Filter, BarChart3, ArrowUpRight, Clock, Target, ChevronDown, ChevronUp } from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, ZAxis, Cell, PieChart, Pie, Legend } from "recharts";
import transferCasesRaw from "../data/transfer-cases.json";

interface TransferCase {
  neeq_code: string;
  bj_code: string;
  name: string;
  sector: string;
  neeq_listing_date: string;
  bj_listing_date: string;
  neeq_years: number;
  guidance_months: number;
  transfer_path: string;
  path_desc: string;
  revenue_at_listing: number;
  net_profit_at_listing: number;
  gross_margin: number;
  roe_at_listing: number;
  revenue_cagr: number;
  neeq_valuation: number;
  issue_price: number;
  bj_current_price: number;
  bj_market_cap: number;
  bj_pe: number | null;
  bj_pb: number | null;
  valuation_multiple: number;
  first_day_gain: number;
}

const transferCases = transferCasesRaw as TransferCase[];

const SECTOR_COLORS: Record<string, string> = {
  "医疗健康": "#10b981",
  "新能源": "#f59e0b",
  "人工智能": "#6366f1",
};

const PATH_COLORS: Record<string, string> = {
  "盈利型": "#10b981",
  "成长型": "#6366f1",
  "市值型": "#f59e0b",
};

export default function TransferCaseDB() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSector, setSelectedSector] = useState("全部");
  const [selectedPath, setSelectedPath] = useState("全部");
  const [sortBy, setSortBy] = useState<"valuation_multiple" | "first_day_gain" | "neeq_years" | "bj_market_cap">("valuation_multiple");
  const [sortDesc, setSortDesc] = useState(true);
  const [expandedCase, setExpandedCase] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"list" | "stats" | "timeline">("stats");

  // 过滤和排序
  const filteredCases = useMemo(() => {
    let cases = transferCases.filter(c => {
      const matchSearch = !searchQuery || c.name.includes(searchQuery) || c.bj_code.includes(searchQuery);
      const matchSector = selectedSector === "全部" || c.sector === selectedSector;
      const matchPath = selectedPath === "全部" || c.transfer_path === selectedPath;
      return matchSearch && matchSector && matchPath;
    });
    cases = [...cases].sort((a, b) => {
      const av = a[sortBy] ?? 0;
      const bv = b[sortBy] ?? 0;
      return sortDesc ? (bv as number) - (av as number) : (av as number) - (bv as number);
    });
    return cases;
  }, [searchQuery, selectedSector, selectedPath, sortBy, sortDesc]);

  // 统计数据
  const stats = useMemo(() => {
    const all = transferCases;
    const avgYears = all.reduce((s, c) => s + c.neeq_years, 0) / all.length;
    const avgGuidance = all.reduce((s, c) => s + c.guidance_months, 0) / all.length;
    const avgMultiple = all.reduce((s, c) => s + c.valuation_multiple, 0) / all.length;
    const avgFirstDay = all.reduce((s, c) => s + c.first_day_gain, 0) / all.length;
    const avgROE = all.reduce((s, c) => s + c.roe_at_listing, 0) / all.length;
    const avgRevenueCagr = all.reduce((s, c) => s + c.revenue_cagr, 0) / all.length;
    const avgGrossMargin = all.reduce((s, c) => s + c.gross_margin, 0) / all.length;

    // 路径分布
    const pathDist = ["盈利型", "成长型", "市值型"].map(p => ({
      name: p,
      value: all.filter(c => c.transfer_path === p).length,
    }));

    // 行业分布
    const sectorDist = ["医疗健康", "新能源", "人工智能"].map(s => ({
      name: s,
      value: all.filter(c => c.sector === s).length,
      avgMultiple: parseFloat((all.filter(c => c.sector === s).reduce((sum, c) => sum + c.valuation_multiple, 0) / Math.max(all.filter(c => c.sector === s).length, 1)).toFixed(1)),
    }));

    // 挂牌年数分布
    const yearsDist = [1, 2, 3, 4, 5, 6].map(y => ({
      name: `${y}年`,
      value: all.filter(c => c.neeq_years === y).length,
    }));

    // 估值倍数分布
    const multipleRanges = [
      { name: "1-2x", min: 1, max: 2 },
      { name: "2-3x", min: 2, max: 3 },
      { name: "3-5x", min: 3, max: 5 },
      { name: "5-8x", min: 5, max: 8 },
      { name: "8x+", min: 8, max: 999 },
    ].map(r => ({
      name: r.name,
      value: all.filter(c => c.valuation_multiple >= r.min && c.valuation_multiple < r.max).length,
    }));

    // 转板前财务特征（按路径）
    const pathFinancials = ["盈利型", "成长型", "市值型"].map(p => {
      const group = all.filter(c => c.transfer_path === p);
      return {
        path: p,
        avgROE: parseFloat((group.reduce((s, c) => s + c.roe_at_listing, 0) / group.length).toFixed(1)),
        avgGrossMargin: parseFloat((group.reduce((s, c) => s + c.gross_margin, 0) / group.length).toFixed(1)),
        avgRevenueCagr: parseFloat((group.reduce((s, c) => s + c.revenue_cagr, 0) / group.length).toFixed(1)),
        avgMultiple: parseFloat((group.reduce((s, c) => s + c.valuation_multiple, 0) / group.length).toFixed(1)),
        count: group.length,
      };
    });

    return { avgYears, avgGuidance, avgMultiple, avgFirstDay, avgROE, avgRevenueCagr, avgGrossMargin, pathDist, sectorDist, yearsDist, multipleRanges, pathFinancials };
  }, []);

  const handleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortDesc(!sortDesc);
    else { setSortBy(col); setSortDesc(true); }
  };

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
            <TrendingUp className="w-5 h-5 text-green-400" />
            <h1 className="text-lg font-bold">历史转板案例数据库</h1>
          </div>
          <span className="text-sm text-gray-400">北交所 {transferCases.length} 家上市企业 · 新三板→北交所完整路径分析 · 数据来源：东方财富</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">

        {/* 核心统计卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {[
            { label: "已转板企业", value: `${transferCases.length}家`, sub: "北交所全量", color: "text-cyan-400" },
            { label: "平均挂牌年限", value: `${stats.avgYears.toFixed(1)}年`, sub: "新三板挂牌时长", color: "text-blue-400" },
            { label: "平均辅导时间", value: `${stats.avgGuidance.toFixed(0)}个月`, sub: "备案到上市", color: "text-purple-400" },
            { label: "平均估值提升", value: `${stats.avgMultiple.toFixed(1)}x`, sub: "新三板→北交所", color: "text-green-400" },
            { label: "平均首日涨幅", value: `${stats.avgFirstDay.toFixed(0)}%`, sub: "上市首日表现", color: "text-yellow-400" },
            { label: "转板前ROE均值", value: `${stats.avgROE.toFixed(1)}%`, sub: "盈利能力基准", color: "text-orange-400" },
            { label: "转板前毛利率", value: `${stats.avgGrossMargin.toFixed(1)}%`, sub: "行业均值", color: "text-pink-400" },
          ].map((item, i) => (
            <div key={i} className="bg-gray-900 rounded-xl p-4 border border-gray-800">
              <div className={`text-2xl font-bold ${item.color}`}>{item.value}</div>
              <div className="text-sm font-medium text-white mt-1">{item.label}</div>
              <div className="text-xs text-gray-500 mt-0.5">{item.sub}</div>
            </div>
          ))}
        </div>

        {/* Tab切换 */}
        <div className="flex gap-2 border-b border-gray-800">
          {[
            { key: "stats", label: "统计分析", icon: BarChart3 },
            { key: "list", label: "案例列表", icon: Building2 },
            { key: "timeline", label: "转板路径指南", icon: Target },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-cyan-400 text-cyan-400"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* 统计分析 Tab */}
        {activeTab === "stats" && (
          <div className="space-y-6">
            {/* 第一行：路径分布 + 行业分布 + 挂牌年数分布 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* 转板路径分布 */}
              <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
                <h3 className="text-sm font-semibold text-gray-300 mb-4">转板路径分布</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={stats.pathDist} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, value }) => `${name} ${value}`}>
                      {stats.pathDist.map((entry, index) => (
                        <Cell key={index} fill={PATH_COLORS[entry.name] || "#6b7280"} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-2 space-y-1">
                  {stats.pathDist.map(p => (
                    <div key={p.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PATH_COLORS[p.name] }}></div>
                        <span className="text-gray-300">{p.name}</span>
                      </div>
                      <span className="text-white font-medium">{p.value}家 ({(p.value / transferCases.length * 100).toFixed(0)}%)</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 行业分布 */}
              <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
                <h3 className="text-sm font-semibold text-gray-300 mb-4">行业分布与估值提升</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={stats.sectorDist} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} width={60} />
                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} />
                    <Bar dataKey="value" name="企业数" radius={[0, 4, 4, 0]}>
                      {stats.sectorDist.map((entry, index) => (
                        <Cell key={index} fill={SECTOR_COLORS[entry.name] || "#6b7280"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-2 space-y-1">
                  {stats.sectorDist.map(s => (
                    <div key={s.name} className="flex items-center justify-between text-xs">
                      <span className="text-gray-300">{s.name}</span>
                      <span className="text-white">{s.value}家 · 均值提升 <span className="text-green-400 font-medium">{s.avgMultiple}x</span></span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 新三板挂牌年数分布 */}
              <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
                <h3 className="text-sm font-semibold text-gray-300 mb-4">转板前新三板挂牌年限</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={stats.yearsDist}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} />
                    <Bar dataKey="value" name="企业数" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <p className="text-xs text-gray-500 mt-2">大多数企业在新三板挂牌 3-5 年后完成转板，平均 {stats.avgYears.toFixed(1)} 年</p>
              </div>
            </div>

            {/* 第二行：估值倍数分布 + 转板路径财务对比 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 估值倍数分布 */}
              <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
                <h3 className="text-sm font-semibold text-gray-300 mb-1">估值提升倍数分布</h3>
                <p className="text-xs text-gray-500 mb-4">新三板挂牌期估值 → 北交所当前市值的提升幅度</p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={stats.multipleRanges}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} />
                    <Bar dataKey="value" name="企业数" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-3 p-3 bg-green-900/20 rounded-lg border border-green-800/30">
                  <p className="text-xs text-green-300">
                    <strong>投资启示：</strong>约 {stats.multipleRanges.filter(r => r.name !== "1-2x").reduce((s, r) => s + r.value, 0)} 家企业（{(stats.multipleRanges.filter(r => r.name !== "1-2x").reduce((s, r) => s + r.value, 0) / transferCases.length * 100).toFixed(0)}%）实现了 2 倍以上的估值提升，平均提升 {stats.avgMultiple.toFixed(1)}x，说明在新三板阶段布局优质转板候选企业具有显著的资本利得空间。
                  </p>
                </div>
              </div>

              {/* 三条路径财务对比 */}
              <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
                <h3 className="text-sm font-semibold text-gray-300 mb-1">三条转板路径财务特征对比</h3>
                <p className="text-xs text-gray-500 mb-4">转板前一年的平均财务指标</p>
                <div className="space-y-4">
                  {stats.pathFinancials.map(pf => (
                    <div key={pf.path} className="p-3 rounded-lg border border-gray-700">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold" style={{ color: PATH_COLORS[pf.path] }}>{pf.path}路径</span>
                        <span className="text-xs text-gray-400">{pf.count}家 · 平均估值提升 <span className="text-green-400 font-medium">{pf.avgMultiple}x</span></span>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <div className="text-xs text-gray-500">ROE均值</div>
                          <div className="text-sm font-medium text-white">{pf.avgROE}%</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">毛利率均值</div>
                          <div className="text-sm font-medium text-white">{pf.avgGrossMargin}%</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">营收CAGR</div>
                          <div className="text-sm font-medium text-white">{pf.avgRevenueCagr}%</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 第三行：转板前财务门槛总结 */}
            <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
              <h3 className="text-sm font-semibold text-gray-300 mb-4">转板成功企业的财务特征画像（历史均值）</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                {[
                  { label: "营收规模", value: `${(transferCases.reduce((s, c) => s + c.revenue_at_listing, 0) / transferCases.length).toFixed(1)}亿`, desc: "上市前年营收均值", tip: "≥3000万是基本门槛" },
                  { label: "净利润", value: `${(transferCases.reduce((s, c) => s + c.net_profit_at_listing, 0) / transferCases.length).toFixed(2)}亿`, desc: "上市前净利润均值", tip: "盈利型路径≥1500万" },
                  { label: "毛利率", value: `${stats.avgGrossMargin.toFixed(1)}%`, desc: "行业综合均值", tip: "医疗>50%，科技>40%" },
                  { label: "ROE", value: `${stats.avgROE.toFixed(1)}%`, desc: "净资产收益率均值", tip: "≥8%是基本要求" },
                  { label: "营收CAGR", value: `${stats.avgRevenueCagr.toFixed(1)}%`, desc: "近3年复合增速", tip: "成长型路径≥30%" },
                  { label: "挂牌年限", value: `${stats.avgYears.toFixed(1)}年`, desc: "新三板挂牌时长", tip: "通常需要3-5年" },
                  { label: "辅导备案", value: `${stats.avgGuidance.toFixed(0)}月`, desc: "备案到上市时长", tip: "最快8个月，通常1-2年" },
                ].map((item, i) => (
                  <div key={i} className="p-3 bg-gray-800 rounded-lg">
                    <div className="text-lg font-bold text-cyan-400">{item.value}</div>
                    <div className="text-xs font-medium text-white mt-1">{item.label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{item.desc}</div>
                    <div className="text-xs text-yellow-400 mt-1">{item.tip}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 案例列表 Tab */}
        {activeTab === "list" && (
          <div className="space-y-4">
            {/* 筛选栏 */}
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索企业名称或代码..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
              {["全部", "医疗健康", "新能源", "人工智能"].map(s => (
                <button
                  key={s}
                  onClick={() => setSelectedSector(s)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    selectedSector === s ? "bg-cyan-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"
                  }`}
                >
                  {s}
                </button>
              ))}
              {["全部", "盈利型", "成长型", "市值型"].map(p => (
                <button
                  key={p}
                  onClick={() => setSelectedPath(p)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    selectedPath === p
                      ? "text-white"
                      : "bg-gray-800 text-gray-400 hover:text-white"
                  }`}
                  style={selectedPath === p && p !== "全部" ? { backgroundColor: PATH_COLORS[p] } : {}}
                >
                  {p}
                </button>
              ))}
              <span className="text-sm text-gray-400 ml-auto">共 {filteredCases.length} 家</span>
            </div>

            {/* 表格 */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 bg-gray-800/50">
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">企业</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">行业/路径</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">转板时间</th>
                    <th
                      className="text-right px-4 py-3 text-gray-400 font-medium cursor-pointer hover:text-white"
                      onClick={() => handleSort("neeq_years")}
                    >
                      挂牌年限 {sortBy === "neeq_years" ? (sortDesc ? "↓" : "↑") : ""}
                    </th>
                    <th className="text-right px-4 py-3 text-gray-400 font-medium">转板前ROE</th>
                    <th className="text-right px-4 py-3 text-gray-400 font-medium">转板前毛利率</th>
                    <th
                      className="text-right px-4 py-3 text-gray-400 font-medium cursor-pointer hover:text-white"
                      onClick={() => handleSort("valuation_multiple")}
                    >
                      估值提升 {sortBy === "valuation_multiple" ? (sortDesc ? "↓" : "↑") : ""}
                    </th>
                    <th
                      className="text-right px-4 py-3 text-gray-400 font-medium cursor-pointer hover:text-white"
                      onClick={() => handleSort("first_day_gain")}
                    >
                      首日涨幅 {sortBy === "first_day_gain" ? (sortDesc ? "↓" : "↑") : ""}
                    </th>
                    <th
                      className="text-right px-4 py-3 text-gray-400 font-medium cursor-pointer hover:text-white"
                      onClick={() => handleSort("bj_market_cap")}
                    >
                      当前市值 {sortBy === "bj_market_cap" ? (sortDesc ? "↓" : "↑") : ""}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCases.slice(0, 50).map((c, i) => (
                    <>
                      <tr
                        key={c.bj_code}
                        className="border-b border-gray-800/50 hover:bg-gray-800/30 cursor-pointer transition-colors"
                        onClick={() => setExpandedCase(expandedCase === c.bj_code ? null : c.bj_code)}
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium text-white">{c.name}</div>
                          <div className="text-xs text-gray-500">{c.bj_code} · 原 {c.neeq_code}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded text-xs font-medium mr-1" style={{ backgroundColor: `${SECTOR_COLORS[c.sector]}20`, color: SECTOR_COLORS[c.sector] }}>
                            {c.sector}
                          </span>
                          <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ backgroundColor: `${PATH_COLORS[c.transfer_path]}20`, color: PATH_COLORS[c.transfer_path] }}>
                            {c.transfer_path}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-300 text-xs">
                          <div>{c.bj_listing_date}</div>
                          <div className="text-gray-500">辅导 {c.guidance_months} 个月</div>
                        </td>
                        <td className="px-4 py-3 text-right text-white">{c.neeq_years}年</td>
                        <td className="px-4 py-3 text-right text-green-400">{c.roe_at_listing}%</td>
                        <td className="px-4 py-3 text-right text-blue-400">{c.gross_margin}%</td>
                        <td className="px-4 py-3 text-right font-bold text-yellow-400">{c.valuation_multiple}x</td>
                        <td className="px-4 py-3 text-right text-green-400">+{c.first_day_gain}%</td>
                        <td className="px-4 py-3 text-right text-white">{c.bj_market_cap > 0 ? `${c.bj_market_cap}亿` : '-'}</td>
                      </tr>
                      {expandedCase === c.bj_code && (
                        <tr key={`${c.bj_code}-detail`} className="bg-gray-800/30">
                          <td colSpan={9} className="px-4 py-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div>
                                <div className="text-xs text-gray-500 mb-1">转板路径说明</div>
                                <div className="text-sm text-white">{c.path_desc}</div>
                              </div>
                              <div>
                                <div className="text-xs text-gray-500 mb-1">转板前营收</div>
                                <div className="text-sm text-white">{c.revenue_at_listing}亿 · CAGR {c.revenue_cagr}%</div>
                              </div>
                              <div>
                                <div className="text-xs text-gray-500 mb-1">发行价 / 当前价</div>
                                <div className="text-sm text-white">¥{c.issue_price} → ¥{c.bj_current_price}</div>
                              </div>
                              <div>
                                <div className="text-xs text-gray-500 mb-1">北交所 PE / PB</div>
                                <div className="text-sm text-white">{c.bj_pe ? `PE ${c.bj_pe}x` : 'PE 亏损'} · {c.bj_pb ? `PB ${c.bj_pb}x` : '-'}</div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
              {filteredCases.length > 50 && (
                <div className="px-4 py-3 text-center text-sm text-gray-500 border-t border-gray-800">
                  显示前50条，共 {filteredCases.length} 条 · 请使用筛选缩小范围
                </div>
              )}
            </div>
          </div>
        )}

        {/* 转板路径指南 Tab */}
        {activeTab === "timeline" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  path: "盈利型",
                  color: "#10b981",
                  icon: "💰",
                  title: "盈利型路径",
                  subtitle: "最主流，占比87%",
                  conditions: [
                    "最近2年净利润均≥1500万元",
                    "最近2年净利润合计≥3000万元",
                    "ROE ≥ 8%（加权平均）",
                    "无重大违规记录",
                  ],
                  financials: stats.pathFinancials.find(p => p.path === "盈利型"),
                  tips: "适合财务稳健、持续盈利的传统行业企业。这条路径要求最明确，审核通过率也最高。",
                },
                {
                  path: "成长型",
                  color: "#6366f1",
                  icon: "🚀",
                  title: "成长型路径",
                  subtitle: "高增速企业，占比7%",
                  conditions: [
                    "最近2年营收CAGR ≥ 30%",
                    "最近1年营收 ≥ 3000万元",
                    "市值 ≥ 2亿元",
                    "最近1年净利润为正",
                  ],
                  financials: stats.pathFinancials.find(p => p.path === "成长型"),
                  tips: "适合高速增长但尚未稳定盈利的科技类企业。增速要求严格，但对绝对利润要求较低。",
                },
                {
                  path: "市值型",
                  color: "#f59e0b",
                  icon: "🏆",
                  title: "市值型路径",
                  subtitle: "大市值企业，占比6%",
                  conditions: [
                    "市值 ≥ 4亿元",
                    "最近2年营收合计 ≥ 1亿元",
                    "最近1年营收 ≥ 5000万元",
                    "持续经营能力强",
                  ],
                  financials: stats.pathFinancials.find(p => p.path === "市值型"),
                  tips: "适合市值较大但利润波动的企业。市值要求是核心，通常需要有较强的市场认可度。",
                },
              ].map(item => (
                <div key={item.path} className="bg-gray-900 rounded-xl p-5 border border-gray-800">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl">{item.icon}</span>
                    <div>
                      <div className="font-bold text-white">{item.title}</div>
                      <div className="text-xs text-gray-400">{item.subtitle}</div>
                    </div>
                  </div>
                  <div className="mb-4">
                    <div className="text-xs text-gray-500 mb-2 font-medium">上市条件</div>
                    <ul className="space-y-1.5">
                      {item.conditions.map((c, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-gray-300">
                          <span className="mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }}></span>
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {item.financials && (
                    <div className="p-3 rounded-lg mb-3" style={{ backgroundColor: `${item.color}10`, border: `1px solid ${item.color}30` }}>
                      <div className="text-xs font-medium mb-2" style={{ color: item.color }}>历史成功案例财务均值</div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div><span className="text-gray-500">ROE：</span><span className="text-white">{item.financials.avgROE}%</span></div>
                        <div><span className="text-gray-500">毛利率：</span><span className="text-white">{item.financials.avgGrossMargin}%</span></div>
                        <div><span className="text-gray-500">营收CAGR：</span><span className="text-white">{item.financials.avgRevenueCagr}%</span></div>
                        <div><span className="text-gray-500">估值提升：</span><span className="text-green-400 font-medium">{item.financials.avgMultiple}x</span></div>
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-gray-400">{item.tips}</p>
                </div>
              ))}
            </div>

            {/* 转板时间线 */}
            <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
              <h3 className="text-sm font-semibold text-gray-300 mb-5">新三板→北交所转板标准时间线</h3>
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-700"></div>
                {[
                  { phase: "新三板挂牌", time: "第1年", color: "#6366f1", desc: "完成股改、在全国股转系统挂牌，建立规范的公司治理结构，开始做市或协议转让交易。" },
                  { phase: "持续督导期", time: "第2-3年", color: "#8b5cf6", desc: "由主办券商持续督导，规范信息披露，完善内控制度，积累连续经营记录（通常需要2年以上）。" },
                  { phase: "辅导备案", time: "第3-4年", color: "#a78bfa", desc: "向证监局提交辅导备案申请，由保荐机构开展上市辅导，平均辅导期约16个月。" },
                  { phase: "申报材料", time: "第4-5年", color: "#c4b5fd", desc: "向北交所提交上市申请，经历问询、审核、注册等流程，从受理到注册通常需要6-18个月。" },
                  { phase: "北交所上市", time: "第4-6年", color: "#10b981", desc: "完成发行上市，股票代码变更为920xxx，享受北交所的流动性溢价，估值平均提升3.9倍。" },
                ].map((step, i) => (
                  <div key={i} className="relative pl-12 pb-6">
                    <div className="absolute left-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: step.color }}>
                      {i + 1}
                    </div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-semibold text-white">{step.phase}</span>
                      <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: `${step.color}20`, color: step.color }}>{step.time}</span>
                    </div>
                    <p className="text-sm text-gray-400">{step.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
