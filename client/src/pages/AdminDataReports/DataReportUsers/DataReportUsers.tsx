import { memo, useState, useCallback, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import {
  DataReportsNav,
  DataParameterPanel,
  UserGrowthChart,
  DataReportsTable,
  AvgTimeCard,
  ChurnAnalysisCard,
  ActivationRatePanel,
  RetentionRatePanel,
  RetentionHeatmap,
  DataReportStoryPanel,
} from "@components";
import { dataApi } from "@api";
import type { DataReportParams, DataReportDetailColumn } from "@types";
import { formatNumber, formatPercentage } from "@util";
import styles from "./DataReportUsers.module.css";

const DataReportUsers: React.FC = () => {
  const paramsStartDate = new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1000
  ).toISOString();
  const paramsEndDate = new Date().toISOString();

  const [params, setParams] = useState<DataReportParams>({
    timeRange: {
      startDate: paramsStartDate,
      endDate: paramsEndDate,
    },
    granularity: "week",
    cohortBy: "signup_week",
  });
  const handleParamsChange = useCallback((newParams: DataReportParams) => {
    setParams(newParams);
  }, []);

  const cohortColumns: DataReportDetailColumn[] = useMemo(
    () => [
      {
        key: "cohortWeek",
        header: "Cohort",
        sortable: true,
        render: (value: string) =>
          new Date(value).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
      },
      {
        key: "cohortSize",
        header: "Size",
        sortable: true,
        align: "right",
        render: (value: number) => {
          const val = typeof value === "number" && !isNaN(value) ? value : 0;
          return formatNumber(val);
        },
      },
      {
        key: "day1",
        header: "Day 1",
        sortable: true,
        align: "right",
        render: (value: number, row: any) => {
          const val = typeof value === "number" && !isNaN(value) ? value : 0;
          return row.cohortSize > 0
            ? formatPercentage((val / row.cohortSize) * 100)
            : "0%";
        },
      },
      {
        key: "day7",
        header: "Day 7",
        sortable: true,
        align: "right",
        render: (value: number, row: any) => {
          const val = typeof value === "number" && !isNaN(value) ? value : 0;
          return row.cohortSize > 0
            ? formatPercentage((val / row.cohortSize) * 100)
            : "0%";
        },
      },
      {
        key: "day14",
        header: "Day 14",
        sortable: true,
        align: "right",
        render: (value: number, row: any) => {
          const val = typeof value === "number" && !isNaN(value) ? value : 0;
          return row.cohortSize > 0
            ? formatPercentage((val / row.cohortSize) * 100)
            : "0%";
        },
      },
      {
        key: "day28",
        header: "Day 28",
        sortable: true,
        align: "right",
        render: (value: number, row: any) => {
          const val = typeof value === "number" && !isNaN(value) ? value : 0;
          return row.cohortSize > 0
            ? formatPercentage((val / row.cohortSize) * 100)
            : "0%";
        },
      },
      {
        key: "day90",
        header: "Day 90",
        sortable: true,
        align: "right",
        render: (value: number, row: any) => {
          const val = typeof value === "number" && !isNaN(value) ? value : 0;
          return row.cohortSize > 0
            ? formatPercentage((val / row.cohortSize) * 100)
            : "0%";
        },
      },
    ],
    []
  );

  const userAnalyticsColumns: DataReportDetailColumn[] = useMemo(
    () => [
      {
        key: "username",
        header: "Username",
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
        key: "uniqueSongsPlayed",
        header: "Unique Songs",
        sortable: true,
        align: "right",
        render: (value: number) => {
          const val = typeof value === "number" && !isNaN(value) ? value : 0;
          return formatNumber(val);
        },
      },
      {
        key: "uniqueArtistsPlayed",
        header: "Unique Artists",
        sortable: true,
        align: "right",
        render: (value: number) => {
          const val = typeof value === "number" && !isNaN(value) ? value : 0;
          return formatNumber(val);
        },
      },
      {
        key: "totalLikes",
        header: "Likes",
        sortable: true,
        align: "right",
        render: (value: number) => {
          const val = typeof value === "number" && !isNaN(value) ? value : 0;
          return formatNumber(val);
        },
      },
      {
        key: "totalComments",
        header: "Comments",
        sortable: true,
        align: "right",
        render: (value: number) => {
          const val = typeof value === "number" && !isNaN(value) ? value : 0;
          return formatNumber(val);
        },
      },
      {
        key: "engagementScore",
        header: "Engagement",
        sortable: true,
        align: "right",
        render: (value: number) => {
          const val = typeof value === "number" && !isNaN(value) ? value : 0;
          return val.toFixed(1);
        },
      },
      {
        key: "avgStreamsPerDay",
        header: "Avg Streams/Day",
        sortable: true,
        align: "right",
        render: (value: number) => {
          const val = typeof value === "number" && !isNaN(value) ? value : 0;
          return val.toFixed(1);
        },
      },
    ],
    []
  );

  return (
    <>
      <Helmet>
        <title>User Growth & Analytics - CoogMusic</title>
      </Helmet>

      <div className={styles.adminLayout}>
        <div className={styles.adminHeader}>
          <span className={styles.adminTitle}>User Growth & Retention</span>
          <span className={styles.adminSubtitle}>
            User acquisition, growth trends, and cohort retention over time.
          </span>
        </div>

        <DataReportsNav />

        <div className={styles.dataContainer}>
          <DataReportStoryPanel params={params} />
          <DataParameterPanel
            params={params}
            onParamsChange={handleParamsChange}
            showGranularity={true}
            showCompareTo={false}
            showCohortBy={true}
          />

          <UserGrowthChart params={params} />

          <DataReportsTable
            fetchData={dataApi.getRetentionCohorts}
            baseParams={params}
            columns={cohortColumns}
            hasPagination={true}
            initialRowsPerPage={10}
            title="Cohort Retention Analysis"
            rowsPerPageOptions={[10, 25, 50, 100]}
            initialSortBy="cohortWeek"
            initialSortDirection="DESC"
            emptyMessage="No cohort data available for the selected time range"
          />

          <div className={styles.gridContainerSmall}>
            <AvgTimeCard params={params} />
            <ActivationRatePanel params={params} />
            <RetentionRatePanel params={params} />
          </div>

          <DataReportsTable
            fetchData={dataApi.getUserAnalytics}
            baseParams={params}
            columns={userAnalyticsColumns}
            hasPagination={true}
            initialRowsPerPage={10}
            title="User Analytics"
            rowsPerPageOptions={[10, 25, 50, 100]}
            initialSortBy="totalStreams"
            initialSortDirection="DESC"
            emptyMessage="No users found for the selected time range"
          />

          <RetentionHeatmap params={params} />

          <ChurnAnalysisCard params={params} />
        </div>
      </div>
    </>
  );
};

export default memo(DataReportUsers);
