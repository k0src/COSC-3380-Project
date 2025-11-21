import { memo, useMemo } from "react";
import { Link } from "react-router-dom";
import { PuffLoader } from "react-spinners";
import { useAsyncData } from "@hooks";
import { statsApi } from "@api";
import type { UUID } from "@types";
import styles from "./ArtistDashboardStreamsChart.module.css";
import { chartsTooltipClasses } from "@mui/x-charts";
import { LineChart } from "@mui/x-charts/LineChart";

export interface ArtistDashboardStreamsChartProps {
  artistId: UUID;
}

const ArtistDashboardStreamsChart: React.FC<
  ArtistDashboardStreamsChartProps
> = ({ artistId }) => {
  const { data, loading, error } = useAsyncData(
    {
      streams: () => statsApi.getArtistDailyStreams(artistId, 30),
    },
    [artistId],
    {
      cacheKey: `artist_daily_streams_${artistId}`,
    }
  );

  const chartData = useMemo(() => {
    if (!data?.streams) return { groupedData: [], labels: [] };

    const dailyStreams = data.streams;
    const groupedData: number[] = [];
    const labels: string[] = [];

    for (let i = 0; i < dailyStreams.length; i += 3) {
      const group = dailyStreams.slice(i, i + 3);
      const sum = group.reduce((acc, val) => acc + val, 0);
      groupedData.push(sum);

      const startDay = i + 1;
      const endDay = Math.min(i + 3, 30);
      labels.push(`${startDay} to ${endDay}`);
    }

    return { groupedData, labels };
  }, [data?.streams]);

  const hasData = useMemo(
    () =>
      chartData.groupedData.length > 0 &&
      chartData.groupedData.some((val) => val > 0),
    [chartData.groupedData]
  );

  if (loading) {
    return (
      <div className={styles.sectionContainer}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>Streams (Last 30 days)</span>
          <Link to="/artist-dashboard/stats" className={styles.viewMoreLink}>
            View More
          </Link>
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
          <span className={styles.sectionTitle}>Streams (Last 30 days)</span>
          <Link to="/artist-dashboard/stats" className={styles.viewMoreLink}>
            View More
          </Link>
        </div>
        <div className={styles.error}>Failed to load streams data.</div>
      </div>
    );
  }

  return (
    <div className={styles.sectionContainer}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionTitle}>Streams This Month</span>
        <Link to="/artist-dashboard/stats" className={styles.viewMoreLink}>
          View More
        </Link>
      </div>
      {hasData ? (
        <div className={styles.chartContainer}>
          <LineChart
            xAxis={[
              {
                data: chartData.labels,
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
                data: chartData.groupedData,
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
            grid={{ vertical: true }}
            hideLegend={true}
            margin={{ left: 0, right: 25, top: 15, bottom: 5 }}
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
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
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
            No stream data available for the last 30 days.
          </span>
        </div>
      )}
    </div>
  );
};

export default memo(ArtistDashboardStreamsChart);
