import { memo, useState } from "react";
import { PuffLoader } from "react-spinners";
import { BarChart } from "@mui/x-charts/BarChart";
import { chartsTooltipClasses } from "@mui/x-charts";
import { axisClasses } from "@mui/x-charts/ChartsAxis";
import { chartsGridClasses } from "@mui/x-charts/ChartsGrid";
import type { StreamsBarChartData } from "@types";
import { formatNumber } from "@util";
import { statsApi } from "@api";
import { useAsyncData } from "@hooks";
import styles from "./ArtistDashboardBarChart.module.css";
import classNames from "classnames";
import { LuTrendingUp, LuTrendingDown } from "react-icons/lu";

type DateRangeType = "7d" | "30d" | "90d" | "1y";

export interface ArtistDashboardBarChartProps {
  artistId: string;
}

const ArtistDashboardBarChart: React.FC<ArtistDashboardBarChartProps> = ({
  artistId,
}) => {
  const [activeDateRange, setActiveDateRange] = useState<DateRangeType>("30d");

  const { data, loading, error } = useAsyncData(
    {
      barChartData: () =>
        statsApi.getArtistStreamsBarChartData(artistId, activeDateRange),
    },
    [artistId, activeDateRange],
    {
      cacheKey: `artist_streams_bar_chart_${artistId}_${activeDateRange}`,
    }
  );

  const chartData: StreamsBarChartData[] = data?.barChartData || [];

  const totalStreams = chartData.reduce((sum, item) => sum + item.streams, 0);
  const totalLikes = chartData.reduce((sum, item) => sum + item.likes, 0);

  const midpoint = Math.floor(chartData.length / 2);
  const firstHalfStreams = chartData
    .slice(0, midpoint)
    .reduce((sum, item) => sum + item.streams, 0);
  const secondHalfStreams = chartData
    .slice(midpoint)
    .reduce((sum, item) => sum + item.streams, 0);
  const isTrendingUp = secondHalfStreams > firstHalfStreams;

  const dateRangeLabel =
    activeDateRange === "7d"
      ? "7 days"
      : activeDateRange === "90d"
      ? "90 days"
      : activeDateRange === "1y"
      ? "year"
      : "30 days";

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

  return (
    <div className={styles.barChartContainer}>
      <div className={styles.barChartTop}>
        <div className={styles.barChartTitle}>
          <span className={styles.barChartTitleText}>
            {formatNumber(totalStreams)} streams in the last {dateRangeLabel}
          </span>
          {isTrendingUp ? (
            <LuTrendingUp
              className={classNames(styles.barChartIcon, styles.barChartIconUp)}
            />
          ) : (
            <LuTrendingDown
              className={classNames(
                styles.barChartIcon,
                styles.barChartIconDown
              )}
            />
          )}
        </div>
        <div className={styles.dateRangeContainer}>
          <button
            className={classNames(styles.dateRangeButton, {
              [styles.dateRangeButtonActive]: activeDateRange === "7d",
            })}
            onClick={() => setActiveDateRange("7d")}
          >
            7 days
          </button>
          <button
            className={classNames(styles.dateRangeButton, {
              [styles.dateRangeButtonActive]: activeDateRange === "30d",
            })}
            onClick={() => setActiveDateRange("30d")}
          >
            30 days
          </button>
          <button
            className={classNames(styles.dateRangeButton, {
              [styles.dateRangeButtonActive]: activeDateRange === "90d",
            })}
            onClick={() => setActiveDateRange("90d")}
          >
            90 days
          </button>
          <button
            className={classNames(styles.dateRangeButton, {
              [styles.dateRangeButtonActive]: activeDateRange === "1y",
            })}
            onClick={() => setActiveDateRange("1y")}
          >
            1 year
          </button>
        </div>
      </div>
      <div className={styles.barChart}>
        <div className={styles.barChartNumbers}>
          <span className={styles.barChartNumber}>
            {formatNumber(totalStreams)} streams
          </span>
          <span className={styles.barChartNumber}>
            {formatNumber(totalLikes)} likes
          </span>
        </div>
        <BarChart
          dataset={chartData}
          xAxis={[
            {
              scaleType: "band",
              dataKey: "month",
              valueFormatter: (value) => value.slice(0, 3),
              tickLabelStyle: {
                fill: "var(--color-text-gray)",
                fontSize: 12,
              },
            },
          ]}
          yAxis={[
            {
              disableLine: true,
              disableTicks: true,
              tickLabelStyle: {
                display: "none",
              },
            },
          ]}
          series={[
            {
              dataKey: "streams",
              label: "Streams",
              color: "var(--color-accent-400)",
            },
            {
              dataKey: "likes",
              label: "Likes",
              color: "var(--color-accent)",
            },
          ]}
          grid={{ horizontal: true }}
          sx={{
            [`.${axisClasses.root}`]: {
              [`.${axisClasses.line}`]: {
                stroke: "transparent",
              },
            },
            [`.${chartsGridClasses.line}`]: {
              stroke: "var(--color-gray-button)",
              strokeDasharray: "4 4",
              strokeWidth: 1,
            },
            "& .MuiBarElement-root": {
              clipPath: "inset(0px 0px 0px 0px round 4px 4px 0px 0px)",
            },
          }}
          margin={{ left: 0, right: 25, top: 20, bottom: 15 }}
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
    </div>
  );
};

export default memo(ArtistDashboardBarChart);
