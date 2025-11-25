import { memo, useState, useCallback, useMemo, useEffect } from "react";
import { PuffLoader } from "react-spinners";
import { TableDropdown } from "@components";
import { useAsyncData } from "@hooks";
import { pluralize } from "@util";
import type { DataReportParams } from "@types";
import styles from "./DataReportsTable.module.css";
import classNames from "classnames";
import {
  LuArrowUpDown,
  LuChevronDown,
  LuChevronRight,
  LuChevronLeft,
} from "react-icons/lu";

export interface DataReportDetailColumn<T = any> {
  key: string;
  header: string;
  sortable?: boolean;
  align?: "left" | "center" | "right";
  render?: (value: any, row: T) => React.ReactNode;
  className?: string;
}

export interface DataReportsTableProps<T = any> {
  fetchData: (params: DataReportParams) => Promise<T[]>;
  baseParams: DataReportParams;
  columns: DataReportDetailColumn<T>[];
  expandable?: boolean;
  renderExpanded?: (row: T) => React.ReactNode;
  emptyMessage?: string;
  className?: string;
  hasPagination?: boolean;
  initialRowsPerPage?: number;
  rowsPerPageOptions?: number[];
  initialSortBy?: string;
  initialSortDirection?: "ASC" | "DESC";
  title?: string;
}

function DataReportsTable<T extends Record<string, any>>({
  fetchData,
  baseParams,
  columns,
  expandable = false,
  renderExpanded,
  emptyMessage = "No data available",
  className,
  hasPagination = false,
  initialRowsPerPage = 10,
  rowsPerPageOptions = [10, 25, 50, 100, 200],
  initialSortBy = "period",
  initialSortDirection = "DESC",
  title,
}: DataReportsTableProps<T>) {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [page, setPage] = useState(0);
  const [sortBy, setSortBy] = useState(initialSortBy);
  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">(
    initialSortDirection
  );
  const [limit, setLimit] = useState(initialRowsPerPage);

  const tableParams = useMemo(
    () => ({
      ...baseParams,
      sortBy,
      sortDirection,
      limit,
      offset: page * limit,
    }),
    [baseParams, sortBy, sortDirection, limit, page]
  );

  const { data, loading, error } = useAsyncData(
    { tableData: () => fetchData(tableParams) },
    [JSON.stringify(tableParams)]
  );

  const tableData = data?.tableData ?? [];

  // Reset page when baseParams change
  useEffect(() => {
    setPage(0);
  }, [baseParams]);

  const toggleExpanded = useCallback((index: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, []);

  const handleSort = useCallback(
    (columnKey: string) => {
      const newDirection =
        sortBy === columnKey && sortDirection === "DESC" ? "ASC" : "DESC";
      setSortBy(columnKey);
      setSortDirection(newDirection);
      setPage(0);
    },
    [sortBy, sortDirection]
  );

  const handleRowsPerPageChange = useCallback((newLimit: number) => {
    setLimit(newLimit);
    setPage(0);
  }, []);

  const handlePrevPage = useCallback(() => {
    setPage((prev) => Math.max(0, prev - 1));
  }, []);

  const handleNextPage = useCallback(() => {
    setPage((prev) => prev + 1);
  }, []);

  const gridColumns = useMemo(() => {
    const baseColumns = expandable ? "3rem " : "";
    const colWidths = columns.map(() => "1fr").join(" ");
    return baseColumns + colWidths;
  }, [columns, expandable]);

  if (loading) {
    return (
      <div className={classNames(styles.container, className)}>
        <div className={styles.loadingContainer}>
          <PuffLoader color="var(--color-accent)" size={35} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={classNames(styles.container, className)}>
        <div className={styles.errorContainer}>
          <span className={styles.errorText}>Failed to load table data</span>
        </div>
      </div>
    );
  }

  if (!tableData || tableData.length === 0) {
    return (
      <div className={classNames(styles.container, className)}>
        <div className={styles.emptyContainer}>
          <span className={styles.emptyText}>{emptyMessage}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={classNames(styles.container, className)}>
      {title && (
        <div className={styles.tableHeader}>
          <h2 className={styles.tableTitle}>{title}</h2>
          {tableData.length > 0 && (
            <div className={styles.resultCount}>
              Showing {tableData.length} {pluralize(tableData.length, "row")}
            </div>
          )}
        </div>
      )}
      <div className={styles.tableWrapper}>
        <div
          className={styles.tableGrid}
          style={{ gridTemplateColumns: gridColumns }}
        >
          <div className={styles.headerRow}>
            {expandable && <div className={styles.headerCell}></div>}

            {columns.map((column) => (
              <div
                key={column.key}
                className={classNames(styles.headerCell, {
                  [styles.headerCellCenter]: column.align === "center",
                  [styles.headerCellRight]: column.align === "right",
                })}
              >
                {column.sortable ? (
                  <button
                    className={styles.sortButton}
                    onClick={() => handleSort(column.key)}
                  >
                    <span>{column.header}</span>
                    <LuArrowUpDown
                      className={classNames(styles.sortIcon, {
                        [styles.sortIconActive]: sortBy === column.key,
                      })}
                    />
                  </button>
                ) : (
                  <span>{column.header}</span>
                )}
              </div>
            ))}
          </div>

          {tableData.map((row: T, rowIndex: number) => {
            const isExpanded = expandedRows.has(rowIndex);

            return (
              <div key={rowIndex} className={styles.rowGroup}>
                <div className={styles.dataRow}>
                  {expandable && (
                    <div className={styles.dataCell}>
                      <button
                        className={styles.expandButton}
                        onClick={() => toggleExpanded(rowIndex)}
                      >
                        {isExpanded ? (
                          <LuChevronDown className={styles.expandIcon} />
                        ) : (
                          <LuChevronRight className={styles.expandIcon} />
                        )}
                      </button>
                    </div>
                  )}

                  {columns.map((column) => (
                    <div
                      key={column.key}
                      className={classNames(styles.dataCell, column.className, {
                        [styles.dataCellCenter]: column.align === "center",
                        [styles.dataCellRight]: column.align === "right",
                      })}
                    >
                      <div className={styles.cellContent}>
                        {column.render
                          ? column.render(row[column.key], row)
                          : row[column.key]}
                      </div>
                    </div>
                  ))}
                </div>

                {expandable && isExpanded && renderExpanded && (
                  <div
                    className={styles.expandedRow}
                    style={{ gridColumn: `1 / -1` }}
                  >
                    {renderExpanded(row)}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {hasPagination && tableData.length > 0 && (
          <div className={styles.paginationContainer}>
            <div className={styles.paginationLeft}>
              <span className={styles.paginationInfo}>Page {page + 1}</span>
            </div>
            <div className={styles.paginationRight}>
              <div className={styles.rowsPerPageContainer}>
                <span className={styles.rowsPerPageLabel}>Rows:</span>
                <TableDropdown
                  options={rowsPerPageOptions.map((option) => ({
                    id: option.toString(),
                    label: option.toString(),
                    onClick: () => handleRowsPerPageChange(option),
                  }))}
                  trigger={
                    <div className={styles.rowsPerPageTrigger}>
                      <span>{limit}</span>
                      <LuChevronDown className={styles.rowsPerPageChevron} />
                    </div>
                  }
                />
              </div>
              <button
                className={styles.paginationButton}
                onClick={handlePrevPage}
                disabled={page === 0}
              >
                <LuChevronLeft />
              </button>
              <button
                className={styles.paginationButton}
                onClick={handleNextPage}
                disabled={tableData.length < limit}
              >
                <LuChevronRight />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(DataReportsTable);
