import { memo } from "react";
import { PuffLoader } from "react-spinners";
import { chartsTooltipClasses } from "@mui/x-charts";
import { PieChart } from "@mui/x-charts/PieChart";
import { useDrawingArea } from "@mui/x-charts/hooks";
import { formatNumber } from "@util";
import { statsApi } from "@api";
import { useAsyncData } from "@hooks";
import type { UUID, ListenersPieChartData } from "@types";
import styles from "./ArtistDashboardPieChart.module.css";

const PieCenterLabel = memo<{
  primaryText: string;
  secondaryText: string;
}>(({ primaryText, secondaryText }) => {
  const { width, height, left, top } = useDrawingArea();
  const cx = left + width / 2;
  const cy = top + height / 2;

  return (
    <text
      x={cx}
      y={cy}
      textAnchor="middle"
      dominantBaseline="central"
      style={{ fontFamily: "var(--font-main)" }}
    >
      <tspan
        x={cx}
        dy="-0.3em"
        fontSize="var(--font-size-2xl)"
        fontWeight="600"
        fill="var(--color-white)"
      >
        {primaryText}
      </tspan>
      <tspan
        x={cx}
        dy="2.2em"
        fontSize="var(--font-size-md)"
        fill="var(--color-white-alt)"
      >
        {secondaryText}
      </tspan>
    </text>
  );
});

export interface ArtistDashboardPieChartProps {
  artistId: UUID;
}

const ArtistDashboardPieChart: React.FC<ArtistDashboardPieChartProps> = ({
  artistId,
}) => {
  const { data, loading, error } = useAsyncData(
    {
      pieChartData: () => statsApi.getArtistListenersPieChartData(artistId),
    },
    [artistId],
    {
      cacheKey: `artist_listeners_pie_chart_${artistId}`,
    }
  );

  const pieData: ListenersPieChartData[] = data?.pieChartData || [];

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
    <div className={styles.pieChartContainer}>
      <div className={styles.pieChartWrapper}>
        <PieChart
          series={[
            {
              data: pieData,
              innerRadius: 120,
              outerRadius: 180,
              paddingAngle: 0,
              cornerRadius: 0,
              startAngle: -90,
              endAngle: 270,
              cx: "50%",
              cy: "50%",
            },
          ]}
          width={360}
          margin={{ top: 0, bottom: 0, left: 0, right: 0 }}
          hideLegend={true}
          sx={{
            "& .MuiPieArc-root": {
              stroke: "none",
            },
            "&.MuiChartsWrapper-root": {
              flex: "0 0 auto !important",
            },
            "& .MuiChartsSurface-root": {
              padding: "0 !important",
              margin: "0 !important",
              overflow: "visible",
            },
          }}
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
          <PieCenterLabel
            primaryText={formatNumber(
              pieData.reduce((sum, item) => sum + item.value, 0)
            )}
            secondaryText="Total Listeners"
          />
        </PieChart>
      </div>
      <div className={styles.listenersStats}>
        {pieData.map((item) => (
          <div key={item.label} className={styles.listenerStatItem}>
            <span
              className={styles.listenerStatColor}
              style={{ backgroundColor: item.color }}
            />
            <span className={styles.listenerStatLabel}>{item.label}</span>
            <span className={styles.listenerStatValue}>
              {formatNumber(item.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default memo(ArtistDashboardPieChart);
