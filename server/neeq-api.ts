import express, { Router, Request, Response } from "express";
import pg from "pg";

const { Pool } = pg;

// 数据库连接池
const pool = new Pool({
  host: "localhost",
  database: "neeq_db",
  user: "neeq_user",
  password: "neeq_password_2024",
  port: 5432,
});

const router = Router();

// 获取所有企业
router.get("/companies", async (req: Request, res: Response) => {
  try {
    const { sector, industry, province, page = 1, limit = 20 } = req.query;
    
    let query = "SELECT * FROM companies WHERE 1=1";
    const params: any[] = [];
    let paramIndex = 1;

    if (sector) {
      query += ` AND sector = $${paramIndex}`;
      params.push(sector);
      paramIndex++;
    }

    if (industry) {
      query += ` AND industry = $${paramIndex}`;
      params.push(industry);
      paramIndex++;
    }

    if (province) {
      query += ` AND province = $${paramIndex}`;
      params.push(province);
      paramIndex++;
    }

    // 分页
    const offset = ((parseInt(page as string) || 1) - 1) * parseInt(limit as string);
    query += ` ORDER BY code LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // 获取总数
    let countQuery = "SELECT COUNT(*) as total FROM companies WHERE 1=1";
    const countParams: any[] = [];
    let countParamIndex = 1;

    if (sector) {
      countQuery += ` AND sector = $${countParamIndex}`;
      countParams.push(sector);
      countParamIndex++;
    }

    if (industry) {
      countQuery += ` AND industry = $${countParamIndex}`;
      countParams.push(industry);
      countParamIndex++;
    }

    if (province) {
      countQuery += ` AND province = $${countParamIndex}`;
      countParams.push(province);
      countParamIndex++;
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    res.json({
      success: true,
      data: result.rows,
      total,
      page: parseInt(page as string) || 1,
      limit: parseInt(limit as string),
      pages: Math.ceil(total / parseInt(limit as string)),
    });
  } catch (error) {
    console.error("Error fetching companies:", error);
    res.status(500).json({ success: false, error: "Failed to fetch companies" });
  }
});

// 搜索企业
router.get("/companies/search", async (req: Request, res: Response) => {
  try {
    const { keyword, sector, industry, page = 1, limit = 20 } = req.query;

    let query = `
      SELECT * FROM companies 
      WHERE (
        name ILIKE $1 OR 
        short_name ILIKE $1 OR 
        code ILIKE $1 OR 
        main_business ILIKE $1
      )
    `;
    const params: any[] = [`%${keyword}%`];
    let paramIndex = 2;

    if (sector) {
      query += ` AND sector = $${paramIndex}`;
      params.push(sector);
      paramIndex++;
    }

    if (industry) {
      query += ` AND industry = $${paramIndex}`;
      params.push(industry);
      paramIndex++;
    }

    const offset = ((parseInt(page as string) || 1) - 1) * parseInt(limit as string);
    query += ` ORDER BY code LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // 获取总数
    let countQuery = `
      SELECT COUNT(*) as total FROM companies 
      WHERE (
        name ILIKE $1 OR 
        short_name ILIKE $1 OR 
        code ILIKE $1 OR 
        main_business ILIKE $1
      )
    `;
    const countParams: any[] = [`%${keyword}%`];
    let countParamIndex = 2;

    if (sector) {
      countQuery += ` AND sector = $${countParamIndex}`;
      countParams.push(sector);
      countParamIndex++;
    }

    if (industry) {
      countQuery += ` AND industry = $${countParamIndex}`;
      countParams.push(industry);
      countParamIndex++;
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    res.json({
      success: true,
      keyword,
      data: result.rows,
      total,
      page: parseInt(page as string) || 1,
      limit: parseInt(limit as string),
    });
  } catch (error) {
    console.error("Error searching companies:", error);
    res.status(500).json({ success: false, error: "Failed to search companies" });
  }
});

// 获取企业详情
router.get("/companies/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // 获取企业基本信息
    const companyResult = await pool.query(
      "SELECT * FROM companies WHERE id = $1",
      [id]
    );

    if (companyResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Company not found" });
    }

    const company = companyResult.rows[0];

    // 获取财务数据
    const financialResult = await pool.query(
      "SELECT * FROM financial_data WHERE company_id = $1 ORDER BY fiscal_year DESC",
      [id]
    );

    // 获取融资信息
    const fundingResult = await pool.query(
      "SELECT * FROM funding_rounds WHERE company_id = $1 ORDER BY funding_date DESC",
      [id]
    );

    // 获取交易数据
    const tradingResult = await pool.query(
      "SELECT * FROM trading_data WHERE company_id = $1 ORDER BY trade_date DESC LIMIT 30",
      [id]
    );

    // 获取评分数据
    const scoreResult = await pool.query(
      "SELECT * FROM company_scores WHERE company_id = $1 ORDER BY evaluation_date DESC LIMIT 1",
      [id]
    );

    res.json({
      success: true,
      data: {
        company,
        financialData: financialResult.rows,
        fundingRounds: fundingResult.rows,
        tradingData: tradingResult.rows,
        scores: scoreResult.rows,
      },
    });
  } catch (error) {
    console.error("Error fetching company details:", error);
    res.status(500).json({ success: false, error: "Failed to fetch company details" });
  }
});

