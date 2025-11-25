import { memo } from "react";
import { PuffLoader } from "react-spinners";
import { useAsyncData } from "@hooks";
import { dataApi } from "@api";
import { MiniStatPanel } from "@components";
import type { DataReportParams } from "@types";
import styles from "./ContentDiversityPanel.module.css";

export interface ContentDiversityPanelProps {
  params: DataReportParams;
}

const ContentDiversityPanel: React.FC<ContentDiversityPanelProps> = ({
  params,
}) => {
  const { data, loading, error } = useAsyncData(
    { genres: () => dataApi.getGenreBreakdown(params) },
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

  const genres = data?.genres ?? [];

  if (genres.length === 0) {
    return null;
  }

  const totalStreams = genres.reduce((sum, g) => sum + (g.streams ?? 0), 0);
  const hhi = genres.reduce((sum, g) => {
    if (totalStreams === 0) return sum;
    const share = (g.streams ?? 0) / totalStreams;
    return sum + share * share * 10000;
  }, 0);
  const diversityIndex = Math.max(0, 100 - hhi / 100).toFixed(0);

  return (
    <MiniStatPanel
      title="Content Diversity Index"
      value={diversityIndex}
      subtitle={`across ${genres.length} genres`}
      trend={genres.slice(0, 10).map((g) => g.streams ?? 0)}
      trendColor="var(--color-accent)"
    />
  );
};

export default memo(ContentDiversityPanel);
