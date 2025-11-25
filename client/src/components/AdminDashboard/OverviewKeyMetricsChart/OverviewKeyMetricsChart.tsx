import { memo } from "react";
import { PuffLoader } from "react-spinners";
import { useAsyncData } from "@hooks";
import { dataApi } from "@api";
import styles from "./OverviewKeyMetricsChart.module.css";
import type { DataReportParams } from "@types";
import { LineChart } from "@mui/x-charts/LineChart";
import { chartsTooltipClasses } from "@mui/x-charts";

export interface OverviewKeyMetricsChartProps {
  params: DataReportParams;
}

const OverviewKeyMetricsChart: React.FC<OverviewKeyMetricsChartProps> = ({
  params,
}) => {
  const { data, loading, error } = useAsyncData(
    {
      kpiData: () => dataApi.getKpisData(params),
    },
    [JSON.stringify(params)],
    {
      cacheKey: `kpi_data_${JSON.stringify(params)}`,
    }
  );

  const kpiData = data?.kpiData;

  if (loading) {
    return (
      <div className={styles.gridItem}>
        <span className={styles.sectionTitle}>Key Metrics Trends</span>
        <div className={styles.loaderContainer}>
          <PuffLoader color="var(--color-accent)" size={35} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.gridItem}>
        <span className={styles.sectionTitle}>Key Metrics Trends</span>
        <div className={styles.errorContainer}>
          <span className={styles.errorText}>Error loading chart data</span>
        </div>
      </div>
    );
  }

  if (!kpiData) {
    return null;
  }

  return (
    <div className={styles.gridItem}>
      <span className={styles.sectionTitle}>Key Metrics Trends</span>
      <div className={styles.chartContainer}>
        <LineChart
          xAxis={[
            {
              data: Array.from(
                {
                  length: kpiData.kpis.activeUsers.trend.length,
                },
                (_, i) => i
              ),
              scaleType: "point",
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
              data: kpiData.kpis.activeUsers.trend,
              label: "Active Users",
              color: "var(--color-green-ui)",
              curve: "natural",
              showMark: false,
            },
            {
              data: kpiData.kpis.totalStreams.trend.map((v: number) => v / 10),
              label: "Streams (÷10)",
              color: "var(--color-orange-ui)",
              curve: "natural",
              showMark: false,
            },
          ]}
          sx={{
            ".MuiLineElement-root": {
              strokeWidth: 2,
            },
            ".MuiAreaElement-root": {
              fill: "url('#areaGradient')",
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
          margin={{ left: -40, right: 10, top: 10, bottom: 0 }}
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

export default memo(OverviewKeyMetricsChart);
