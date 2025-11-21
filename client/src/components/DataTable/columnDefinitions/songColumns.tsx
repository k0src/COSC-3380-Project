import { Link } from "react-router-dom";
import { LazyImg } from "@components";
import type { Song, DataTableColumn } from "@types";
import musicPlaceholder from "@assets/music-placeholder.webp";

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

export const songColumns: DataTableColumn<Song>[] = [
  {
    key: "image_url",
    header: "Cover",
    width: 80,
    align: "center",
    render: (value, row) => (
      <div style={{ width: "4rem", height: "4rem" }}>
        <LazyImg
          src={value || musicPlaceholder}
          blurHash={row.image_url_blurhash}
          alt={row.title}
          imgClassNames={[]}
          size={64}
        />
      </div>
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
          transition: "color 0.2s ease",
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
    width: 100,
    align: "center",
    render: (value) => (
      <span
        style={{ color: "var(--color-text-gray)", fontFamily: "monospace" }}
      >
        {formatDuration(value)}
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
    width: 120,
    render: (value) => (
      <span style={{ color: "var(--color-text-gray)" }}>
        {formatDate(value)}
      </span>
    ),
  },
  {
    key: "streams",
    header: "Streams",
    sortable: true,
    width: 100,
    align: "center",
    render: (value) => (
      <span style={{ color: "var(--color-white-alt)", fontWeight: 500 }}>
        {value ? formatNumber(value) : "0"}
      </span>
    ),
  },
  {
    key: "visibility_status",
    header: "Status",
    sortable: true,
    width: 100,
    align: "center",
    render: (value) => (
      <span
        style={{
          color:
            value === "PUBLIC"
              ? "var(--color-green-ui)"
              : value === "PRIVATE"
              ? "var(--color-text-gray)"
              : "var(--color-yellow-ui)",
          fontWeight: 500,
          textTransform: "capitalize",
        }}
      >
        {value.toLowerCase()}
      </span>
    ),
  },
  {
    key: "likes",
    header: "Likes",
    sortable: true,
    width: 80,
    align: "center",
    render: (value) => (
      <span style={{ color: "var(--color-white-alt)", fontWeight: 500 }}>
        {value ? formatNumber(value) : "0"}
      </span>
    ),
  },
];

export const songFilterKeys = ["title", "genre"];
