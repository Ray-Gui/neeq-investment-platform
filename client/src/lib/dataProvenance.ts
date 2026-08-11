/**
 * 数据时点（单一事实来源 / Single Source of Truth）
 * ---------------------------------------------------------------
 * 本平台的数据分为两层，刷新节奏不同：
 *
 *   ① 行情层（quote）      —— 最新价、总市值。可从公开行情源实时获取，已刷新。
 *   ② 财务层（fundamental）—— PE/PB/EPS/ROE/毛利率/成长性/各类评分与评级。
 *                             依赖定期报告，新三板与北交所标的的财报在当前
 *                             数据通道下不可批量获取，因此保持快照不变。
 *
 * ⚠️ 两层时点不同，跨层推导（例如用新价 ÷ 旧 EPS 反推 PE）会得到错误结论。
 *    页面上凡展示这两类指标处，均应通过 <VintageBadge /> 或
 *    <DataVintageNotice /> 标注其真实时点。
 *
 * 修改数据时点时只需改动本文件。
 */

export const QUOTE_AS_OF = "2026-08-10";
export const FUNDAMENTAL_AS_OF = "2026-04-17";

export type VintageKind = "quote" | "fundamental";

export interface VintageInfo {
  kind: VintageKind;
  /** 完整日期 YYYY-MM-DD */
  asOf: string;
  /** 徽章上的短日期 MM-DD */
  short: string;
  /** 层名称 */
  label: string;
  /** 该层覆盖的字段（面向用户的说法） */
  fields: string;
  /** 数据来源 */
  source: string;
  /** 悬浮提示文案 */
  tooltip: string;
}

export const VINTAGE: Record<VintageKind, VintageInfo> = {
  quote: {
    kind: "quote",
    asOf: QUOTE_AS_OF,
    short: QUOTE_AS_OF.slice(5),
    label: "行情数据",
    fields: "最新价、总市值",
    source: "腾讯行情（最新价）+ NeoData 金融数据（总市值 / 总股本）",
    tooltip: `行情数据（最新价、总市值）已更新至 ${QUOTE_AS_OF}，来源：腾讯行情 + NeoData。`,
  },
  fundamental: {
    kind: "fundamental",
    asOf: FUNDAMENTAL_AS_OF,
    short: FUNDAMENTAL_AS_OF.slice(5),
    label: "财务数据",
    fields: "市盈率、市净率、EPS、每股净资产、ROE、毛利率、净利率、成长性及各类评分评级",
    source: `${FUNDAMENTAL_AS_OF} 快照（基于当时最新披露的定期报告）`,
    tooltip:
      `财务数据仍为 ${FUNDAMENTAL_AS_OF} 快照，未随行情同步更新。` +
      `新三板 / 北交所标的财报暂无法批量获取，故保留原快照。` +
      `请勿将其与最新股价直接混合推算估值。`,
  },
};

/** 字段 → 所属数据层。用于自动判定某个指标该挂哪种时点徽章。 */
const QUOTE_FIELDS = new Set([
  "price",
  "market_cap",
  "market_cap_wan",
  "market_cap_yi",
  "latest_price",
  "close",
]);

export function vintageOf(field: string): VintageKind {
  return QUOTE_FIELDS.has(field) ? "quote" : "fundamental";
}

/** 页脚 / 说明区使用的一句话摘要 */
export const VINTAGE_SUMMARY =
  `行情数据（最新价、总市值）截至 ${QUOTE_AS_OF}；` +
  `财务数据与评分截至 ${FUNDAMENTAL_AS_OF}`;

/**
 * 单条记录是否已刷新行情。
 * 刷新脚本会给成功取到数据的记录写入 `quote_as_of` 字段；
 * 未取到的（已摘牌 / 长期停牌 / 无公开报价）保持原值、无该字段。
 */
export function isQuoteRefreshed(record: any): boolean {
  return Boolean(record && record.quote_as_of);
}

/** 取单条记录的行情时点，未刷新的回退为财务快照时点。 */
export function recordQuoteAsOf(record: any): string {
  return record?.quote_as_of || FUNDAMENTAL_AS_OF;
}
