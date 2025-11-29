import { memo, useMemo } from "react";
import { PuffLoader } from "react-spinners";
import { useAsyncData } from "@hooks";
import { statsApi } from "@api";
import styles from "./AdminDashboardPlatformActivityChart.module.css";
import { chartsTooltipClasses } from "@mui/x-charts";
import { BarChart } from "@mui/x-charts/BarChart";

const AdminDashboardPlatformActivityChart: React.FC = () => {
  const { data, loading, error } = useAsyncData(
    {
      platformActivity: () => statsApi.getPlatformActivity(30),
    },
    [],
    {
      cacheKey: "admin_platform_activity_30d",
    }
  );

  const chartData = useMemo(() => {
    if (!data?.platformActivity)
      return { dates: [], songs: [], albums: [], playlists: [] };

    const dates = data.platformActivity.map((item) => {
      const date = new Date(item.date);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    });
    const songs = data.platformActivity.map((item) => item.songs);
    const albums = data.platformActivity.map((item) => item.albums);
    const playlists = data.platformActivity.map((item) => item.playlists);

    return { dates, songs, albums, playlists };
  }, [data?.platformActivity]);

  const hasData = useMemo(
    () =>
      chartData.songs.length > 0 &&
      (chartData.songs.some((val) => val > 0) ||
        chartData.albums.some((val) => val > 0) ||
        chartData.playlists.some((val) => val > 0)),
    [chartData]
  );

  if (loading) {
    return (
      <div className={styles.sectionContainer}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>
            Platform Activity (Last 30 days)
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
            Platform Activity (Last 30 days)
          </span>
        </div>
        <div className={styles.error}>
          Failed to load platform activity data.
        </div>
      </div>
    );
  }

  return (
    <div className={styles.sectionContainer}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionTitle}>
          Platform Activity (Last 30 days)
        </span>
      </div>
      {hasData ? (
        <div className={styles.chartContainer}>
          <BarChart
            xAxis={[
              {
                data: chartData.dates,
                scaleType: "band",
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
                data: chartData.songs,
                label: "Songs",
                color: "var(--color-accent)",
              },
              {
                data: chartData.albums,
                label: "Albums",
                color: "var(--color-accent-400)",
              },
              {
                data: chartData.playlists,
                label: "Playlists",
                color: "var(--color-accent-700)",
              },
            ]}
            sx={{
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
              "& .MuiChartsLegend-root": {
                "& .MuiChartsLegend-series text": {
                  fill: "var(--color-text-gray) !important",
                  fontSize: "var(--font-size-sm) !important",
                },
              },
              "& .MuiBarElement-root": {
                clipPath: "inset(0px 0px 0px 0px round 2px 2px 0px 0px)",
              },
            }}
            grid={{ horizontal: true }}
            margin={{ left: 0, right: 45, top: 25, bottom: 25 }}
            hideLegend={true}
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
          />
        </div>
      ) : (
        <div className={styles.noDataContainer}>
          <span className={styles.noDataMessage}>
            No platform activity data available for the last 30 days.
          </span>
        </div>
      )}
    </div>
  );
};

export default memo(AdminDashboardPlatformActivityChart);
