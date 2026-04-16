import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import { 
  TrendingUp, 
  Building2, 
  BarChart3, 
  Filter, 
  Download, 
  Info,
  PieChart,
  ArrowRightLeft,
  Building,
  Landmark,
  Store
} from "lucide-react";
import companiesData from "../../public/neeq_pre_ipo_with_industry.json";
import industryStats from "../../public/bse_industry_stats.json";
import industryComparison from "../../public/industry_comparison.json";

// 格式化金额
const formatMoney = (value: number) => {
  if (value >= 1e8) {
    return `${(value / 1e8).toFixed(2)}亿`;
  } else if (value >= 1e4) {
    return `${(value / 1e4).toFixed(0)}万`;
  }
  return value.toFixed(0);
};

// 行业颜色映射
const industryColors: Record<string, string> = {
  "软件和信息技术服务业": "#3b82f6",
  "化学原料和化学制品制造业": "#10b981",
  "其他制造业": "#f59e0b",
  "计算机、通信和其他电子设备制造业": "#8b5cf6",
  "医药制造业": "#ef4444",
  "专用设备制造业": "#06b6d4",
  "电气机械和器材制造业": "#84cc16",
  "汽车制造业": "#f97316"
};

export default function PreIPOFinancial() {
  const [selectedIndustry, setSelectedIndustry] = useState<string>("all");
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [comparisonIndustry, setComparisonIndustry] = useState<string | null>(null);

  // 获取所有行业列表
  const industries = useMemo(() => {
    const allIndustries = new Set(companiesData.map(c => c.industry));
    return Array.from(allIndustries).filter(Boolean).sort();
  }, []);

  // 筛选后的公司数据
  const filteredCompanies = useMemo(() => {
    if (selectedIndustry === "all") return companiesData;
    return companiesData.filter(c => c.industry === selectedIndustry);
  }, [selectedIndustry]);

  // 统计概览
  const stats = useMemo(() => {
    const totalCompanies = filteredCompanies.length;
    const avgRevenue3Yr = totalCompanies > 0 
      ? filteredCompanies.reduce((sum, c) => sum + c.pre_ipo_3year_avg_revenue, 0) / totalCompanies 
      : 0;
    const avgProfit3Yr = totalCompanies > 0 
      ? filteredCompanies.reduce((sum, c) => sum + c.pre_ipo_3year_avg_profit, 0) / totalCompanies 
      : 0;
    const avgRevenueLast = totalCompanies > 0 
      ? filteredCompanies.reduce((sum, c) => sum + c.pre_ipo_last_year_revenue, 0) / totalCompanies 
      : 0;
    const avgProfitLast = totalCompanies > 0 
      ? filteredCompanies.reduce((sum, c) => sum + c.pre_ipo_last_year_profit, 0) / totalCompanies 
      : 0;

    return {
      totalCompanies,
      avgRevenue3Yr,
      avgProfit3Yr,
      avgRevenueLast,
      avgProfitLast,
      avgMarginLast: avgRevenueLast > 0 ? (avgProfitLast / avgRevenueLast * 100) : 0
    };
  }, [filteredCompanies]);

  // 行业分布数据
  const industryDistribution = useMemo(() => {
    const distribution: Record<string, number> = {};
    companiesData.forEach(c => {
      distribution[c.industry] = (distribution[c.industry] || 0) + 1;
    });
    return Object.entries(distribution)
      .map(([name, count]) => ({ name, count, color: industryColors[name] || "#6b7280" }))
      .sort((a, b) => b.count - a.count);
  }, []);

  // 导出CSV
  const exportCSV = () => {
    const headers = ["公司名称", "股票代码", "行业", "上市日期", "3年平均营收(元)", "3年平均利润(元)", "上市前一年营收(元)", "上市前一年利润(元)"];
    const rows = filteredCompanies.map(c => [
      c.company_name,
      c.stock_code,
      c.industry,
      c.listing_date,
      c.pre_ipo_3year_avg_revenue,
      c.pre_ipo_3year_avg_profit,
      c.pre_ipo_last_year_revenue,
      c.pre_ipo_last_year_profit
    ]);
    
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `北交所上市前财务数据_${selectedIndustry === "all" ? "全部" : selectedIndustry}.csv`;
    link.click();
  };

  // 对标图表数据
  const comparisonChartData = useMemo(() => {
    if (!comparisonIndustry || !industryComparison[comparisonIndustry]) return [];
    
    const data = industryComparison[comparisonIndustry];
    return [
      {
        name: "新三板",
        revenue_3yr: data.neeq.avg_revenue_3yr / 1e8,
        profit_3yr: data.neeq.avg_profit_3yr / 1e8,
        revenue_last: data.neeq.avg_revenue_last / 1e8,
        profit_last: data.neeq.avg_profit_last / 1e8,
        margin: data.neeq.avg_margin_last
      },
      {
        name: "北交所",
        revenue_3yr: data.bse.avg_revenue_3yr / 1e8,
        profit_3yr: data.bse.avg_profit_3yr / 1e8,
        revenue_last: data.bse.avg_revenue_last / 1e8,
        profit_last: data.bse.avg_profit_last / 1e8,
        margin: data.bse.avg_margin_last
      },
      {
        name: "A股",
        revenue_3yr: data.a_stock.avg_revenue_3yr / 1e8,
        profit_3yr: data.a_stock.avg_profit_3yr / 1e8,
        revenue_last: data.a_stock.avg_revenue_last / 1e8,
        profit_last: data.a_stock.avg_profit_last / 1e8,
        margin: data.a_stock.avg_margin_last
      }
    ];
  }, [comparisonIndustry]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 页面标题 */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-cyan-400" />
              上市前财务分析
            </h1>
            <p className="text-gray-400 mt-2">
              北交所上市公司上市前三年财务数据分析与行业对标
            </p>
          </div>
          <Button 
            onClick={exportCSV}
            variant="outline" 
            className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
          >
            <Download className="w-4 h-4 mr-2" />
            导出数据
          </Button>
        </div>

        {/* 行业筛选 */}
        <Card className="bg-slate-900/50 border-slate-700/50">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              <div className="flex items-center gap-2 text-gray-300">
                <Filter className="w-5 h-5" />
                <span>行业筛选:</span>
              </div>
              <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
                <SelectTrigger className="w-[300px] bg-slate-800 border-slate-600">
                  <SelectValue placeholder="选择行业" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  <SelectItem value="all">全部行业</SelectItem>
                  {industries.map(industry => (
                    <SelectItem key={industry} value={industry}>
                      {industry} ({industryDistribution.find(d => d.name === industry)?.count || 0}家)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedIndustry !== "all" && (
                <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                  {selectedIndustry}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 统计概览 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardContent className="p-4">
              <div className="text-gray-400 text-sm">分析公司数</div>
              <div className="text-2xl font-bold text-white mt-1">{stats.totalCompanies}</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardContent className="p-4">
              <div className="text-gray-400 text-sm">3年平均营收</div>
              <div className="text-2xl font-bold text-cyan-400 mt-1">
                {formatMoney(stats.avgRevenue3Yr)}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardContent className="p-4">
              <div className="text-gray-400 text-sm">3年平均利润</div>
              <div className="text-2xl font-bold text-green-400 mt-1">
                {formatMoney(stats.avgProfit3Yr)}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardContent className="p-4">
              <div className="text-gray-400 text-sm">上市前营收</div>
              <div className="text-2xl font-bold text-blue-400 mt-1">
                {formatMoney(stats.avgRevenueLast)}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardContent className="p-4">
              <div className="text-gray-400 text-sm">平均净利率</div>
              <div className="text-2xl font-bold text-purple-400 mt-1">
                {stats.avgMarginLast.toFixed(1)}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 主要内容区域 */}
        <Tabs defaultValue="companies" className="w-full">
          <TabsList className="bg-slate-800 border-slate-700">
            <TabsTrigger value="companies" className="data-[state=active]:bg-cyan-500/20">
              <Building2 className="w-4 h-4 mr-2" />
              公司列表
            </TabsTrigger>
            <TabsTrigger value="industry" className="data-[state=active]:bg-cyan-500/20">
              <PieChart className="w-4 h-4 mr-2" />
              行业分布
            </TabsTrigger>
            <TabsTrigger value="comparison" className="data-[state=active]:bg-cyan-500/20">
              <ArrowRightLeft className="w-4 h-4 mr-2" />
              行业对标
            </TabsTrigger>
          </TabsList>

          {/* 公司列表 */}
          <TabsContent value="companies">
            <Card className="bg-slate-900/50 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Building className="w-5 h-5 text-cyan-400" />
                  公司明细
                  {selectedIndustry !== "all" && (
                    <Badge className="bg-cyan-500/20 text-cyan-400">
                      {selectedIndustry}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-700">
                        <TableHead className="text-gray-400">股票代码</TableHead>
                        <TableHead className="text-gray-400">公司名称</TableHead>
                        <TableHead className="text-gray-400">行业分类</TableHead>
                        <TableHead className="text-gray-400 text-right">3年平均营收</TableHead>
                        <TableHead className="text-gray-400 text-right">3年平均利润</TableHead>
                        <TableHead className="text-gray-400 text-right">上市前营收</TableHead>
                        <TableHead className="text-gray-400 text-right">上市前利润</TableHead>
                        <TableHead className="text-gray-400">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCompanies.map((company) => (
                        <TableRow key={company.stock_code} className="border-slate-700/50">
                          <TableCell className="font-mono text-cyan-400">
                            {company.stock_code}
                          </TableCell>
                          <TableCell className="text-white font-medium">
                            {company.company_name}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline" 
                              className="text-xs"
                              style={{ 
                                borderColor: industryColors[company.industry] || "#6b7280",
                                color: industryColors[company.industry] || "#6b7280"
                              }}
                            >
                              {company.industry}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-gray-300">
                            {formatMoney(company.pre_ipo_3year_avg_revenue)}
                          </TableCell>
                          <TableCell className="text-right text-green-400">
                            {formatMoney(company.pre_ipo_3year_avg_profit)}
                          </TableCell>
                          <TableCell className="text-right text-blue-400">
                            {formatMoney(company.pre_ipo_last_year_revenue)}
                          </TableCell>
                          <TableCell className="text-right text-purple-400">
                            {formatMoney(company.pre_ipo_last_year_profit)}
                          </TableCell>
                          <TableCell>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="text-cyan-400 hover:text-cyan-300"
                                  onClick={() => setSelectedCompany(company)}
                                >
                                  <Info className="w-4 h-4 mr-1" />
                                  详情
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl bg-slate-900 border-slate-700">
                                <DialogHeader>
                                  <DialogTitle className="text-white flex items-center gap-2">
                                    {company.company_name}
                                    <span className="text-cyan-400 font-mono">{company.stock_code}</span>
                                    <Badge 
                                      variant="outline"
                                      style={{ 
                                        borderColor: industryColors[company.industry] || "#6b7280",
                                        color: industryColors[company.industry] || "#6b7280"
                                      }}
                                    >
                                      {company.industry}
                                    </Badge>
                                  </DialogTitle>
                                </DialogHeader>
                                
                                <div className="space-y-6">
                                  {/* 财务数据卡片 */}
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <Card className="bg-slate-800/50">
                                      <CardContent className="p-3">
                                        <div className="text-gray-400 text-xs">3年平均营收</div>
                                        <div className="text-lg font-bold text-cyan-400">
                                          {formatMoney(company.pre_ipo_3year_avg_revenue)}
                                        </div>
                                      </CardContent>
                                    </Card>
                                    <Card className="bg-slate-800/50">
                                      <CardContent className="p-3">
                                        <div className="text-gray-400 text-xs">3年平均利润</div>
                                        <div className="text-lg font-bold text-green-400">
                                          {formatMoney(company.pre_ipo_3year_avg_profit)}
                                        </div>
                                      </CardContent>
                                    </Card>
                                    <Card className="bg-slate-800/50">
                                      <CardContent className="p-3">
                                        <div className="text-gray-400 text-xs">上市前营收</div>
                                        <div className="text-lg font-bold text-blue-400">
                                          {formatMoney(company.pre_ipo_last_year_revenue)}
                                        </div>
                                      </CardContent>
                                    </Card>
                                    <Card className="bg-slate-800/50">
                                      <CardContent className="p-3">
                                        <div className="text-gray-400 text-xs">上市前净利率</div>
                                        <div className="text-lg font-bold text-purple-400">
                                          {(company.pre_ipo_last_year_profit / company.pre_ipo_last_year_revenue * 100).toFixed(1)}%
                                        </div>
                                      </CardContent>
                                    </Card>
                                  </div>

                                  {/* 历史数据图表 */}
                                  <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                      <BarChart data={company.historical_data}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                        <XAxis dataKey="year" stroke="#9ca3af" />
                                        <YAxis yAxisId="left" stroke="#9ca3af" tickFormatter={(v) => `${(v/1e8).toFixed(0)}亿`} />
                                        <YAxis yAxisId="right" orientation="right" stroke="#9ca3af" tickFormatter={(v) => `${(v/1e8).toFixed(0)}亿`} />
                                        <Tooltip 
                                          contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                                          formatter={(value: number) => formatMoney(value)}
                                        />
                                        <Legend />
                                        <Bar yAxisId="left" dataKey="revenue" name="营业收入" fill="#3b82f6" />
                                        <Bar yAxisId="right" dataKey="net_profit" name="净利润" fill="#10b981" />
                                      </BarChart>
                                    </ResponsiveContainer>
                                  </div>

                                  {/* 历史数据表格 */}
                                  <Table>
                                    <TableHeader>
                                      <TableRow className="border-slate-700">
                                        <TableHead className="text-gray-400">年度</TableHead>
                                        <TableHead className="text-gray-400 text-right">营业收入</TableHead>
                                        <TableHead className="text-gray-400 text-right">净利润</TableHead>
                                        <TableHead className="text-gray-400 text-right">净利率</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {company.historical_data.map((year: any) => (
                                        <TableRow key={year.year} className="border-slate-700/50">
                                          <TableCell className="text-white">{year.year}</TableCell>
                                          <TableCell className="text-right text-cyan-400">
                                            {formatMoney(year.revenue)}
                                          </TableCell>
                                          <TableCell className="text-right text-green-400">
                                            {formatMoney(year.net_profit)}
                                          </TableCell>
                                          <TableCell className="text-right text-purple-400">
                                            {(year.net_profit / year.revenue * 100).toFixed(1)}%
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 行业分布 */}
          <TabsContent value="industry">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-slate-900/50 border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-cyan-400" />
                    行业分布
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={industryDistribution} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis type="number" stroke="#9ca3af" />
                        <YAxis dataKey="name" type="category" width={200} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                        <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
                        <Bar dataKey="count" name="公司数量" fill="#3b82f6">
                          {industryDistribution.map((entry, index) => (
                            <cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-cyan-400" />
                    各行业上市前平均营收
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={Object.entries(industryStats).map(([name, stats]: [string, any]) => ({
                        name: name.slice(0, 10) + (name.length > 10 ? '...' : ''),
                        revenue: stats.avg_revenue_last / 1e8
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="name" stroke="#9ca3af" angle={-45} textAnchor="end" height={80} />
                        <YAxis stroke="#9ca3af" tickFormatter={(v) => `${v}亿`} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                          formatter={(value: number) => [`${value.toFixed(2)}亿`, '上市前平均营收']}
                        />
                        <Bar dataKey="revenue" fill="#10b981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 行业对标 */}
          <TabsContent value="comparison">
            <div className="space-y-6">
              {/* 行业选择 */}
              <Card className="bg-slate-900/50 border-slate-700/50">
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                    <div className="flex items-center gap-2 text-gray-300">
                      <ArrowRightLeft className="w-5 h-5" />
                      <span>选择行业进行对标:</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {industries.map(industry => (
                        <Button
                          key={industry}
                          variant={comparisonIndustry === industry ? "default" : "outline"}
                          size="sm"
                          onClick={() => setComparisonIndustry(industry)}
                          className={comparisonIndustry === industry 
                            ? "bg-cyan-500 hover:bg-cyan-600" 
                            : "border-slate-600 text-gray-300 hover:bg-slate-800"
                          }
                        >
                          {industry}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {comparisonIndustry && comparisonChartData.length > 0 && (
                <>
                  {/* 三市场对标图表 */}
                  <Card className="bg-slate-900/50 border-slate-700/50">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Landmark className="w-5 h-5 text-cyan-400" />
                        {comparisonIndustry} - 三市场财务指标对比
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-96">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={comparisonChartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="name" stroke="#9ca3af" />
                            <YAxis yAxisId="left" stroke="#9ca3af" tickFormatter={(v) => `${v}亿`} />
                            <YAxis yAxisId="right" orientation="right" stroke="#9ca3af" tickFormatter={(v) => `${v}%`} />
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                              formatter={(value: number, name: string) => {
                                if (name === '净利率') return [`${value.toFixed(1)}%`, name];
                                return [`${value.toFixed(2)}亿`, name];
                              }}
                            />
                            <Legend />
                            <Bar yAxisId="left" dataKey="revenue_3yr" name="3年平均营收" fill="#3b82f6" />
                            <Bar yAxisId="left" dataKey="profit_3yr" name="3年平均利润" fill="#10b981" />
                            <Bar yAxisId="left" dataKey="revenue_last" name="上市前营收" fill="#8b5cf6" />
                            <Bar yAxisId="left" dataKey="profit_last" name="上市前利润" fill="#f59e0b" />
                            <Line yAxisId="right" type="monotone" dataKey="margin" name="净利率" stroke="#ef4444" strokeWidth={2} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* 对标数据表格 */}
                  <Card className="bg-slate-900/50 border-slate-700/50">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Store className="w-5 h-5 text-cyan-400" />
                        详细对标数据
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow className="border-slate-700">
                            <TableHead className="text-gray-400">市场</TableHead>
                            <TableHead className="text-gray-400 text-right">3年平均营收</TableHead>
                            <TableHead className="text-gray-400 text-right">3年平均利润</TableHead>
                            <TableHead className="text-gray-400 text-right">上市前营收</TableHead>
                            <TableHead className="text-gray-400 text-right">上市前利润</TableHead>
                            <TableHead className="text-gray-400 text-right">平均净利率</TableHead>
                            <TableHead className="text-gray-400 text-right">样本数</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {comparisonChartData.map((row: any, idx: number) => {
                            const marketColors: Record<string, string> = {
                              "新三板": "text-yellow-400",
                              "北交所": "text-cyan-400",
                              "A股": "text-purple-400"
                            };
                            return (
                              <TableRow key={idx} className="border-slate-700/50">
                                <TableCell className={`font-medium ${marketColors[row.name] || 'text-gray-300'}`}>
                                  {row.name}
                                </TableCell>
                                <TableCell className="text-right text-gray-300">{row.revenue_3yr.toFixed(2)}亿</TableCell>
                                <TableCell className="text-right text-green-400">{row.profit_3yr.toFixed(2)}亿</TableCell>
                                <TableCell className="text-right text-blue-400">{row.revenue_last.toFixed(2)}亿</TableCell>
                                <TableCell className="text-right text-purple-400">{row.profit_last.toFixed(2)}亿</TableCell>
                                <TableCell className="text-right text-orange-400">{row.margin.toFixed(1)}%</TableCell>
                                <TableCell className="text-right text-gray-500">
                                  {row.name === "新三板" 
                                    ? industryComparison[comparisonIndustry].neeq.sample_size
                                    : row.name === "北交所"
                                    ? industryComparison[comparisonIndustry].bse.count
                                    : industryComparison[comparisonIndustry].a_stock.sample_size
                                  }
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </>
              )}

              {!comparisonIndustry && (
                <Card className="bg-slate-900/50 border-slate-700/50">
                  <CardContent className="p-12 text-center">
                    <ArrowRightLeft className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg">请选择一个行业进行三市场对标分析</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
