import { useState, useMemo } from 'react';
import { ArrowLeft, Shield, Search, BookOpen, CheckSquare, AlertTriangle, ChevronDown, ChevronRight, FileText, Clock, Tag } from 'lucide-react';
import { regulations, complianceChecklist, regulationCategories, type Regulation, type RegulationArticle } from '../data/compliance-regulations';

// ============================================================
// 子组件：制度卡片
// ============================================================
function RegulationCard({ reg, onSelect }: { reg: Regulation; onSelect: (r: Regulation) => void }) {
  const statusColor = reg.status === 'active' ? 'text-green-400 bg-green-400/10' : reg.status === 'amended' ? 'text-yellow-400 bg-yellow-400/10' : 'text-gray-400 bg-gray-400/10';
  const statusLabel = reg.status === 'active' ? '现行有效' : reg.status === 'amended' ? '已修订' : '已废止';

  return (
    <div
      className="bg-[#1a2535] border border-[#2a3a4f] rounded-xl p-5 cursor-pointer hover:border-blue-500/50 hover:bg-[#1e2d42] transition-all"
      onClick={() => onSelect(reg)}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1">
          <h3 className="text-white font-semibold text-sm leading-snug mb-1">{reg.title}</h3>
          <p className="text-gray-400 text-xs">{reg.issuer}</p>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${statusColor}`}>{statusLabel}</span>
      </div>
      <div className="flex flex-wrap gap-2 mb-3">
        <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">{reg.category}</span>
        <span className="text-xs text-gray-500">{reg.docNumber}</span>
      </div>
      <p className="text-gray-400 text-xs leading-relaxed line-clamp-2">{reg.summary}</p>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#2a3a4f]">
        <span className="text-xs text-gray-500">发布：{reg.issueDate} &nbsp;|&nbsp; 生效：{reg.effectiveDate}</span>
        <span className="text-xs text-blue-400 flex items-center gap-1">{reg.articles.length}条款 <ChevronRight size={12} /></span>
      </div>
    </div>
  );
}

// ============================================================
// 子组件：制度详情面板
// ============================================================
function RegulationDetail({ reg, onBack, searchKeyword }: { reg: Regulation; onBack: () => void; searchKeyword: string }) {
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null);

  const highlight = (text: string) => {
    if (!searchKeyword) return text;
    const parts = text.split(new RegExp(`(${searchKeyword})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === searchKeyword.toLowerCase()
        ? `<mark class="bg-yellow-400/30 text-yellow-300 rounded px-0.5">${part}</mark>`
        : part
    ).join('');
  };

  return (
    <div className="bg-[#1a2535] border border-[#2a3a4f] rounded-xl overflow-hidden">
      {/* 头部 */}
      <div className="p-5 border-b border-[#2a3a4f]">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-4 transition-colors">
          <ArrowLeft size={14} /> 返回制度列表
        </button>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-white font-bold text-base leading-snug mb-2">{reg.title}</h2>
            <div className="flex flex-wrap gap-2 text-xs text-gray-400">
              <span>发布机构：{reg.issuer}</span>
              <span>·</span>
              <span>文号：{reg.docNumber}</span>
              <span>·</span>
              <span>发布：{reg.issueDate}</span>
              <span>·</span>
              <span>生效：{reg.effectiveDate}</span>
            </div>
          </div>
          <span className="text-xs px-2 py-1 rounded-full bg-green-400/10 text-green-400 border border-green-400/20 whitespace-nowrap">现行有效</span>
        </div>
        <div className="mt-3 p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
          <p className="text-gray-300 text-sm leading-relaxed">{reg.summary}</p>
        </div>
      </div>

      {/* 条款列表 */}
      <div className="p-5 space-y-3">
        <h3 className="text-gray-300 font-semibold text-sm mb-4 flex items-center gap-2">
          <BookOpen size={14} className="text-blue-400" />
          条款全文（共{reg.articles.length}条）
        </h3>
        {reg.articles.map((article) => (
          <div key={article.id} className="border border-[#2a3a4f] rounded-lg overflow-hidden">
            <button
              className="w-full flex items-center justify-between p-4 hover:bg-[#1e2d42] transition-colors text-left"
              onClick={() => setExpandedArticle(expandedArticle === article.id ? null : article.id)}
            >
              <div className="flex items-center gap-3">
                <span className="text-blue-400 font-bold text-sm whitespace-nowrap">{article.number}</span>
                {article.title && <span className="text-white text-sm">{article.title}</span>}
              </div>
              {expandedArticle === article.id ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
            </button>
            {expandedArticle === article.id && (
              <div className="px-4 pb-4 border-t border-[#2a3a4f]">
                <div
                  className="text-gray-300 text-sm leading-relaxed whitespace-pre-line mt-3"
                  dangerouslySetInnerHTML={{ __html: highlight(article.content) }}
                />
                {article.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-[#2a3a4f]">
                    {article.tags.map((tag) => (
                      <span key={tag} className="text-xs px-2 py-0.5 rounded bg-[#2a3a4f] text-gray-400">#{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// 子组件：合规自查清单
// ============================================================
function ComplianceChecklist() {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [filterFreq, setFilterFreq] = useState<string>('all');
  const [filterRisk, setFilterRisk] = useState<string>('all');

  const freqLabel: Record<string, string> = {
    daily: '每日', weekly: '每周', monthly: '每月', quarterly: '每季度', annual: '每年', ongoing: '持续',
  };
  const freqColor: Record<string, string> = {
    daily: 'text-red-400 bg-red-400/10', weekly: 'text-orange-400 bg-orange-400/10',
    monthly: 'text-yellow-400 bg-yellow-400/10', quarterly: 'text-blue-400 bg-blue-400/10',
    annual: 'text-purple-400 bg-purple-400/10', ongoing: 'text-green-400 bg-green-400/10',
  };
  const riskColor: Record<string, string> = {
    high: 'text-red-400', medium: 'text-yellow-400', low: 'text-green-400',
  };
  const riskLabel: Record<string, string> = { high: '高风险', medium: '中风险', low: '低风险' };

  const filtered = complianceChecklist.filter((item) => {
    if (filterFreq !== 'all' && item.frequency !== filterFreq) return false;
    if (filterRisk !== 'all' && item.riskLevel !== filterRisk) return false;
    return true;
  });

  const categories = Array.from(new Set(filtered.map((i) => i.category)));
  const completedCount = filtered.filter((i) => checkedItems.has(i.id)).length;

  const toggleItem = (id: string) => {
    const next = new Set(checkedItems);
    if (next.has(id)) next.delete(id); else next.add(id);
    setCheckedItems(next);
  };

  return (
    <div className="space-y-6">
      {/* 进度条 */}
      <div className="bg-[#1a2535] border border-[#2a3a4f] rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-semibold text-sm">合规自查进度</h3>
          <span className="text-gray-400 text-sm">{completedCount} / {filtered.length} 项已完成</span>
        </div>
        <div className="w-full bg-[#2a3a4f] rounded-full h-2">
          <div
            className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${filtered.length > 0 ? (completedCount / filtered.length) * 100 : 0}%` }}
          />
        </div>
        <p className="text-gray-500 text-xs mt-2">
          {completedCount === filtered.length && filtered.length > 0 ? '✅ 当前筛选条件下所有合规项已完成' : '请逐项核查并勾选已完成的合规项'}
        </p>
      </div>

      {/* 筛选器 */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-xs">频率：</span>
          {['all', 'daily', 'monthly', 'quarterly', 'annual', 'ongoing'].map((f) => (
            <button
              key={f}
              onClick={() => setFilterFreq(f)}
              className={`text-xs px-3 py-1 rounded-full transition-colors ${filterFreq === f ? 'bg-blue-500 text-white' : 'bg-[#1a2535] text-gray-400 hover:text-white border border-[#2a3a4f]'}`}
            >
              {f === 'all' ? '全部' : freqLabel[f]}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-xs">风险：</span>
          {['all', 'high', 'medium', 'low'].map((r) => (
            <button
              key={r}
              onClick={() => setFilterRisk(r)}
              className={`text-xs px-3 py-1 rounded-full transition-colors ${filterRisk === r ? 'bg-blue-500 text-white' : 'bg-[#1a2535] text-gray-400 hover:text-white border border-[#2a3a4f]'}`}
            >
              {r === 'all' ? '全部' : riskLabel[r]}
            </button>
          ))}
        </div>
      </div>

      {/* 清单按类别分组 */}
      {categories.map((cat) => {
        const items = filtered.filter((i) => i.category === cat);
        return (
          <div key={cat} className="bg-[#1a2535] border border-[#2a3a4f] rounded-xl overflow-hidden">
            <div className="px-5 py-3 bg-[#1e2d42] border-b border-[#2a3a4f]">
              <h4 className="text-white font-semibold text-sm">{cat}</h4>
            </div>
            <div className="divide-y divide-[#2a3a4f]">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={`p-4 flex items-start gap-4 cursor-pointer hover:bg-[#1e2d42] transition-colors ${checkedItems.has(item.id) ? 'opacity-60' : ''}`}
                  onClick={() => toggleItem(item.id)}
                >
                  <div className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${checkedItems.has(item.id) ? 'bg-green-500 border-green-500' : 'border-gray-500'}`}>
                    {checkedItems.has(item.id) && <span className="text-white text-xs">✓</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`font-medium text-sm ${checkedItems.has(item.id) ? 'text-gray-400 line-through' : 'text-white'}`}>{item.item}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${freqColor[item.frequency]}`}>{freqLabel[item.frequency]}</span>
                      <span className={`text-xs font-medium ${riskColor[item.riskLevel]}`}>
                        <AlertTriangle size={10} className="inline mr-0.5" />{riskLabel[item.riskLevel]}
                      </span>
                    </div>
                    <p className="text-gray-400 text-xs leading-relaxed mb-1">{item.requirement}</p>
                    <p className="text-gray-500 text-xs">依据：{item.regulationRef}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// 主页面
// ============================================================
export default function ComplianceLibrary() {
  const [activeTab, setActiveTab] = useState<'library' | 'checklist'>('library');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedRegulation, setSelectedRegulation] = useState<Regulation | null>(null);

  // 全文搜索：在标题、摘要、条款内容、标签中搜索
  const filteredRegulations = useMemo(() => {
    return regulations.filter((reg) => {
      const matchCategory = selectedCategory === 'all' || reg.category === selectedCategory;
      if (!matchCategory) return false;
      if (!searchKeyword) return true;
      const kw = searchKeyword.toLowerCase();
      if (reg.title.toLowerCase().includes(kw)) return true;
      if (reg.summary.toLowerCase().includes(kw)) return true;
      if (reg.docNumber.toLowerCase().includes(kw)) return true;
      return reg.articles.some(
        (a) =>
          a.content.toLowerCase().includes(kw) ||
          a.title?.toLowerCase().includes(kw) ||
          a.tags.some((t) => t.toLowerCase().includes(kw))
      );
    });
  }, [searchKeyword, selectedCategory]);

  // 搜索结果：展开所有匹配条款
  const searchResults = useMemo(() => {
    if (!searchKeyword) return [];
    const kw = searchKeyword.toLowerCase();
    const results: { reg: Regulation; article: RegulationArticle }[] = [];
    regulations.forEach((reg) => {
      reg.articles.forEach((article) => {
        if (
          article.content.toLowerCase().includes(kw) ||
          article.title?.toLowerCase().includes(kw) ||
          article.tags.some((t) => t.toLowerCase().includes(kw))
        ) {
          results.push({ reg, article });
        }
      });
    });
    return results;
  }, [searchKeyword]);

  return (
    <div className="min-h-screen bg-[#0f1923] text-white">
      {/* 顶部导航 */}
      <div className="border-b border-[#1a2535] px-6 py-4 flex items-center gap-4">
        <button
          onClick={() => { if (selectedRegulation) { setSelectedRegulation(null); } else { window.history.length > 1 ? window.history.back() : (window.location.href = '/'); } }}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
        >
          <ArrowLeft size={16} />
          {selectedRegulation ? '返回制度列表' : '返回'}
        </button>
        <div className="flex items-center gap-2">
          <Shield size={18} className="text-blue-400" />
          <span className="font-bold text-white">合规管理库</span>
        </div>
        <span className="text-gray-500 text-sm">新三板做市全套监管制度 · {regulations.length}部规则 · {complianceChecklist.length}项自查清单</span>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* Tab 切换 */}
        <div className="flex gap-1 bg-[#1a2535] rounded-xl p-1 mb-6 w-fit">
          <button
            onClick={() => setActiveTab('library')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'library' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            <BookOpen size={14} /> 制度全文库
          </button>
          <button
            onClick={() => setActiveTab('checklist')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'checklist' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            <CheckSquare size={14} /> 合规自查清单
          </button>
        </div>

        {/* ---- 制度全文库 ---- */}
        {activeTab === 'library' && (
          <div>
            {selectedRegulation ? (
              <RegulationDetail
                reg={selectedRegulation}
                onBack={() => setSelectedRegulation(null)}
                searchKeyword={searchKeyword}
              />
            ) : (
              <>
                {/* 搜索栏 */}
                <div className="relative mb-5">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    placeholder="搜索制度名称、条款内容、关键词（如：75%、10万股、内幕交易...）"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    className="w-full bg-[#1a2535] border border-[#2a3a4f] rounded-xl pl-11 pr-4 py-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                  {searchKeyword && (
                    <button onClick={() => setSearchKeyword('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-xs">✕ 清除</button>
                  )}
                </div>

                {/* 分类筛选 */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {regulationCategories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`text-sm px-4 py-1.5 rounded-full transition-colors ${selectedCategory === cat.id ? 'bg-blue-500 text-white' : 'bg-[#1a2535] text-gray-400 hover:text-white border border-[#2a3a4f]'}`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* 关键词搜索结果 */}
                {searchKeyword && searchResults.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-gray-300 text-sm font-semibold mb-3 flex items-center gap-2">
                      <Search size={13} className="text-yellow-400" />
                      找到 {searchResults.length} 条匹配条款
                    </h3>
                    <div className="space-y-2">
                      {searchResults.map(({ reg, article }) => {
                        const kw = searchKeyword;
                        const preview = article.content.length > 120 ? article.content.substring(0, 120) + '...' : article.content;
                        return (
                          <div
                            key={article.id}
                            className="bg-[#1a2535] border border-yellow-500/20 rounded-lg p-4 cursor-pointer hover:border-yellow-500/50 transition-colors"
                            onClick={() => setSelectedRegulation(reg)}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-blue-400 text-xs font-bold">{article.number}</span>
                              {article.title && <span className="text-white text-xs font-medium">{article.title}</span>}
                              <span className="text-gray-500 text-xs">— {reg.shortTitle}</span>
                            </div>
                            <p className="text-gray-400 text-xs leading-relaxed">{preview}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 制度卡片网格 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredRegulations.map((reg) => (
                    <RegulationCard key={reg.id} reg={reg} onSelect={setSelectedRegulation} />
                  ))}
                </div>

                {filteredRegulations.length === 0 && (
                  <div className="text-center py-16 text-gray-500">
                    <Shield size={40} className="mx-auto mb-3 opacity-30" />
                    <p>未找到匹配的制度文件</p>
                    <p className="text-xs mt-1">请尝试其他关键词或分类</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ---- 合规自查清单 ---- */}
        {activeTab === 'checklist' && <ComplianceChecklist />}
      </div>
    </div>
  );
}
