import { memo } from "react";
import { PuffLoader } from "react-spinners";
import { useAsyncData } from "@hooks";
import { dataApi } from "@api";
import type { DataReportParams } from "@types";
import { formatPercentage } from "@util";
import { LuChartNoAxesColumn } from "react-icons/lu";
import styles from "./ContentConcentrationCard.module.css";

export interface ContentConcentrationCardProps {
  params: DataReportParams;
}

const ContentConcentrationCard: React.FC<ContentConcentrationCardProps> = ({
  params,
}) => {
  const { data, loading, error } = useAsyncData(
    { engagement: () => dataApi.getEngagementMetrics(params) },
    [JSON.stringify(params)]
  );

  if (loading) {
    return (
      <div className={styles.panel}>
        <div className={styles.loaderContainer}>
          <PuffLoader color="var(--color-accent)" size={35} />
        </div>
      </div>
    );
  }

  if (error || !data?.engagement?.concentration) {
    return null;
  }

  const { concentration } = data.engagement;

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <LuChartNoAxesColumn className={styles.icon} />
        <span className={styles.title}>Content Concentration</span>
      </div>
      <div className={styles.content}>
        <div className={styles.concentrationGrid}>
          <div className={styles.concentrationItem}>
            <span className={styles.concentrationLabel}>Top 1%</span>
            <span className={styles.concentrationValue}>
              {formatPercentage(concentration.top1Percent ?? 0)}
            </span>
            <span className={styles.concentrationSubtext}>of streams</span>
          </div>
          <div className={styles.concentrationItem}>
            <span className={styles.concentrationLabel}>Top 10%</span>
            <span className={styles.concentrationValue}>
              {formatPercentage(concentration.top10Percent ?? 0)}
            </span>
            <span className={styles.concentrationSubtext}>of streams</span>
          </div>
          <div className={styles.concentrationItem}>
            <span className={styles.concentrationLabel}>Top 50%</span>
            <span className={styles.concentrationValue}>
              {formatPercentage(concentration.top50Percent ?? 0)}
            </span>
            <span className={styles.concentrationSubtext}>of streams</span>
          </div>
        </div>
      </div>
      <div className={styles.subtitle}>
        {concentration.top1Percent > 50
          ? "High concentration - a small number of songs dominate streams"
          : concentration.top1Percent > 30
          ? "Moderate concentration - popular songs have significant share"
          : "Low concentration - streams are well distributed across content"}
      </div>
    </div>
  );
};

export default memo(ContentConcentrationCard);
