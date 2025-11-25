import { memo } from "react";
import { PuffLoader } from "react-spinners";
import { PieChart } from "@mui/x-charts/PieChart";
import { chartsTooltipClasses } from "@mui/x-charts";
import { useAsyncData } from "@hooks";
import { dataApi } from "@api";
import type { DataReportParams } from "@types";
import { formatNumber, formatPercentage } from "@util";
import styles from "./GenreBreakdownPanel.module.css";

export interface GenreBreakdownPanelProps {
  params: DataReportParams;
}

const GENRE_COLORS = [
  "#c83f46",
  "#af373e",
  "#962f35",
  "#e1474f",
  "#fa4f58",
  "#fa4f58",
  "#fb6169",
  "#fb7279",
  "#fc848a",
  "#fc959b",
];

const GenreBreakdownPanel: React.FC<GenreBreakdownPanelProps> = ({
  params,
}) => {
  const { data, loading, error } = useAsyncData(
    { genres: () => dataApi.getGenreBreakdown(params) },
    [JSON.stringify(params)]
  );

  const genres = data?.genres ?? [];

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <span className={styles.title}>Genre Distribution</span>
        </div>
        <div className={styles.loaderContainer}>
          <PuffLoader color="var(--color-accent)" size={35} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <span className={styles.title}>Genre Distribution</span>
        </div>
        <div className={styles.emptyState}>
          No genre data available for the selected time range.
        </div>
      </div>
    );
  }

  if (genres.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <span className={styles.title}>Genre Distribution</span>
        </div>
        <div className={styles.emptyState}>
          No genre data available for the selected time range.
        </div>
      </div>
    );
  }

  const chartData = genres.map((item, index) => ({
    id: index,
    value: item.streams ?? 0,
    label: item.genre ?? "Unknown",
    color: GENRE_COLORS[index % GENRE_COLORS.length],
  }));

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.title}>Genre Distribution</span>
      </div>
      <div className={styles.content}>
        <div className={styles.chartContainer}>
          <PieChart
            series={[
              {
                data: chartData,
                paddingAngle: 0,
                cornerRadius: 0,
                cx: "50%",
                cy: "50%",
              },
            ]}
            width={400}
            height={300}
            margin={{ top: 10, bottom: 10, left: 10, right: 10 }}
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
          />
        </div>

        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Genre</th>
                <th>Streams</th>
                <th>Listeners</th>
                <th>% of Total</th>
              </tr>
            </thead>
            <tbody>
              {genres.map((item, index) => (
                <tr key={index}>
                  <td className={styles.genreName}>
                    <span
                      className={styles.genreColor}
                      style={{
                        backgroundColor:
                          GENRE_COLORS[index % GENRE_COLORS.length],
                      }}
                    />
                    {item.genre ?? "Unknown"}
                  </td>
                  <td>{formatNumber(item.streams ?? 0)}</td>
                  <td>{formatNumber(item.uniqueListeners ?? 0)}</td>
                  <td>{formatPercentage(item.percentOfTotal ?? 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default memo(GenreBreakdownPanel);
