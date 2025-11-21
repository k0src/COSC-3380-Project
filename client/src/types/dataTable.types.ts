import type { ReactNode } from "react";

export type ColumnWidth = number | "auto" | "flex";
export type SortDirection = "ASC" | "DESC";

export interface DataTableColumn<T = any> {
  key: string;
  header: string;
  sortable?: boolean;
  width?: ColumnWidth;
  maxWidth?: number;
  minWidth?: number;
  render?: (value: any, row: T, index: number) => ReactNode;
  align?: "left" | "center" | "right";
  className?: string;
}

export interface DataTableAction<T = any> {
  id: string;
  icon: React.ElementType;
  label: string;
  onClick: (row: T, refetch: () => void) => void | Promise<void>;
  variant?: "default" | "danger";
}

export interface DataTableBulkAction<T = any> {
  id: string;
  icon: React.ElementType;
  label: string;
  onClick: (rows: T[], refetch: () => void) => void | Promise<void>;
  variant?: "default" | "danger";
}

export interface FetchParams {
  limit: number;
  offset: number;
}

export type FetchDataFunction<T> = (params: FetchParams) => Promise<T[]>;

export interface DataTableProps<T = any> {
  fetchData: FetchDataFunction<T>;
  columns: DataTableColumn<T>[];
  filterKeys?: string[];
  actions?: DataTableAction<T>[];
  bulkActions?: DataTableBulkAction<T>[];
  initialRowsPerPage?: number;
  rowsPerPageOptions?: number[];
  className?: string;
  cacheKey: string;
  dependencies?: any[];
  theme?: "default" | "dark";
  noDataMessage?: ReactNode;
}

export interface DataTableState<T> {
  data: T[];
  loading: boolean;
  error: Error | null;
  currentPage: number;
  rowsPerPage: number;
  totalRows: number;
  hasMore: boolean;
  sortColumn: string | null;
  sortDirection: SortDirection;
  filterText: string;
  filteredData: T[];
  selectedIds: Set<string>;
  columnWidths: number[];
}

export interface TableDropdownOption {
  id: string;
  label: string;
  icon?: React.ElementType;
  onClick: () => void;
  variant?: "default" | "danger";
}
