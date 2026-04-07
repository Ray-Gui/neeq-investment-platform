import { useState } from "react";
import { Link } from "wouter";
import {
  ArrowRight,
  TrendingUp,
  Zap,
  Brain,
  BarChart3,
  Shield,
  Search,
  LineChart,
  Target,
  AlertTriangle,
  BookOpen,
  Scale,
  History,
  GitCompare,
  Activity,
  Layers,
  ChevronRight,
} from "lucide-react";

// ─── 功能模块数据 ────────────────────────────────────────────────────────────

const MODULES = {
  enterprise: {
    label: "企业数据库",
    icon: Search,
    color: "cyan",
    desc: "搜索、筛选、查看企业详情",
    items: [
      {
        href: "/neeq",
        icon: "🏢",
        title: "新三板企业库",
        desc: "医疗健康 386家 · 新能源 159家 · 人工智能 1342家",
        tags: ["多维筛选", "财务数据", "企业详情"],
        color: "cyan",
      },
      {
        href: "/bse",
        icon: "📋",
        title: "北交所上市企业",
        desc: "298家已上市企业 · 首日涨幅 +81.9% · 一年均值 +43.5%",
        tags: ["融资历程", "上市表现", "估值分析"],
        color: "blue",
      },
    ],
  },
  analysis: {
    label: "财务分析",
    icon: BarChart3,
    color: "green",
    desc: "多维度财务数据分析与对标",
    items: [
      {
        href: "/financial",
        icon: "📊",
        title: "财务分析",
        desc: "多公司横向对比 · 行业均值对标 · 三年趋势展示",
        tags: ["对标分析", "行业基准", "趋势图"],
        color: "green",
      },
      {
        href: "/trend-rating",
        icon: "📈",
        title: "三年财务趋势评级",
        desc: "1850家企业 · CAGR分级 · 盈利改善评分 · 现金流质量",
        tags: ["CAGR", "盈利改善", "现金流"],
        color: "teal",
      },
      {
        href: "/industry-benchmark",
        icon: "🎯",
        title: "行业对标分析",
        desc: "1887家企业 · P10–P90分位排名 · 行业龙头 vs 尾部",
        tags: ["分位数", "行业排名", "景气趋势"],
        color: "orange",
      },
      {
        href: "/scoring",
        icon: "⭐",
        title: "综合评分系统",
        desc: "五维度评分 · 盈利/成长/稳健/市场/风险",
        tags: ["综合评分", "投资建议", "雷达图"],
        color: "purple",
      },
    ],
  },
  market_making: {
    label: "做市决策",
    icon: Target,
    color: "yellow",
    desc: "做市业务核心决策支持工具",
    items: [
      {
        href: "/dealer-opportunities",
        icon: "💡",
        title: "做市机会识别",
        desc: "流动性评分 · 价差空间 · 套利机会筛选",
        tags: ["流动性", "套利机会", "优先级"],
        color: "yellow",
      },
      {
        href: "/spread-analysis",
        icon: "📐",
        title: "做市价差分析仪",
        desc: "1887家企业 · 价差空间估算 · 竞争程度评估",
        tags: ["价差估算", "竞争格局", "做市机会"],
        color: "amber",
      },
      {
        href: "/liquidity-score",
        icon: "💧",
        title: "流动性评分体系",
        desc: "1887家企业 · 五维度流动性评分 · 做市机会识别",
        tags: ["流动性等级", "五维评分", "退市预警"],
        color: "sky",
      },
      {
        href: "/inventory-risk",
        icon: "🛡️",
        title: "库存风险监控",
        desc: "1887家企业 · 退市风险评分 · Beta估算 · 连亏预警",
        tags: ["退市风险", "Beta", "连亏预警"],
        color: "red",
      },
      {
        href: "/investment-decision",
        icon: "🎯",
        title: "投资决策系统",
        desc: "综合投资建议 · 组合配置 · 买入/持有/卖出信号",
        tags: ["投资建议", "组合配置", "信号"],
        color: "pink",
      },
      {
        href: "/fair-value",
        icon: "⚖️",
        title: "公允价值定价模型",
        desc: "PE/PB/PS三法估值 · 可比公司法 · 做市报价区间建议",
        tags: ["三法估值", "可比公司", "报价区间"],
        color: "gold",
      },
    ],
  },
  listing: {
    label: "转板研究",
    icon: TrendingUp,
    color: "emerald",
    desc: "北交所转板路径分析与套利研究",
    items: [
      {
        href: "/bse-listing-tracker",
        icon: "🚀",
        title: "北交所转板追踪",
        desc: "844家候选企业 · 盈利/成长/市值三条路径 · 趋势评级",
        tags: ["三条路径", "趋势评级", "候选筛选"],
        color: "emerald",
      },
      {
        href: "/listing-potential",
        icon: "🌟",
        title: "上市潜力评估",
        desc: "转板概率模型 · 上市时间预测 · IPO估价",
        tags: ["转板概率", "时间预测", "IPO估价"],
        color: "lime",
      },
      {
        href: "/transfer-cases",
        icon: "📚",
        title: "历史转板案例数据库",
        desc: "北交所全量企业 · 转板前财务画像 · 估值提升统计",
        tags: ["历史案例", "财务画像", "估值提升"],
        color: "green",
      },
      {
        href: "/a-stock-benchmark",
        icon: "🔗",
        title: "A股可比公司对标",
        desc: "三大行业A股估值参考 · 动态折价率 · 行业景气度",
        tags: ["折价率", "PE/PB/PS", "景气度"],
        color: "indigo",
      },
    ],
  },
  compliance: {
    label: "合规管理",
    icon: Shield,
    color: "blue",
    desc: "监管制度全文与合规自查工具",
    items: [
      {
        href: "/compliance",
        icon: "📜",
        title: "合规管理库",
        desc: "10部监管制度全文 · 关键词检索 · 15项合规自查清单",
        tags: ["做市规则", "信息披露", "北交所转板"],
        color: "blue",
      },
    ],
  },
};

