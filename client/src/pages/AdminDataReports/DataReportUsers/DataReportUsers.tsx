import { memo, useState, useCallback, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import {
  DataReportsNav,
  DataParameterPanel,
  UserGrowthChart,
  DataReportsTable,
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

  // const cohortColumns: DataReportDetailColumn[] = useMemo(
  //   () => [
  //     {
  //       key: "cohortWeek",
  //       header: "Cohort",
  //       sortable: true,
  //       render: (value: string) =>
  //         new Date(value).toLocaleDateString(undefined, {
  //           month: "short",
  //           day: "numeric",
  //           year: "numeric",
  //         }),
  //     },
  //     {
  //       key: "cohortSize",
  //       header: "Size",
  //       sortable: true,
  //       align: "right",
  //       render: (value: number) => formatNumber(value),
  //     },
  //     {
  //       key: "day1",
  //       header: "Day 1",
  //       sortable: true,
  //       align: "right",
  //       render: (value: number, row: any) =>
  //         row.cohortSize > 0
  //           ? formatPercentage((value / row.cohortSize) * 100)
  //           : "0%",
  //     },
  //     {
  //       key: "day7",
  //       header: "Day 7",
  //       sortable: true,
  //       align: "right",
  //       render: (value: number, row: any) =>
  //         row.cohortSize > 0
  //           ? formatPercentage((value / row.cohortSize) * 100)
  //           : "0%",
  //     },
  //     {
  //       key: "day14",
  //       header: "Day 14",
  //       sortable: true,
  //       align: "right",
  //       render: (value: number, row: any) =>
  //         row.cohortSize > 0
  //           ? formatPercentage((value / row.cohortSize) * 100)
  //           : "0%",
  //     },
  //     {
  //       key: "day28",
  //       header: "Day 28",
  //       sortable: true,
  //       align: "right",
  //       render: (value: number, row: any) =>
  //         row.cohortSize > 0
  //           ? formatPercentage((value / row.cohortSize) * 100)
  //           : "0%",
  //     },
  //     {
  //       key: "day90",
  //       header: "Day 90",
  //       sortable: true,
  //       align: "right",
  //       render: (value: number, row: any) =>
  //         row.cohortSize > 0
  //           ? formatPercentage((value / row.cohortSize) * 100)
  //           : "0%",
  //     },
  //   ],
  //   []
  // );

  return (
    <>
      {/* <Helmet>
        <title>User Growth - CoogMusic</title>
      </Helmet> */}

      <div className={styles.adminLayout}>
        <div className={styles.adminHeader}>
          <span className={styles.adminTitle}>User Growth & Retention</span>
          <span className={styles.adminSubtitle}>
            User acquisition, growth trends, and cohort retention over time.
          </span>
        </div>

        <DataReportsNav />

        <div className={styles.dataContainer}>
          {/* <DataParameterPanel
            params={params}
            onParamsChange={handleParamsChange}
            showGranularity={true}
            showCompareTo={false}
            showCohortBy={true}
          /> */}

          <UserGrowthChart params={params} />

          <div className={styles.tableSection}>
            <h2 className={styles.sectionTitle}>Cohort Retention Analysis</h2>
            {/* <DataReportsTable
              fetchData={dataApi.getRetentionCohorts}
              baseParams={params}
              columns={cohortColumns}
              hasPagination={true}
              initialRowsPerPage={10}
              rowsPerPageOptions={[10, 25, 50, 100]}
              initialSortBy="cohortWeek"
              initialSortDirection="DESC"
              emptyMessage="No cohort data available for the selected time range"
            /> */}
          </div>
        </div>
      </div>
    </>
  );
};

export default memo(DataReportUsers);
