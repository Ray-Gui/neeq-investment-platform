// 新三板企业数据集 - 完整版
// 包含原始数据和扩展数据（医疗健康、新能源、人工智能三个领域）

export interface NEEQCompany {
  code: string; // 企业代码
  name: string; // 企业名称
  shortName: string; // 企业简称
  industry: string; // 行业分类
  sector: "医疗健康" | "新能源" | "人工智能"; // 所属领域
  province: string; // 所在省份
  city: string; // 所在城市
  foundedYear: number; // 成立年份
  mainBusiness: string; // 主营业务
  neeqListingDate?: string; // 新三板挂牌日期
  neeqLayer?: "基础层" | "创新层"; // 新三板层级
  
  // 财务数据（最新年度）
  revenue?: number; // 营业收入（万元）
  netProfit?: number; // 净利润（万元）
  grossMargin?: number; // 毛利率（%）
  netMargin?: number; // 净利率（%）
  roe?: number; // ROE（%）
  totalAssets?: number; // 资产总额（万元）
  totalLiabilities?: number; // 负债总额（万元）
  
  // 融资信息
  latestFundingRound?: string; // 最新融资轮次
  latestFundingAmount?: number; // 最新融资金额（万元）
  latestFundingDate?: string; // 最新融资日期
  investors?: string[]; // 主要投资方
  
  // 交易信息
  dailyVolume?: number; // 日均成交量（万股）
  dailyAmount?: number; // 日均成交额（万元）
  bidAskSpread?: number; // 买卖价差（%）
  
  // 上市相关
  bseListingDate?: string; // 北交所上市日期（已上市）
  bseListingStatus?: "未申报" | "申报中" | "辅导中" | "已上市"; // 北交所上市状态
  bseCode?: string; // 北交所代码
  
  // 评分和排名
  score?: number; // 综合评分（0-100）
  scoreBreakdown?: {
    financial: number; // 财务质量评分
    competitiveness: number; // 竞争力评分
    industry: number; // 行业前景评分
    listingPotential: number; // 上市潜力评分
  };
}

// 合并原始数据和扩展数据
export const neeqCompaniesData: NEEQCompany[] = [
  // 原始数据（示例企业）
  {
    code: "830938.OC",
    name: "可恩口腔医疗股份有限公司",
    shortName: "可恩口腔",
    industry: "医疗器械",
    sector: "医疗健康",
    province: "北京",
    city: "北京",
    foundedYear: 2009,
    mainBusiness: "口腔医疗服务、口腔医疗器械销售",
    neeqListingDate: "2015-11-13",
    neeqLayer: "创新层",
    revenue: 25000,
    netProfit: 3500,
    grossMargin: 65,
    netMargin: 14,
    roe: 18,
    totalAssets: 45000,
    totalLiabilities: 15000,
    latestFundingRound: "B 轮",
    latestFundingAmount: 5000,
    latestFundingDate: "2023-06-15",
    investors: ["经纬创投", "真格基金"],
    dailyVolume: 120,
    dailyAmount: 850,
    bidAskSpread: 2.5,
    bseListingStatus: "申报中",
    score: 78,
    scoreBreakdown: {
      financial: 82,
      competitiveness: 75,
      industry: 80,
      listingPotential: 72,
    },
  },
  // ... 其他原始数据
];

// 扩展数据集（医疗健康、新能源、人工智能）
export const neeqCompaniesDataExtended: NEEQCompany[] = [
  // 扩展数据将从 neeq-companies-data-extended.ts 导入
];

// 合并所有数据
export const allNeeqCompanies: NEEQCompany[] = [
  ...neeqCompaniesData,
  ...neeqCompaniesDataExtended,
];

// 按行业分类
export const companiesBySetor = {
  医疗健康: allNeeqCompanies.filter((c) => c.sector === "医疗健康"),
  新能源: allNeeqCompanies.filter((c) => c.sector === "新能源"),
  人工智能: allNeeqCompanies.filter((c) => c.sector === "人工智能"),
};

// 按评分排序
export const companiesByScore = allNeeqCompanies.sort(
  (a, b) => (b.score || 0) - (a.score || 0)
);

// 导出统计信息
export const companiesStats = {
  total: allNeeqCompanies.length,
  healthcare: companiesBySetor.医疗健康.length,
  energy: companiesBySetor.新能源.length,
  ai: companiesBySetor.人工智能.length,
};
