import { Link } from "react-router-dom";
import { LazyImg } from "@components";
import type { Playlist, DataTableColumn } from "@types";
import { formatNumber } from "@util";
import styles from "./columns.module.css";
import musicPlaceholder from "@assets/music-placeholder.webp";

export const playlistColumns: DataTableColumn<Playlist>[] = [
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
        to={`/playlists/${row.id}`}
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
    key: "description",
    header: "Description",
    width: "flex",
    render: (value) => (
      <span
        style={{
          color: "var(--color-text-gray)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {value || "—"}
      </span>
    ),
  },
  {
    key: "user",
    header: "Creator",
    sortable: true,
    width: "flex",
    render: (value) => (
      <Link
        to={`/users/${value?.id}`}
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
        {value?.username || "—"}
      </Link>
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
    key: "song_count",
    header: "Songs",
    sortable: true,
    width: "flex",
    align: "center",
    render: (value) => (
      <span style={{ color: "var(--color-white-alt)", fontWeight: 500 }}>
        {value || "0"}
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

export const playlistFilterKeys = ["title", "description"];
