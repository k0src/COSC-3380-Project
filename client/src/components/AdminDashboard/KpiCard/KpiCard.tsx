import { memo } from "react";
import { LineChart } from "@mui/x-charts/LineChart";
import type { KPIMetric } from "@types";
import { formatNumber, formatPercentage } from "@util";
import styles from "./KpiCard.module.css";
import classNames from "classnames";
import { LuTrendingUp, LuTrendingDown, LuMinus } from "react-icons/lu";

interface KpiCardProps {
  metric: KPIMetric;
}

const KpiCard: React.FC<KpiCardProps> = ({ metric }) => {
  const isPositive = metric.deltaPercent > 0;
  const isNegative = metric.deltaPercent < 0;
  const isSignificant = metric.isSignificant;

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.label}>{metric.label}</span>
        {isSignificant && (
          <span className={styles.significantBadge}>Significant</span>
        )}
      </div>

      <div className={styles.content}>
        <div className={styles.mainValue}>
          <span className={styles.currentValue}>
            {formatNumber(metric.currentValue)}
          </span>
          <div
            className={classNames(styles.delta, {
              [styles.deltaPositive]: isPositive,
              [styles.deltaNegative]: isNegative,
              [styles.deltaNeutral]: !isPositive && !isNegative,
            })}
          >
            {isPositive && <LuTrendingUp className={styles.deltaIcon} />}
            {isNegative && <LuTrendingDown className={styles.deltaIcon} />}
            {!isPositive && !isNegative && (
              <LuMinus className={styles.deltaIcon} />
            )}
            <span className={styles.deltaText}>
              {isPositive ? "+" : ""}
              {formatPercentage(metric.deltaPercent)}
            </span>
          </div>
        </div>

        {metric.trend.length > 0 && (
          <div className={styles.trendChart}>
            <LineChart
              xAxis={[
                {
                  data: metric.trend.map((_, i) => i),
                  scaleType: "point",
                  disableLine: true,
                  disableTicks: true,
                  tickLabelStyle: { display: "none" },
                },
              ]}
              yAxis={[
                {
                  disableLine: true,
                  disableTicks: true,
                  tickLabelStyle: { display: "none" },
                },
              ]}
              series={[
                {
                  data: metric.trend,
                  showMark: false,
                  color: isPositive
                    ? "var(--color-green-ui)"
                    : isNegative
                    ? "var(--color-red-ui)"
                    : "var(--color-text-gray)",
                  curve: "natural",
                },
              ]}
              sx={{
                ".MuiLineElement-root": {
                  strokeWidth: 2,
                },
              }}
              hideLegend={true}
              margin={{ left: -40, right: 10, top: 0, bottom: -20 }}
              slotProps={{ tooltip: { trigger: "none" } }}
            />
          </div>
        )}
      </div>

      <div className={styles.comparison}>
        <span className={styles.comparisonLabel}>vs previous period:</span>
        <span className={styles.comparisonValue}>
          {formatNumber(metric.previousValue)}
        </span>
      </div>
    </div>
  );
};

export default memo(KpiCard);
