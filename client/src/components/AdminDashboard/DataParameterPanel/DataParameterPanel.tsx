import { memo, useState, useCallback, useEffect } from "react";
import type { DataReportParams, Granularity, CompareTo } from "@types";
import { formatDateString } from "@util";
import styles from "./DataParameterPanel.module.css";
import classNames from "classnames";
import {
  LuX,
  LuCalendar,
  LuCheck,
  LuRotateCcw,
  LuSlidersHorizontal,
} from "react-icons/lu";

interface DataParameterPanelProps {
  params: DataReportParams;
  onParamsChange: (params: DataReportParams) => void;
  showGranularity?: boolean;
  showCompareTo?: boolean;
  showLimit?: boolean;
  showCohortBy?: boolean;
  showMinThresholds?: boolean;
}

const DataParameterPanel: React.FC<DataParameterPanelProps> = ({
  params,
  onParamsChange,
  showGranularity = true,
  showCompareTo = true,
  showLimit = false,
  showCohortBy = false,
  showMinThresholds = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [pendingParams, setPendingParams] = useState<DataReportParams>(params);

  useEffect(() => {
    setPendingParams(params);
  }, [params]);

  const handleTimeRangeChange = useCallback(
    (field: "startDate" | "endDate", value: string) => {
      setPendingParams({
        ...pendingParams,
        timeRange: {
          ...pendingParams.timeRange,
          [field]: new Date(value).toISOString(),
        },
      });
    },
    [pendingParams]
  );

  const handleGranularityChange = useCallback(
    (granularity: Granularity) => {
      setPendingParams({ ...pendingParams, granularity });
    },
    [pendingParams]
  );

  const handleCompareToChange = useCallback(
    (compareTo: CompareTo) => {
      setPendingParams({ ...pendingParams, compareTo });
    },
    [pendingParams]
  );

  const handleLimitChange = useCallback(
    (limit: number) => {
      setPendingParams({ ...pendingParams, limit });
    },
    [pendingParams]
  );

  const handleCohortByChange = useCallback(
    (cohortBy: "signup_week" | "signup_month") => {
      setPendingParams({ ...pendingParams, cohortBy });
    },
    [pendingParams]
  );

  const handleMinStreamsChange = useCallback(
    (minStreams: number) => {
      setPendingParams({ ...pendingParams, minStreams });
    },
    [pendingParams]
  );

  const handleMinGrowthPercentChange = useCallback(
    (minGrowthPercent: number) => {
      setPendingParams({ ...pendingParams, minGrowthPercent });
    },
    [pendingParams]
  );

  const handleMinEngagementRateChange = useCallback(
    (minEngagementRate: number) => {
      setPendingParams({ ...pendingParams, minEngagementRate });
    },
    [pendingParams]
  );

  const handleQuickRange = useCallback(
    (days: number) => {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      setPendingParams({
        ...pendingParams,
        timeRange: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
      });
    },
    [pendingParams]
  );

  const handleSubmit = useCallback(() => {
    onParamsChange(pendingParams);
  }, [pendingParams, onParamsChange]);

  const handleReset = useCallback(() => {
    setPendingParams(params);
  }, [params]);

  const hasChanges = JSON.stringify(params) !== JSON.stringify(pendingParams);

  return (
    <div className={styles.panel}>
      <button
        className={styles.toggleButton}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <LuSlidersHorizontal className={styles.toggleIcon} />
        <span>Parameters</span>
        {isExpanded ? <LuX className={styles.closeIcon} /> : null}
      </button>

      {isExpanded && (
        <div className={styles.content}>
          <div className={styles.section}>
            <label className={styles.sectionLabel}>
              <LuCalendar className={styles.sectionIcon} />
              Time Range
            </label>
            <div className={styles.quickRanges}>
              <button
                className={styles.quickRangeButton}
                onClick={() => handleQuickRange(7)}
              >
                Last 7 days
              </button>
              <button
                className={styles.quickRangeButton}
                onClick={() => handleQuickRange(30)}
              >
                Last 30 days
              </button>
              <button
                className={styles.quickRangeButton}
                onClick={() => handleQuickRange(90)}
              >
                Last 90 days
              </button>
            </div>
            <div className={styles.dateInputs}>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Start Date</label>
                <input
                  type="date"
                  className={styles.dateInput}
                  value={formatDateString(pendingParams.timeRange.startDate)}
                  onChange={(e) =>
                    handleTimeRangeChange("startDate", e.target.value)
                  }
                />
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>End Date</label>
                <input
                  type="date"
                  className={styles.dateInput}
                  value={formatDateString(pendingParams.timeRange.endDate)}
                  onChange={(e) =>
                    handleTimeRangeChange("endDate", e.target.value)
                  }
                />
              </div>
            </div>
          </div>

          {showGranularity && (
            <div className={styles.section}>
              <label className={styles.sectionLabel}>Granularity</label>
              <div className={styles.buttonGroup}>
                {(["hour", "day", "week", "month"] as Granularity[]).map(
                  (g) => (
                    <button
                      key={g}
                      className={classNames(styles.optionButton, {
                        [styles.active]: pendingParams.granularity === g,
                      })}
                      onClick={() => handleGranularityChange(g)}
                    >
                      {g.charAt(0).toUpperCase() + g.slice(1)}
                    </button>
                  )
                )}
              </div>
            </div>
          )}

          {showCompareTo && (
            <div className={styles.section}>
              <label className={styles.sectionLabel}>Compare To</label>
              <div className={styles.buttonGroup}>
                {(["none", "previous_period", "year_ago"] as CompareTo[]).map(
                  (c) => (
                    <button
                      key={c}
                      className={classNames(styles.optionButton, {
                        [styles.active]: pendingParams.compareTo === c,
                      })}
                      onClick={() => handleCompareToChange(c)}
                    >
                      {c === "none"
                        ? "None"
                        : c === "previous_period"
                        ? "Previous Period"
                        : "Year Ago"}
                    </button>
                  )
                )}
              </div>
            </div>
          )}

          {showLimit && (
            <div className={styles.section}>
              <label className={styles.sectionLabel}>Limit</label>
              <input
                type="number"
                className={styles.numberInput}
                value={pendingParams.limit || 50}
                onChange={(e) => handleLimitChange(parseInt(e.target.value))}
                min={1}
                max={200}
              />
            </div>
          )}

          {showCohortBy && (
            <div className={styles.section}>
              <label className={styles.sectionLabel}>Cohort By</label>
              <div className={styles.buttonGroup}>
                {(["signup_week", "signup_month"] as const).map((c) => (
                  <button
                    key={c}
                    className={classNames(styles.optionButton, {
                      [styles.active]: pendingParams.cohortBy === c,
                    })}
                    onClick={() => handleCohortByChange(c)}
                  >
                    {c === "signup_week" ? "Week" : "Month"}
                  </button>
                ))}
              </div>
            </div>
          )}

          {showMinThresholds && (
            <div className={styles.section}>
              <label className={styles.sectionLabel}>Thresholds</label>
              <div className={styles.thresholdGrid}>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Min Streams</label>
                  <input
                    type="number"
                    className={styles.numberInput}
                    value={pendingParams.minStreams || 0}
                    onChange={(e) =>
                      handleMinStreamsChange(parseInt(e.target.value) || 0)
                    }
                    min={0}
                    placeholder="0"
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Min Growth %</label>
                  <input
                    type="number"
                    className={styles.numberInput}
                    value={pendingParams.minGrowthPercent || 0}
                    onChange={(e) =>
                      handleMinGrowthPercentChange(
                        parseFloat(e.target.value) || 0
                      )
                    }
                    min={0}
                    step={0.1}
                    placeholder="0"
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Min Engagement %</label>
                  <input
                    type="number"
                    className={styles.numberInput}
                    value={pendingParams.minEngagementRate || 0}
                    onChange={(e) =>
                      handleMinEngagementRateChange(
                        parseFloat(e.target.value) || 0
                      )
                    }
                    min={0}
                    step={0.1}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          )}

          <div className={styles.actions}>
            <button
              className={classNames(styles.actionButton, styles.resetButton)}
              onClick={handleReset}
              disabled={!hasChanges}
            >
              <LuRotateCcw />
              <span>Reset</span>
            </button>
            <button
              className={classNames(styles.actionButton, styles.submitButton)}
              onClick={handleSubmit}
              disabled={!hasChanges}
            >
              <LuCheck />
              <span>Apply Changes</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(DataParameterPanel);
