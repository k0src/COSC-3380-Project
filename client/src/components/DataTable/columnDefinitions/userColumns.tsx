import { Link } from "react-router-dom";
import { LazyImg } from "@components";
import type { User, DataTableColumn } from "@types";
import { formatDateString } from "@util";
import { LuCheck } from "react-icons/lu";
import userPlaceholder from "@assets/user-placeholder.webp";
import styles from "./columns.module.css";

export const userColumns: DataTableColumn<User>[] = [
  {
    key: "profile_picture_url",
    header: "Image",
    width: 110,
    align: "center",
    render: (value, row) => (
      <LazyImg
        src={value || userPlaceholder}
        blurHash={row.pfp_blurhash}
        alt={row.username}
        imgClassNames={[styles.imageRound]}
      />
    ),
  },
  {
    key: "username",
    header: "Username",
    sortable: true,
    width: "flex",
    render: (value, row) => (
      <Link
        to={`/users/${row.id}`}
        style={{
          color: "var(--color-white)",
          textDecoration: "none",
          fontWeight: 500,
          transition: "color var(--transition-speed) ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "var(--color-accent)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "var(--color-white)";
        }}
      >
        {value}
      </Link>
    ),
  },
  {
    key: "email",
    header: "Email",
    sortable: true,
    width: "flex",
    render: (value) => (
      <span style={{ color: "var(--color-text-gray)" }}>{value}</span>
    ),
  },
  {
    key: "authenticated_with",
    header: "Auth",
    sortable: true,
    width: "flex",
    render: (value) => (
      <span style={{ color: "var(--color-text-gray)" }}>{value}</span>
    ),
  },
  {
    key: "role",
    header: "Role",
    sortable: true,
    width: "flex",
    align: "center",
    render: (value) => (
      <span
        style={{
          color: "var(--color-white-alt)",
          fontWeight: 500,
          textTransform: "uppercase",
        }}
      >
        {value.toLowerCase()}
      </span>
    ),
  },
  {
    key: "status",
    header: "Status",
    sortable: true,
    width: "flex",
    align: "center",
    render: (value) => (
      <span
        className={`${styles.statusBadge} ${
          value === "ACTIVE"
            ? styles.statusActive
            : value === "SUSPENDED"
            ? styles.statusSuspended
            : styles.statusDeactivated
        }`}
      >
        {value.toLowerCase()}
      </span>
    ),
  },
  {
    key: "artist_id",
    header: "Artist",
    width: "flex",
    render: (value) =>
      value ? (
        <Link
          to={`/artists/${value}`}
          style={{
            color: "var(--color-white-alt)",
            textDecoration: "none",
            transition: "color var(--transition-speed) ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--color-accent)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--color-white-alt)";
          }}
        >
          View Artist
        </Link>
      ) : (
        <span style={{ color: "var(--color-text-gray)" }}>—</span>
      ),
  },
  {
    key: "is_private",
    header: "Private",
    sortable: true,
    width: "flex",
    align: "center",
    render: (value) =>
      value ? (
        <LuCheck
          style={{
            color: "var(--color-ui-red)",
            fontSize: "var(--icon-size-md)",
          }}
        />
      ) : (
        <span style={{ color: "var(--color-text-gray)" }}>—</span>
      ),
  },
  {
    key: "created_at",
    header: "Joined",
    sortable: true,
    width: "flex",
    render: (value) => (
      <span style={{ color: "var(--color-text-gray)" }}>
        {formatDateString(value)}
      </span>
    ),
  },
];

export const userFilterKeys = ["username", "email"];
