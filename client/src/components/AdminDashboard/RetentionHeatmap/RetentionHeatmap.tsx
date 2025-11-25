import { memo, useState, useRef } from "react";
import { PuffLoader } from "react-spinners";
import { useAsyncData } from "@hooks";
import { dataApi } from "@api";
import type { DataReportParams, RetentionCohort } from "@types";
import styles from "./RetentionHeatmap.module.css";

export interface RetentionHeatmapProps {
  params: DataReportParams;
}

const RetentionHeatmap: React.FC<RetentionHeatmapProps> = ({ params }) => {
  const [hoveredCell, setHoveredCell] = useState<{
    cohort: string;
    day: string;
    count: number;
    percentage: number;
  } | null>(null);

  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const rafRef = useRef<number>(0);

  const { data, loading, error } = useAsyncData(
    { cohorts: () => dataApi.getRetentionCohorts(params) },
    [JSON.stringify(params)]
  );

  const cohorts = data?.cohorts ?? [];

  const retentionDays = ["day1", "day7", "day14", "day28", "day90"] as const;
  const dayLabels = {
    day1: "Day 1",
    day7: "Day 7",
    day14: "Day 14",
    day28: "Day 28",
    day90: "Day 90",
  };

  const getColor = (percentage: number) => {
    const hue = percentage * 1.2;
    return `hsl(${hue}, 70%, 50%)`;
  };

  const handleCellEnter = (
    cohort: RetentionCohort,
    day: keyof typeof dayLabels,
    event: React.MouseEvent
  ) => {
    const count = cohort[day];
    const percentage = (count / cohort.cohortSize) * 100;
    setHoveredCell({
      cohort: cohort.cohortWeek,
      day: dayLabels[day],
      count,
      percentage,
    });
    setTooltipPos({ x: event.clientX, y: event.clientY });
  };

  const handleCellMove = (event: React.MouseEvent) => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    rafRef.current = requestAnimationFrame(() => {
      setTooltipPos({ x: event.clientX, y: event.clientY });
    });
  };

  const handleCellLeave = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    setHoveredCell(null);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loaderContainer}>
          <PuffLoader color="var(--color-accent)" size={35} />
        </div>
      </div>
    );
  }

  if (error || cohorts.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          No retention data available for the selected time range.
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.heatmapGrid}>
          <div className={styles.headerCell}>Cohort Week</div>
          {retentionDays.map((day) => (
            <div key={day} className={styles.headerCell}>
              {dayLabels[day]}
            </div>
          ))}
        </div>
      </div>
      <div className={styles.heatmapGrid}>
        {cohorts.map((cohort) => (
          <div key={cohort.cohortWeek} className={styles.row}>
            <div className={styles.cohortCell}>
              {new Date(cohort.cohortWeek).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </div>
            {retentionDays.map((day) => {
              const count = cohort[day];
              const percentage = (count / cohort.cohortSize) * 100;
              return (
                <div
                  key={day}
                  className={styles.dataCell}
                  style={{ backgroundColor: getColor(percentage) }}
                  onMouseEnter={(e) => handleCellEnter(cohort, day, e)}
                  onMouseMove={handleCellMove}
                  onMouseLeave={handleCellLeave}
                >
                  <span className={styles.cellValue}>
                    {percentage.toFixed(0)}%
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {hoveredCell && (
        <div
          className={styles.tooltip}
          style={{
            left: tooltipPos.x + 10,
            top: tooltipPos.y + 10,
          }}
        >
          <div className={styles.tooltipRow}>
            <strong>Cohort:</strong> {hoveredCell.cohort}
          </div>
          <div className={styles.tooltipRow}>
            <strong>Retention:</strong> {hoveredCell.day}
          </div>
          <div className={styles.tooltipRow}>
            <strong>Users:</strong> {hoveredCell.count}
          </div>
          <div className={styles.tooltipRow}>
            <strong>Rate:</strong> {hoveredCell.percentage.toFixed(1)}%
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(RetentionHeatmap);
