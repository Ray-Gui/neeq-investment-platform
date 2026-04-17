import { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Building2,
  TrendingUp,
  TrendingDown,
  Search,
  Download,
  ChevronUp,
  ChevronDown,
  BarChart3,
  Target,
  Layers,
  ArrowUpDown,
} from "lucide-react";

// ============ Types ============
interface PreIPOCompany {
  code: string;
  name: string;
  industry: string;
  em_industry: string;
  region: string;
  listing_date: string;
  listing_year: number;
  total_shares: number | null;
  float_shares: number | null;
  pre_ipo_data: Record<string, YearData>;
  data_years_count: number;
  data_years: string[];
  avg_3y: {
    revenue: number | null;
    net_profit: number | null;
    roe: number | null;
    gross_margin: number | null;
  };
  last_full_year: {
    year: string;
    revenue: number | null;
    net_profit: number | null;
    roe: number | null;
    gross_margin: number | null;
    eps: number | null;
  };
}

interface YearData {
  revenue: number | null;
  revenue_yoy: number | null;
  net_profit: number | null;
  net_profit_yoy: number | null;
  eps: number | null;
  bvps: number | null;
  roe: number | null;
  cash_per_share: number | null;
  gross_margin: number | null;
}

interface MarketStats {
  count: number;
  avg_revenue: number | null;
  median_revenue: number | null;
  avg_net_profit: number | null;
  median_net_profit: number | null;
  avg_gross_margin: number | null;
  median_gross_margin: number | null;
  avg_roe: number | null;
  median_roe: number | null;
}

interface IndustryComparison {
  [year: string]: {
    ashare: MarketStats;
    bse: MarketStats;
    neeq: MarketStats;
  };
}

// ============ Helpers ============
function formatNumber(val: number | null | undefined): string {
  if (val == null || isNaN(val)) return "-";
  if (Math.abs(val) >= 1e8) return (val / 1e8).toFixed(2) + "亿";
  if (Math.abs(val) >= 1e4) return (val / 1e4).toFixed(2) + "万";
  return val.toFixed(2);
}

function formatPercent(val: number | null | undefined): string {
  if (val == null || isNaN(val)) return "-";
  return val.toFixed(2) + "%";
}

const COLORS = [
  "#06b6d4",
  "#8b5cf6",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#3b82f6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#6366f1",
  "#84cc16",
  "#e879f9",
];