type ModuleKey = keyof typeof MODULES;

// ─── 颜色映射 ────────────────────────────────────────────────────────────────

const colorMap: Record<string, { bg: string; border: string; text: string; tag: string; tagText: string }> = {
  cyan:    { bg: "bg-cyan-500/10",    border: "border-cyan-500/30",    text: "text-cyan-400",    tag: "bg-cyan-500/20",    tagText: "text-cyan-300" },
  blue:    { bg: "bg-blue-500/10",    border: "border-blue-500/30",    text: "text-blue-400",    tag: "bg-blue-500/20",    tagText: "text-blue-300" },
  green:   { bg: "bg-green-500/10",   border: "border-green-500/30",   text: "text-green-400",   tag: "bg-green-500/20",   tagText: "text-green-300" },
  teal:    { bg: "bg-teal-500/10",    border: "border-teal-500/30",    text: "text-teal-400",    tag: "bg-teal-500/20",    tagText: "text-teal-300" },
  orange:  { bg: "bg-orange-500/10",  border: "border-orange-500/30",  text: "text-orange-400",  tag: "bg-orange-500/20",  tagText: "text-orange-300" },
  purple:  { bg: "bg-purple-500/10",  border: "border-purple-500/30",  text: "text-purple-400",  tag: "bg-purple-500/20",  tagText: "text-purple-300" },
  yellow:  { bg: "bg-yellow-500/10",  border: "border-yellow-500/30",  text: "text-yellow-400",  tag: "bg-yellow-500/20",  tagText: "text-yellow-300" },
  amber:   { bg: "bg-amber-500/10",   border: "border-amber-500/30",   text: "text-amber-400",   tag: "bg-amber-500/20",   tagText: "text-amber-300" },
  sky:     { bg: "bg-sky-500/10",     border: "border-sky-500/30",     text: "text-sky-400",     tag: "bg-sky-500/20",     tagText: "text-sky-300" },
  red:     { bg: "bg-red-500/10",     border: "border-red-500/30",     text: "text-red-400",     tag: "bg-red-500/20",     tagText: "text-red-300" },
  pink:    { bg: "bg-pink-500/10",    border: "border-pink-500/30",    text: "text-pink-400",    tag: "bg-pink-500/20",    tagText: "text-pink-300" },
  gold:    { bg: "bg-yellow-600/10",  border: "border-yellow-600/30",  text: "text-yellow-500",  tag: "bg-yellow-600/20",  tagText: "text-yellow-400" },
  emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400", tag: "bg-emerald-500/20", tagText: "text-emerald-300" },
  lime:    { bg: "bg-lime-500/10",    border: "border-lime-500/30",    text: "text-lime-400",    tag: "bg-lime-500/20",    tagText: "text-lime-300" },
  indigo:  { bg: "bg-indigo-500/10",  border: "border-indigo-500/30",  text: "text-indigo-400",  tag: "bg-indigo-500/20",  tagText: "text-indigo-300" },
};

