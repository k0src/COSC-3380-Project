import { memo } from "react";
import { PuffLoader } from "react-spinners";
import { useAsyncData } from "@hooks";
import { dataApi } from "@api";
import styles from "./OverviewActivityChart.module.css";
import type { DataReportParams } from "@types";
import { BarChart } from "@mui/x-charts/BarChart";
import { chartsTooltipClasses } from "@mui/x-charts";

export interface OverviewActivityChartProps {
  params: DataReportParams;
}

const OverviewActivityChart: React.FC<OverviewActivityChartProps> = ({
  params,
}) => {
  const { data, loading, error } = useAsyncData(
    { timeline: () => dataApi.getActivityTimeline(params) },
    [JSON.stringify(params)]
  );

  const timelineData = data?.timeline ?? [];

  if (loading) {
    return (
      <div className={styles.gridItem}>
        <span className={styles.sectionTitle}>Activity Timeline</span>
        <div className={styles.loaderContainer}>
          <PuffLoader color="var(--color-accent)" size={35} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.gridItem}>
        <span className={styles.sectionTitle}>Activity Timeline</span>
        <div className={styles.errorContainer}>
          <span className={styles.errorText}>Error loading chart data</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.gridItem}>
      <span className={styles.sectionTitle}>Activity Timeline</span>
      <div className={styles.chartContainer}>
        <BarChart
          xAxis={[
            {
              data: timelineData.map((d) =>
                new Date(d.period).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })
              ),
              scaleType: "band",
              tickLabelStyle: {
                fill: "var(--color-text-gray)",
                fontSize: 10,
                angle: -45,
                textAnchor: "end",
              },
              disableLine: true,
              disableTicks: true,
            },
          ]}
          yAxis={[
            {
              tickLabelStyle: {
                fill: "var(--color-text-gray)",
                fontSize: 11,
              },
              disableLine: true,
              disableTicks: true,
            },
          ]}
          series={[
            {
              data: timelineData.map((d) => d.streams),
              label: "Streams",
              color: "var(--color-green-ui)",
            },
            {
              data: timelineData.map((d) => d.likes),
              label: "Likes",
              color: "var(--color-orange-ui)",
            },
          ]}
          sx={{
            "& .MuiChartsGrid-line": {
              stroke: "var(--color-gray-button)",
              strokeDasharray: "4 4",
            },
            ".MuiChartsLegend-series text": {
              fill: "var(--color-text-gray) !important",
            },
          }}
          grid={{ vertical: false, horizontal: true }}
          margin={{ left: -25, right: 10, top: 10, bottom: 20 }}
          slotProps={{
            legend: {
              sx: {
                "& .MuiChartsLegend-label": {
                  color: "var(--color-white-alt) !important",
                  fontSize: "var(--font-size-sm) !important",
                  fontFamily: "var(--font-main) !important",
                },
              },
            },
            tooltip: {
              sx: {
                [`& .${chartsTooltipClasses.paper}`]: {
                  backgroundColor: "var(--color-panel-gray-dark) !important",
                  border:
                    "var(--border-size-sm) solid var(--color-panel-border) !important",
                  borderRadius: "var(--border-radius-md) !important",
                  padding: "var(--spacing-xs) !important",
                  boxShadow: "var(--shadow-sm) !important",
                  color: "var(--color-white-alt) !important",
                  fontSize: "var(--font-size-sm) !important",
                },
                [`& .${chartsTooltipClasses.labelCell}`]: {
                  color: "var(--color-white-alt) !important",
                  fontSize: "var(--font-size-sm) !important",
                },
                [`& .${chartsTooltipClasses.valueCell}`]: {
                  color: "var(--color-text-gray) !important",
                  fontSize: "var(--font-size-xs) !important",
                  fontWeight: "500 !important",
                },
                [`& .${chartsTooltipClasses.mark}`]: {
                  borderRadius: "50% !important",
                  width: 10,
                  height: 10,
                },
              },
            },
          }}
        />
      </div>
    </div>
  );
};

export default memo(OverviewActivityChart);
