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
      // barChartData: () => statsApi.getArtistStreamsBarChartData(artistId, timeRange: "30d"),
    },
    [artistId],
    {
      cacheKey: `artist_streams_bar_chart_${artistId}`,
    }
  );

  // const chartData: StreamsBarChartData[] = data?.barChartData || [];

  const chartData = [
    { month: "January", streams: 186, likes: 80 },
    { month: "February", streams: 305, likes: 200 },
    { month: "March", streams: 237, likes: 120 },
    { month: "April", streams: 73, likes: 190 },
    { month: "May", streams: 209, likes: 130 },
    { month: "June", streams: 244, likes: 123 },
    { month: "July", streams: 199, likes: 62 },
    { month: "August", streams: 201, likes: 100 },
    { month: "September", streams: 299, likes: 198 },
    { month: "October", streams: 178, likes: 90 },
    { month: "November", streams: 239, likes: 150 },
    { month: "December", streams: 300, likes: 210 },
  ];

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
            {formatNumber(38941)} streams in the last 30 days
          </span>
          <LuTrendingUp
            className={classNames(styles.barChartIcon, {
              [styles.barChartIconUp]: true, // if trending up
              [styles.barChartIconDown]: false, // if trending down
            })}
          />
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
            {formatNumber(1023)} streams
          </span>
          <span className={styles.barChartNumber}>
            {formatNumber(124)} likes
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
