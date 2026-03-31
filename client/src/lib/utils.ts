import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Company } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const DATA_URL = "/data_v4_fixed.json";
export const ANALYTICS_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663106941819/L3jdtkWk9JZNhxFtGdcAp9/analytics_v2_a5337511.json";

export function fmt(v: number | undefined | null, decimals = 2, suffix = ""): string {
  if (v == null || isNaN(v as number)) return "—";
  return (v as number).toFixed(decimals) + suffix;
}

export function fmtYi(v: number | undefined | null): string {
  if (v == null || isNaN(v as number)) return "—";
  return (v as number).toFixed(2) + " 亿";
}

export function fmtWan(v: number | undefined | null): string {
  if (v == null || isNaN(v as number)) return "—";
  const n = v as number;
  if (n >= 10000) return (n / 10000).toFixed(2) + " 亿";
  return n.toFixed(0) + " 万";
}

export function fmtPct(v: number | undefined | null): string {
  if (v == null || isNaN(v as number)) return "—";
  const n = v as number;
  return (n > 0 ? "+" : "") + n.toFixed(1) + "%";
}

export function fmtDate(d: string | undefined | null): string {
  if (!d || d === "null" || d === "None") return "—";
  return d.slice(0, 10);
}

export function getYear(d: string | undefined | null): string {
  if (!d) return "—";
  return d.slice(0, 4);
}

export function changeColor(v: number | undefined | null): string {
  if (v == null) return "text-muted-foreground";
  if ((v as number) > 0) return "text-positive";
  if ((v as number) < 0) return "text-negative";
  return "text-muted-foreground";
}

export function changeBg(v: number | undefined | null): string {
  if (v == null) return "";
  if ((v as number) > 0) return "bg-positive";
  if ((v as number) < 0) return "bg-negative";
  return "";
}

export function getIndustries(data: Company[]): string[] {
  const set = new Set(data.map(d => d.industry).filter(Boolean) as string[]);
  return Array.from(set).sort();
}

export function getYears(data: Company[]): string[] {
  const set = new Set(data.map(d => d.bse_listing_date?.slice(0, 4)).filter(Boolean) as string[]);
  return Array.from(set).sort();
}

export function getProvinces(data: Company[]): string[] {
  const set = new Set(data.map(d => d.province?.slice(0, 3)).filter(Boolean) as string[]);
  return Array.from(set).sort();
}

export function getSponsors(data: Company[]): string[] {
  const set = new Set(data.map(d => d.sponsor).filter(Boolean) as string[]);
  return Array.from(set).sort();
}

export function filterCompanies(
  data: Company[],
  search: string,
  year: string,
  financing: string,
  performance: string,
  industry: string,
  province: string,
  sponsor: string
): Company[] {
  return data.filter((c) => {
    if (search) {
      const s = search.toLowerCase();
      if (
        !c.name?.toLowerCase().includes(s) &&
        !c.bse_code?.includes(s) &&
        !c.industry?.toLowerCase().includes(s) &&
        !c.sponsor?.toLowerCase().includes(s)
      )
        return false;
    }
    if (year && year !== "all") {
      if (!c.bse_listing_date?.startsWith(year)) return false;
    }
    if (financing && financing !== "all") {
      if (financing === "has") {
        if (!c.last_round_date) return false;
      } else if (financing === "none") {
        if (!c.no_financing) return false;
      } else if (financing === "no_data") {
        if (c.last_round_date || c.no_financing) return false;
      }
    }
    if (performance && performance !== "all") {
      if (performance === "up") {
        if ((c.cap_change_pct ?? 0) <= 0) return false;
      } else if (performance === "down") {
        if ((c.cap_change_pct ?? 0) >= 0) return false;
      } else if (performance === "bust") {
        if (!c.is_bust) return false;
      }
    }
    if (industry && industry !== "all") {
      if (c.industry !== industry) return false;
    }
    if (province && province !== "all") {
      if (!c.province?.startsWith(province)) return false;
    }
    if (sponsor && sponsor !== "all") {
      if (!c.sponsor?.includes(sponsor)) return false;
    }
    return true;
  });
}

export function sortCompanies(data: Company[], field: keyof Company, dir: "asc" | "desc"): Company[] {
  return [...data].sort((a, b) => {
    const av = a[field];
    const bv = b[field];
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    const cmp = av < bv ? -1 : av > bv ? 1 : 0;
    return dir === "asc" ? cmp : -cmp;
  });
}
