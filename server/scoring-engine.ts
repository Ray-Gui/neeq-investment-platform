import Database from "better-sqlite3";

interface FinancialData {
  fiscal_year: number;
  revenue: number;
  net_profit: number;
  gross_margin: number;
  net_margin: number;
  roe: number;
}

interface CompanyScoring {
  company_id: number;
  code: string;
  short_name: string;
  sector: string;
  industry: string;
  
  // 五个维度的评分
  financial_health: number;
  growth_potential: number;
  competitiveness: number;
  listing_potential: number;
  dealer_opportunity: number;
  
  // 总分和等级
  total_score: number;
  rating: string;
  recommendation: string;
  
  // 详细数据
  financials: FinancialData[];
  scoring_details: ScoringDetails;
}

interface ScoringDetails {
  // 财务健康度的计算过程
  financial_health_details: {
    net_margin_score: number;
    roe_score: number;
    gross_margin_score: number;
    debt_ratio_score: number;
  };
  
  // 成长潜力的计算过程
  growth_potential_details: {
    revenue_growth_rate: number;
    revenue_growth_score: number;
    profit_growth_rate: number;
    profit_growth_score: number;
  };
  
  // 竞争力的计算过程
  competitiveness_details: {
    market_position: string;
    market_position_score: number;
    product_differentiation_score: number;
  };
  
  // 上市潜力的计算过程
  listing_potential_details: {
    scale_score: number;
    profitability_score: number;
    compliance_score: number;
  };
  
  // 做市商机会的计算过程
  dealer_opportunity_details: {
    liquidity_score: number;
    volatility_score: number;
    financing_need_score: number;
  };
}

// 评分标准
const SCORING_STANDARDS = {
  net_margin: [
    { min: 15, max: 100, score: 90 },
    { min: 10, max: 15, score: 75 },
    { min: 5, max: 10, score: 60 },
    { min: 0, max: 5, score: 40 },
  ],
  roe: [
    { min: 20, max: 100, score: 90 },
    { min: 15, max: 20, score: 80 },
    { min: 10, max: 15, score: 65 },
    { min: 0, max: 10, score: 45 },
  ],
  gross_margin: [
    { min: 50, max: 100, score: 95 },
    { min: 40, max: 50, score: 80 },
    { min: 30, max: 40, score: 60 },
    { min: 0, max: 30, score: 40 },
  ],
};

export class ScoringEngine {
  private db: Database.Database;

  constructor(dbPath: string = ":memory:") {
    this.db = new Database(dbPath);
  }

  /**
   * 计算企业评分
   */
  calculateCompanyScore(companyId: number): CompanyScoring | null {
    // 获取企业基本信息
    const company = this.db
      .prepare(
        "SELECT id, code, short_name, sector, industry FROM companies WHERE id = ?"
      )
      .get(companyId) as any;

    if (!company) return null;

    // 获取企业财务数据
    const financials = this.db
      .prepare(
        "SELECT fiscal_year, revenue, net_profit, gross_margin, net_margin, roe FROM financial_data WHERE company_id = ? ORDER BY fiscal_year DESC"
      )
      .all(companyId) as FinancialData[];

    if (financials.length === 0) return null;

    // 计算各维度评分
    const financial_health = this.calculateFinancialHealth(financials);
    const growth_potential = this.calculateGrowthPotential(financials);
    const competitiveness = this.calculateCompetitiveness(company, financials);
    const listing_potential = this.calculateListingPotential(financials);
    const dealer_opportunity = this.calculateDealerOpportunity(financials);

    // 应用行业特殊调整
    const adjusted = this.applyIndustryAdjustment(
      {
        financial_health,
        growth_potential,
        competitiveness,
        listing_potential,
        dealer_opportunity,
      },
      company.sector
    );

    // 计算总分
    const total_score =
      adjusted.financial_health * 0.3 +
      adjusted.growth_potential * 0.25 +
      adjusted.competitiveness * 0.2 +
      adjusted.listing_potential * 0.15 +
      adjusted.dealer_opportunity * 0.1;

    // 获取等级和建议
    const { rating, recommendation } = this.getRatingAndRecommendation(
      total_score
    );

    return {
      company_id: company.id,
      code: company.code,
      short_name: company.short_name,
      sector: company.sector,
      industry: company.industry,
      financial_health: adjusted.financial_health,
      growth_potential: adjusted.growth_potential,
      competitiveness: adjusted.competitiveness,
      listing_potential: adjusted.listing_potential,
      dealer_opportunity: adjusted.dealer_opportunity,
      total_score: Math.round(total_score * 10) / 10,
      rating,
      recommendation,
      financials,
      scoring_details: this.generateScoringDetails(
        financials,
        company,
        adjusted
      ),
    };
  }

