import { memo, useMemo } from "react";
import { useAsyncData } from "@hooks";
import { adminApi } from "@api";
import { formatNumber } from "@util";
import styles from "./AdminDashboardStats.module.css";
import {
  LuUsers,
  LuMusic,
  LuDisc3,
  LuListMusic,
  LuUserCheck,
  LuCircleAlert,
  LuMic,
  LuAudioLines,
} from "react-icons/lu";
import classNames from "classnames";

const AdminDashboardStats: React.FC = () => {
  const { data, loading, error } = useAsyncData(
    {
      stats: () => adminApi.getDashboardStats(),
    },
    [],
    {
      cacheKey: "admin_dashboard_stats",
    }
  );

  const stats = data?.stats;

  const statCards = useMemo(
    () => [
      {
        label: "Total Users",
        value: stats?.totalUsers ?? 0,
        icon: LuUsers,
        color: "accent",
      },
      {
        label: "Active Users (30d)",
        value: stats?.activeUsers ?? 0,
        icon: LuUserCheck,
        color: "green",
      },
      {
        label: "Total Songs",
        value: stats?.totalSongs ?? 0,
        icon: LuMusic,
        color: "accent",
      },
      {
        label: "Total Albums",
        value: stats?.totalAlbums ?? 0,
        icon: LuDisc3,
        color: "accent",
      },
      {
        label: "Total Playlists",
        value: stats?.totalPlaylists ?? 0,
        icon: LuListMusic,
        color: "accent",
      },
      {
        label: "Total Artists",
        value: stats?.totalArtists ?? 0,
        icon: LuMic,
        color: "accent",
      },
      {
        label: "Total Streams",
        value: stats?.totalStreams ?? 0,
        icon: LuAudioLines,
        color: "accent",
      },
      {
        label: "Pending Reports",
        value: stats?.pendingReports ?? 0,
        icon: LuCircleAlert,
        color: "warning",
      },
    ],
    [stats]
  );

  if (loading) {
    return (
      <div className={styles.statsGrid}>
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className={styles.statCard}>
            <div className={styles.loadingContainer}>
              <span className={styles.loadingText}>Loading...</span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <span className={styles.errorText}>Error loading dashboard stats.</span>
      </div>
    );
  }

  return (
    <div className={styles.statsGrid}>
      {statCards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div key={index} className={styles.statCard}>
            <div className={styles.statCardHeader}>
              <Icon
                className={classNames(styles.statIcon, {
                  [styles.accent]: card.color === "accent",
                  [styles.green]: card.color === "green",
                  [styles.warning]: card.color === "warning",
                })}
              ></Icon>
              <span className={styles.statValue}>
                {formatNumber(card.value)}
              </span>
            </div>
            <span className={styles.statLabel}>{card.label}</span>
          </div>
        );
      })}
    </div>
  );
};

export default memo(AdminDashboardStats);
