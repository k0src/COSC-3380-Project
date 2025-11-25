import { memo } from "react";
import { PuffLoader } from "react-spinners";
import { useAsyncData } from "@hooks";
import { dataApi } from "@api";
import { KpiCard } from "@components";
import type { DataReportParams } from "@types";
import styles from "./OverviewKpiCards.module.css";

export interface OverviewKpiCardsProps {
  params: DataReportParams;
}

const OverviewKpiCards: React.FC<OverviewKpiCardsProps> = ({ params }) => {
  const { data, loading, error } = useAsyncData(
    { kpiData: () => dataApi.getKpisData(params) },
    [JSON.stringify(params)]
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
        <span className={styles.errorText}>Error loading KPI data</span>
      </div>
    );
  }

  const kpiData = data?.kpiData;

  if (!kpiData?.kpis) {
    return null;
  }

  const kpiMetrics = [
    kpiData.kpis.activeUsers,
    kpiData.kpis.totalStreams,
    kpiData.kpis.uniqueSongs,
    kpiData.kpis.avgStreamsPerUser,
    kpiData.kpis.engagementRate,
  ];

  return (
    <div className={styles.kpiGrid}>
      {kpiMetrics.map((metric, index) => (
        <KpiCard key={index} metric={metric} />
      ))}
    </div>
  );
};

export default memo(OverviewKpiCards);