// 按领域获取企业
router.get("/companies-by-sector/:sector", async (req: Request, res: Response) => {
  try {
    const { sector } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const offset = ((parseInt(page as string) || 1) - 1) * parseInt(limit as string);

    const result = await pool.query(
      "SELECT * FROM companies WHERE sector = $1 ORDER BY code LIMIT $2 OFFSET $3",
      [sector, limit, offset]
    );

    const countResult = await pool.query(
      "SELECT COUNT(*) as total FROM companies WHERE sector = $1",
      [sector]
    );

    const total = parseInt(countResult.rows[0].total);

    res.json({
      success: true,
      sector,
      data: result.rows,
      total,
      page: parseInt(page as string) || 1,
      limit: parseInt(limit as string),
    });
  } catch (error) {
    console.error("Error fetching companies by sector:", error);
    res.status(500).json({ success: false, error: "Failed to fetch companies" });
  }
});

// 获取财务数据
router.get("/companies/:id/financial", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT c.short_name, f.* FROM financial_data f
       JOIN companies c ON f.company_id = c.id
       WHERE f.company_id = $1
       ORDER BY f.fiscal_year DESC`,
      [id]
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Error fetching financial data:", error);
    res.status(500).json({ success: false, error: "Failed to fetch financial data" });
  }
});

// 获取统计数据
router.get("/analytics", async (req: Request, res: Response) => {
  try {
    // 总企业数
    const totalResult = await pool.query("SELECT COUNT(*) as total FROM companies");
    const totalCompanies = parseInt(totalResult.rows[0].total);

    // 按领域统计
    const sectorResult = await pool.query(
      "SELECT sector, COUNT(*) as count FROM companies GROUP BY sector"
    );
    const sectorStats: { [key: string]: number } = {};
    sectorResult.rows.forEach((row: any) => {
      sectorStats[row.sector] = parseInt(row.count);
    });

    // 按上市状态统计
    const statusResult = await pool.query(
      "SELECT bse_listing_status, COUNT(*) as count FROM companies GROUP BY bse_listing_status"
    );
    const listingStats: { [key: string]: number } = {};
    statusResult.rows.forEach((row: any) => {
      listingStats[row.bse_listing_status || "未知"] = parseInt(row.count);
    });

    // 平均财务指标
    const avgResult = await pool.query(`
      SELECT 
        AVG(revenue) as avg_revenue,
        AVG(net_profit) as avg_net_profit,
        AVG(gross_margin) as avg_gross_margin,
        AVG(net_margin) as avg_net_margin,
        AVG(roe) as avg_roe
      FROM financial_data
      WHERE fiscal_year = 2024
    `);

    const avgData = avgResult.rows[0];

    res.json({
      success: true,
      data: {
        totalCompanies,
        sectorStats,
        listingStats,
        avgFinancial: {
          avgRevenue: Math.round(avgData.avg_revenue || 0),
          avgNetProfit: Math.round(avgData.avg_net_profit || 0),
          avgGrossMargin: Math.round((avgData.avg_gross_margin || 0) * 100) / 100,
          avgNetMargin: Math.round((avgData.avg_net_margin || 0) * 100) / 100,
          avgRoe: Math.round((avgData.avg_roe || 0) * 100) / 100,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({ success: false, error: "Failed to fetch analytics" });
  }
});

// 获取排名（按评分）
router.get("/ranking/score", async (req: Request, res: Response) => {
  try {
    const { limit = 20 } = req.query;

    const result = await pool.query(
      `SELECT c.*, cs.overall_score, cs.financial_score, cs.competitiveness_score, 
              cs.industry_score, cs.listing_potential_score
       FROM companies c
       LEFT JOIN company_scores cs ON c.id = cs.company_id
       ORDER BY cs.overall_score DESC NULLS LAST
       LIMIT $1`,
      [limit]
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Error fetching ranking:", error);
    res.status(500).json({ success: false, error: "Failed to fetch ranking" });
  }
});

// 获取排名（按财务指标）
router.get("/ranking/financial", async (req: Request, res: Response) => {
  try {
    const { metric = "revenue", limit = 20 } = req.query;

    const allowedMetrics = ["revenue", "net_profit", "gross_margin", "roe"];
    if (!allowedMetrics.includes(metric as string)) {
      return res.status(400).json({ success: false, error: "Invalid metric" });
    }

    const query = `
      SELECT c.*, f.${metric} as metric_value
      FROM companies c
      JOIN financial_data f ON c.id = f.company_id
      WHERE f.fiscal_year = 2024
      ORDER BY f.${metric} DESC NULLS LAST
      LIMIT $1
    `;

    const result = await pool.query(query, [limit]);

    res.json({
      success: true,
      metric,
      data: result.rows,
    });
  } catch (error) {
    console.error("Error fetching financial ranking:", error);
    res.status(500).json({ success: false, error: "Failed to fetch ranking" });
  }
});

export default router;
