/**
 * 数据时点标注组件
 * ---------------------------------------------------------------
 * 平台数据分行情层（已刷新）与财务层（快照）两个时点，
 * 本组件用于在展示指标的位置明确标注其真实时点，避免误读。
 *
 * 用法：
 *   <VintageBadge kind="quote" />              // 表头 / 指标旁的小徽章
 *   <VintageBadge kind="fundamental" compact />// 更小号，适合密集表格
 *   <DataVintageNotice />                      // 页面级说明卡（两层都说明）
 *   <DataVintageNotice only="fundamental" />   // 仅财务层的页面
 *   <StaleQuoteMark record={company} />        // 行级：该条未刷新时标 ⚠
 */

import React from "react";
import { VINTAGE, VintageKind, isQuoteRefreshed, FUNDAMENTAL_AS_OF } from "@/lib/dataProvenance";

const TONE: Record<VintageKind, string> = {
  quote: "bg-sky-500/10 text-sky-300 border-sky-500/30",
  fundamental: "bg-amber-500/10 text-amber-300 border-amber-500/30",
};

interface BadgeProps {
  kind: VintageKind;
  /** 更紧凑，用于密集表头 */
  compact?: boolean;
  className?: string;
}

/** 指标旁的时点徽章，例如「市值 08-10」「ROE 04-17」 */
export function VintageBadge({ kind, compact = false, className = "" }: BadgeProps) {
  const v = VINTAGE[kind];
  return (
    <span
      title={v.tooltip}
      className={[
        "inline-flex items-center rounded border align-middle whitespace-nowrap cursor-help font-normal",
        compact ? "px-1 py-0 text-[9px] ml-1" : "px-1.5 py-0.5 text-[10px] ml-1.5",
        TONE[kind],
        className,
      ].join(" ")}
    >
      {v.short}
    </span>
  );
}

interface NoticeProps {
  /** 只说明某一层（页面若不含行情字段就传 "fundamental"） */
  only?: VintageKind;
  className?: string;
}

/** 页面级数据时点说明卡 */
export function DataVintageNotice({ only, className = "" }: NoticeProps) {
  const kinds: VintageKind[] = only ? [only] : ["quote", "fundamental"];
  return (
    <div
      className={[
        "bg-slate-800/30 border border-slate-700 rounded-xl p-4 text-xs text-slate-500",
        className,
      ].join(" ")}
    >
      <strong className="text-slate-400">数据时点说明：</strong>
      <div className="mt-2 space-y-1.5">
        {kinds.map((k) => {
          const v = VINTAGE[k];
          return (
            <div key={k} className="flex items-start gap-2">
              <VintageBadge kind={k} className="ml-0 mt-0.5 flex-shrink-0" />
              <span>
                <span className="text-slate-400">{v.label}</span>
                （{v.fields}）截至 <span className="text-slate-300">{v.asOf}</span>
                ，来源：{v.source}。
              </span>
            </div>
          );
        })}
      </div>
      {!only && (
        <div className="mt-2.5 pt-2.5 border-t border-slate-700/60 text-slate-500">
          ⚠️ 两层数据时点不同：<span className="text-amber-300/90">财务指标与评分未随股价同步更新</span>
          ，请勿用最新股价与旧期 EPS / 每股净资产直接推算市盈率、市净率，也不要将两层数字视为同一时点的快照做横向比较。
        </div>
      )}
    </div>
  );
}

/** 行级标记：该条记录行情未刷新（已摘牌 / 长期停牌 / 无公开报价） */
export function StaleQuoteMark({ record, className = "" }: { record: any; className?: string }) {
  if (isQuoteRefreshed(record)) return null;
  return (
    <span
      title={`该标的未取到最新公开报价（可能已摘牌、长期停牌或无连续竞价），此处仍为 ${FUNDAMENTAL_AS_OF} 快照值。`}
      className={["text-amber-500/80 text-[10px] ml-1 cursor-help align-middle", className].join(" ")}
    >
      ⚠
    </span>
  );
}

export default DataVintageNotice;
