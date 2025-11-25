import { memo, useState, useCallback, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import {
  DataReportsNav,
  DataParameterPanel,
  DataReportsTable,
  GenreBreakdownPanel,
  AvgSessionLengthCard,
  ContentDiversityPanel,
  ListenerLoyaltyPanel,
  AdvancedFilterPanel,
  ContentConcentrationCard,
} from "@components";
import { dataApi } from "@api";
import type { DataReportParams, DataReportDetailColumn } from "@types";
import { formatNumber, formatPercentage } from "@util";
import styles from "./DataReportEngagement.module.css";

const DataReportEngagement: React.FC = () => {
  const paramsStartDate = new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1000
  ).toISOString();
  const paramsEndDate = new Date().toISOString();

  const [params, setParams] = useState<DataReportParams>({
    timeRange: {
      startDate: paramsStartDate,
      endDate: paramsEndDate,
    },
    granularity: "day",
  });

  const handleParamsChange = useCallback((newParams: DataReportParams) => {
    setParams(newParams);
  }, []);

  const trackColumns: DataReportDetailColumn[] = useMemo(
    () => [
      {
        key: "title",
        header: "Song Title",
        sortable: true,
      },
      {
        key: "artistName",
        header: "Artist",
        sortable: true,
      },
      {
        key: "streams",
        header: "Streams",
        sortable: true,
        align: "right",
        render: (value: number) => {
          const val = typeof value === "number" && !isNaN(value) ? value : 0;
          return formatNumber(val);
        },
      },
      {
        key: "uniqueListeners",
        header: "Unique Listeners",
        sortable: true,
        align: "right",
        render: (value: number) => {
          const val = typeof value === "number" && !isNaN(value) ? value : 0;
          return formatNumber(val);
        },
      },
      {
        key: "likes",
        header: "Likes",
        sortable: true,
        align: "right",
        render: (value: number) => {
          const val = typeof value === "number" && !isNaN(value) ? value : 0;
          return formatNumber(val);
        },
      },
      {
        key: "engagementRate",
        header: "Engagement Rate",
        sortable: true,
        align: "right",
        render: (value: number) => {
          const val = typeof value === "number" && !isNaN(value) ? value : 0;
          return formatPercentage(val);
        },
      },
      {
        key: "growthPercent",
        header: "Growth %",
        sortable: true,
        align: "right",
        render: (value: number) => {
          const val = typeof value === "number" && !isNaN(value) ? value : 0;
          return (
            <span
              style={{
                color:
                  val > 0
                    ? "var(--color-green-ui)"
                    : val < 0
                    ? "var(--color-red-ui)"
                    : "inherit",
              }}
            >
              {val > 0 ? "+" : ""}
              {val.toFixed(1)}%
            </span>
          );
        },
      },
    ],
    []
  );

  const artistColumns: DataReportDetailColumn[] = useMemo(
    () => [
      {
        key: "displayName",
        header: "Artist",
        sortable: true,
      },
      {
        key: "totalStreams",
        header: "Total Streams",
        sortable: true,
        align: "right",
        render: (value: number) => {
          const val = typeof value === "number" && !isNaN(value) ? value : 0;
          return formatNumber(val);
        },
      },
      {
        key: "uniqueListeners",
        header: "Unique Listeners",
        sortable: true,
        align: "right",
        render: (value: number) => {
          const val = typeof value === "number" && !isNaN(value) ? value : 0;
          return formatNumber(val);
        },
      },
      {
        key: "avgStreamsPerListener",
        header: "Avg Streams/Listener",
        sortable: true,
        align: "right",
        render: (value: number) => {
          const val = typeof value === "number" && !isNaN(value) ? value : 0;
          return val.toFixed(1);
        },
      },
      {
        key: "growthPercent",
        header: "Growth %",
        sortable: true,
        align: "right",
        render: (value: number) => {
          const val = typeof value === "number" && !isNaN(value) ? value : 0;
          return (
            <span
              style={{
                color:
                  val > 0
                    ? "var(--color-green-ui)"
                    : val < 0
                    ? "var(--color-red-ui)"
                    : "inherit",
              }}
            >
              {val > 0 ? "+" : ""}
              {val.toFixed(1)}%
            </span>
          );
        },
      },
    ],
    []
  );

  return (
    <>
      <Helmet>
        <title>Admin Dashboard - Engagement Report</title>
      </Helmet>

      <div className={styles.adminLayout}>
        <div className={styles.adminHeader}>
          <span className={styles.adminTitle}>Listening & Engagement</span>
          <span className={styles.adminSubtitle}>
            Top performing content, listener behavior, and platform engagement
            metrics.
          </span>
        </div>

        <DataReportsNav />

        <div className={styles.dataContainer}>
          <ContentConcentrationCard params={params} />
          <DataParameterPanel
            params={params}
            onParamsChange={handleParamsChange}
            showGranularity={true}
            showCompareTo={false}
            showCohortBy={false}
          />

          <AdvancedFilterPanel
            params={params}
            onParamsChange={handleParamsChange}
          />

          <DataReportsTable
            fetchData={dataApi.getEnhancedTrackPerformance}
            baseParams={params}
            columns={trackColumns}
            hasPagination={true}
            initialRowsPerPage={10}
            title="Top Performing Tracks"
            rowsPerPageOptions={[10, 25, 50, 100]}
            initialSortBy="streams"
            initialSortDirection="DESC"
            emptyMessage="No tracks found for the selected time range"
          />

          <DataReportsTable
            fetchData={dataApi.getArtistPerformance}
            baseParams={params}
            columns={artistColumns}
            hasPagination={true}
            initialRowsPerPage={10}
            title="Artist Performance Leaderboard"
            rowsPerPageOptions={[10, 25, 50]}
            initialSortBy="totalStreams"
            initialSortDirection="DESC"
            emptyMessage="No artists found for the selected time range"
          />

          <div className={styles.gridContainer}>
            <GenreBreakdownPanel params={params} />

            <div className={styles.verticalStats}>
              <AvgSessionLengthCard params={params} />
              <ContentDiversityPanel params={params} />
              <ListenerLoyaltyPanel params={params} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default memo(DataReportEngagement);
