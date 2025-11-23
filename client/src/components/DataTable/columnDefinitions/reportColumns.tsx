import { formatDateString } from "@util";
import type { DataTableColumn } from "@types";
import styles from "./columns.module.css";

export const reportsColumns: DataTableColumn[] = [
  {
    key: "reporter_username",
    width: "flex",
    header: "Reporter",
    sortable: true,
  },
  {
    key: "reported_username",
    width: "flex",
    header: "Reported",
    sortable: true,
  },
  {
    key: "report_type",
    width: "flex",
    header: "Type",
    sortable: true,
  },
  {
    key: "description",
    width: "flex",
    header: "Description",
    sortable: false,
    render: (value: string) => (
      <span className={styles.descriptionCell}>{value}</span>
    ),
  },
  {
    key: "report_status",
    width: "flex",
    header: "Status",
    sortable: true,
    render: (value: string) => (
      <span
        className={`${styles.statusBadge} ${
          value === "PENDING"
            ? styles.statusPending
            : value === "RESOLVED"
            ? styles.statusResolved
            : styles.statusDismissed
        }`}
      >
        {value}
      </span>
    ),
  },
  {
    key: "reported_at",
    width: "flex",
    header: "Reported",
    sortable: true,
    render: (value: string) => {
      return <span>{formatDateString(value)}</span>;
    },
  },
];
