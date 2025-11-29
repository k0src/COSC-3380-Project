import { memo } from "react";
import { SparkLineChart } from "@mui/x-charts/SparkLineChart";
import { chartsTooltipClasses } from "@mui/x-charts";
import { formatNumber, formatPercentage } from "@util";
import {
  areaElementClasses,
  lineElementClasses,
} from "@mui/x-charts/LineChart";
import styles from "./MiniStatPanel.module.css";

interface MiniStatPanelProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number[];
  trendColor?: string;
  showArea?: boolean;
  icon?: React.ElementType;
  changePercent?: number;
  changeLabel?: string;
}

const MiniStatPanel = memo(
  ({
    title,
    value,
    subtitle,
    trend,
    trendColor = "var(--color-accent)",
    showArea = false,
    icon: Icon,
    changePercent,
    changeLabel,
  }: MiniStatPanelProps) => (
    <div className={styles.panel}>
      <div className={styles.header}>
        {Icon && <Icon className={styles.icon} />}
        <span className={styles.title}>{title}</span>
      </div>
      <div className={styles.content}>
        <div className={styles.valueSection}>
          <span className={styles.value}>
            {typeof value === "number" ? formatNumber(value) : value}
          </span>
          {changePercent !== undefined && (
            <div className={styles.change}>
              <span
                className={styles.changePercent}
                data-positive={changePercent >= 0}
              >
                {changePercent > 0 ? "+" : ""}
                {formatPercentage(changePercent)}
              </span>
              {changeLabel && (
                <span className={styles.changeLabel}>{changeLabel}</span>
              )}
            </div>
          )}
        </div>
        {trend && trend.length > 0 && (
          <div className={styles.sparkline}>
            <SparkLineChart
              data={trend}
              height={50}
              area={showArea}
              showHighlight
              showTooltip
              color={trendColor}
              margin={{ left: 0, right: 0, top: 0, bottom: 0 }}
              sx={{
                [`& .${areaElementClasses.root}`]: {
                  opacity: 0.3,
                },
                [`& .${lineElementClasses.root}`]: {
                  strokeWidth: 2,
                },
              }}
              slotProps={{
                tooltip: {
                  sx: {
                    [`& .${chartsTooltipClasses.paper}`]: {
                      backgroundColor:
                        "var(--color-panel-gray-dark) !important",
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
        )}
      </div>
      {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
    </div>
  )
);

export default MiniStatPanel;
