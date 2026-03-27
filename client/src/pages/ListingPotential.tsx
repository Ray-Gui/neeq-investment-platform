import { Search, TrendingUp, AlertCircle, CheckCircle, Filter } from "lucide-react";
import React, { useState, useMemo } from "react";
import listingData from "../data/listing-potential-data.json";

interface ListingItem {
  company_id: number;
  code: string;
  short_name: string;
  sector: string;
  listing_probability: number;
  estimated_listing_year: number;
  listing_readiness: number;
  profitability_score: number;
  growth_score: number;
  market_potential: number;
  key_factors: string[];
  risk_factors: string[];
  estimated_ipo_price: number;
  estimated_first_day_return: number;
  estimated_one_year_return: number;
}

export default function ListingPotential() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("probability");
  const [filterSector, setFilterSector] = useState("全部");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const sectors = ["全部", "医疗健康", "新能源", "人工智能"];

  const filteredSorted = useMemo(() => {
    let filtered = listingData as ListingItem[];
    if (searchTerm) {
      const kw = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (c) => c.short_name.toLowerCase().includes(kw) || c.code.includes(kw)
      );
    }
    if (filterSector !== "全部") {
      filtered = filtered.filter((c) => c.sector === filterSector);
    }
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === "probability") return b.listing_probability - a.listing_probability;
      if (sortBy === "year") return a.estimated_listing_year - b.estimated_listing_year;
      if (sortBy === "ipo_price") return b.estimated_ipo_price - a.estimated_ipo_price;
      return 0;
    });
    return sorted;
  }, [searchTerm, filterSector, sortBy]);

  const totalPages = Math.ceil(filteredSorted.length / pageSize);
  const pagedData = filteredSorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const allData = listingData as ListingItem[];
  const highProbCount = allData.filter((c) => c.listing_probability >= 60).length;
  const avgProb = (allData.reduce((s, c) => s + c.listing_probability, 0) / allData.length).toFixed(1);

  const getProbColor = (prob: number) => {
    if (prob >= 70) return "text-green-400";
    if (prob >= 50) return "text-yellow-400";
    if (prob >= 30) return "text-orange-400";
    return "text-red-400";
  };

  const getProbBg = (prob: number) => {
    if (prob >= 70) return "bg-green-500";
    if (prob >= 50) return "bg-yellow-500";
    if (prob >= 30) return "bg-orange-500";
    return "bg-red-500";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-blue-400" />
            上市潜力分析
          </h1>
          <p className="text-slate-400">预测企业上市时间和表现 · 共 {allData.length} 家企业</p>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <p className="text-sm text-slate-400">覆盖企业数</p>
            <p className="text-2xl font-bold text-white">{allData.length} 家</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <p className="text-sm text-slate-400">高潜力企业（≥60%）</p>
            <p className="text-2xl font-bold text-green-400">{highProbCount} 家</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <p className="text-sm text-slate-400">平均上市概率</p>
            <p className="text-2xl font-bold text-blue-400">{avgProb}%</p>
          </div>
        </div>

        {/* 筛选栏 */}
        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-4 mb-6 flex flex-wrap gap-4">
          <div className="flex-1 min-w-48 flex items-center gap-2">
            <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="搜索企业..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="flex-1 bg-slate-700 border border-slate-600 rounded px-4 py-2 text-white text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-slate-400" />
            <select
              value={filterSector}
              onChange={(e) => { setFilterSector(e.target.value); setCurrentPage(1); }}
              className="bg-slate-700 border border-slate-600 rounded px-4 py-2 text-white text-sm"
            >
              {sectors.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-slate-700 border border-slate-600 rounded px-4 py-2 text-white text-sm"
          >
            <option value="probability">按上市概率</option>
            <option value="year">按上市年份</option>
            <option value="ipo_price">按IPO价格</option>
          </select>
          <div className="flex items-center text-sm text-slate-400">
            共 <span className="text-white font-bold mx-1">{filteredSorted.length}</span> 家企业
          </div>
        </div>

        {/* 企业列表 */}
        <div className="space-y-4">
          {pagedData.map((company) => (
            <div key={company.company_id} className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">{company.short_name}</h3>
                  <p className="text-sm text-slate-400">{company.code} | {company.sector}</p>
                </div>
                <div className="text-right">
                  <div className={`text-3xl font-bold ${getProbColor(company.listing_probability)}`}>
                    {company.listing_probability.toFixed(1)}%
                  </div>
                  <p className="text-sm text-slate-400">上市概率</p>
                </div>
              </div>

              {/* 概率进度条 */}
              <div className="mb-4">
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className={`${getProbBg(company.listing_probability)} h-2 rounded-full transition-all`}
                    style={{ width: `${Math.min(100, company.listing_probability)}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-700/50 rounded p-3">
                  <p className="text-xs text-slate-400">预计上市年份</p>
                  <p className="text-lg font-bold text-white">{company.estimated_listing_year}</p>
                </div>
                <div className="bg-slate-700/50 rounded p-3">
                  <p className="text-xs text-slate-400">预计IPO价格</p>
                  <p className="text-lg font-bold text-green-400">¥{company.estimated_ipo_price.toFixed(2)}</p>
                </div>
                <div className="bg-slate-700/50 rounded p-3">
                  <p className="text-xs text-slate-400">首日涨幅</p>
                  <p className="text-lg font-bold text-blue-400">+{company.estimated_first_day_return.toFixed(1)}%</p>
                </div>
                <div className="bg-slate-700/50 rounded p-3">
                  <p className="text-xs text-slate-400">一年涨幅</p>
                  <p className={`text-lg font-bold ${company.estimated_one_year_return >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {company.estimated_one_year_return > 0 ? "+" : ""}{company.estimated_one_year_return.toFixed(1)}%
                  </p>
                </div>
              </div>

              {/* 关键因素 */}
              {company.key_factors && company.key_factors.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-700 flex flex-wrap gap-2">
                  {company.key_factors.map((f, i) => (
                    <span key={i} className="px-2 py-0.5 bg-green-500/10 text-green-400 rounded text-xs">
                      {f}
                    </span>
                  ))}
                  {company.risk_factors && company.risk_factors.map((r, i) => (
                    <span key={`r${i}`} className="px-2 py-0.5 bg-red-500/10 text-red-400 rounded text-xs">
                      {r}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 分页 */}
        <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-700">
          <span className="text-sm text-slate-400">
            第 {currentPage} / {totalPages} 页，共 {filteredSorted.length} 条
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-slate-700 text-white rounded text-sm disabled:opacity-50 hover:bg-slate-600"
            >
              上一页
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 bg-slate-700 text-white rounded text-sm disabled:opacity-50 hover:bg-slate-600"
            >
              下一页
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
