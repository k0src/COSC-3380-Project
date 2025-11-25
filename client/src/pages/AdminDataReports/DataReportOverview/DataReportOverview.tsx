import { memo, useState, useCallback, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { dataApi } from "@api";
import type { DataReportParams, DataReportDetailColumn } from "@types";
import { formatNumber, formatPercentage } from "@util";
import {
  DataReportsNav,
  AdminDashboardSummary,
  OverviewKpiCards,
  DataParameterPanel,
  OverviewKeyMetricsChart,
  OverviewActivityChart,
  PeakHourPanel,
  EngagementVelocityPanel,
  PeakActivityDayPanel,
  DataReportsTable,
} from "@components";
import styles from "./DataReportOverview.module.css";

const DataReportOverview: React.FC = () => {
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
    compareTo: "previous_period",
  });

  const handleParamsChange = useCallback((newParams: DataReportParams) => {
    setParams(newParams);
  }, []);

  const tableColumns: DataReportDetailColumn[] = useMemo(
    () => [
      {
        key: "period",
        header: "Period",
        sortable: true,
        render: (value: string) =>
          new Date(value).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
      },
      {
        key: "activeUsers",
        header: "Active Users",
        sortable: true,
        align: "right",
        render: (value: number) => {
          const val = typeof value === "number" && !isNaN(value) ? value : 0;
          return formatNumber(val);
        },
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
        key: "uniqueSongs",
        header: "Unique Songs",
        sortable: true,
        align: "right",
        render: (value: number) => {
          const val = typeof value === "number" && !isNaN(value) ? value : 0;
          return formatNumber(val);
        },
      },
      {
        key: "engagementRate",
        header: "Engagement",
        sortable: true,
        align: "right",
        render: (value: number) => {
          const val = typeof value === "number" && !isNaN(value) ? value : 0;
          return formatPercentage(val);
        },
      },
      {
        key: "newUsers",
        header: "New Users",
        sortable: true,
        align: "right",
        render: (value: number) => {
          const val = typeof value === "number" && !isNaN(value) ? value : 0;
          return formatNumber(val);
        },
      },
      {
        key: "topArtist",
        header: "Top Artist",
        sortable: false,
      },
      {
        key: "topSong",
        header: "Top Song",
        sortable: false,
      },
    ],
    []
  );

  return (
    <>
      <Helmet>
        <title>Data Reports - CoogMusic</title>
      </Helmet>

      <div className={styles.adminLayout}>
        <div className={styles.adminHeader}>
          <span className={styles.adminTitle}>Admin Dashboard</span>
          <span className={styles.adminSubtitle}>
            High-level KPIs and platform performance metrics.
          </span>
        </div>

        <DataReportsNav />

        <div className={styles.dataContainer}>
          <AdminDashboardSummary params={params} />

          <div className={styles.gridContainerSmall}>
            <PeakHourPanel params={params} />
            <EngagementVelocityPanel params={params} />
            <PeakActivityDayPanel params={params} />
          </div>
        </div>

        <div className={styles.dataContainer}>
          <DataParameterPanel
            params={params}
            onParamsChange={handleParamsChange}
            showGranularity={true}
            showCompareTo={true}
            showMinThresholds={true}
          />

          <DataReportsTable
            fetchData={dataApi.getDetailedPeriods}
            baseParams={params}
            columns={tableColumns}
            hasPagination={true}
            initialRowsPerPage={10}
            rowsPerPageOptions={[10, 25, 50, 100, 200]}
            initialSortBy="period"
            initialSortDirection="DESC"
            title="Period Analysis"
          />

          <div className={styles.gridContainer}>
            <div className={styles.gridRow}>
              <OverviewKpiCards params={params} />
            </div>
            <div className={styles.gridRow}>
              <OverviewKeyMetricsChart params={params} />
              <OverviewActivityChart params={params} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default memo(DataReportOverview);
