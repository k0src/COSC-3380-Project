import { Link } from "react-router-dom";
import { LazyImg } from "@components";
import type { User, DataTableColumn } from "@types";
import { LuCheck } from "react-icons/lu";
import userPlaceholder from "@assets/user-placeholder.webp";

const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

export const userColumns: DataTableColumn<User>[] = [
  {
    key: "profile_picture_url",
    header: "Avatar",
    width: 80,
    align: "center",
    render: (value, row) => (
      <div
        style={{
          width: "4rem",
          height: "4rem",
          borderRadius: "50%",
          overflow: "hidden",
        }}
      >
        <LazyImg
          src={value || userPlaceholder}
          blurHash={row.pfp_blurhash}
          alt={row.username}
          imgClassNames={[]}
          size={64}
        />
      </div>
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
    header: "Auth Method",
    sortable: true,
    width: 120,
    render: (value) => (
      <span
        style={{
          color: "var(--color-white-alt)",
          textTransform: "capitalize",
        }}
      >
        {value}
      </span>
    ),
  },
  {
    key: "role",
    header: "Role",
    sortable: true,
    width: 100,
    align: "center",
    render: (value) => (
      <span
        style={{
          color:
            value === "ADMIN"
              ? "var(--color-red-ui)"
              : value === "ARTIST"
              ? "var(--color-accent)"
              : "var(--color-white-alt)",
          fontWeight: 500,
          textTransform: "capitalize",
        }}
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
            color: "var(--color-accent)",
            textDecoration: "none",
            transition: "color 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--color-accent-800)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--color-accent)";
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
    width: 80,
    align: "center",
    render: (value) =>
      value ? (
        <LuCheck
          style={{
            color: "var(--color-accent)",
            fontSize: "var(--icon-size-md)",
          }}
        />
      ) : null,
  },
  {
    key: "follower_count",
    header: "Followers",
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
    key: "following_count",
    header: "Following",
    sortable: true,
    width: 100,
    align: "center",
    render: (value) => (
      <span style={{ color: "var(--color-white-alt)", fontWeight: 500 }}>
        {value ? formatNumber(value) : "0"}
      </span>
    ),
  },
];

export const userFilterKeys = ["username", "email"];
