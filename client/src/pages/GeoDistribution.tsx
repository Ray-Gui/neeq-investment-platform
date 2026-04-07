import { useState, useMemo } from "react";
import { Link } from "wouter";
import { ArrowLeft, MapPin, Building2, TrendingUp, Award, ChevronDown, ChevronUp, Globe } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis } from "recharts";
import geoData from "../data/geo-distribution-data.json";

const SECTOR_COLORS: Record<string, string> = {
  "医疗健康": "#10b981",
  "新能源": "#f59e0b",
  "人工智能": "#6366f1",
};

const REGION_MAP: Record<string, string[]> = {
  "华南": ["广东"],
  "华北": ["北京", "天津", "河北"],
  "华东": ["江苏", "浙江", "上海", "山东", "安徽", "福建", "江西"],
  "华中": ["湖北", "湖南", "河南"],
  "西南": ["四川", "重庆", "云南", "贵州"],
  "西北": ["陕西"],
  "东北": ["辽宁"],
};

function getRegion(province: string): string {
  for (const [region, provinces] of Object.entries(REGION_MAP)) {
    if (provinces.includes(province)) return region;
  }
  return "其他";
}

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316"];

export default function GeoDistribution() {
  const [activeTab, setActiveTab] = useState<"overview" | "province" | "region" | "policy">("overview");
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"company_count" | "transfer_rate" | "avg_score">("company_count");
  const [expandedProvince, setExpandedProvince] = useState<string | null>(null);

  const sortedData = useMemo(() => {
    return [...geoData].sort((a, b) => (b as any)[sortBy] - (a as any)[sortBy]);
  }, [sortBy]);

  const regionData = useMemo(() => {
    const map: Record<string, { count: number; transfer: number; score_sum: number; score_n: number }> = {};
    for (const d of geoData) {
      const region = getRegion(d.province);
      if (!map[region]) map[region] = { count: 0, transfer: 0, score_sum: 0, score_n: 0 };
      map[region].count += d.company_count;
      map[region].transfer += d.transfer_count;
      if (d.avg_score) { map[region].score_sum += d.avg_score; map[region].score_n += 1; }
    }
    return Object.entries(map).map(([region, v]) => ({
      region,
      company_count: v.count,
      transfer_count: v.transfer,
      transfer_rate: v.count > 0 ? Math.round(v.transfer / v.count * 100 * 10) / 10 : 0,
      avg_score: v.score_n > 0 ? Math.round(v.score_sum / v.score_n * 10) / 10 : 0,
    })).sort((a, b) => b.company_count - a.company_count);
  }, []);

  const totalCompanies = geoData.reduce((s, d) => s + d.company_count, 0);
  const totalTransfer = geoData.reduce((s, d) => s + d.transfer_count, 0);
  const avgScore = Math.round(geoData.reduce((s, d) => s + d.avg_score, 0) / geoData.length * 10) / 10;

  const selectedData = selectedProvince ? geoData.find(d => d.province === selectedProvince) : null;

  const sectorPieData = useMemo(() => {
    const map: Record<string, number> = {};
    for (const d of geoData) {
      for (const [sector, count] of Object.entries(d.sector_distribution)) {
        map[sector] = (map[sector] || 0) + (count as number);
      }
    }
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => window.history.length > 1 ? window.history.back() : window.location.href = '/'}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">返回</span>
          </button>
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-cyan-400" />
            <h1 className="text-lg font-bold">地理分布与区域政策</h1>
          </div>
          <span className="text-sm text-gray-400">覆盖 {geoData.length} 个省份 · {totalCompanies.toLocaleString()} 家企业</span>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* 统计概览 */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "覆盖省份", value: geoData.length, unit: "个", color: "text-cyan-400" },
            { label: "企业总数", value: totalCompanies.toLocaleString(), unit: "家", color: "text-indigo-400" },
            { label: "转板案例", value: totalTransfer, unit: "家", color: "text-emerald-400" },
            { label: "平均评分", value: avgScore, unit: "分", color: "text-amber-400" },
          ].map((stat) => (
            <div key={stat.label} className="bg-gray-900 rounded-xl p-4 border border-gray-800">
              <div className="text-sm text-gray-400 mb-1">{stat.label}</div>
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}<span className="text-sm text-gray-400 ml-1">{stat.unit}</span></div>
            </div>
          ))}
        </div>

        {/* 标签页 */}
        <div className="flex gap-2">
          {[
            { key: "overview", label: "全国概览" },
            { key: "province", label: "省份详情" },
            { key: "region", label: "区域对比" },
            { key: "policy", label: "政策地图" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "bg-cyan-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 全国概览 */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-2 gap-6">
            {/* 企业数量省份排行 */}
            <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
              <h3 className="text-sm font-semibold text-gray-300 mb-4">企业数量省份排行 TOP10</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={sortedData.slice(0, 10)} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis type="number" tick={{ fill: "#9ca3af", fontSize: 11 }} />
                  <YAxis type="category" dataKey="province" tick={{ fill: "#9ca3af", fontSize: 11 }} width={40} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px" }}
                    labelStyle={{ color: "#f9fafb" }}
                  />
                  <Bar dataKey="company_count" name="企业数" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* 行业分布饼图 */}
            <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
              <h3 className="text-sm font-semibold text-gray-300 mb-4">全国行业分布</h3>
              <div className="flex items-center justify-center">
                <PieChart width={280} height={280}>
                  <Pie
                    data={sectorPieData}
                    cx={140}
                    cy={140}
                    innerRadius={70}
                    outerRadius={110}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {sectorPieData.map((entry, index) => (
                      <Cell key={index} fill={SECTOR_COLORS[entry.name] || COLORS[index]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px" }}
                  />
                </PieChart>
              </div>
              <div className="flex justify-center gap-6 mt-2">
                {sectorPieData.map((d) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: SECTOR_COLORS[d.name] }} />
                    <span className="text-xs text-gray-400">{d.name}: {d.value}家</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 转板成功率省份排行 */}
            <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
              <h3 className="text-sm font-semibold text-gray-300 mb-4">转板成功率省份排行 TOP10</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={[...geoData].sort((a, b) => b.transfer_rate - a.transfer_rate).slice(0, 10)}
                  layout="vertical"
                  margin={{ left: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis type="number" tick={{ fill: "#9ca3af", fontSize: 11 }} unit="%" />
                  <YAxis type="category" dataKey="province" tick={{ fill: "#9ca3af", fontSize: 11 }} width={40} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px" }}
                    formatter={(v: any) => [`${v}%`, "转板率"]}
                  />
                  <Bar dataKey="transfer_rate" name="转板率" fill="#10b981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* 平均评分省份排行 */}
            <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
              <h3 className="text-sm font-semibold text-gray-300 mb-4">平均投资评分省份排行 TOP10</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={[...geoData].sort((a, b) => b.avg_score - a.avg_score).slice(0, 10)}
                  layout="vertical"
                  margin={{ left: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: "#9ca3af", fontSize: 11 }} />
                  <YAxis type="category" dataKey="province" tick={{ fill: "#9ca3af", fontSize: 11 }} width={40} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px" }}
                    formatter={(v: any) => [`${v}分`, "平均评分"]}
                  />
                  <Bar dataKey="avg_score" name="平均评分" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* 省份详情 */}
        {activeTab === "province" && (
          <div className="space-y-4">
            {/* 排序控制 */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-400">排序方式：</span>
              {[
                { key: "company_count", label: "企业数量" },
                { key: "transfer_rate", label: "转板率" },
                { key: "avg_score", label: "平均评分" },
              ].map((s) => (
                <button
                  key={s.key}
                  onClick={() => setSortBy(s.key as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    sortBy === s.key ? "bg-cyan-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* 省份列表 */}
            <div className="space-y-2">
              {sortedData.map((d) => (
                <div key={d.province} className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                  <button
                    className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-800/50 transition-colors"
                    onClick={() => setExpandedProvince(expandedProvince === d.province ? null : d.province)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-cyan-400" />
                        <span className="font-semibold">{d.province}</span>
                        <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">{getRegion(d.province)}</span>
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        <span className="text-indigo-400 font-medium">{d.company_count} 家企业</span>
                        <span className="text-emerald-400">{d.transfer_count} 家转板</span>
                        <span className="text-amber-400">转板率 {d.transfer_rate}%</span>
                        <span className="text-gray-400">均分 {d.avg_score}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">
                        主导行业: {d.top_sector}
                      </span>
                      {expandedProvince === d.province ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </div>
                  </button>

                  {expandedProvince === d.province && (
                    <div className="px-5 pb-5 border-t border-gray-800">
                      <div className="grid grid-cols-3 gap-4 mt-4">
                        {/* 行业分布 */}
                        <div>
                          <h4 className="text-xs text-gray-400 mb-3 font-medium">行业分布</h4>
                          <div className="space-y-2">
                            {Object.entries(d.sector_distribution).map(([sector, count]) => {
                              const pct = Math.round((count as number) / d.company_count * 100);
                              return (
                                <div key={sector}>
                                  <div className="flex justify-between text-xs mb-1">
                                    <span style={{ color: SECTOR_COLORS[sector] }}>{sector}</span>
                                    <span className="text-gray-400">{count as number}家 ({pct}%)</span>
                                  </div>
                                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                    <div
                                      className="h-full rounded-full"
                                      style={{ width: `${pct}%`, backgroundColor: SECTOR_COLORS[sector] }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* 财务指标 */}
                        <div>
                          <h4 className="text-xs text-gray-400 mb-3 font-medium">财务均值</h4>
                          <div className="space-y-2">
                            {[
                              { label: "平均毛利率", value: `${d.avg_gross_margin}%`, color: "text-emerald-400" },
                              { label: "平均ROE", value: `${d.avg_roe}%`, color: "text-indigo-400" },
                              { label: "平均营收增速", value: `${d.avg_revenue_growth}%`, color: "text-amber-400" },
                              { label: "综合评分", value: `${d.avg_score}分`, color: "text-cyan-400" },
                            ].map((item) => (
                              <div key={item.label} className="flex justify-between text-xs">
                                <span className="text-gray-400">{item.label}</span>
                                <span className={item.color}>{item.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* 政策标签 */}
                        <div>
                          <h4 className="text-xs text-gray-400 mb-3 font-medium">政策支持</h4>
                          <div className="flex flex-wrap gap-1.5">
                            {(d.policy_tags || []).map((tag) => (
                              <span key={tag} className="text-xs bg-indigo-900/40 text-indigo-300 border border-indigo-700/50 px-2 py-1 rounded-full">
                                {tag}
                              </span>
                            ))}
                          </div>
                          <div className="mt-3">
                            <h4 className="text-xs text-gray-400 mb-2 font-medium">主要城市</h4>
                            <div className="flex flex-wrap gap-1">
                              {(d.cities || []).map((city) => (
                                <span key={city} className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded">
                                  {city}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 区域对比 */}
        {activeTab === "region" && (
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
              <h3 className="text-sm font-semibold text-gray-300 mb-4">各区域企业数量对比</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={regionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="region" tick={{ fill: "#9ca3af", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px" }} />
                  <Bar dataKey="company_count" name="企业数" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
              <h3 className="text-sm font-semibold text-gray-300 mb-4">各区域转板率对比</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={regionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="region" tick={{ fill: "#9ca3af", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} unit="%" />
                  <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px" }} formatter={(v: any) => [`${v}%`, "转板率"]} />
                  <Bar dataKey="transfer_rate" name="转板率" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* 区域综合对比表 */}
            <div className="col-span-2 bg-gray-900 rounded-xl p-5 border border-gray-800">
              <h3 className="text-sm font-semibold text-gray-300 mb-4">区域综合对比</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800">
                      {["区域", "企业数", "转板案例", "转板率", "平均评分", "主要省份"].map((h) => (
                        <th key={h} className="text-left py-2 px-3 text-gray-400 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {regionData.map((r, i) => (
                      <tr key={r.region} className={`border-b border-gray-800/50 ${i % 2 === 0 ? "bg-gray-800/20" : ""}`}>
                        <td className="py-3 px-3 font-medium text-cyan-400">{r.region}</td>
                        <td className="py-3 px-3 text-indigo-400">{r.company_count}</td>
                        <td className="py-3 px-3 text-emerald-400">{r.transfer_count}</td>
                        <td className="py-3 px-3">
                          <span className={`font-medium ${r.transfer_rate > 20 ? "text-emerald-400" : r.transfer_rate > 15 ? "text-amber-400" : "text-gray-400"}`}>
                            {r.transfer_rate}%
                          </span>
                        </td>
                        <td className="py-3 px-3 text-amber-400">{r.avg_score}</td>
                        <td className="py-3 px-3 text-gray-400 text-xs">
                          {REGION_MAP[r.region]?.slice(0, 3).join("、") || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 政策地图 */}
        {activeTab === "policy" && (
          <div className="grid grid-cols-2 gap-4">
            {geoData
              .filter(d => d.policy_tags && d.policy_tags.length > 0)
              .sort((a, b) => b.company_count - a.company_count)
              .map((d) => (
                <div key={d.province} className="bg-gray-900 rounded-xl p-5 border border-gray-800">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-cyan-400" />
                      <span className="font-semibold">{d.province}</span>
                      <span className="text-xs text-gray-500">{getRegion(d.province)}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-indigo-400 font-medium">{d.company_count} 家</div>
                      <div className="text-xs text-gray-500">转板率 {d.transfer_rate}%</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {d.policy_tags.map((tag) => (
                      <span key={tag} className="text-xs bg-indigo-900/40 text-indigo-300 border border-indigo-700/50 px-2 py-1 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-gray-800 rounded-lg p-2 text-center">
                      <div className="text-emerald-400 font-medium">{d.avg_gross_margin}%</div>
                      <div className="text-gray-500">均值毛利率</div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-2 text-center">
                      <div className="text-indigo-400 font-medium">{d.avg_roe}%</div>
                      <div className="text-gray-500">均值ROE</div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-2 text-center">
                      <div className="text-amber-400 font-medium">{d.avg_score}</div>
                      <div className="text-gray-500">综合评分</div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
