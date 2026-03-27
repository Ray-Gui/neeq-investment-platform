import { useState } from "react";
import { Link } from "wouter";
import { ArrowRight, TrendingUp, Zap, Brain, BarChart3, Users } from "lucide-react";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<"bse" | "neeq">("bse");

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700/50 sticky top-0 z-50 bg-slate-900/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <span className="text-white text-lg font-bold">📊</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">投资研究平台</h1>
              <p className="text-sm text-gray-400">新三板做市商投资决策支持系统</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        {/* Tab Navigation */}
        <div className="flex gap-4 mb-12 border-b border-slate-700">
          <button
            onClick={() => setActiveTab("bse")}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === "bse"
                ? "text-cyan-400 border-b-2 border-cyan-400"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            🏢 北交所上市企业
          </button>
          <button
            onClick={() => setActiveTab("neeq")}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === "neeq"
                ? "text-cyan-400 border-b-2 border-cyan-400"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            📈 新三板企业库
          </button>
        </div>

        {/* BSE Section */}
        {activeTab === "bse" && (
          <div className="space-y-8">
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700 rounded-xl p-8">
              <h2 className="text-3xl font-bold text-white mb-4">北交所上市企业研究</h2>
              <p className="text-gray-400 mb-6">
                深度分析北交所已上市企业的财务表现、融资历程、上市表现等多个维度，为投资决策提供数据支持。
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <BarChart3 className="text-cyan-400" size={20} />
                    <span className="text-gray-400 text-sm">已上市企业</span>
                  </div>
                  <p className="text-2xl font-bold text-white">298+</p>
                </div>
                <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <TrendingUp className="text-green-400" size={20} />
                    <span className="text-gray-400 text-sm">平均涨幅</span>
                  </div>
                  <p className="text-2xl font-bold text-green-400">+43.5%</p>
                </div>
                <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Zap className="text-yellow-400" size={20} />
                    <span className="text-gray-400 text-sm">首日涨幅</span>
                  </div>
                  <p className="text-2xl font-bold text-yellow-400">+80.1%</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link href="/bse">
                  <a className="flex items-center justify-between p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg hover:bg-cyan-500/20 transition-colors group">
                    <div>
                      <h3 className="font-semibold text-white mb-1">完整研究报告</h3>
                      <p className="text-sm text-gray-400">9 个分析维度，298 家企业数据</p>
                    </div>
                    <ArrowRight className="text-cyan-400 group-hover:translate-x-1 transition-transform" size={20} />
                  </a>
                </Link>
                <Link href="/bse">
                  <a className="flex items-center justify-between p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg hover:bg-blue-500/20 transition-colors group">
                    <div>
                      <h3 className="font-semibold text-white mb-1">数据分析工具</h3>
                      <p className="text-sm text-gray-400">融资、估值、上市表现分析</p>
                    </div>
                    <ArrowRight className="text-blue-400 group-hover:translate-x-1 transition-transform" size={20} />
                  </a>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* NEEQ Section */}
        {activeTab === "neeq" && (
          <div className="space-y-8">
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700 rounded-xl p-8">
              <h2 className="text-3xl font-bold text-white mb-4">新三板企业投资库</h2>
              <p className="text-gray-400 mb-6">
                专注医疗健康、新能源、人工智能三大领域的新三板企业，提供完整的企业数据、财务分析和投资评分，助力做市商精准投资决策。
              </p>

              {/* Industry Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border border-cyan-500/30 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                      <span className="text-2xl">🏥</span>
                    </div>
                    <h3 className="font-semibold text-white">医疗健康</h3>
                  </div>
                  <p className="text-2xl font-bold text-cyan-400 mb-2">674 家</p>
                  <p className="text-sm text-gray-400">医疗服务、医疗器械、生物医药</p>
                </div>

                <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/30 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                      <span className="text-2xl">⚡</span>
                    </div>
                    <h3 className="font-semibold text-white">新能源</h3>
                  </div>
                  <p className="text-2xl font-bold text-green-400 mb-2">350 家</p>
                  <p className="text-sm text-gray-400">光伏、风电、储能、充电桩</p>
                </div>

                <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/30 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                      <span className="text-2xl">🤖</span>
                    </div>
                    <h3 className="font-semibold text-white">人工智能</h3>
                  </div>
                  <p className="text-2xl font-bold text-purple-400 mb-2">280 家</p>
                  <p className="text-sm text-gray-400">AI 基础设施、软件、芯片</p>
                </div>
              </div>

              {/* Feature Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-6">
                  <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                    <Users size={20} className="text-cyan-400" />
                    企业搜索和筛选
                  </h3>
                  <p className="text-sm text-gray-400 mb-4">
                    按行业领域、上市状态、地区等多维度筛选企业，快速定位目标投资对象。
                  </p>
                  <ul className="text-xs text-gray-500 space-y-1">
                    <li>✓ 按行业领域筛选</li>
                    <li>✓ 按上市状态筛选</li>
                    <li>✓ 企业名称/代码搜索</li>
                  </ul>
                </div>

                <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-6">
                  <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                    <BarChart3 size={20} className="text-green-400" />
                    财务分析工具
                  </h3>
                  <p className="text-sm text-gray-400 mb-4">
                    对标分析、趋势分析、关键指标展示，全面评估企业财务状况。
                  </p>
                  <ul className="text-xs text-gray-500 space-y-1">
                    <li>✓ 多企业对标分析</li>
                    <li>✓ 3 年财务趋势</li>
                    <li>✓ 关键指标对比</li>
                  </ul>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link href="/neeq">
                  <a className="flex items-center justify-between p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg hover:bg-cyan-500/20 transition-colors group">
                    <div>
                      <h3 className="font-semibold text-white mb-1">企业库</h3>
                      <p className="text-sm text-gray-400">搜索、筛选、查看企业详情</p>
                    </div>
                    <ArrowRight className="text-cyan-400 group-hover:translate-x-1 transition-transform" size={20} />
                  </a>
                </Link>
                <Link href="/financial">
                  <a className="flex items-center justify-between p-4 bg-green-500/10 border border-green-500/30 rounded-lg hover:bg-green-500/20 transition-colors group">
                    <div>
                      <h3 className="font-semibold text-white mb-1">财务分析</h3>
                      <p className="text-sm text-gray-400">对标分析、趋势展示</p>
                    </div>
                    <ArrowRight className="text-green-400 group-hover:translate-x-1 transition-transform" size={20} />
                  </a>
                </Link>
                <Link href="/scoring">
                  <a className="flex items-center justify-between p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg hover:bg-purple-500/20 transition-colors group">
                    <div>
                      <h3 className="font-semibold text-white mb-1">评分系统</h3>
                      <p className="text-sm text-gray-400">多维度评分、投资建议</p>
                    </div>
                    <ArrowRight className="text-purple-400 group-hover:translate-x-1 transition-transform" size={20} />
                  </a>
                </Link>
              </div>

              {/* 深化研究功能 */}
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-white mb-4">深化研究工具</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Link href="/listing-potential">
                    <a className="flex items-center justify-between p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg hover:bg-blue-500/20 transition-colors group">
                      <div>
                        <h3 className="font-semibold text-white mb-1">上市潜力</h3>
                        <p className="text-sm text-gray-400">上市时间和表现预测</p>
                      </div>
                      <ArrowRight className="text-blue-400 group-hover:translate-x-1 transition-transform" size={20} />
                    </a>
                  </Link>
                  <Link href="/dealer-opportunities">
                    <a className="flex items-center justify-between p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-lg hover:bg-indigo-500/20 transition-colors group">
                      <div>
                        <h3 className="font-semibold text-white mb-1">做市机会</h3>
                        <p className="text-sm text-gray-400">流动性和套利机会识别</p>
                      </div>
                      <ArrowRight className="text-indigo-400 group-hover:translate-x-1 transition-transform" size={20} />
                    </a>
                  </Link>
                  <Link href="/investment-decision">
                    <a className="flex items-center justify-between p-4 bg-pink-500/10 border border-pink-500/30 rounded-lg hover:bg-pink-500/20 transition-colors group">
                      <div>
                        <h3 className="font-semibold text-white mb-1">投资决策</h3>
                        <p className="text-sm text-gray-400">综合投资建议和组合配置</p>
                      </div>
                      <ArrowRight className="text-pink-400 group-hover:translate-x-1 transition-transform" size={20} />
                    </a>
                  </Link>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-8">
              <h3 className="text-xl font-bold text-white mb-4">🚀 后续规划</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-semibold">1</div>
                  <div>
                    <h4 className="font-semibold text-white mb-1">企业评分系统</h4>
                    <p className="text-sm text-gray-400">多维度评分，识别优质投资标的</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 font-semibold">2</div>
                  <div>
                    <h4 className="font-semibold text-white mb-1">上市潜力评估</h4>
                    <p className="text-sm text-gray-400">预测上市可能性和时间窗口</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-semibold">3</div>
                  <div>
                    <h4 className="font-semibold text-white mb-1">做市商机会识别</h4>
                    <p className="text-sm text-gray-400">识别流动性机会和交易机会</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-400 font-semibold">4</div>
                  <div>
                    <h4 className="font-semibold text-white mb-1">投资决策支持</h4>
                    <p className="text-sm text-gray-400">综合评分和投资建议</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-700/50 mt-16 py-8 bg-slate-900/50">
        <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
          <p>新三板做市商投资研究平台 · 数据截至 2026年3月</p>
        </div>
      </footer>
    </div>
  );
}