const navColorMap: Record<string, { active: string; hover: string; icon: string; dot: string }> = {
  cyan:    { active: "bg-cyan-500/20 text-cyan-300 border-l-2 border-cyan-400",    hover: "hover:bg-cyan-500/10 hover:text-cyan-300",    icon: "text-cyan-400",    dot: "bg-cyan-400" },
  green:   { active: "bg-green-500/20 text-green-300 border-l-2 border-green-400", hover: "hover:bg-green-500/10 hover:text-green-300",  icon: "text-green-400",   dot: "bg-green-400" },
  yellow:  { active: "bg-yellow-500/20 text-yellow-300 border-l-2 border-yellow-400", hover: "hover:bg-yellow-500/10 hover:text-yellow-300", icon: "text-yellow-400", dot: "bg-yellow-400" },
  emerald: { active: "bg-emerald-500/20 text-emerald-300 border-l-2 border-emerald-400", hover: "hover:bg-emerald-500/10 hover:text-emerald-300", icon: "text-emerald-400", dot: "bg-emerald-400" },
  blue:    { active: "bg-blue-500/20 text-blue-300 border-l-2 border-blue-400",    hover: "hover:bg-blue-500/10 hover:text-blue-300",    icon: "text-blue-400",    dot: "bg-blue-400" },
};

