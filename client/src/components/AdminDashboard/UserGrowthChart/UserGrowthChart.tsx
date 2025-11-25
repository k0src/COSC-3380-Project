import { memo } from "react";
import { PuffLoader } from "react-spinners";
import { useAsyncData } from "@hooks";
import { dataApi } from "@api";
import styles from "./UserGrowthChart.module.css";
import type { DataReportParams } from "@types";
import { LineChart } from "@mui/x-charts/LineChart";
import { chartsTooltipClasses } from "@mui/x-charts";

export interface UserGrowthChartProps {
  params: DataReportParams;
}

const UserGrowthChart: React.FC<UserGrowthChartProps> = ({ params }) => {
  const { data, loading, error } = useAsyncData(
    {
      growth: () => dataApi.getUserGrowthData(params),
    },
    [JSON.stringify(params)],
    {
      cacheKey: `user_growth_${JSON.stringify(params)}`,
    }
  );

  const growthData = data?.growth ?? [];

  if (loading) {
    return (
      <div className={styles.gridItem}>
        <span className={styles.sectionTitle}>User Growth Over Time</span>
        <div className={styles.loaderContainer}>
          <PuffLoader color="var(--color-accent)" size={35} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.gridItem}>
        <span className={styles.sectionTitle}>User Growth Over Time</span>
        <div className={styles.errorContainer}>
          <span className={styles.errorText}>Error loading chart data</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.gridItem}>
      <span className={styles.sectionTitle}>User Growth Over Time</span>
      <div className={styles.chartContainer}>
        <LineChart
          xAxis={[
            {
              data: growthData.map((d) => d.period),
              scaleType: "point",
              valueFormatter: (value) =>
                new Date(value).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                }),
              tickLabelStyle: {
                fill: "var(--color-text-gray)",
                fontSize: 11,
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
              id: "newUsers",
              data: growthData.map((d) => d.newUsers),
              label: "New Users",
              area: true,
              showMark: false,
              color: "var(--color-orange-ui)",
              curve: "natural",
            },
            {
              id: "totalUsers",
              data: growthData.map((d) => d.totalUsers),
              label: "Total Users",
              area: true,
              showMark: false,
              color: "var(--color-green-ui)",
              curve: "natural",
            },
          ]}
          sx={{
            ".MuiLineElement-root": {
              strokeWidth: 2,
            },
            ".MuiAreaElement-series-newUsers": {
              fill: "url('#orangeGradient')",
            },
            ".MuiAreaElement-series-totalUsers": {
              fill: "url('#greenGradient')",
            },
            "& .MuiChartsGrid-line": {
              stroke: "var(--color-gray-button)",
              strokeDasharray: "4 4",
              strokeWidth: 1,
            },
            ".MuiChartsAxis-line": {
              stroke: "var(--color-gray-button)",
            },
            ".MuiChartsAxis-tick": {
              stroke: "none",
            },
          }}
          grid={{ vertical: true, horizontal: true }}
          margin={{ left: -25, right: 20, top: 10, bottom: 0 }}
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
        >
          <defs>
            <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor="var(--color-green-ui)"
                stopOpacity={0.5}
              />
              <stop
                offset="50%"
                stopColor="var(--color-green-ui)"
                stopOpacity={0.2}
              />
              <stop
                offset="100%"
                stopColor="var(--color-green-ui)"
                stopOpacity={0.0}
              />
            </linearGradient>
            <linearGradient id="orangeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor="var(--color-orange-ui)"
                stopOpacity={0.5}
              />
              <stop
                offset="50%"
                stopColor="var(--color-orange-ui)"
                stopOpacity={0.2}
              />
              <stop
                offset="100%"
                stopColor="var(--color-orange-ui)"
                stopOpacity={0.0}
              />
            </linearGradient>
          </defs>
        </LineChart>
      </div>
    </div>
  );
};

export default memo(UserGrowthChart);
