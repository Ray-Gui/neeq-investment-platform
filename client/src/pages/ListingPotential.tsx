import { Search, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter } from "recharts";
import listingData from "../data/listing-potential-data.json";

export default function ListingPotential() {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [sortBy, setSortBy] = React.useState("probability");

  const filtered = listingData.filter(c => 
    c.short_name.includes(searchTerm) || c.code.includes(searchTerm)
  );

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "probability") return b.listing_probability - a.listing_probability;
    if (sortBy === "year") return a.estimated_listing_year - b.estimated_listing_year;
    return 0;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">上市潜力分析</h1>
          <p className="text-slate-400">预测企业上市时间和表现</p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-4 mb-6 flex gap-4">
          <div className="flex-1 flex items-center gap-2">
            <Search className="w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="搜索企业..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-slate-700 border border-slate-600 rounded px-4 py-2 text-white"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-slate-700 border border-slate-600 rounded px-4 py-2 text-white"
          >
            <option value="probability">按上市概率</option>
            <option value="year">按上市年份</option>
          </select>
        </div>

        <div className="space-y-4">
          {sorted.map((company) => (
            <div key={company.company_id} className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">{company.short_name}</h3>
                  <p className="text-sm text-slate-400">{company.code} | {company.sector}</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-blue-400">{company.listing_probability}%</div>
                  <p className="text-sm text-slate-400">上市概率</p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="bg-slate-700/50 rounded p-3">
                  <p className="text-xs text-slate-400">预计上市年份</p>
                  <p className="text-lg font-bold text-white">{company.estimated_listing_year}</p>
                </div>
                <div className="bg-slate-700/50 rounded p-3">
                  <p className="text-xs text-slate-400">预计IPO价格</p>
                  <p className="text-lg font-bold text-green-400">¥{company.estimated_ipo_price}</p>
                </div>
                <div className="bg-slate-700/50 rounded p-3">
                  <p className="text-xs text-slate-400">首日涨幅</p>
                  <p className="text-lg font-bold text-blue-400">+{company.estimated_first_day_return}%</p>
                </div>
                <div className="bg-slate-700/50 rounded p-3">
                  <p className="text-xs text-slate-400">一年涨幅</p>
                  <p className={`text-lg font-bold ${company.estimated_one_year_return >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {company.estimated_one_year_return > 0 ? "+" : ""}{company.estimated_one_year_return}%
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import React from "react";
