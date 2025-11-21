import { memo, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@contexts";
import { useAsyncData } from "@hooks";
import type { Artist } from "@types";
import { artistApi, statsApi } from "@api";
import styles from "./ArtistDashboardStatsPage.module.css";
import {
  LuPlus,
  LuCircleUserRound,
  LuImage,
  LuUserRoundPen,
  LuListMusic,
} from "react-icons/lu";
import artistPlaceholder from "@assets/artist-placeholder.webp";
import { LineChart } from "@mui/x-charts/LineChart";
import { chartsTooltipClasses } from "@mui/x-charts";

interface ArtistDashboardStatsPageProps {
  artist?: Artist;
}

const ArtistDashboardStatsPage: React.FC<ArtistDashboardStatsPageProps> = ({
  artist,
}) => {
  const { user } = useAuth();

  const artistId = user?.artist_id;

  const { data, loading, error } = useAsyncData(
    {
      streams: () => statsApi.getArtistDailyStreams(artistId!, 30),
    },
    [artistId],
    {
      cacheKey: `artist_daily_streams_${artistId}`,
      enabled: !!artistId,
    }
  );

  const chartData = useMemo(() => {
    if (!data?.streams) return { groupedData: [], labels: [] };

    const dailyStreams = data.streams;
    const groupedData: number[] = [];
    const labels: string[] = [];

    for (let i = 0; i < dailyStreams.length; i += 3) {
      const group = dailyStreams.slice(i, i + 3);
      const sum = group.reduce((acc, val) => acc + val, 0);
      groupedData.push(sum);

      const dayNum = i + 1;
      labels.push(`${Math.min(dayNum + 2, 30)}`);
    }

    return { groupedData, labels };
  }, [data?.streams]);

  if (loading) {
    return <div>loading...</div>;
  }
  if (error) {
    return <div>error...</div>;
  }

  const artistName = useMemo(() => {
    if (!artist) return "";
    return artist.display_name;
  }, [artist]);

  const artistImageUrl = useMemo(() => {
    if (!artist) return artistPlaceholder;
    return artist.user?.profile_picture_url || artistPlaceholder;
  }, [artist]);

  return (
    <>
      <Helmet>
        <title>{`${artistName}'s Dashboard - CoogMusic`}</title>
      </Helmet>

      <div className={styles.statsLayout}>
        <span className={styles.statsTitle}>{artistName}'s Stats</span>

        <div className={styles.lineChart}>
          <LineChart
            xAxis={[
              {
                data: chartData.labels,
                scaleType: "point",
                tickLabelStyle: {
                  fill: "var(--color-white-alt)",
                  fontSize: 12,
                },
              },
            ]}
            yAxis={[
              {
                tickLabelStyle: {
                  fill: "var(--color-white-alt)",
                  fontSize: 12,
                },
                // Hide grid lines for cleaner look if desired, or style them
              },
            ]}
            series={[
              {
                data: chartData.groupedData,
                area: true,
                showMark: false,
                color: "var(--color-accent)",
                curve: "natural",
              },
            ]}
            sx={{
              ".MuiLineElement-root": {
                strokeWidth: 2,
              },
              ".MuiAreaElement-root": {
                fill: "url('#areaGradient')",
              },
              "& .MuiChartsGrid-line": {
                stroke: "none",
                strokeDasharray: "3 3",
              },
              // Hide axis lines for cleaner look
              ".MuiChartsAxis-line": {
                stroke: "var(--color-gray-button)",
              },
              ".MuiChartsAxis-tick": {
                stroke: "none",
              },
            }}
            hideLegend={true}
            slotProps={{
              tooltip: {
                sx: {
                  [`& .${chartsTooltipClasses.paper}`]: {
                    backgroundColor: "var(--color-panel-gray) !important",
                    border:
                      "var(--border-size-md) solid var(--color-panel-border) !important",
                    borderRadius: "var(--border-radius-md) !important",
                    padding: "var(--spacing-sm) !important",
                    boxShadow: "var(--shadow-md) !important",
                    color: "var(--color-text-gray) !important",
                    fontSize: "var(--font-size-sm) !important",
                  },
                  [`& .${chartsTooltipClasses.labelCell}`]: {
                    color: "var(--color-white-alt) !important",
                    fontSize: "var(--font-size-sm) !important",
                  },
                  [`& .${chartsTooltipClasses.valueCell}`]: {
                    color: "var(--color-white-alt) !important",
                    fontSize: "var(--font-size-sm) !important",
                    fontWeight: "500 !important",
                  },
                  [`& .${chartsTooltipClasses.mark}`]: {
                    borderRadius: "50% !important",
                  },
                },
              },
            }}
          >
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="var(--color-accent)"
                  stopOpacity={0.5}
                />
                <stop
                  offset="50%"
                  stopColor="var(--color-accent)"
                  stopOpacity={0.2}
                />
                <stop
                  offset="100%"
                  stopColor="var(--color-accent)"
                  stopOpacity={0.0}
                />
              </linearGradient>
            </defs>
          </LineChart>
        </div>
      </div>
    </>
  );
};

export default memo(ArtistDashboardStatsPage);
