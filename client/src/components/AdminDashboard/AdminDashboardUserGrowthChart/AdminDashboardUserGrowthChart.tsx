import { memo, useMemo } from "react";
import { PuffLoader } from "react-spinners";
import { chartsTooltipClasses } from "@mui/x-charts";
import { LineChart } from "@mui/x-charts/LineChart";
import { useAsyncData } from "@hooks";
import { statsApi } from "@api";
import styles from "./AdminDashboardUserGrowthChart.module.css";

const AdminDashboardUserGrowthChart: React.FC = () => {
  const { data, loading, error } = useAsyncData(
    {
      userGrowth: () => statsApi.getUserGrowth(30),
    },
    [],
    {
      cacheKey: "admin_user_growth_30d",
    }
  );

  const chartData = useMemo(() => {
    if (!data?.userGrowth) return { dates: [], counts: [] };

    const dates = data.userGrowth.map((item) => {
      const date = new Date(item.date);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    });
    const counts = data.userGrowth.map((item) => item.count);

    return { dates, counts };
  }, [data?.userGrowth]);

  const hasData = useMemo(
    () =>
      chartData.counts.length > 0 && chartData.counts.some((val) => val > 0),
    [chartData.counts]
  );

  if (loading) {
    return (
      <div className={styles.sectionContainer}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>
            User Growth (Last 30 days)
          </span>
        </div>
        <div className={styles.loaderContainer}>
          <PuffLoader color="var(--color-accent)" size={35} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.sectionContainer}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>
            User Growth (Last 30 days)
          </span>
        </div>
        <div className={styles.error}>Failed to load user growth data.</div>
      </div>
    );
  }

  return (
    <div className={styles.sectionContainer}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionTitle}>User Growth (Last 30 days)</span>
      </div>
      {hasData ? (
        <div className={styles.chartContainer}>
          <LineChart
            xAxis={[
              {
                data: chartData.dates,
                scaleType: "point",
                tickLabelStyle: {
                  fill: "var(--color-text-gray)",
                  fontSize: 12,
                },
                disableLine: true,
                disableTicks: true,
              },
            ]}
            yAxis={[
              {
                tickLabelStyle: {
                  display: "none",
                },
                disableLine: true,
                disableTicks: true,
              },
            ]}
            series={[
              {
                data: chartData.counts,
                area: true,
                showMark: false,
                color: "var(--color-accent)",
                curve: "natural",
              },
            ]}
            sx={{
              ".MuiLineElement-root": {
                strokeWidth: 2,
              },
              ".MuiAreaElement-root": {
                fill: "url('#userGrowthGradient')",
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
            grid={{ vertical: true }}
            hideLegend={true}
            margin={{ left: 0, right: 45, top: 25, bottom: 25 }}
            slotProps={{
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
              <linearGradient
                id="userGrowthGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor="var(--color-accent)"
                  stopOpacity={0.5}
                />
                <stop
                  offset="50%"
                  stopColor="var(--color-accent)"
                  stopOpacity={0.2}
                />
                <stop
                  offset="100%"
                  stopColor="var(--color-accent)"
                  stopOpacity={0.0}
                />
              </linearGradient>
            </defs>
          </LineChart>
        </div>
      ) : (
        <div className={styles.noDataContainer}>
          <span className={styles.noDataMessage}>
            No user growth data available for the last 30 days.
          </span>
        </div>
      )}
    </div>
  );
};

export default memo(AdminDashboardUserGrowthChart);
