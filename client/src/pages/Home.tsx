import { useState, useEffect, useMemo } from "react";
import type { Company, Analytics } from "@/lib/types";
import { DATA_URL, ANALYTICS_URL } from "@/lib/utils";
import OverviewTab from "@/components/OverviewTab";
import DataTableTab from "@/components/DataTableTab";
import FinancingTab from "@/components/FinancingTab";
import NeeqTab from "@/components/NeeqTab";
import PerformanceTab from "@/components/PerformanceTab";
import SponsorTab from "@/components/SponsorTab";
import ProvinceTab from "@/components/ProvinceTab";
import PETab from "@/components/PETab";
import ResearchSummaryTab from "@/components/ResearchSummaryTab";

const PDF_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663106941819/L3jdtkWk9JZNhxFtGdcAp9/%E5%8C%97%E4%BA%A4%E6%89%80%E4%B8%8A%E5%B8%82%E4%BC%81%E4%B8%9A%E7%A0%94%E7%A9%B6%E6%8A%A5%E5%91%8A_BSE%20Listed%20Companies%20Research%20Report_b41441e5.pdf";
const XLSX_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663106941819/L3jdtkWk9JZNhxFtGdcAp9/%E5%8C%97%E4%BA%A4%E6%89%80%E4%B8%8A%E5%B8%82%E4%BC%81%E4%B8%9A%E7%A0%94%E7%A9%B6%E6%8A%A5%E5%91%8A_BSE%20Listed%20Companies%20Research%20Report_2622fde0.xlsx";
const TABS = [
  { id: "summary", label: "研究摘要", icon: "📝" },
  { id: "overview", label: "概览分析", icon: "📊" },
  { id: "table", label: "完整数据", icon: "📋" },
  { id: "financing", label: "融资分析", icon: "💰" },
  { id: "neeq", label: "新三板路径", icon: "🔄" },
  { id: "performance", label: "上市表现", icon: "📈" },
  { id: "pe", label: "估值分析", icon: "🎯" },
  { id: "sponsor", label: "保荐机构", icon: "🏦" },
  { id: "province", label: "地域分布", icon: "🗺️" },
];

export default function Home() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(DATA_URL).then(r => r.json()),
      fetch(ANALYTICS_URL).then(r => r.json()),
    ]).then(([data, anal]) => {
      setCompanies(data);
      setAnalytics(anal);
      setLoading(false);
    }).catch(err => {
      console.error("Failed to load data:", err);
      setLoading(false);
    });
  }, []);

  const overview = analytics?.overview;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground text-sm">正在加载数据...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border/50 sticky top-0 z-50 bg-background/95 backdrop-blur-sm">
        <div className="container py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => { if (window.history.length > 1) { window.history.back(); } else { window.location.href = '/'; } }} className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center flex-shrink-0 hover:bg-primary/30 transition-colors">
              <span className="text-primary text-sm font-bold">北</span>
            </button>
            <div className="min-w-0">
              <h1 className="text-base font-semibold text-foreground truncate">北交所上市企业研究报告</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                覆盖 {companies.length} 家上市公司 · 数据截至 2026年3月
              </p>
            </div>
          </div>
          {/* Download buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <a
              href={PDF_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors border border-primary/20"
            >
              <span>📄</span>
              <span>下载PDF报告</span>
            </a>
            <a
              href={XLSX_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-green-500/10 text-green-600 hover:bg-green-500/20 transition-colors border border-green-500/20"
            >
              <span>📊</span>
              <span>下载Excel</span>
            </a>
          </div>
          {/* Stats bar */}
          {overview && (
            <div className="hidden lg:flex items-center gap-6 text-xs">
              <div className="text-center">
                <div className="data-num text-primary font-semibold">{overview.total_companies}</div>
                <div className="text-muted-foreground">上市公司</div>
              </div>
              <div className="text-center">
                <div className="data-num text-primary font-semibold">{overview.ipo_cap.total.toFixed(0)}亿</div>
                <div className="text-muted-foreground">总发行市值</div>
              </div>
              <div className="text-center">
                <div className={`data-num font-semibold ${overview.cap_change.mean > 0 ? 'text-positive' : 'text-negative'}`}>
                  {overview.cap_change.mean > 0 ? '+' : ''}{overview.cap_change.mean.toFixed(1)}%
                </div>
                <div className="text-muted-foreground">平均市值变化</div>
              </div>
              <div className="text-center">
                <div className="data-num text-negative font-semibold">{overview.first_day.bust_pct.toFixed(1)}%</div>
                <div className="text-muted-foreground">破发率</div>
              </div>
            </div>
          )}
        </div>

        {/* Tab navigation */}
        <div className="border-t border-border/30">
          <div className="container">
            <div className="flex overflow-x-auto scrollbar-none gap-0 -mb-px">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition-colors flex-shrink-0 ${
                    activeTab === tab.id
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span className="text-sm">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 container py-6">
        {activeTab === "summary" && <ResearchSummaryTab analytics={analytics} companies={companies} />}
        {activeTab === "overview" && <OverviewTab companies={companies} analytics={analytics} />}
        {activeTab === "table" && <DataTableTab companies={companies} analytics={analytics} />}
        {activeTab === "financing" && <FinancingTab companies={companies} analytics={analytics} />}
        {activeTab === "neeq" && <NeeqTab companies={companies} analytics={analytics} />}
        {activeTab === "performance" && <PerformanceTab companies={companies} analytics={analytics} />}
        {activeTab === "pe" && <PETab companies={companies} analytics={analytics} />}
        {activeTab === "sponsor" && <SponsorTab companies={companies} analytics={analytics} />}
        {activeTab === "province" && <ProvinceTab companies={companies} analytics={analytics} />}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/30 py-4">
        <div className="container text-center text-xs text-muted-foreground">
          <p>数据来源：东方财富、巨潮资讯、北交所官网 · 研究报告仅供参考，不构成投资建议</p>
          <p className="mt-1">融资历史数据部分由AI辅助整理，建议以公司招股书为准</p>
        </div>
      </footer>
    </div>
  );
}