// ─── 主组件 ──────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [activeSection, setActiveSection] = useState<ModuleKey>("enterprise");

  const section = MODULES[activeSection];
  const navColor = navColorMap[section.color] || navColorMap["cyan"];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex flex-col">
      {/* ── Header ── */}
      <header className="border-b border-slate-700/50 sticky top-0 z-50 bg-slate-950/95 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <BarChart3 size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white leading-tight">投资研究平台</h1>
              <p className="text-xs text-gray-500">新三板做市商投资决策支持系统</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Activity size={12} className="text-green-400" />
            <span>数据截至 2026年3月</span>
          </div>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 container mx-auto px-6 py-8 gap-8">

        {/* ── 左侧导航 ── */}
        <aside className="w-56 flex-shrink-0">
          <nav className="sticky top-24 space-y-1">
            {(Object.entries(MODULES) as [ModuleKey, typeof MODULES[ModuleKey]][]).map(([key, mod]) => {
              const nc = navColorMap[mod.color] || navColorMap["cyan"];
              const isActive = activeSection === key;
              const Icon = mod.icon;
              return (
                <button
                  key={key}
                  onClick={() => setActiveSection(key)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all text-sm font-medium ${
                    isActive
                      ? nc.active
                      : `text-gray-400 ${nc.hover}`
                  }`}
                >
                  <Icon size={16} className={isActive ? nc.icon : "text-gray-500"} />
                  <span>{mod.label}</span>
                  {isActive && <ChevronRight size={14} className={`ml-auto ${nc.icon}`} />}
                </button>
              );
            })}
          </nav>

          {/* 平台统计 */}
          <div className="mt-8 p-4 rounded-xl bg-slate-800/40 border border-slate-700/50">
            <p className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wider">平台数据</p>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">新三板企业</span>
                <span className="text-white font-semibold">1,887 家</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">北交所企业</span>
                <span className="text-white font-semibold">298 家</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">功能模块</span>
                <span className="text-white font-semibold">18 个</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">监管制度</span>
                <span className="text-white font-semibold">10 部</span>
              </div>
            </div>
          </div>
        </aside>

        {/* ── 右侧内容区 ── */}
        <main className="flex-1 min-w-0">
          {/* 分区标题 */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-1">
              {(() => { const Icon = section.icon; return <Icon size={22} className={navColor.icon} />; })()}
              <h2 className="text-2xl font-bold text-white">{section.label}</h2>
            </div>
            <p className="text-gray-400 text-sm ml-9">{section.desc}</p>
          </div>

          {/* 功能卡片网格 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {section.items.map((item) => {
              const c = colorMap[item.color] || colorMap["cyan"];
              return (
                <Link key={item.href} href={item.href}>
                  <a className={`flex flex-col p-5 rounded-xl border ${c.bg} ${c.border} hover:brightness-125 transition-all group cursor-pointer`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{item.icon}</span>
                        <h3 className="font-semibold text-white text-base">{item.title}</h3>
                      </div>
                      <ArrowRight size={16} className={`${c.text} group-hover:translate-x-1 transition-transform flex-shrink-0 mt-1`} />
                    </div>
                    <p className="text-sm text-gray-400 mb-3 leading-relaxed">{item.desc}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {item.tags.map((tag) => (
                        <span key={tag} className={`text-xs px-2 py-0.5 rounded-full ${c.tag} ${c.tagText}`}>{tag}</span>
                      ))}
                    </div>
                  </a>
                </Link>
              );
            })}
          </div>

          {/* 路线图（仅在合规管理分区下方显示） */}
          {activeSection === "compliance" && (
            <div className="mt-8 p-6 rounded-xl bg-slate-800/30 border border-slate-700/50">
              <div className="flex items-center gap-2 mb-4">
                <Layers size={16} className="text-gray-400" />
                <h3 className="text-base font-semibold text-white">平台路线图</h3>
                <span className="text-xs text-gray-500 ml-1">下一阶段待开发功能</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { q: "Q2", color: "cyan",   title: "股权结构分析",   desc: "控股股东持股比例、机构持股、限售股解禁时间表" },
                  { q: "Q2", color: "green",  title: "定增融资追踪",   desc: "历次定向增发价格、融资金额、认购方背景分析" },
                  { q: "Q3", color: "purple", title: "关联公司网络",   desc: "识别上市公司子公司/关联方，挖掘资产注入预期" },
                  { q: "Q3", color: "yellow", title: "实时行情接入",   desc: "接入新三板实时成交数据，计算真实买卖价差和换手率" },
                  { q: "Q4", color: "red",    title: "辅导备案监控",   desc: "自动追踪证监会辅导备案公告，识别转板预期标的" },
                  { q: "Q4", color: "orange", title: "投资组合管理",   desc: "做市库存组合风险敞口监控、行业集中度预警" },
                ].map((item) => {
                  const c = colorMap[item.color] || colorMap["cyan"];
                  return (
                    <div key={item.title} className="flex gap-3 p-3 rounded-lg bg-slate-700/30 border border-slate-600/40">
                      <div className={`flex-shrink-0 w-7 h-7 rounded-full ${c.tag} flex items-center justify-center ${c.text} font-semibold text-xs`}>{item.q}</div>
                      <div>
                        <h4 className="font-medium text-white text-sm mb-0.5">{item.title}</h4>
                        <p className="text-xs text-gray-400 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-700/30 py-5 bg-slate-950/50">
        <div className="container mx-auto px-6 text-center text-gray-600 text-xs">
          新三板做市商投资研究平台 · 数据截至 2026年3月 · 仅供内部研究参考
        </div>
      </footer>
    </div>
  );
}
