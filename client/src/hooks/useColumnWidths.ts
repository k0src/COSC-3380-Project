import { useMemo, useRef } from "react";
import type { DataTableColumn } from "../types";

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

function hashData(data: any[], columns: DataTableColumn[]): string {
  const values = data
    .slice(0, 10)
    .map((row) => columns.map((col) => String(row[col.key] || "")).join("|"))
    .join("\n");
  return simpleHash(values);
}

const widthCache = new Map<
  string,
  { widths: string; timestamp: number; dataHash: string }
>();
const CACHE_TTL = 5 * 60 * 1000;

interface UseColumnWidthsParams<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  cacheKey: string;
  hasCheckbox?: boolean;
  hasActions?: boolean;
  actionsCount?: number;
}

export function useColumnWidths<T>({
  columns,
  data,
  cacheKey,
  hasCheckbox = false,
  hasActions = false,
  actionsCount = 0,
}: UseColumnWidthsParams<T>): string {
  const dataHashRef = useRef<string>("");

  const gridTemplateColumns = useMemo(() => {
    const dataHash = hashData(data, columns);
    dataHashRef.current = dataHash;

    const cacheKeyFull = `${cacheKey}_${dataHash}`;
    const cached = widthCache.get(cacheKeyFull);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.widths;
    }

    const widths: string[] = [];

    if (hasCheckbox) {
      widths.push("4rem");
    }

    for (const column of columns) {
      if (column.width === "flex" || !column.width) {
        if (column.maxWidth) {
          widths.push(`minmax(0, ${column.maxWidth}px)`);
        } else {
          widths.push("1fr");
        }
      } else if (column.width === "auto") {
        const min = column.minWidth || 100;
        const max = column.maxWidth || 300;
        widths.push(`minmax(${min}px, ${max}px)`);
      } else if (typeof column.width === "number") {
        widths.push(`${column.width}px`);
      } else {
        widths.push("1fr");
      }
    }

    if (hasActions) {
      widths.push("auto");
    }

    const result = widths.join(" ");

    widthCache.set(cacheKeyFull, {
      widths: result,
      timestamp: Date.now(),
      dataHash,
    });

    if (widthCache.size > 50) {
      const entries = Array.from(widthCache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      entries.slice(0, entries.length - 50).forEach(([key]) => {
        widthCache.delete(key);
      });
    }

    return result;
  }, [columns, data, cacheKey, hasCheckbox, hasActions, actionsCount]);

  return gridTemplateColumns;
}
