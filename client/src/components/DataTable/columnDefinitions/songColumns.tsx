import { Link } from "react-router-dom";
import { LazyImg } from "@components";
import { formatDateString, formatNumber, formatRuntime } from "@util";
import type { Song, DataTableColumn } from "@types";
import styles from "./columns.module.css";
import musicPlaceholder from "@assets/music-placeholder.webp";

export const songColumns: DataTableColumn<Song>[] = [
  {
    key: "image_url",
    header: "Cover",
    width: 110,
    align: "center",
    render: (value, row) => (
      <LazyImg
        src={value || musicPlaceholder}
        blurHash={row.image_url_blurhash}
        alt={row.title}
        imgClassNames={[styles.image]}
      />
    ),
  },
  {
    key: "title",
    header: "Title",
    sortable: true,
    width: "flex",
    render: (value, row) => (
      <Link
        to={`/songs/${row.id}`}
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
    key: "duration",
    header: "Duration",
    sortable: true,
    width: "flex",
    align: "center",
    render: (value) => (
      <span style={{ color: "var(--color-text-gray)" }}>
        {formatRuntime(value)}
      </span>
    ),
  },
  {
    key: "genre",
    header: "Genre",
    sortable: true,
    width: "flex",
    render: (value) => (
      <span style={{ color: "var(--color-white-alt)" }}>{value}</span>
    ),
  },
  {
    key: "release_date",
    header: "Release Date",
    sortable: true,
    width: "flex",
    render: (value) => (
      <span style={{ color: "var(--color-text-gray)" }}>
        {formatDateString(value)}
      </span>
    ),
  },
  {
    key: "streams",
    header: "Streams",
    sortable: true,
    width: "flex",
    align: "center",
    render: (value) => (
      <span style={{ color: "var(--color-white-alt)", fontWeight: 500 }}>
        {formatNumber(value ?? 0)}
      </span>
    ),
  },
  {
    key: "visibility_status",
    header: "Status",
    sortable: true,
    width: "flex",
    render: (value) => (
      <span
        style={{
          color:
            value === "PUBLIC"
              ? "var(--color-green-ui)"
              : value === "PRIVATE"
              ? "var(--color-red-ui)"
              : "var(--color-orange-ui)",
          fontWeight: 500,
          textTransform: "uppercase",
        }}
      >
        {value}
      </span>
    ),
  },
  {
    key: "likes",
    header: "Likes",
    sortable: true,
    width: "flex",
    align: "center",
    render: (value) => (
      <span style={{ color: "var(--color-white-alt)", fontWeight: 500 }}>
        {formatNumber(value ?? 0)}
      </span>
    ),
  },
];

export const songFilterKeys = ["title", "genre"];
