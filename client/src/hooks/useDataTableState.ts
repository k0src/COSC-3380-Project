import { useState, useCallback, useMemo, useEffect } from "react";
import { useAsyncData } from "@hooks";
import type { FetchDataFunction, SortDirection } from "@types";

interface UseDataTableStateParams<T> {
  fetchData: FetchDataFunction<T>;
  cacheKey: string;
  dependencies: any[];
  initialRowsPerPage: number;
  filterKeys?: string[];
}

interface UseDataTableStateReturn<T> {
  data: T[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
  currentPage: number;
  rowsPerPage: number;
  offset: number;
  hasMore: boolean;
  setRowsPerPage: (rows: number) => void;
  goToNextPage: () => void;
  goToPrevPage: () => void;
  sortColumn: string | null;
  sortDirection: SortDirection;
  handleSort: (column: string) => void;
  sortedData: T[];
  filterText: string;
  setFilterText: (text: string) => void;
  filteredData: T[];
  selectedIds: Set<string>;
  toggleSelection: (id: string) => void;
  toggleSelectAll: () => void;
  clearSelection: () => void;
  isAllSelected: boolean;
}

export function useDataTableState<T extends Record<string, any>>({
  fetchData,
  cacheKey,
  dependencies,
  initialRowsPerPage,
  filterKeys = [],
}: UseDataTableStateParams<T>): UseDataTableStateReturn<T> {
  const [currentPage, setCurrentPage] = useState(0);
  const [rowsPerPage, setRowsPerPageState] = useState(initialRowsPerPage);
  const offset = currentPage * rowsPerPage;

  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("DESC");

  const [filterText, setFilterText] = useState("");

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const {
    data: rawData,
    loading,
    error: fetchError,
    refetch,
  } = useAsyncData(
    {
      data: () => fetchData({ limit: rowsPerPage, offset }),
    },
    [...dependencies, rowsPerPage, offset],
    {
      cacheKey: `${cacheKey}_${offset}_${rowsPerPage}`,
      hasBlobUrl: true,
    }
  );

  const data = rawData?.data || [];
  const error = fetchError as Error | null;

  const hasMore = data.length === rowsPerPage;

  const filteredData = useMemo(() => {
    if (!filterText || filterKeys.length === 0) return data;

    const lowerFilter = filterText.toLowerCase();
    return data.filter((row) =>
      filterKeys.some((key) => {
        const value = row[key];
        return value && String(value).toLowerCase().includes(lowerFilter);
      })
    );
  }, [data, filterText, filterKeys]);

  const sortedData = useMemo(() => {
    if (!sortColumn) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];

      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      let result = 0;
      if (typeof aVal === "number" && typeof bVal === "number") {
        result = aVal - bVal;
      } else if (aVal instanceof Date && bVal instanceof Date) {
        result = aVal.getTime() - bVal.getTime();
      } else {
        result = String(aVal).localeCompare(String(bVal));
      }

      return sortDirection === "ASC" ? result : -result;
    });
  }, [filteredData, sortColumn, sortDirection]);

  const setRowsPerPage = useCallback((rows: number) => {
    setRowsPerPageState(rows);
    setCurrentPage(0);
    setSelectedIds(new Set());
  }, []);

  const goToNextPage = useCallback(() => {
    if (hasMore) {
      setCurrentPage((prev) => prev + 1);
      setSelectedIds(new Set());
    }
  }, [hasMore]);

  const goToPrevPage = useCallback(() => {
    if (currentPage > 0) {
      setCurrentPage((prev) => prev - 1);
      setSelectedIds(new Set());
    }
  }, [currentPage]);

  const handleSort = useCallback(
    (column: string) => {
      if (sortColumn === column) {
        setSortDirection((prev) => (prev === "ASC" ? "DESC" : "ASC"));
      } else {
        setSortColumn(column);
        setSortDirection("DESC");
      }
    },
    [sortColumn]
  );

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === sortedData.length && sortedData.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedData.map((row) => row.id)));
    }
  }, [sortedData, selectedIds.size]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const isAllSelected =
    sortedData.length > 0 && selectedIds.size === sortedData.length;

  useEffect(() => {
    setSelectedIds(new Set());
  }, [filterText]);

  return {
    data,
    loading,
    error,
    refetch,
    currentPage,
    rowsPerPage,
    offset,
    hasMore,
    setRowsPerPage,
    goToNextPage,
    goToPrevPage,
    sortColumn,
    sortDirection,
    handleSort,
    sortedData,
    filterText,
    setFilterText,
    filteredData,
    selectedIds,
    toggleSelection,
    toggleSelectAll,
    clearSelection,
    isAllSelected,
  };
}