  /**
   * 计算财务健康度 (30%)
   */
  private calculateFinancialHealth(financials: FinancialData[]): number {
    const latest = financials[0];
    if (!latest) return 0;

    // 净利率评分 (40%)
    const net_margin_score = this.scoreByStandard(
      latest.net_margin,
      SCORING_STANDARDS.net_margin
    );

    // ROE评分 (30%)
    const roe_score = this.scoreByStandard(
      latest.roe,
      SCORING_STANDARDS.roe
    );

    // 毛利率评分 (20%)
    const gross_margin_score = this.scoreByStandard(
      latest.gross_margin,
      SCORING_STANDARDS.gross_margin
    );

    // 资产负债率评分 (10%) - 假设为50%
    const debt_ratio_score = 75;

    const score =
      net_margin_score * 0.4 +
      roe_score * 0.3 +
      gross_margin_score * 0.2 +
      debt_ratio_score * 0.1;

    return Math.round(score);
  }

  /**
   * 计算成长潜力 (25%)
   */
  private calculateGrowthPotential(financials: FinancialData[]): number {
    if (financials.length < 2) return 50;

    // 计算3年CAGR
    const latest = financials[0];
    const oldest = financials[financials.length - 1];

    // 营收增速
    const revenue_growth_rate =
      ((latest.revenue / oldest.revenue) ** (1 / (financials.length - 1)) - 1) *
      100;
    const revenue_growth_score = this.scoreGrowthRate(revenue_growth_rate, [
      { min: 30, score: 90 },
      { min: 20, score: 80 },
      { min: 10, score: 60 },
      { min: 0, score: 40 },
    ]);

    // 利润增速
    const profit_growth_rate =
      ((latest.net_profit / oldest.net_profit) **
        (1 / (financials.length - 1)) -
        1) *
      100;
    const profit_growth_score = this.scoreGrowthRate(profit_growth_rate, [
      { min: 40, score: 90 },
      { min: 25, score: 80 },
      { min: 10, score: 60 },
      { min: 0, score: 40 },
    ]);

    // 市场增速假设为20%
    const market_growth_score = 75;

    const score =
      revenue_growth_score * 0.5 +
      profit_growth_score * 0.3 +
      market_growth_score * 0.2;

    return Math.round(score);
  }

  /**
   * 计算竞争力 (20%)
   */
  private calculateCompetitiveness(
    company: any,
    financials: FinancialData[]
  ): number {
    // 行业地位 (40%) - 基于毛利率判断
    const latest = financials[0];
    let market_position_score = 60;
    if (latest.gross_margin > 60) {
      market_position_score = 85;
    } else if (latest.gross_margin > 50) {
      market_position_score = 75;
    }

    // 产品差异化 (60%) - 基于净利率和ROE判断
    let product_differentiation_score = 60;
    if (latest.net_margin > 12 && latest.roe > 18) {
      product_differentiation_score = 85;
    } else if (latest.net_margin > 10 && latest.roe > 15) {
      product_differentiation_score = 75;
    }

    const score =
      market_position_score * 0.4 + product_differentiation_score * 0.6;

    return Math.round(score);
  }

