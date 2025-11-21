import { memo, useMemo } from "react";
import classNames from "classnames";
import { TableDropdown } from "@components";
import type { DataTableBulkAction, TableDropdownOption } from "@types";
import styles from "./DataTableHeader.module.css";
import {
  LuSearch,
  LuX,
  LuChevronLeft,
  LuChevronRight,
  LuChevronDown,
} from "react-icons/lu";

interface DataTableHeaderProps<T = any> {
  hasFilter: boolean;
  filterText: string;
  onFilterChange: (text: string) => void;
  onFilterClear: () => void;
  bulkActions: DataTableBulkAction<T>[];
  selectedCount: number;
  onBulkAction: (action: DataTableBulkAction<T>) => void;
  isBulkActionExecuting: boolean;
  hasPagination: boolean;
  currentPage: number;
  rowsPerPage: number;
  rowsPerPageOptions: number[];
  hasMore: boolean;
  onRowsPerPageChange: (rows: number) => void;
  onPrevPage: () => void;
  onNextPage: () => void;
  disabled?: boolean;
  theme?: "default" | "dark";
}

function DataTableHeader<T = any>({
  hasFilter,
  filterText,
  onFilterChange,
  onFilterClear,
  bulkActions,
  selectedCount,
  onBulkAction,
  isBulkActionExecuting,
  hasPagination,
  currentPage,
  rowsPerPage,
  rowsPerPageOptions,
  hasMore,
  onRowsPerPageChange,
  onPrevPage,
  onNextPage,
  disabled = false,
  theme = "default",
}: DataTableHeaderProps<T>) {
  const hasBulkActions = bulkActions.length > 0;

  const bulkActionOptions: TableDropdownOption[] = useMemo(
    () =>
      bulkActions.map((action) => ({
        id: action.id,
        label: action.label,
        icon: action.icon,
        onClick: () => onBulkAction(action),
        variant: action.variant,
      })),
    [bulkActions, onBulkAction]
  );

  const rowsPerPageDropdownOptions: TableDropdownOption[] = useMemo(
    () =>
      rowsPerPageOptions.map((option) => ({
        id: option.toString(),
        label: option.toString(),
        onClick: () => onRowsPerPageChange(option),
      })),
    [rowsPerPageOptions, onRowsPerPageChange]
  );
  return (
    <div className={styles.headerContainer}>
      <div className={styles.headerLeft}>
        {hasFilter && (
          <div
            className={classNames(styles.filterContainer, {
              [styles.filterContainerDefault]: theme === "default",
            })}
          >
            <LuSearch className={styles.filterIcon} />
            <input
              type="text"
              placeholder="Search..."
              className={styles.filterInput}
              value={filterText}
              onChange={(e) => onFilterChange(e.target.value)}
            />
            {filterText && (
              <LuX className={styles.filterClear} onClick={onFilterClear} />
            )}
          </div>
        )}
      </div>

      <div className={styles.headerRight}>
        {hasBulkActions && selectedCount > 0 && (
          <>
            <div className={styles.bulkActionsContainer}>
              {bulkActions.length === 1 ? (
                <button
                  className={classNames(styles.bulkActionButton, {
                    [styles.bulkActionButtonDanger]:
                      bulkActions[0].variant === "danger",
                    [styles.bulkActionButtonDefault]: theme === "default",
                  })}
                  onClick={() => onBulkAction(bulkActions[0])}
                  disabled={isBulkActionExecuting}
                >
                  {bulkActions[0].icon &&
                    (() => {
                      const Icon = bulkActions[0].icon;
                      return <Icon className={styles.bulkActionIcon} />;
                    })()}
                  <span>
                    {bulkActions[0].label} ({selectedCount})
                  </span>
                </button>
              ) : (
                <TableDropdown
                  options={bulkActionOptions}
                  disabled={isBulkActionExecuting}
                  trigger={
                    <div className={styles.bulkActionButton}>
                      <span>Actions ({selectedCount})</span>
                      <LuChevronDown className={styles.bulkActionChevron} />
                    </div>
                  }
                />
              )}
            </div>
            <div className={styles.verticalRule} />
          </>
        )}

        {hasPagination && (
          <div className={styles.paginationControls}>
            <div className={styles.rowsPerPageContainer}>
              <span className={styles.rowsPerPageLabel}>Rows:</span>
              <TableDropdown
                options={rowsPerPageDropdownOptions}
                disabled={disabled}
                trigger={
                  <div
                    className={classNames(styles.rowsPerPageTrigger, {
                      [styles.rowsPerPageTriggerDefault]: theme === "default",
                    })}
                  >
                    <span>{rowsPerPage}</span>
                    <LuChevronDown className={styles.rowsPerPageChevron} />
                  </div>
                }
              />
            </div>

            <button
              className={classNames(styles.paginationButton, {
                [styles.paginationButtonDefault]: theme === "default",
              })}
              onClick={onPrevPage}
              disabled={disabled || currentPage === 0}
            >
              <LuChevronLeft />
            </button>

            <button
              className={classNames(styles.paginationButton, {
                [styles.paginationButtonDefault]: theme === "default",
              })}
              onClick={onNextPage}
              disabled={disabled || !hasMore}
            >
              <LuChevronRight />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(DataTableHeader) as typeof DataTableHeader;