// ============ Component ============
export default function PreIPOFinancial() {
  const [companies, setCompanies] = useState<PreIPOCompany[]>([]);
  const [comparison, setComparison] = useState<Record<string, IndustryComparison>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState<string>("all");
  const [selectedClassification, setSelectedClassification] = useState<"csrc" | "em">("csrc");
  const [sortField, setSortField] = useState<string>("avg_revenue");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selectedCompany, setSelectedCompany] = useState<PreIPOCompany | null>(null);
  const [comparisonIndustry, setComparisonIndustry] = useState<string>("");

  // Load data
  useEffect(() => {
    Promise.all([
      fetch("/neeq_pre_ipo_full_data.json").then(r => r.json()),
      fetch("/industry_comparison_full.json").then(r => r.json()),
    ]).then(([compData, compData2]) => {
      setCompanies(compData);
      setComparison(compData2);
      if (compData.length > 0) {
        const firstIndustry = compData[0].em_industry;
        setComparisonIndustry(firstIndustry);
      }
      setLoading(false);
    }).catch(err => {
      console.error("Data load error:", err);
      setLoading(false);
    });
  }, []);

  // Industry list
  const industries = useMemo(() => {
    const key = selectedClassification === "csrc" ? "industry" : "em_industry";
    const counts: Record<string, number> = {};
    companies.forEach(c => {
      const ind = c[key];
      if (ind) counts[ind] = (counts[ind] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }, [companies, selectedClassification]);

  // Filtered & sorted companies
  const filtered = useMemo(() => {
    const key = selectedClassification === "csrc" ? "industry" : "em_industry";
    let list = companies.filter(c => {
      const matchSearch = !search ||
        c.name.includes(search) ||
        c.code.includes(search) ||
        c.industry.includes(search);
      const matchIndustry = selectedIndustry === "all" || c[key] === selectedIndustry;
      return matchSearch && matchIndustry;
    });

    list.sort((a, b) => {
      let va: number, vb: number;
      switch (sortField) {
        case "avg_revenue": va = a.avg_3y.revenue || 0; vb = b.avg_3y.revenue || 0; break;
        case "avg_profit": va = a.avg_3y.net_profit || 0; vb = b.avg_3y.net_profit || 0; break;
        case "avg_roe": va = a.avg_3y.roe || 0; vb = b.avg_3y.roe || 0; break;
        case "avg_margin": va = a.avg_3y.gross_margin || 0; vb = b.avg_3y.gross_margin || 0; break;
        case "last_revenue": va = a.last_full_year.revenue || 0; vb = b.last_full_year.revenue || 0; break;
        case "last_profit": va = a.last_full_year.net_profit || 0; vb = b.last_full_year.net_profit || 0; break;
        case "listing_year": va = a.listing_year; vb = b.listing_year; break;
        default: va = a.avg_3y.revenue || 0; vb = b.avg_3y.revenue || 0;
      }
      return sortDir === "desc" ? vb - va : va - vb;
    });
    return list;
  }, [companies, search, selectedIndustry, selectedClassification, sortField, sortDir]);

  // Summary stats
  const summary = useMemo(() => {
    const key = selectedClassification === "csrc" ? "industry" : "em_industry";
    const list = selectedIndustry === "all"
      ? companies
      : companies.filter(c => c[key] === selectedIndustry);

    const revenues = list.map(c => c.avg_3y.revenue).filter((v): v is number => v != null);
    const profits = list.map(c => c.avg_3y.net_profit).filter((v): v is number => v != null);
    const roes = list.map(c => c.avg_3y.roe).filter((v): v is number => v != null);
    const margins = list.map(c => c.avg_3y.gross_margin).filter((v): v is number => v != null);

    return {
      total: list.length,
      avgRevenue: revenues.length ? revenues.reduce((a, b) => a + b, 0) / revenues.length : null,
      avgProfit: profits.length ? profits.reduce((a, b) => a + b, 0) / profits.length : null,
      avgRoe: roes.length ? roes.reduce((a, b) => a + b, 0) / roes.length : null,
      avgMargin: margins.length ? margins.reduce((a, b) => a + b, 0) / margins.length : null,
    };
  }, [companies, selectedIndustry, selectedClassification]);

  // Industry distribution chart data
  const industryChartData = useMemo(() => {
    return industries.slice(0, 15).map(ind => ({
      name: ind.name.length > 8 ? ind.name.substring(0, 8) + "..." : ind.name,
      fullName: ind.name,
      count: ind.count,
      avgRevenue: (() => {
        const key = selectedClassification === "csrc" ? "industry" : "em_industry";
        const comps = companies.filter(c => c[key] === ind.name);
        const revs = comps.map(c => c.avg_3y.revenue).filter((v): v is number => v != null);
        return revs.length ? revs.reduce((a, b) => a + b, 0) / revs.length : 0;
      })(),
    }));
  }, [industries, companies, selectedClassification]);

  // Comparison data for selected industry
  const compData = useMemo(() => {
    if (!comparisonIndustry || !comparison[comparisonIndustry]) return null;
    const indComp = comparison[comparisonIndustry];
    const years = Object.keys(indComp).sort();
    return years.map(year => {
      const d = indComp[year];
      return {
        year,
        "A股均值营收": d.ashare.avg_revenue,
        "北交所均值营收": d.bse.avg_revenue,
        "新三板均值营收": d.neeq.avg_revenue,
        "A股毛利率": d.ashare.avg_gross_margin,
        "北交所毛利率": d.bse.avg_gross_margin,
        "新三板毛利率": d.neeq.avg_gross_margin,
        "A股ROE": d.ashare.avg_roe,
        "北交所ROE": d.bse.avg_roe,
        "新三板ROE": d.neeq.avg_roe,
        "A股公司数": d.ashare.count,
        "北交所公司数": d.bse.count,
        "新三板公司数": d.neeq.count,
      };
    });
  }, [comparison, comparisonIndustry]);

  // Radar chart data
  const radarData = useMemo(() => {
    if (!compData || compData.length === 0) return [];
    const latest = compData[compData.length - 1];
    const metrics = [
      { name: "营收规模", ashare: latest["A股均值营收"], bse: latest["北交所均值营收"], neeq: latest["新三板均值营收"], scale: 1e8 },
      { name: "毛利率", ashare: latest["A股毛利率"], bse: latest["北交所毛利率"], neeq: latest["新三板毛利率"], scale: 1 },
      { name: "ROE", ashare: latest["A股ROE"], bse: latest["北交所ROE"], neeq: latest["新三板ROE"], scale: 1 },
    ];
    return metrics.map(m => ({
      name: m.name,
      A股: m.ashare ? m.ashare / m.scale : 0,
      北交所: m.bse ? m.bse / m.scale : 0,
      新三板: m.neeq ? m.neeq / m.scale : 0,
    }));
  }, [compData]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(d => d === "desc" ? "asc" : "desc");
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />;
    return sortDir === "desc"
      ? <ChevronDown className="ml-1 h-3 w-3 text-cyan-400" />
      : <ChevronUp className="ml-1 h-3 w-3 text-cyan-400" />;
  };

  // Export CSV
  const exportCSV = () => {
    const key = selectedClassification === "csrc" ? "industry" : "em_industry";
    const headers = [
      "代码", "名称", "行业", "地区", "上市日期", "上市年份",
      "上市前三年平均营收", "上市前三年平均净利润", "上市前三年平均ROE", "上市前三年平均毛利率",
      "上市前一年营收", "上市前一年净利润", "上市前一年ROE", "上市前一年毛利率", "上市前一年EPS",
      "数据年份数",
    ];
    const rows = filtered.map(c => [
      c.code, c.name, c[key], c.region, c.listing_date, c.listing_year,
      c.avg_3y.revenue, c.avg_3y.net_profit, c.avg_3y.roe, c.avg_3y.gross_margin,
      c.last_full_year.revenue, c.last_full_year.net_profit, c.last_full_year.roe, c.last_full_year.gross_margin, c.last_full_year.eps,
      c.data_years_count,
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => v == null ? "" : v).join(",")).join("\n");
    const bom = "\uFEFF";
    const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "北交所上市前财务分析.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Company detail chart data
  const companyChartData = useMemo(() => {
    if (!selectedCompany) return [];
    return Object.entries(selectedCompany.pre_ipo_data)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([year, data]) => ({
        year,
        营业收入: data.revenue,
        净利润: data.net_profit,
        毛利率: data.gross_margin,
        ROE: data.roe,
        EPS: data.eps,
      }));
  }, [selectedCompany]);

  // Pie chart data for industry distribution
  const pieData = useMemo(() => {
    return industries.slice(0, 10).map((ind, i) => ({
      name: ind.name.length > 6 ? ind.name.substring(0, 6) + "..." : ind.name,
      fullName: ind.name,
      value: ind.count,
      color: COLORS[i % COLORS.length],
    }));
  }, [industries]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">加载307家北交所公司数据...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                📊 北交所上市前财务分析
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                覆盖 {companies.length} 家北交所上市公司 · 上市前三年财务数据 · 行业对标
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={exportCSV} className="border-cyan-800 text-cyan-400 hover:bg-cyan-950">
                <Download className="mr-1 h-4 w-4" /> 导出CSV
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card className="bg-slate-900/60 border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <Building2 className="h-4 w-4" /> 公司总数
              </div>
              <div className="text-2xl font-bold text-cyan-400 mt-1">{summary.total}</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/60 border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <TrendingUp className="h-4 w-4" /> 三年平均营收
              </div>
              <div className="text-2xl font-bold text-emerald-400 mt-1">{formatNumber(summary.avgRevenue)}</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/60 border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <BarChart3 className="h-4 w-4" /> 三年平均净利润
              </div>
              <div className="text-2xl font-bold text-blue-400 mt-1">{formatNumber(summary.avgProfit)}</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/60 border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <Target className="h-4 w-4" /> 三年平均ROE
              </div>
              <div className="text-2xl font-bold text-amber-400 mt-1">{formatPercent(summary.avgRoe)}</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/60 border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <Layers className="h-4 w-4" /> 三年平均毛利率
              </div>
              <div className="text-2xl font-bold text-purple-400 mt-1">{formatPercent(summary.avgMargin)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="companies" className="space-y-6">
          <TabsList className="bg-slate-900 border-slate-800">
            <TabsTrigger value="companies" className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white">
              📋 公司列表 ({filtered.length})
            </TabsTrigger>
            <TabsTrigger value="distribution" className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white">
              📈 行业分布
            </TabsTrigger>
            <TabsTrigger value="benchmark" className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white">
              🎯 行业对标
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Company List */}
          <TabsContent value="companies" className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  placeholder="搜索公司名称或代码..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-10 bg-slate-900 border-slate-700"
                />
              </div>
              <Select value={selectedClassification} onValueChange={v => {
                setSelectedClassification(v as "csrc" | "em");
                setSelectedIndustry("all");
              }}>
                <SelectTrigger className="w-48 bg-slate-900 border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csrc">证监会行业分类</SelectItem>
                  <SelectItem value="em">东财行业分类</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
                <SelectTrigger className="w-64 bg-slate-900 border-slate-700">
                  <SelectValue placeholder="全部行业" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部行业 ({companies.length})</SelectItem>
                  {industries.map(ind => (
                    <SelectItem key={ind.name} value={ind.name}>
                      {ind.name} ({ind.count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedIndustry !== "all" && (
              <Badge variant="outline" className="border-cyan-700 text-cyan-400">
                {selectedIndustry}
                <button onClick={() => setSelectedIndustry("all")} className="ml-1 hover:text-cyan-300">✕</button>
              </Badge>
            )}

            {/* Table */}
            <div className="rounded-lg border border-slate-800 overflow-auto max-h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700 hover:bg-slate-800/50">
                    <TableHead className="text-slate-400">代码</TableHead>
                    <TableHead className="text-slate-400">名称</TableHead>
                    <TableHead className="text-slate-400">
                      <button className="flex items-center" onClick={() => handleSort(selectedClassification === "csrc" ? "industry" : "em_industry")}>
                        行业 <SortIcon field={selectedClassification === "csrc" ? "industry" : "em_industry"} />
                      </button>
                    </TableHead>
                    <TableHead className="text-slate-400">地区</TableHead>
                    <TableHead className="text-slate-400">
                      <button className="flex items-center" onClick={() => handleSort("listing_year")}>
                        上市年份 <SortIcon field="listing_year" />
                      </button>
                    </TableHead>
                    <TableHead className="text-slate-400 text-right">
                      <button className="flex items-center justify-end" onClick={() => handleSort("avg_revenue")}>
                        3年平均营收 <SortIcon field="avg_revenue" />
                      </button>
                    </TableHead>
                    <TableHead className="text-slate-400 text-right">
                      <button className="flex items-center justify-end" onClick={() => handleSort("avg_profit")}>
                        3年平均净利润 <SortIcon field="avg_profit" />
                      </button>
                    </TableHead>
                    <TableHead className="text-slate-400 text-right">
                      <button className="flex items-center justify-end" onClick={() => handleSort("avg_margin")}>
                        3年平均毛利率 <SortIcon field="avg_margin" />
                      </button>
                    </TableHead>
                    <TableHead className="text-slate-400 text-right">
                      <button className="flex items-center justify-end" onClick={() => handleSort("avg_roe")}>
                        3年平均ROE <SortIcon field="avg_roe" />
                      </button>
                    </TableHead>
                    <TableHead className="text-slate-400 text-right">
                      <button className="flex items-center justify-end" onClick={() => handleSort("last_revenue")}>
                        上市前一年营收 <SortIcon field="last_revenue" />
                      </button>
                    </TableHead>
                    <TableHead className="text-slate-400 text-right">
                      <button className="flex items-center justify-end" onClick={() => handleSort("last_profit")}>
                        上市前一年净利润 <SortIcon field="last_profit" />
                      </button>
                    </TableHead>
                    <TableHead className="text-slate-400 text-center">数据</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((company) => {
                    const industryKey = selectedClassification === "csrc" ? "industry" : "em_industry";
                    return (
                      <TableRow
                        key={company.code}
                        className="border-slate-700/50 hover:bg-slate-800/50 cursor-pointer"
                        onClick={() => setSelectedCompany(company)}
                      >
                        <TableCell className="text-cyan-400 font-mono text-sm">{company.code}</TableCell>
                        <TableCell className="font-medium text-white">{company.name}</TableCell>
                        <TableCell className="text-slate-300 text-xs max-w-[160px] truncate">{company[industryKey]}</TableCell>
                        <TableCell className="text-slate-400 text-xs">{company.region}</TableCell>
                        <TableCell className="text-slate-400">{company.listing_year}</TableCell>
                        <TableCell className="text-right text-emerald-400 font-mono text-sm">
                          {formatNumber(company.avg_3y.revenue)}
                        </TableCell>
                        <TableCell className={`text-right font-mono text-sm ${(company.avg_3y.net_profit || 0) >= 0 ? "text-blue-400" : "text-red-400"}`}>
                          {formatNumber(company.avg_3y.net_profit)}
                        </TableCell>
                        <TableCell className="text-right text-purple-400 font-mono text-sm">
                          {formatPercent(company.avg_3y.gross_margin)}
                        </TableCell>
                        <TableCell className={`text-right font-mono text-sm ${(company.avg_3y.roe || 0) >= 0 ? "text-amber-400" : "text-red-400"}`}>
                          {formatPercent(company.avg_3y.roe)}
                        </TableCell>
                        <TableCell className="text-right text-emerald-300/70 font-mono text-sm">
                          {formatNumber(company.last_full_year.revenue)}
                        </TableCell>
                        <TableCell className={`text-right font-mono text-sm ${(company.last_full_year.net_profit || 0) >= 0 ? "text-blue-300/70" : "text-red-300/70"}`}>
                          {formatNumber(company.last_full_year.net_profit)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="text-xs bg-slate-800">
                            {company.data_years_count}年
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <div className="text-sm text-slate-500">显示 {filtered.length} / {companies.length} 家公司</div>
          </TabsContent>

          {/* Tab 2: Industry Distribution */}
          <TabsContent value="distribution" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-slate-900/60 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-lg text-white">行业公司数量分布（Top 15）</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={industryChartData} layout="vertical" margin={{ left: 120 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                      <YAxis type="category" dataKey="name" width={110} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: 8 }}
                        formatter={(value: number, name: string) => {
                          if (name === "count") return [value, "公司数量"];
                          return [formatNumber(value), "平均营收"];
                        }}
                        labelFormatter={(label) => {
                          const item = industryChartData.find(d => d.name === label);
                          return item?.fullName || label;
                        }}
                      />
                      <Bar dataKey="count" fill="#06b6d4" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/60 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-lg text-white">行业占比分布</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                        outerRadius={140}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: 8 }}
                        formatter={(value: number) => [value + "家", "公司数量"]}
                        labelFormatter={(label) => {
                          const item = pieData.find(d => d.name === label);
                          return item?.fullName || label;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/60 border-slate-800 md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg text-white">各行业上市前三年平均营收对比</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={industryChartData} margin={{ left: 120 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={v => formatNumber(v)} />
                      <YAxis type="category" dataKey="name" width={110} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: 8 }}
                        formatter={(value: number) => [formatNumber(value), "平均营收"]}
                        labelFormatter={(label) => {
                          const item = industryChartData.find(d => d.name === label);
                          return item?.fullName || label;
                        }}
                      />
                      <Bar dataKey="avgRevenue" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="平均营收" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab 3: Industry Benchmark */}
          <TabsContent value="benchmark" className="space-y-6">
            {/* Industry selector for benchmark */}
            <div className="flex flex-col md:flex-row gap-3">
              <Select value={comparisonIndustry} onValueChange={setComparisonIndustry}>
                <SelectTrigger className="w-72 bg-slate-900 border-slate-700">
                  <SelectValue placeholder="选择行业查看对标" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(comparison).sort().map(ind => (
                    <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {compData && compData.length > 0 ? (
              <>
                {/* Benchmark summary cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(["ashare", "bse", "neeq"] as const).map(market => {
                    const latest = compData[compData.length - 1];
                    const labels = { ashare: "A股", bse: "北交所", neeq: "新三板" };
                    const colors = { ashare: "from-blue-500/20 to-blue-600/5", bse: "from-cyan-500/20 to-cyan-600/5", neeq: "from-purple-500/20 to-purple-600/5" };
                    const borderColors = { ashare: "border-blue-800", bse: "border-cyan-800", neeq: "border-purple-800" };
                    const textColors = { ashare: "text-blue-400", bse: "text-cyan-400", neeq: "text-purple-400" };
                    return (
                      <Card className={`bg-gradient-to-br ${colors[market]} border ${borderColors[market]}`}>
                        <CardHeader className="pb-2">
                          <CardTitle className={`text-lg ${textColors[market]}`}>
                            {labels[market]} · {comparisonIndustry}
                          </CardTitle>
                          <CardDescription className="text-slate-400">
                            {latest[`${market}公司数` as keyof typeof latest] as number} 家公司 · {compData[0].year}年报
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-slate-400">平均营收</span>
                              <span className={textColors[market]}>{formatNumber(latest[`${market}均值营收` as keyof typeof latest] as number)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">中位营收</span>
                              <span className="text-slate-300">{formatNumber(null)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">平均毛利率</span>
                              <span className={textColors[market]}>{formatPercent(latest[`${market}毛利率` as keyof typeof latest] as number)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">平均ROE</span>
                              <span className={textColors[market]}>{formatPercent(latest[`${market}ROE` as keyof typeof latest] as number)}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Revenue comparison bar chart */}
                  <Card className="bg-slate-900/60 border-slate-800">
                    <CardHeader>
                      <CardTitle className="text-lg text-white">三市场营收对比</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={compData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                          <XAxis dataKey="year" tick={{ fill: '#94a3b8' }} />
                          <YAxis tick={{ fill: '#94a3b8' }} tickFormatter={v => formatNumber(v)} />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: 8 }}
                            formatter={(value: number) => formatNumber(value)}
                          />
                          <Legend />
                          <Bar dataKey="A股均值营收" fill="#3b82f6" />
                          <Bar dataKey="北交所均值营收" fill="#06b6d4" />
                          <Bar dataKey="新三板均值营收" fill="#8b5cf6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Radar chart */}
                  <Card className="bg-slate-900/60 border-slate-800">
                    <CardHeader>
                      <CardTitle className="text-lg text-white">综合指标雷达图</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <RadarChart data={radarData}>
                          <PolarGrid stroke="#334155" />
                          <PolarAngleAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                          <PolarRadiusAxis tick={{ fill: '#64748b' }} />
                          <Radar name="A股" dataKey="A股" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                          <Radar name="北交所" dataKey="北交所" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.3} />
                          <Radar name="新三板" dataKey="新三板" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
                          <Legend />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: 8 }}
                            formatter={(value: number) => value.toFixed(2)}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Gross margin comparison */}
                  <Card className="bg-slate-900/60 border-slate-800">
                    <CardHeader>
                      <CardTitle className="text-lg text-white">三市场毛利率对比</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={compData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                          <XAxis dataKey="year" tick={{ fill: '#94a3b8' }} />
                          <YAxis tick={{ fill: '#94a3b8' }} tickFormatter={v => v + "%"} />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: 8 }}
                            formatter={(value: number) => value + "%"}
                          />
                          <Legend />
                          <Bar dataKey="A股毛利率" fill="#3b82f6" />
                          <Bar dataKey="北交所毛利率" fill="#06b6d4" />
                          <Bar dataKey="新三板毛利率" fill="#8b5cf6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* ROE comparison */}
                  <Card className="bg-slate-900/60 border-slate-800">
                    <CardHeader>
                      <CardTitle className="text-lg text-white">三市场ROE对比</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={compData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                          <XAxis dataKey="year" tick={{ fill: '#94a3b8' }} />
                          <YAxis tick={{ fill: '#94a3b8' }} tickFormatter={v => v + "%"} />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: 8 }}
                            formatter={(value: number) => value + "%"}
                          />
                          <Legend />
                          <Bar dataKey="A股ROE" fill="#3b82f6" />
                          <Bar dataKey="北交所ROE" fill="#06b6d4" />
                          <Bar dataKey="新三板ROE" fill="#8b5cf6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Detail comparison table */}
                <Card className="bg-slate-900/60 border-slate-800">
                  <CardHeader>
                    <CardTitle className="text-lg text-white">对标数据明细表</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-lg border border-slate-700 overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-slate-700 hover:bg-slate-800/50">
                            <TableHead className="text-slate-400">指标</TableHead>
                            <TableHead className="text-slate-400 text-blue-400">A股</TableHead>
                            <TableHead className="text-slate-400 text-cyan-400">北交所</TableHead>
                            <TableHead className="text-slate-400 text-purple-400">新三板</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {compData.map(row => (
                            <>
                              <TableRow key={row.year + "-header"} className="border-slate-700/50 bg-slate-800/30">
                                <TableCell colSpan={4} className="font-bold text-white">{row.year} 年报</TableCell>
                              </TableRow>
                              <TableRow key={row.year + "-count"} className="border-slate-700/50 hover:bg-slate-800/50">
                                <TableCell className="text-slate-400">公司数量</TableCell>
                                <TableCell className="text-blue-400">{row["A股公司数"]}</TableCell>
                                <TableCell className="text-cyan-400">{row["北交所公司数"]}</TableCell>
                                <TableCell className="text-purple-400">{row["新三板公司数"]}</TableCell>
                              </TableRow>
                              <TableRow key={row.year + "-rev"} className="border-slate-700/50 hover:bg-slate-800/50">
                                <TableCell className="text-slate-400">平均营收</TableCell>
                                <TableCell className="text-blue-400 font-mono">{formatNumber(row["A股均值营收"])}</TableCell>
                                <TableCell className="text-cyan-400 font-mono">{formatNumber(row["北交所均值营收"])}</TableCell>
                                <TableCell className="text-purple-400 font-mono">{formatNumber(row["新三板均值营收"])}</TableCell>
                              </TableRow>
                              <TableRow key={row.year + "-margin"} className="border-slate-700/50 hover:bg-slate-800/50">
                                <TableCell className="text-slate-400">平均毛利率</TableCell>
                                <TableCell className="text-blue-400 font-mono">{formatPercent(row["A股毛利率"])}</TableCell>
                                <TableCell className="text-cyan-400 font-mono">{formatPercent(row["北交所毛利率"])}</TableCell>
                                <TableCell className="text-purple-400 font-mono">{formatPercent(row["新三板毛利率"])}</TableCell>
                              </TableRow>
                              <TableRow key={row.year + "-roe"} className="border-slate-700/50 hover:bg-slate-800/50">
                                <TableCell className="text-slate-400">平均ROE</TableCell>
                                <TableCell className="text-blue-400 font-mono">{formatPercent(row["A股ROE"])}</TableCell>
                                <TableCell className="text-cyan-400 font-mono">{formatPercent(row["北交所ROE"])}</TableCell>
                                <TableCell className="text-purple-400 font-mono">{formatPercent(row["新三板ROE"])}</TableCell>
                              </TableRow>
                            </>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="bg-slate-900/60 border-slate-800">
                <CardContent className="py-12 text-center text-slate-500">
                  请选择一个行业查看对标数据
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Company Detail Dialog - Full Screen */}
      <Dialog open={!!selectedCompany} onOpenChange={() => setSelectedCompany(null)}>
        <DialogContent className="w-[95vw] max-w-[95vw] h-[90vh] overflow-auto bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-2xl text-white">
              {selectedCompany?.name}（{selectedCompany?.code}）
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-base">
              {selectedCompany?.industry} · {selectedCompany?.region} · 上市日期 {selectedCompany?.listing_date}
            </DialogDescription>
          </DialogHeader>

          {selectedCompany && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-slate-800/80 to-slate-800/40 rounded-lg p-4 border border-slate-700">
                  <div className="text-sm text-slate-400 mb-1">上市前一年营收</div>
                  <div className="text-2xl font-bold text-emerald-400">{formatNumber(selectedCompany.last_full_year.revenue)}</div>
                  <div className="text-xs text-slate-500 mt-1">{selectedCompany.last_full_year.year}年报</div>
                </div>
                <div className="bg-gradient-to-br from-slate-800/80 to-slate-800/40 rounded-lg p-4 border border-slate-700">
                  <div className="text-sm text-slate-400 mb-1">上市前一年净利润</div>
                  <div className={`text-2xl font-bold ${(selectedCompany.last_full_year.net_profit || 0) >= 0 ? "text-blue-400" : "text-red-400"}`}>
                    {formatNumber(selectedCompany.last_full_year.net_profit)}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">净利率: {selectedCompany.last_full_year.net_profit && selectedCompany.last_full_year.revenue ? 
                    ((selectedCompany.last_full_year.net_profit / selectedCompany.last_full_year.revenue) * 100).toFixed(2) + "%" : "-"}</div>
                </div>
                <div className="bg-gradient-to-br from-slate-800/80 to-slate-800/40 rounded-lg p-4 border border-slate-700">
                  <div className="text-sm text-slate-400 mb-1">上市前一年毛利率</div>
                  <div className="text-2xl font-bold text-purple-400">{formatPercent(selectedCompany.last_full_year.gross_margin)}</div>
                  <div className="text-xs text-slate-500 mt-1">毛利率=毛利/营收</div>
                </div>
                <div className="bg-gradient-to-br from-slate-800/80 to-slate-800/40 rounded-lg p-4 border border-slate-700">
                  <div className="text-sm text-slate-400 mb-1">上市前一年ROE</div>
                  <div className={`text-2xl font-bold ${(selectedCompany.last_full_year.roe || 0) >= 0 ? "text-amber-400" : "text-red-400"}`}>
                    {formatPercent(selectedCompany.last_full_year.roe)}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">净资产收益率</div>
                </div>
              </div>

              {/* Three-year average */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-cyan-900/30 to-cyan-900/10 rounded-lg p-4 border border-cyan-800">
                  <div className="text-sm text-cyan-400 mb-1">上市前三年平均营收</div>
                  <div className="text-xl font-bold text-cyan-300">{formatNumber(selectedCompany.avg_3y.revenue)}</div>
                </div>
                <div className="bg-gradient-to-br from-blue-900/30 to-blue-900/10 rounded-lg p-4 border border-blue-800">
                  <div className="text-sm text-blue-400 mb-1">上市前三年平均净利润</div>
                  <div className={`text-xl font-bold ${(selectedCompany.avg_3y.net_profit || 0) >= 0 ? "text-blue-300" : "text-red-300"}`}>
                    {formatNumber(selectedCompany.avg_3y.net_profit)}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-purple-900/30 to-purple-900/10 rounded-lg p-4 border border-purple-800">
                  <div className="text-sm text-purple-400 mb-1">上市前三年平均毛利率</div>
                  <div className="text-xl font-bold text-purple-300">{formatPercent(selectedCompany.avg_3y.gross_margin)}</div>
                </div>
                <div className="bg-gradient-to-br from-amber-900/30 to-amber-900/10 rounded-lg p-4 border border-amber-800">
                  <div className="text-sm text-amber-400 mb-1">上市前三年平均ROE</div>
                  <div className={`text-xl font-bold ${(selectedCompany.avg_3y.roe || 0) >= 0 ? "text-amber-300" : "text-red-300"}`}>
                    {formatPercent(selectedCompany.avg_3y.roe)}
                  </div>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base text-slate-200">📈 营收与净利润趋势（上市前）</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={companyChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="year" tick={{ fill: '#94a3b8', fontSize: 13 }} />
                        <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={v => formatNumber(v)} />
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} formatter={(v: number) => formatNumber(v)} />
                        <Legend />
                        <Bar dataKey="营业收入" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="净利润" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base text-slate-200">📊 毛利率与ROE趋势（上市前）</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={companyChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="year" tick={{ fill: '#94a3b8', fontSize: 13 }} />
                        <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={v => v + "%"} />
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} formatter={(v: number) => v + "%"} />
                        <Legend />
                        <Bar dataKey="毛利率" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="ROE" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Company info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <div className="text-sm text-slate-400 mb-2">🏢 公司基本信息</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">公司全称</span>
                      <span className="text-white">{selectedCompany.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">股票代码</span>
                      <span className="text-cyan-400 font-mono">{selectedCompany.code}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">上市日期</span>
                      <span className="text-white">{selectedCompany.listing_date}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">上市年份</span>
                      <span className="text-white">{selectedCompany.listing_year}年</span>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <div className="text-sm text-slate-400 mb-2">🏭 行业分类</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">证监会行业</span>
                      <span className="text-white text-right max-w-[150px] truncate" title={selectedCompany.industry}>{selectedCompany.industry}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">东财行业</span>
                      <span className="text-cyan-400 text-right max-w-[150px] truncate" title={selectedCompany.em_industry}>{selectedCompany.em_industry}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">所在地区</span>
                      <span className="text-white">{selectedCompany.region}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">数据年数</span>
                      <span className="text-white">{selectedCompany.data_years_count}年</span>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <div className="text-sm text-slate-400 mb-2">📊 股本信息</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">总股本</span>
                      <span className="text-white">{selectedCompany.total_shares ? formatNumber(selectedCompany.total_shares) : "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">流通股本</span>
                      <span className="text-cyan-400">{selectedCompany.float_shares ? formatNumber(selectedCompany.float_shares) : "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">数据年份</span>
                      <span className="text-white">{selectedCompany.data_years.join(", ")}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detail table */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-slate-200">📋 历年财务明细（上市前）</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg border border-slate-600 overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-slate-600 hover:bg-slate-700/50">
                          <TableHead className="text-slate-300">年份</TableHead>
                          <TableHead className="text-slate-300 text-right">营业收入</TableHead>
                          <TableHead className="text-slate-300 text-right">营收同比</TableHead>
                          <TableHead className="text-slate-300 text-right">净利润</TableHead>
                          <TableHead className="text-slate-300 text-right">利润同比</TableHead>
                          <TableHead className="text-slate-300 text-right">毛利率</TableHead>
                          <TableHead className="text-slate-300 text-right">ROE</TableHead>
                          <TableHead className="text-slate-300 text-right">每股收益</TableHead>
                          <TableHead className="text-slate-300 text-right">每股净资产</TableHead>
                          <TableHead className="text-slate-300 text-right">每股现金流</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.entries(selectedCompany.pre_ipo_data)
                          .sort(([a], [b]) => b.localeCompare(a))
                          .map(([year, data]) => (
                            <TableRow key={year} className="border-slate-700/50 hover:bg-slate-700/30">
                              <TableCell className="text-white font-bold text-lg">{year}</TableCell>
                              <TableCell className="text-right text-emerald-400 font-mono">{formatNumber(data.revenue)}</TableCell>
                              <TableCell className={`text-right font-mono ${(data.revenue_yoy || 0) >= 0 ? "text-green-400" : "text-red-400"}`}>
                                {data.revenue_yoy != null ? (data.revenue_yoy > 0 ? "+" : "") + data.revenue_yoy.toFixed(2) + "%" : "-"}
                              </TableCell>
                              <TableCell className={`text-right font-mono ${(data.net_profit || 0) >= 0 ? "text-blue-400" : "text-red-400"}`}>
                                {formatNumber(data.net_profit)}
                              </TableCell>
                              <TableCell className={`text-right font-mono ${(data.net_profit_yoy || 0) >= 0 ? "text-green-400" : "text-red-400"}`}>
                                {data.net_profit_yoy != null ? (data.net_profit_yoy > 0 ? "+" : "") + data.net_profit_yoy.toFixed(2) + "%" : "-"}
                              </TableCell>
                              <TableCell className="text-right text-purple-400 font-mono">{formatPercent(data.gross_margin)}</TableCell>
                              <TableCell className={`text-right font-mono ${(data.roe || 0) >= 0 ? "text-amber-400" : "text-red-400"}`}>
                                {formatPercent(data.roe)}
                              </TableCell>
                              <TableCell className="text-right text-slate-200 font-mono">{data.eps != null ? data.eps.toFixed(4) : "-"}</TableCell>
                              <TableCell className="text-right text-slate-200 font-mono">{data.bvps != null ? data.bvps.toFixed(2) : "-"}</TableCell>
                              <TableCell className="text-right text-slate-200 font-mono">{data.cash_per_share != null ? data.cash_per_share.toFixed(2) : "-"}</TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