  /**
   * 计算上市潜力 (15%)
   */
  private calculateListingPotential(financials: FinancialData[]): number {
    const latest = financials[0];

    // 规模达标度 (40%)
    let scale_score = 50;
    if (latest.revenue > 10000) {
      scale_score = 90;
    } else if (latest.revenue > 5000) {
      scale_score = 80;
    } else if (latest.revenue > 1000) {
      scale_score = 65;
    }

    // 盈利能力 (30%) - 检查是否连续盈利
    let profitability_score = 75;
    const all_profitable = financials.every((f) => f.net_profit > 0);
    if (all_profitable) {
      profitability_score = 85;
    }

    // 合规性 (20%) - 假设为75
    const compliance_score = 75;

    // 融资历程 (10%) - 假设为70
    const financing_score = 70;

    const score =
      scale_score * 0.4 +
      profitability_score * 0.3 +
      compliance_score * 0.2 +
      financing_score * 0.1;

    return Math.round(score);
  }

  /**
   * 计算做市商机会 (10%)
   */
  private calculateDealerOpportunity(financials: FinancialData[]): number {
    const latest = financials[0];

    // 流动性 (50%) - 基于营收规模判断
    let liquidity_score = 60;
    if (latest.revenue > 20000) {
      liquidity_score = 75;
    } else if (latest.revenue > 10000) {
      liquidity_score = 65;
    }

    // 波动性 (30%) - 基于毛利率波动判断
    let volatility_score = 60;
    if (financials.length >= 2) {
      const margin_change = Math.abs(
        financials[0].gross_margin - financials[1].gross_margin
      );
      if (margin_change > 5) {
        volatility_score = 75;
      }
    }

    // 融资需求 (20%) - 假设为70
    const financing_need_score = 70;

    const score =
      liquidity_score * 0.5 +
      volatility_score * 0.3 +
      financing_need_score * 0.2;

    return Math.round(score);
  }

  /**
   * 应用行业特殊调整
   */
  private applyIndustryAdjustment(
    scores: {
      financial_health: number;
      growth_potential: number;
      competitiveness: number;
      listing_potential: number;
      dealer_opportunity: number;
    },
    sector: string
  ) {
    const adjusted = { ...scores };

    if (sector === "医疗健康") {
      // 竞争力权重提升 +5%
      adjusted.competitiveness = Math.min(100, scores.competitiveness + 5);
      // 上市潜力权重提升 +5%
      adjusted.listing_potential = Math.min(100, scores.listing_potential + 5);
      // 做市商机会权重降低 -10%
      adjusted.dealer_opportunity = Math.max(40, scores.dealer_opportunity - 10);
    } else if (sector === "新能源") {
      // 成长潜力权重提升 +10%
      adjusted.growth_potential = Math.min(100, scores.growth_potential + 10);
      // 财务健康度权重降低 -5%
      adjusted.financial_health = Math.max(40, scores.financial_health - 5);
      // 做市商机会权重提升 +5%
      adjusted.dealer_opportunity = Math.min(100, scores.dealer_opportunity + 5);
    } else if (sector === "人工智能") {
      // 成长潜力权重提升 +15%
      adjusted.growth_potential = Math.min(100, scores.growth_potential + 15);
      // 竞争力权重提升 +5%
      adjusted.competitiveness = Math.min(100, scores.competitiveness + 5);
      // 财务健康度权重降低 -10%
      adjusted.financial_health = Math.max(40, scores.financial_health - 10);
      // 上市潜力权重降低 -10%
      adjusted.listing_potential = Math.max(40, scores.listing_potential - 10);
    }

    return adjusted;
  }

