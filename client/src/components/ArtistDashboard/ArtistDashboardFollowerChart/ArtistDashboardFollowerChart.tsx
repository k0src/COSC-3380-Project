import { memo, useMemo } from "react";
import { PuffLoader } from "react-spinners";
import { useAsyncData } from "@hooks";
import { statsApi } from "@api";
import type { UUID, FollowerData } from "@types";
import styles from "./ArtistDashboardFollowerChart.module.css";
import { chartsTooltipClasses } from "@mui/x-charts";
import { LineChart } from "@mui/x-charts/LineChart";

export interface ArtistDashboardFollowerChartProps {
  artistId: UUID;
}

const ArtistDashboardFollowerChart: React.FC<
  ArtistDashboardFollowerChartProps
> = ({ artistId }) => {
  const { data, loading, error } = useAsyncData(
    {
      followers: () => statsApi.getArtistFollowersData(artistId),
    },
    [artistId],
    {
      cacheKey: `artist_follower_data_${artistId}`,
    }
  );

  const chartData = useMemo(() => {
    const followersData: FollowerData = data?.followers || {
      dates: [],
      followers: [],
    };
    return {
      dates: followersData.dates,
      followers: followersData.followers,
    };
  }, [data?.followers]);

  const hasData = useMemo(
    () =>
      chartData.dates.length > 0 && chartData.followers.some((val) => val > 0),
    [chartData]
  );

  if (loading) {
    return (
      <div className={styles.loaderContainer}>
        <PuffLoader color="var(--color-accent)" size={35} />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <span className={styles.errorText}>
          Error loading chart data. Please try again later.
        </span>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className={styles.errorContainer}>
        <span className={styles.errorText}>No follower data available.</span>
      </div>
    );
  }

  return (
    <div className={styles.followerChartContainer}>
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
            data: chartData.followers,
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
  );
};

export default memo(ArtistDashboardFollowerChart);
