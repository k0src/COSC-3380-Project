import { Link } from "react-router-dom";
import type { Comment, DataTableColumn } from "@types";

export const commentColumns: DataTableColumn<Comment>[] = [
  {
    key: "song_title",
    header: "Song",
    sortable: true,
    width: "flex",
    render: (value, row) => (
      <Link
        to={`/songs/${row.song_id}`}
        style={{
          color: "var(--color-white)",
          textDecoration: "none",
          transition: "color var(--transistion-speed) ease",
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
    key: "username",
    header: "User",
    sortable: true,
    width: "flex",
    render: (value, row) => (
      <Link
        to={`/users/${row.user_id}`}
        style={{
          color: "var(--color-white-alt)",
          textDecoration: "none",
          transition: "color var(--transistion-speed) ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "var(--color-accent)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "var(--color-white-alt)";
        }}
      >
        {value}
      </Link>
    ),
  },
  {
    key: "comment_text",
    header: "Comment",
    width: "flex",
    render: (value) => (
      <span style={{ color: "var(--color-text-gray)" }}>{value}</span>
    ),
  },
  {
    key: "likes",
    header: "Likes",
    sortable: true,
    width: 100,
    align: "center",
    render: (value) => (
      <span style={{ color: "var(--color-white-alt)", fontWeight: 500 }}>
        {value || 0}
      </span>
    ),
  },
];

export const commentFilterKeys = ["song_title", "username", "comment_text"];
