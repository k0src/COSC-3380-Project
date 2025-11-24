import { memo, useState, useCallback, useEffect } from "react";
import { PuffLoader } from "react-spinners";
import type { DataTableProps } from "@types";
import { DataTableHeader, DataTableCheckbox } from "@components";
import { useDataTableState, useColumnWidths } from "@hooks";
import classNames from "classnames";
import styles from "./DataTable.module.css";
import { LuArrowUpDown } from "react-icons/lu";

function DataTable<T extends Record<string, any> = any>({
  fetchData,
  columns,
  filterKeys,
  actions = [],
  bulkActions = [],
  initialRowsPerPage = 25,
  rowsPerPageOptions = [10, 25, 50, 100],
  className,
  cacheKey,
  dependencies = [],
  theme = "default",
  noDataMessage,
  onRefetchNeeded,
}: DataTableProps<T>) {
  const [isActionExecuting, setIsActionExecuting] = useState(false);
  const [isBulkActionExecuting, setIsBulkActionExecuting] = useState(false);
  const {
    loading,
    error,
    refetch,
    currentPage,
    rowsPerPage,
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
    selectedIds,
    toggleSelection,
    toggleSelectAll,
    clearSelection,
    isAllSelected,
  } = useDataTableState({
    fetchData,
    cacheKey,
    dependencies,
    initialRowsPerPage,
    filterKeys,
  });

  const hasCheckbox = bulkActions.length > 0;
  const hasActions = actions.length > 0;
  const gridTemplateColumns = useColumnWidths({
    columns,
    data: sortedData,
    cacheKey,
    hasCheckbox,
    hasActions,
    actionsCount: actions.length,
  });

  useEffect(() => {
    if (onRefetchNeeded) {
      onRefetchNeeded.current = refetch;
    }
  }, [refetch, onRefetchNeeded]);

  const handleFilterClear = useCallback(() => {
    setFilterText("");
  }, [setFilterText]);

  const handleActionClick = useCallback(
    async (action: (typeof actions)[0], row: T) => {
      if (action.disabled && action.disabled(row)) return;

      setIsActionExecuting(true);
      try {
        await action.onClick(row, refetch);
        clearSelection();
      } catch (error) {
        console.error("Failed to execute action:", error);
      } finally {
        setIsActionExecuting(false);
      }
    },
    [refetch, clearSelection]
  );

  const handleBulkActionClick = useCallback(
    async (action: (typeof bulkActions)[0]) => {
      if (selectedIds.size === 0) return;

      setIsBulkActionExecuting(true);
      try {
        const selectedRows = sortedData.filter((row) =>
          selectedIds.has(row.id)
        );
        const enabledRows = action.disabled
          ? selectedRows.filter((row) => !action.disabled!(row))
          : selectedRows;

        if (enabledRows.length === 0) {
          setIsBulkActionExecuting(false);
          return;
        }

        await action.onClick(enabledRows, refetch);
        clearSelection();
      } catch (error) {
        console.error("Failed to execute bulk action:", error);
      } finally {
        setIsBulkActionExecuting(false);
      }
    },
    [selectedIds, sortedData, clearSelection, refetch]
  );

  const hasFilter = !!filterKeys && filterKeys.length > 0;
  const hasPagination = rowsPerPageOptions.length > 0;
  const showHeader = hasFilter || hasPagination || hasCheckbox;
  const hasData = sortedData.length > 0;
  const isDisabled = loading || !hasData;

  return (
    <div className={classNames(styles.dataTableContainer, className)}>
      {showHeader && (
        <DataTableHeader<T>
          hasFilter={hasFilter}
          filterText={filterText}
          onFilterChange={setFilterText}
          onFilterClear={handleFilterClear}
          bulkActions={bulkActions}
          selectedCount={selectedIds.size}
          selectedRows={sortedData.filter((row) => selectedIds.has(row.id))}
          onBulkAction={handleBulkActionClick}
          isBulkActionExecuting={isBulkActionExecuting}
          hasPagination={hasPagination}
          currentPage={currentPage}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={rowsPerPageOptions}
          hasMore={hasMore}
          onRowsPerPageChange={setRowsPerPage}
          onPrevPage={goToPrevPage}
          onNextPage={goToNextPage}
          disabled={isDisabled}
          theme={theme}
        />
      )}

      {loading && (
        <div
          className={classNames(styles.loaderContainer, {
            [styles.loaderContainerDefault]: theme === "default",
          })}
        >
          <PuffLoader color="var(--color-accent)" size={35} />
        </div>
      )}

      {error && !loading && (
        <div
          className={classNames(styles.errorContainer, {
            [styles.errorContainerDefault]: theme === "default",
          })}
        >
          <span>Failed to load data</span>
          <button className={styles.retryButton} onClick={refetch}>
            Retry
          </button>
        </div>
      )}

      {!loading && !error && !hasData && (
        <div
          className={classNames(styles.emptyContainer, {
            [styles.emptyContainerDefault]: theme === "default",
          })}
        >
          {noDataMessage || (
            <span className={styles.emptyMessage}>No data available</span>
          )}
        </div>
      )}

      {!loading && !error && hasData && (
        <div
          className={classNames(styles.dataTableWrapper, {
            [styles.dataTableWrapperDark]: theme === "dark",
            [styles.dataTableWrapperDefault]: theme === "default",
          })}
        >
          <div className={styles.dataTableGrid} style={{ gridTemplateColumns }}>
            <div className={styles.headerRow}>
              {hasCheckbox && (
                <div
                  className={classNames(styles.headerCell, {
                    [styles.headerCellDefault]: theme === "default",
                  })}
                >
                  <DataTableCheckbox
                    checked={isAllSelected}
                    onChange={toggleSelectAll}
                  />
                </div>
              )}

              {columns.map((column) => (
                <div
                  key={column.key}
                  className={classNames(styles.headerCell, {
                    [styles.headerCellDefault]: theme === "default",
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
                          [styles.sortIconDesc]:
                            sortColumn === column.key &&
                            sortDirection === "DESC",
                        })}
                      />
                    </button>
                  ) : (
                    <span>{column.header}</span>
                  )}
                </div>
              ))}

              {hasActions && (
                <div
                  className={classNames(styles.headerCell, {
                    [styles.headerCellDefault]: theme === "default",
                  })}
                >
                  <span>Actions</span>
                </div>
              )}
            </div>

            {sortedData.map((row, rowIndex) => (
              <div
                key={row.id || rowIndex}
                className={classNames(styles.dataRow, {
                  [styles.dataRowDefault]: theme === "default",
                })}
              >
                {hasCheckbox && (
                  <div
                    className={classNames(styles.dataCell, {
                      [styles.dataCellDefault]: theme === "default",
                      [styles.dataCellDark]: theme === "dark",
                    })}
                  >
                    <DataTableCheckbox
                      checked={selectedIds.has(row.id)}
                      onChange={() => toggleSelection(row.id)}
                    />
                  </div>
                )}

                {columns.map((column) => (
                  <div
                    key={column.key}
                    className={classNames(styles.dataCell, column.className, {
                      [styles.dataCellCenter]: column.align === "center",
                      [styles.dataCellRight]: column.align === "right",
                      [styles.dataCellDefault]: theme === "default",
                      [styles.dataCellDark]: theme === "dark",
                    })}
                  >
                    <div className={styles.cellContent}>
                      {column.render
                        ? column.render(row[column.key], row, rowIndex)
                        : row[column.key]}
                    </div>
                  </div>
                ))}

                {hasActions && (
                  <div
                    className={classNames(styles.dataCell, {
                      [styles.dataCellCenter]: actions.length === 1,
                      [styles.dataCellDefault]: theme === "default",
                      [styles.dataCellDark]: theme === "dark",
                    })}
                  >
                    <div className={styles.actionButtons}>
                      {actions.map((action) => {
                        const Icon = action.icon;
                        const isDisabled =
                          isActionExecuting ||
                          (action.disabled && action.disabled(row));
                        return (
                          <button
                            key={action.id}
                            className={classNames(styles.actionButton, {
                              [styles.actionButtonDanger]:
                                action.variant === "danger",
                            })}
                            onClick={() => handleActionClick(action, row)}
                            disabled={isDisabled}
                          >
                            <Icon />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(DataTable) as typeof DataTable;
