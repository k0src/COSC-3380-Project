import { memo } from "react";
import { formatNumber } from "@util";
import styles from "./BigStatPanel.module.css";
import classNames from "classnames";

export interface BigStatPanelProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon?: React.ElementType;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
}

const BigStatPanel = memo(
  ({
    icon: Icon,
    value,
    title,
    subtitle,
    trend,
    trendValue,
  }: BigStatPanelProps) => (
    <div className={styles.panel}>
      <div className={styles.header}>
        {Icon && <Icon className={styles.icon} aria-hidden="true" />}
        <span className={styles.title}>{title}</span>
      </div>
      <div className={styles.content}>
        <div className={styles.valueSection}>
          <span className={styles.value}>
            {typeof value === "number" ? formatNumber(value) : value}
          </span>
          {trend && trendValue && (
            <span
              className={classNames(styles.trend, {
                [styles.trendUp]: trend === "up",
                [styles.trendDown]: trend === "down",
                [styles.trendNeutral]: trend === "neutral",
              })}
            >
              {trendValue}
            </span>
          )}
        </div>
        <span className={styles.subtitle}>{subtitle}</span>
      </div>
    </div>
  )
);

export default BigStatPanel;
