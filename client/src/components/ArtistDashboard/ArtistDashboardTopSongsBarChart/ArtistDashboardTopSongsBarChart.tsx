import { memo, useMemo } from "react";
import { PuffLoader } from "react-spinners";
import { BarChart } from "@mui/x-charts/BarChart";
import { chartsTooltipClasses } from "@mui/x-charts";
import type { ArtistTopSongsChartData } from "@types";
import { statsApi } from "@api";
import { useAsyncData } from "@hooks";
import styles from "./ArtistDashboardTopSongsBarChart.module.css";

export interface ArtistDashboardTopSongsBarChartProps {
  artistId: string;
}

const ArtistDashboardTopSongsBarChart: React.FC<
  ArtistDashboardTopSongsBarChartProps
> = ({ artistId }) => {
  const { data, loading, error } = useAsyncData(
    {
      topSongs: () => statsApi.getArtistTopSongs(artistId, { limit: 5 }),
    },
    [artistId],
    {
      cacheKey: `artist_top_songs_bar_chart_${artistId}`,
    }
  );

  const chartData: ArtistTopSongsChartData[] = useMemo(() => {
    if (!data?.topSongs) return [];
    return data.topSongs.map((song, index) => ({
      title: song.title,
      streams: song.streams ?? 0,
      fill: `var(--color-accent-${400 + index * 100})`,
    }));
  }, [data?.topSongs]);

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
    <div className={styles.topSongsChart}>
      <span className={styles.topSongsChartTitle}>Your Top Songs</span>
      <BarChart
        dataset={chartData}
        yAxis={[
          {
            scaleType: "band",
            dataKey: "title",
            disableTicks: true,
            disableLine: true,
            tickLabelStyle: {
              fill: "var(--color-white-alt)",
              fontSize: 12,
              fontFamily: "var(--font-main)",
            },
          },
        ]}
        xAxis={[
          {
            disableTicks: true,
            disableLine: true,
            tickLabelStyle: { display: "none" },
          },
        ]}
        series={[
          {
            dataKey: "streams",
            layout: "horizontal",
            valueFormatter: (value) => `${value ?? 0} streams`,
          },
        ]}
        layout="horizontal"
        grid={{ vertical: false }}
        margin={{ left: 50, right: 25, top: 5, bottom: 0 }}
        slots={{
          bar: (props) => {
            const { ownerState, id, ...rest } = props;
            const index = props.dataIndex ?? 0;
            const color = chartData[index]?.fill || "var(--color-accent)";

            return (
              <rect
                {...rest}
                id={typeof id === "number" ? String(id) : id}
                fill={color}
                rx={4}
                ry={4}
              />
            );
          },
        }}
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
  );
};

export default memo(ArtistDashboardTopSongsBarChart);
