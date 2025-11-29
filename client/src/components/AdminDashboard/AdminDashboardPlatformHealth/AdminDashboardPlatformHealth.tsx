import { memo, useMemo } from "react";
import { useAsyncData } from "@hooks";
import { statsApi } from "@api";
import { formatNumber } from "@util";
import styles from "./AdminDashboardPlatformHealth.module.css";

const AdminDashboardPlatformHealth: React.FC = () => {
  const { data, loading, error } = useAsyncData(
    {
      stats: () => statsApi.getDashboardStats(),
    },
    [],
    {
      cacheKey: "admin_dashboard_stats",
    }
  );

  const stats = data?.stats;

  const engagementRate = useMemo(() => {
    if (!stats?.totalUsers || stats.totalUsers === 0) return 0;
    return ((stats.activeUsers / stats.totalUsers) * 100).toFixed(1);
  }, [stats]);

  const avgStreamsPerSong = useMemo(() => {
    if (!stats?.totalSongs || stats.totalSongs === 0) return 0;
    return Math.round(stats.totalStreams / stats.totalSongs);
  }, [stats]);

  const healthMetrics = useMemo(
    () => [
      {
        label: "Engagement Rate",
        value: `${engagementRate}%`,
        description: "Active users / Total users",
      },
      {
        label: "Avg Streams/Song",
        value: formatNumber(avgStreamsPerSong),
        description: "Total streams / Total songs",
      },
      {
        label: "Content Library",
        value: formatNumber(
          (stats?.totalSongs || 0) + (stats?.totalAlbums || 0)
        ),
        description: "Songs + Albums",
      },
      {
        label: "Platform Health",
        value: stats?.pendingReports === 0 ? "Excellent" : "Good",
        description: `${stats?.pendingReports || 0} pending reports`,
      },
    ],
    [engagementRate, avgStreamsPerSong, stats]
  );

  if (loading) {
    return (
      <div className={styles.healthContainer}>
        <span className={styles.healthTitle}>Platform Health</span>
        <div className={styles.loadingContainer}>
          <span className={styles.loadingText}>Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.healthContainer}>
        <span className={styles.healthTitle}>Platform Health</span>
        <div className={styles.errorContainer}>
          <span className={styles.errorText}>
            Failed to load health metrics.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.healthContainer}>
      <span className={styles.healthTitle}>Platform Health</span>
      <div className={styles.metricsGrid}>
        {healthMetrics.map((metric, index) => (
          <div key={index} className={styles.metricCard}>
            <span className={styles.metricValue}>{metric.value}</span>
            <span className={styles.metricLabel}>{metric.label}</span>
            <span className={styles.metricDescription}>
              {metric.description}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default memo(AdminDashboardPlatformHealth);
