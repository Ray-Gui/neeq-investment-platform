// 新三板企业数据 - 医疗健康、新能源、AI 三个领域
// 这是示例数据，实际应用中应从数据库或 API 获取

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

export const neeqCompaniesData: NEEQCompany[] = [
  // 医疗健康领域
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
  {
    code: "831672.OC",
    name: "莲池医院股份有限公司",
    shortName: "莲池医院",
    industry: "医疗服务",
    sector: "医疗健康",
    province: "河北",
    city: "保定",
    foundedYear: 1995,
    mainBusiness: "医疗服务、医院运营",
    neeqListingDate: "2016-04-08",
    neeqLayer: "基础层",
    revenue: 18000,
    netProfit: 2200,
    grossMargin: 45,
    netMargin: 12,
    roe: 15,
    totalAssets: 35000,
    totalLiabilities: 12000,
    latestFundingRound: "A 轮",
    latestFundingAmount: 2000,
    latestFundingDate: "2022-09-20",
    investors: ["华泰资本"],
    dailyVolume: 80,
    dailyAmount: 450,
    bidAskSpread: 3.2,
    bseListingStatus: "未申报",
    score: 65,
    scoreBreakdown: {
      financial: 68,
      competitiveness: 62,
      industry: 70,
      listingPotential: 60,
    },
  },
  {
    code: "920050",
    name: "江苏爱舍伦医疗科技集团股份有限公司",
    shortName: "爱舍伦",
    industry: "医疗器械",
    sector: "医疗健康",
    province: "江苏",
    city: "苏州",
    foundedYear: 2015,
    mainBusiness: "医疗器械研发、生产、销售",
    neeqListingDate: "2021-06-10",
    neeqLayer: "创新层",
    revenue: 32000,
    netProfit: 4800,
    grossMargin: 68,
    netMargin: 15,
    roe: 22,
    totalAssets: 55000,
    totalLiabilities: 18000,
    latestFundingRound: "C 轮",
    latestFundingAmount: 8000,
    latestFundingDate: "2024-03-15",
    investors: ["红杉资本", "高瓴资本"],
    dailyVolume: 200,
    dailyAmount: 1500,
    bidAskSpread: 1.8,
    bseListingDate: "2026-01-21",
    bseCode: "920050",
    bseListingStatus: "已上市",
    score: 85,
    scoreBreakdown: {
      financial: 88,
      competitiveness: 86,
      industry: 85,
      listingPotential: 82,
    },
  },

  // 新能源领域
  {
    code: "430737.OC",
    name: "无锡斯达新能源科技股份有限公司",
    shortName: "斯达新能源",
    industry: "新能源汽车",
    sector: "新能源",
    province: "江苏",
    city: "无锡",
    foundedYear: 2012,
    mainBusiness: "新能源汽车电机、控制器等核心部件研发生产",
    neeqListingDate: "2014-04-30",
    neeqLayer: "创新层",
    revenue: 28000,
    netProfit: 3200,
    grossMargin: 38,
    netMargin: 11,
    roe: 16,
    totalAssets: 42000,
    totalLiabilities: 14000,
    latestFundingRound: "B 轮",
    latestFundingAmount: 6000,
    latestFundingDate: "2023-12-10",
    investors: ["国家级产业基金", "上汽集团"],
    dailyVolume: 150,
    dailyAmount: 980,
    bidAskSpread: 2.1,
    bseListingStatus: "辅导中",
    score: 76,
    scoreBreakdown: {
      financial: 74,
      competitiveness: 78,
      industry: 82,
      listingPotential: 70,
    },
  },
  {
    code: "834599.OC",
    name: "西安华新新能源股份有限公司",
    shortName: "华新能源",
    industry: "新能源",
    sector: "新能源",
    province: "陕西",
    city: "西安",
    foundedYear: 2010,
    mainBusiness: "新能源电池、储能系统研发生产",
    neeqListingDate: "2016-08-25",
    neeqLayer: "基础层",
    revenue: 22000,
    netProfit: 2100,
    grossMargin: 35,
    netMargin: 9.5,
    roe: 12,
    totalAssets: 38000,
    totalLiabilities: 16000,
    latestFundingRound: "A 轮",
    latestFundingAmount: 3000,
    latestFundingDate: "2023-05-20",
    investors: ["陕西创投"],
    dailyVolume: 90,
    dailyAmount: 520,
    bidAskSpread: 3.5,
    bseListingStatus: "未申报",
    score: 62,
    scoreBreakdown: {
      financial: 60,
      competitiveness: 65,
      industry: 75,
      listingPotential: 55,
    },
  },

  // 人工智能领域
  {
    code: "871169",
    name: "蓝耘科技集团股份有限公司",
    shortName: "蓝耘科技",
    industry: "人工智能",
    sector: "人工智能",
    province: "北京",
    city: "北京",
    foundedYear: 2016,
    mainBusiness: "AI 算力基础设施、全栈服务能力",
    neeqListingDate: "2020-03-15",
    neeqLayer: "创新层",
    revenue: 35000,
    netProfit: 5200,
    grossMargin: 62,
    netMargin: 14.8,
    roe: 20,
    totalAssets: 58000,
    totalLiabilities: 20000,
    latestFundingRound: "C 轮",
    latestFundingAmount: 10000,
    latestFundingDate: "2024-06-15",
    investors: ["腾讯、阿里、字节跳动"],
    dailyVolume: 250,
    dailyAmount: 1800,
    bidAskSpread: 1.5,
    bseListingStatus: "申报中",
    score: 82,
    scoreBreakdown: {
      financial: 84,
      competitiveness: 85,
      industry: 88,
      listingPotential: 78,
    },
  },
  {
    code: "833816.OC",
    name: "元聚变科技集团股份有限公司",
    shortName: "元聚变科技",
    industry: "人工智能",
    sector: "人工智能",
    province: "浙江",
    city: "杭州",
    foundedYear: 2017,
    mainBusiness: "AI 生态建设、AI 应用开发",
    neeqListingDate: "2021-09-20",
    neeqLayer: "创新层",
    revenue: 28000,
    netProfit: 4100,
    grossMargin: 58,
    netMargin: 14.6,
    roe: 19,
    totalAssets: 48000,
    totalLiabilities: 16000,
    latestFundingRound: "B 轮",
    latestFundingAmount: 7000,
    latestFundingDate: "2024-02-28",
    investors: ["杭州创新基金", "浙江风投"],
    dailyVolume: 180,
    dailyAmount: 1200,
    bidAskSpread: 2.0,
    bseListingStatus: "辅导中",
    score: 79,
    scoreBreakdown: {
      financial: 81,
      competitiveness: 80,
      industry: 86,
      listingPotential: 75,
    },
  },
  {
    code: "874640",
    name: "海南百迈科医疗科技股份有限公司",
    shortName: "百迈科",
    industry: "医疗器械",
    sector: "医疗健康",
    province: "海南",
    city: "海口",
    foundedYear: 2014,
    mainBusiness: "医疗诊断设备、AI 医疗影像分析",
    neeqListingDate: "2019-11-25",
    neeqLayer: "创新层",
    revenue: 24000,
    netProfit: 3600,
    grossMargin: 64,
    netMargin: 15,
    roe: 18,
    totalAssets: 44000,
    totalLiabilities: 15000,
    latestFundingRound: "B 轮",
    latestFundingAmount: 5500,
    latestFundingDate: "2024-08-10",
    investors: ["海南创投", "医疗产业基金"],
    dailyVolume: 140,
    dailyAmount: 950,
    bidAskSpread: 2.2,
    bseListingStatus: "已上市",
    bseCode: "920xxx",
    score: 80,
    scoreBreakdown: {
      financial: 82,
      competitiveness: 79,
      industry: 82,
      listingPotential: 80,
    },
  },
];

// 按领域分组的企业数据
export const companiesBySetor = {
  医疗健康: neeqCompaniesData.filter((c) => c.sector === "医疗健康"),
  新能源: neeqCompaniesData.filter((c) => c.sector === "新能源"),
  人工智能: neeqCompaniesData.filter((c) => c.sector === "人工智能"),
};

// 按评分排序的企业数据
export const companiesByScore = [...neeqCompaniesData].sort(
  (a, b) => (b.score || 0) - (a.score || 0)
);
