import { useState, useEffect } from "react";
import { Link } from "wouter";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Building2,
  Calendar,
  DollarSign,
  PieChart,
  Search,
  Download,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

interface PreIPOCompany {
  company_name: string;
  stock_code: string;
  listing_date: string;
  pre_ipo_3year_avg_revenue: number;
  pre_ipo_3year_avg_profit: number;
  pre_ipo_last_year_revenue: number;
  pre_ipo_last_year_profit: number;
  historical_data: Array<{
    year: number;
    revenue: number;
    net_profit: number;
  }>;
}

// 格式化金额
const formatAmount = (amount: number | null | undefined) => {
  if (amount === null || amount === undefined) return "-";
  const absAmount = Math.abs(amount);
  if (absAmount >= 100000000) {
    return `${(amount / 100000000).toFixed(2)}亿`;
  } else if (absAmount >= 10000) {
    return `${(amount / 10000).toFixed(2)}万`;
  }
  return amount.toFixed(2);
};

// 格式化大金额（以亿为单位）
const formatYi = (amount: number | null | undefined) => {
  if (amount === null || amount === undefined) return "-";
  return `${(amount / 100000000).toFixed(2)}`;
};

export default function PreIPOFinancial() {
  const [companies, setCompanies] = useState<PreIPOCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: keyof PreIPOCompany;
    direction: "asc" | "desc";
  } | null>({ key: "pre_ipo_last_year_revenue", direction: "desc" });
  const [selectedCompany, setSelectedCompany] = useState<PreIPOCompany | null>(null);

  useEffect(() => {
    fetch("/neeq_pre_ipo_financial_data.json")
      .then((res) => res.json())
      .then((data) => {
        setCompanies(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load data:", err);
        setLoading(false);
      });
  }, []);

  // 排序处理
  const handleSort = (key: keyof PreIPOCompany) => {
    let direction: "asc" | "desc" = "desc";
    if (sortConfig?.key === key && sortConfig.direction === "desc") {
      direction = "asc";
    }
    setSortConfig({ key, direction });
  };

  // 过滤和排序数据
  const filteredAndSortedCompanies = companies
    .filter((company) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        company.company_name.toLowerCase().includes(searchLower) ||
        company.stock_code.toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => {
      if (!sortConfig) return 0;
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;
      
      if (sortConfig.direction === "asc") {
        return aValue > bValue ? 1 : -1;
      }
      return aValue < bValue ? 1 : -1;
    });

  // 计算统计数据
  const stats = {
    total: companies.length,
    avgRevenue: companies.length > 0
      ? companies.reduce((sum, c) => sum + (c.pre_ipo_3year_avg_revenue || 0), 0) / companies.length
      : 0,
    avgProfit: companies.length > 0
      ? companies.reduce((sum, c) => sum + (c.pre_ipo_3year_avg_profit || 0), 0) / companies.length
      : 0,
    avgLastYearRevenue: companies.length > 0
      ? companies.reduce((sum, c) => sum + (c.pre_ipo_last_year_revenue || 0), 0) / companies.length
      : 0,
    avgLastYearProfit: companies.length > 0
      ? companies.reduce((sum, c) => sum + (c.pre_ipo_last_year_profit || 0), 0) / companies.length
      : 0,
  };

  // 导出CSV
  const exportCSV = () => {
    const headers = [
      "公司名称",
      "股票代码",
      "上市日期",
      "上市前三年平均营收(元)",
      "上市前三年平均净利润(元)",
      "上市前一年营收(元)",
      "上市前一年净利润(元)",
    ];
    const rows = filteredAndSortedCompanies.map((c) => [
      c.company_name,
      c.stock_code,
      c.listing_date,
      c.pre_ipo_3year_avg_revenue || "",
      c.pre_ipo_3year_avg_profit || "",
      c.pre_ipo_last_year_revenue || "",
      c.pre_ipo_last_year_profit || "",
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `上市前财务分析_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">加载数据中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-700/50 sticky top-0 z-50 bg-slate-950/95 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                  <ArrowLeft size={20} />
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <BarChart3 size={20} className="text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">上市前财务分析</h1>
                  <p className="text-xs text-gray-500">北交所上市公司上市前三年及前一年财务数据</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={exportCSV}
                className="border-slate-600 text-gray-300 hover:bg-slate-800"
              >
                <Download size={16} className="mr-2" />
                导出数据
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-6">
        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">分析公司数</p>
                  <p className="text-2xl font-bold text-white">{stats.total}</p>
                </div>
                <Building2 className="text-cyan-500" size={24} />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">前三年平均营收</p>
                  <p className="text-2xl font-bold text-emerald-400">{formatAmount(stats.avgRevenue)}</p>
                </div>
                <TrendingUp className="text-emerald-500" size={24} />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">前三年平均净利润</p>
                  <p className="text-2xl font-bold text-blue-400">{formatAmount(stats.avgProfit)}</p>
                </div>
                <DollarSign className="text-blue-500" size={24} />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">前一年平均营收</p>
                  <p className="text-2xl font-bold text-purple-400">{formatAmount(stats.avgLastYearRevenue)}</p>
                </div>
                <Calendar className="text-purple-500" size={24} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 搜索 */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <Input
              placeholder="搜索公司名称或股票代码..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-900/50 border-slate-700 text-white placeholder:text-gray-600"
            />
          </div>
        </div>

        {/* 公司列表表格 */}
        <Card className="bg-slate-900/50 border-slate-700/50 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <PieChart size={20} className="text-cyan-500" />
              公司列表
              <span className="text-sm font-normal text-gray-500">
                (共 {filteredAndSortedCompanies.length} 家)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700 hover:bg-transparent">
                    <TableHead className="text-gray-400">公司名称</TableHead>
                    <TableHead className="text-gray-400">股票代码</TableHead>
                    <TableHead className="text-gray-400">上市日期</TableHead>
                    <TableHead
                      className="text-gray-400 cursor-pointer hover:text-white"
                      onClick={() => handleSort("pre_ipo_3year_avg_revenue")}
                    >
                      <div className="flex items-center gap-1">
                        前三年平均营收
                        {sortConfig?.key === "pre_ipo_3year_avg_revenue" &&
                          (sortConfig.direction === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                      </div>
                    </TableHead>
                    <TableHead
                      className="text-gray-400 cursor-pointer hover:text-white"
                      onClick={() => handleSort("pre_ipo_3year_avg_profit")}
                    >
                      <div className="flex items-center gap-1">
                        前三年平均净利润
                        {sortConfig?.key === "pre_ipo_3year_avg_profit" &&
                          (sortConfig.direction === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                      </div>
                    </TableHead>
                    <TableHead
                      className="text-gray-400 cursor-pointer hover:text-white"
                      onClick={() => handleSort("pre_ipo_last_year_revenue")}
                    >
                      <div className="flex items-center gap-1">
                        前一年营收
                        {sortConfig?.key === "pre_ipo_last_year_revenue" &&
                          (sortConfig.direction === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                      </div>
                    </TableHead>
                    <TableHead
                      className="text-gray-400 cursor-pointer hover:text-white"
                      onClick={() => handleSort("pre_ipo_last_year_profit")}
                    >
                      <div className="flex items-center gap-1">
                        前一年净利润
                        {sortConfig?.key === "pre_ipo_last_year_profit" &&
                          (sortConfig.direction === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                      </div>
                    </TableHead>
                    <TableHead className="text-gray-400">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedCompanies.map((company) => (
                    <TableRow key={company.stock_code} className="border-slate-700/50 hover:bg-slate-800/50">
                      <TableCell className="font-medium text-white">{company.company_name}</TableCell>
                      <TableCell className="text-cyan-400">{company.stock_code}</TableCell>
                      <TableCell className="text-gray-400">{company.listing_date}</TableCell>
                      <TableCell className="text-emerald-400">
                        {formatAmount(company.pre_ipo_3year_avg_revenue)}
                      </TableCell>
                      <TableCell className={company.pre_ipo_3year_avg_profit >= 0 ? "text-blue-400" : "text-red-400"}>
                        {formatAmount(company.pre_ipo_3year_avg_profit)}
                      </TableCell>
                      <TableCell className="text-purple-400">
                        {formatAmount(company.pre_ipo_last_year_revenue)}
                      </TableCell>
                      <TableCell className={company.pre_ipo_last_year_profit >= 0 ? "text-green-400" : "text-red-400"}>
                        {formatAmount(company.pre_ipo_last_year_profit)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedCompany(company)}
                          className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                        >
                          详情
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* 选中公司详情 */}
        {selectedCompany && (
          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2">
                <Building2 size={20} className="text-cyan-500" />
                {selectedCompany.company_name} ({selectedCompany.stock_code})
                <span className="text-sm font-normal text-gray-500">
                  上市日期: {selectedCompany.listing_date}
                </span>
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedCompany(null)}
                className="text-gray-400 hover:text-white"
              >
                关闭
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 三年财务趋势图 */}
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
                    <TrendingUp size={16} />
                    上市前三年营收趋势 (单位: 亿元)
                  </h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={selectedCompany.historical_data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="year" stroke="#64748b" />
                        <YAxis
                          stroke="#64748b"
                          tickFormatter={(value) => `${(value / 100000000).toFixed(1)}`}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1e293b",
                            border: "1px solid #334155",
                            borderRadius: "8px",
                          }}
                          formatter={(value: number) => [formatAmount(value), "营业收入"]
                          }
                          labelStyle={{ color: "#94a3b8" }}
                        />
                        <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 净利润趋势图 */}
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
                    <TrendingDown size={16} />
                    上市前三年净利润趋势 (单位: 亿元)
                  </h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={selectedCompany.historical_data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="year" stroke="#64748b" />
                        <YAxis
                          stroke="#64748b"
                          tickFormatter={(value) => `${(value / 100000000).toFixed(1)}`}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1e293b",
                            border: "1px solid #334155",
                            borderRadius: "8px",
                          }}
                          formatter={(value: number) => [formatAmount(value), "净利润"]
                          }
                          labelStyle={{ color: "#94a3b8" }}
                        />
                        <Line
                          type="monotone"
                          dataKey="net_profit"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          dot={{ fill: "#3b82f6", strokeWidth: 2 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* 详细数据表格 */}
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-400 mb-4">历年财务详情</h4>
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700">
                      <TableHead className="text-gray-400">年度</TableHead>
                      <TableHead className="text-gray-400">营业收入</TableHead>
                      <TableHead className="text-gray-400">净利润</TableHead>
                      <TableHead className="text-gray-400">净利率</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedCompany.historical_data.map((data) => {
                      const profitMargin = data.revenue > 0
                        ? ((data.net_profit / data.revenue) * 100).toFixed(2)
                        : "-";
                      return (
                        <TableRow key={data.year} className="border-slate-700/50">
                          <TableCell className="text-white font-medium">{data.year}年</TableCell>
                          <TableCell className="text-emerald-400">{formatAmount(data.revenue)}</TableCell>
                          <TableCell className={data.net_profit >= 0 ? "text-blue-400" : "text-red-400"}>
                            {formatAmount(data.net_profit)}
                          </TableCell>
                          <TableCell className={parseFloat(profitMargin) >= 0 ? "text-green-400" : "text-red-400"}>
                            {profitMargin}%
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* 汇总统计 */}
              <div className="mt-6 p-4 bg-slate-800/50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                  <Info size={16} />
                  上市前财务汇总
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">前三年平均营收</p>
                    <p className="text-lg font-semibold text-white">
                      {formatAmount(selectedCompany.pre_ipo_3year_avg_revenue)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">前三年平均净利润</p>
                    <p className={`text-lg font-semibold ${selectedCompany.pre_ipo_3year_avg_profit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {formatAmount(selectedCompany.pre_ipo_3year_avg_profit)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">前一年营收</p>
                    <p className="text-lg font-semibold text-white">
                      {formatAmount(selectedCompany.pre_ipo_last_year_revenue)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">前一年净利润</p>
                    <p className={`text-lg font-semibold ${selectedCompany.pre_ipo_last_year_profit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {formatAmount(selectedCompany.pre_ipo_last_year_profit)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 数据来源说明 */}
        <div className="mt-6 p-4 bg-slate-800/30 border border-slate-700/30 rounded-lg">
          <p className="text-xs text-gray-500 flex items-center gap-2">
            <Info size={14} />
            数据来源：东方财富网、同花顺财经。数据仅供研究参考，不构成投资建议。
            上市前三年指上市当年之前的连续三个完整会计年度。
          </p>
        </div>
      </main>
    </div>
  );
}
