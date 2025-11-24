import { formatDateString } from "@util";
import type { DataTableColumn } from "@types";
import styles from "./columns.module.css";

export const appealsColumns: DataTableColumn[] = [
  {
    key: "username",
    width: "flex",
    header: "User",
    sortable: true,
  },
  {
    key: "entity_name",
    width: "flex",
    header: "Entity",
    sortable: true,
  },
  {
    key: "entity_type",
    width: "flex",
    header: "Type",
    sortable: true,
    render: (value: string) => (
      <span className={styles.entityBadge}>
        {value.charAt(0).toUpperCase() + value.slice(1)}
      </span>
    ),
  },
  {
    key: "reason",
    width: "flex",
    header: "Reason",
    sortable: false,
    render: (value: string) => (
      <span className={styles.descriptionCell}>{value}</span>
    ),
  },
  {
    key: "appeal_status",
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
    key: "submitted_at",
    width: "flex",
    header: "Submitted",
    sortable: true,
    render: (value: string) => {
      return <span>{formatDateString(value)}</span>;
    },
  },
];

export const appealFilterKeys = ["reporter_username", "reported_name"];
