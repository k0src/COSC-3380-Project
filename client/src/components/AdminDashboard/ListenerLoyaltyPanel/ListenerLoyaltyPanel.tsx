import { memo } from "react";
import { PuffLoader } from "react-spinners";
import { useAsyncData } from "@hooks";
import { dataApi } from "@api";
import { MiniStatPanel } from "@components";
import type { DataReportParams } from "@types";
import styles from "./ListenerLoyaltyPanel.module.css";

export interface ListenerLoyaltyPanelProps {
  params: DataReportParams;
}

const ListenerLoyaltyPanel: React.FC<ListenerLoyaltyPanelProps> = ({
  params,
}) => {
  const { data, loading, error } = useAsyncData(
    { engagement: () => dataApi.getEngagementMetrics(params) },
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
    return null;
  }

  const topTracks = data?.engagement?.topTracks ?? [];

  if (topTracks.length === 0) {
    return null;
  }

  const avgLoyalty =
    topTracks.length > 0
      ? topTracks.reduce((sum, t) => {
          const loyalty =
            (t.uniqueListeners ?? 0) > 0
              ? (t.streams ?? 0) / t.uniqueListeners
              : 0;
          return sum + loyalty;
        }, 0) / topTracks.length
      : 0;

  return (
    <MiniStatPanel
      title="Listener Loyalty Score"
      value={avgLoyalty.toFixed(1)}
      subtitle="avg replays per listener"
      trend={topTracks.slice(0, 10).map((t) => {
        const listeners = t.uniqueListeners ?? 0;
        const streams = t.streams ?? 0;
        return listeners > 0 ? streams / listeners : 0;
      })}
      trendColor="var(--color-green-ui)"
      showArea
    />
  );
};

export default memo(ListenerLoyaltyPanel);