  /**
   * 获取等级和建议
   */
  private getRatingAndRecommendation(
    score: number
  ): { rating: string; recommendation: string } {
    if (score >= 90) {
      return {
        rating: "⭐⭐⭐⭐⭐ 优秀",
        recommendation: "强烈推荐 - 优质投资标的",
      };
    } else if (score >= 75) {
      return {
        rating: "⭐⭐⭐⭐ 良好",
        recommendation: "推荐 - 值得关注",
      };
    } else if (score >= 60) {
      return {
        rating: "⭐⭐⭐ 一般",
        recommendation: "中性 - 可考虑",
      };
    } else if (score >= 45) {
      return {
        rating: "⭐⭐ 较差",
        recommendation: "谨慎 - 需要观察",
      };
    } else {
      return {
        rating: "⭐ 很差",
        recommendation: "不推荐 - 风险较大",
      };
    }
  }

  /**
   * 根据标准评分
   */
  private scoreByStandard(
    value: number,
    standards: Array<{ min: number; max: number; score: number }>
  ): number {
    for (const standard of standards) {
      if (value >= standard.min && value <= standard.max) {
        return standard.score;
      }
    }
    return 40;
  }

  /**
   * 根据增长率评分
   */
  private scoreGrowthRate(
    rate: number,
    standards: Array<{ min: number; score: number }>
  ): number {
    for (const standard of standards) {
      if (rate >= standard.min) {
        return standard.score;
      }
    }
    return 40;
  }

  /**
   * 生成评分详情
   */
  private generateScoringDetails(
    financials: FinancialData[],
    company: any,
    scores: any
  ) {
    const latest = financials[0];
    const oldest = financials[financials.length - 1];

    const revenue_growth_rate =
      ((latest.revenue / oldest.revenue) ** (1 / (financials.length - 1)) - 1) *
      100;
    const profit_growth_rate =
      ((latest.net_profit / oldest.net_profit) **
        (1 / (financials.length - 1)) -
        1) *
      100;

    return {
      financial_health_details: {
        net_margin_score: this.scoreByStandard(
          latest.net_margin,
          SCORING_STANDARDS.net_margin
        ),
        roe_score: this.scoreByStandard(
          latest.roe,
          SCORING_STANDARDS.roe
        ),
        gross_margin_score: this.scoreByStandard(
          latest.gross_margin,
          SCORING_STANDARDS.gross_margin
        ),
        debt_ratio_score: 75,
      },
      growth_potential_details: {
        revenue_growth_rate: Math.round(revenue_growth_rate * 100) / 100,
        revenue_growth_score: this.scoreGrowthRate(revenue_growth_rate, [
          { min: 30, score: 90 },
          { min: 20, score: 80 },
          { min: 10, score: 60 },
          { min: 0, score: 40 },
        ]),
        profit_growth_rate: Math.round(profit_growth_rate * 100) / 100,
        profit_growth_score: this.scoreGrowthRate(profit_growth_rate, [
          { min: 40, score: 90 },
          { min: 25, score: 80 },
          { min: 10, score: 60 },
          { min: 0, score: 40 },
        ]),
      },
      competitiveness_details: {
        market_position: latest.gross_margin > 60 ? "行业前列" : "行业平均",
        market_position_score:
          latest.gross_margin > 60 ? 85 : 60,
        product_differentiation_score:
          latest.net_margin > 12 && latest.roe > 18 ? 85 : 60,
      },
      listing_potential_details: {
        scale_score:
          latest.revenue > 10000 ? 90 : latest.revenue > 5000 ? 80 : 65,
        profitability_score: financials.every((f) => f.net_profit > 0)
          ? 85
          : 75,
        compliance_score: 75,
      },
      dealer_opportunity_details: {
        liquidity_score:
          latest.revenue > 20000 ? 75 : latest.revenue > 10000 ? 65 : 60,
        volatility_score: 60,
        financing_need_score: 70,
      },
    };
  }

  /**
   * 获取所有企业的评分排名
   */
  getAllCompanyScores(): CompanyScoring[] {
    const companies = this.db
      .prepare("SELECT id FROM companies ORDER BY id")
      .all() as any[];

    const scores: CompanyScoring[] = [];
    for (const company of companies) {
      const score = this.calculateCompanyScore(company.id);
      if (score) {
        scores.push(score);
      }
    }

    return scores.sort((a, b) => b.total_score - a.total_score);
  }
}
